// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('div');
      const modeLabels = {
        connected: '연결됨',
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };
      const deviceStatusLabels = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };
      const sessionStatusLabels = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };
      const text = (value, fallback = '확인 불가') =>
        (typeof value === 'string' || typeof value === 'number') && String(value).length > 0
          ? String(value)
          : fallback;
      const make = (tag, value) => {
        const element = document.createElement(tag);
        element.textContent = value;
        return element;
      };
      const modeText = (resource) => {
        const mode = resource && Object.hasOwn(modeLabels, resource.mode) ? resource.mode : 'unknown';
        return `연결 상태: ${modeLabels[mode]}`;
      };
      const section = (title, resource) => {
        const element = document.createElement('section');
        element.append(make('h3', title));
        const status = resource?.status;
        if (status === 'loading') {
          element.append(make('p', `불러오는 중 · ${modeText(resource)}`));
        } else if (status === 'error') {
          const message = text(resource.error?.message, '오류 내용이 없습니다.');
          element.append(make('p', `연결 실패: ${message} · ${modeText(resource)}`));
        } else if (status === 'ok') {
          element.append(make('p', `조회 완료 · ${modeText(resource)}`));
        } else {
          element.append(make('p', `확인 불가 · ${modeText(resource)}`));
        }
        root.append(element);
        return element;
      };
      const labelFor = (labels, value) => {
        const code = typeof value === 'string' && value ? value : 'unknown';
        const description = Object.hasOwn(labels, code) ? labels[code] : labels.unknown;
        return `${description}(${code})`;
      };
      const itemName = (item) => text(item?.label ?? item?.name, '이름 정보 없음');

      const identitySection = section('로그인한 사용자·기기·세션', me);
      if (me?.status === 'ok' && me.data) {
        const user = me.data.user || {};
        const device = me.data.device || {};
        const session = me.data.session || {};
        identitySection.append(make('p', `사용자 ID: ${text(user.id)} · 이름: ${text(user.label, '이름 정보 없음')}`));
        identitySection.append(make('p', `기기 ID: ${text(device.id)} · 이름: ${itemName(device)} · 상태: ${labelFor(deviceStatusLabels, device.status)}`));
        identitySection.append(make('p', `세션 ID: ${text(session.id)} · 이름: ${itemName(session)} · 상태: ${labelFor(sessionStatusLabels, session.status)}`));
      }

      const deviceSection = section('기기 목록', devices);
      if (devices?.status === 'ok') {
        const rows = Array.isArray(devices.data) ? devices.data : [];
        if (rows.length === 0) deviceSection.append(make('p', '표시할 기기가 없습니다.'));
        else {
          const list = document.createElement('ul');
          for (const item of rows) {
            const row = document.createElement('li');
            row.textContent = `기기 ID: ${text(item?.id)} · 이름: ${itemName(item)} · 상태: ${labelFor(deviceStatusLabels, item?.status)}`;
            list.append(row);
          }
          deviceSection.append(list);
        }
      }

      const sessionSection = section('세션 목록', sessions);
      if (sessions?.status === 'ok') {
        const rows = Array.isArray(sessions.data) ? sessions.data : [];
        if (rows.length === 0) sessionSection.append(make('p', '표시할 세션이 없습니다.'));
        else {
          const list = document.createElement('ul');
          for (const item of rows) {
            const row = document.createElement('li');
            row.textContent = `세션 ID: ${text(item?.id)} · 이름: ${itemName(item)} · 상태: ${labelFor(sessionStatusLabels, item?.status)}`;
            list.append(row);
          }
          sessionSection.append(list);
        }
      }

      return root;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('section');
      const make = (tag, value) => {
        const element = document.createElement(tag);
        element.textContent = value;
        return element;
      };
      const text = (value, fallback = '정보 없음') =>
        (typeof value === 'string' || typeof value === 'number') && String(value).length > 0
          ? String(value)
          : fallback;
      const decisionLabels = {
        allow: '접근 허용',
        deny: '접근 거부',
        challenge: '추가 인증 또는 확인 필요',
        unknown: '판정 확인 불가',
      };
      const modeLabels = {
        connected: '연결됨',
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };

      root.append(make('h3', '업무 앱 접근 판정'));
      const selectedAppId = data?.appId ?? appId;
      if (selectedAppId != null) {
        root.append(make('p', `앱 ID: ${text(selectedAppId)}`));
      }
      const modeCode = typeof mode === 'string' && Object.hasOwn(modeLabels, mode) ? mode : 'unknown';
      root.append(make('p', `연결 상태: ${modeLabels[modeCode]}(${modeCode})`));

      if (status === 'idle') {
        root.append(make('p', '앱을 골라 접속을 요청하세요. 아직 접근 판정을 받지 않았습니다.'));
        return root;
      }
      if (status === 'loading') {
        root.append(make('p', '판정 확인 중입니다. 아직 접근 허용 또는 거부가 결정되지 않았습니다.'));
        return root;
      }
      if (status === 'error') {
        root.append(make('p', `요청 실패: ${text(error?.message, '오류 내용이 없습니다.')}`));
        root.append(make('p', '요청 실패는 접근 거부(deny) 판정이 아닙니다. 접근 허용도 확인되지 않았습니다.'));
        return root;
      }
      if (status !== 'ok') {
        root.append(make('p', '판정 확인 불가(unknown): 요청 상태를 확인할 수 없습니다. 접근 허용이 확인되지 않았습니다.'));
        return root;
      }

      const received = data?.decision;
      const code = typeof received === 'string' && Object.hasOwn(decisionLabels, received)
        ? received
        : 'unknown';
      root.append(make('p', `접근 판정: ${decisionLabels[code]}(${code})`));
      if (code === 'challenge') {
        root.append(make('p', '추가 인증 또는 확인이 필요합니다. 이 화면은 인증 절차를 대신 수행하지 않습니다.'));
      } else if (code === 'allow') {
        root.append(make('p', '정책상 접근 허용이며 실제 업무 앱 접속 성공을 보장하지 않습니다.'));
      } else if (code === 'unknown') {
        root.append(make('p', '접근 허용이 확인되지 않았습니다. 확인 불가를 허용으로 간주하지 마세요.'));
      } else if (code === 'deny') {
        root.append(make('p', '정책에 따라 접근이 거부되었습니다.'));
      }
      root.append(make('p', `판정 이유: ${text(data?.reason, '사유 정보 없음')}`));
      root.append(make('p', `판정 시각: ${text(data?.checkedAt, '시각 정보 없음')}`));
      return root;
    },
    renderEvents({ status, mode, data, error } = {}) {
      const root = document.createElement('section');
      const make = (tag, content) => {
        const element = document.createElement(tag);
        element.textContent = content;
        return element;
      };
      const text = (value, fallback = '확인 불가') =>
        (typeof value === 'string' || typeof value === 'number') && String(value).length > 0
          ? String(value)
          : fallback;
      const labels = {
        kind: { access: '접속 기록', xdr: 'XDR 경보', unknown: '확인 불가' },
        access: { allowed: '접근 허용', denied: '접근 거부', unknown: '확인 불가' },
        session: { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' },
        device: { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' },
        mode: { connected: '연결됨', demo: '예제 자료', disconnected: '연결 없음', unknown: '확인 불가' },
      };
      const labeled = (category, raw) => {
        const code = typeof raw === 'string' && Object.hasOwn(labels[category], raw)
          ? raw
          : 'unknown';
        return labels[category][code] + '(' + code + ')';
      };
      const appName = (appId) =>
        appId === null || appId === undefined || appId === ''
          ? '앱 확인 불가(appId 없음)'
          : text(appId);

      root.append(make('h3', '내 접속 기록·저장된 XDR 경보'));
      root.append(make('p', '현재 사용자에게 연결된 최근 최대 40건의 기록만 표시합니다. 전체 직원 기록이나 실시간 전체 위협 탐지 결과가 아닙니다.'));
      root.append(make('p', '연결 상태: ' + labeled('mode', mode)));

      if (status === 'loading') {
        root.append(make('p', '보안 기록을 불러오는 중입니다.'));
        return root;
      }
      if (status === 'error') {
        if (error?.code === 'CONTRACT_MISMATCH') {
          root.append(make('p', '확인 불가(CONTRACT_MISMATCH): 기록 데이터 형식이 맞지 않습니다.'));
        }
        root.append(make('p', '기록을 불러오지 못했습니다: ' + text(error?.message, '오류 내용이 없습니다.')));
        return root;
      }
      if (status !== 'ok') {
        root.append(make('p', '보안 기록 상태를 확인할 수 없습니다.'));
        return root;
      }
      if (!Array.isArray(data)) {
        root.append(make('p', '확인 불가(CONTRACT_MISMATCH): 기록 목록을 확인할 수 없습니다.'));
        return root;
      }
      // 서버 입력은 변경하지 않고, 전달된 현재 사용자 기록만 복사해 최신순 정렬한다.
      const events = [...data].sort((left, right) =>
        Date.parse(right.at) - Date.parse(left.at));
      if (events.length === 0) {
        root.append(make('p', '표시할 기록이 없습니다.'));
        return root;
      }

      const filterArea = document.createElement('div');
      const listHost = document.createElement('div');
      const count = make('p', '');
      const filters = {};
      const createFilter = (key, caption, rawValues, describe) => {
        const label = document.createElement('label');
        label.append(make('span', caption + ': '));
        const select = document.createElement('select');
        select.setAttribute('aria-label', caption);
        const addOption = (value, title) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = title;
          select.append(option);
        };
        addOption('all', '전체');
        for (const value of [...new Set(rawValues)]) {
          addOption(value, describe(value));
        }
        select.value = 'all';
        filters[key] = select;
        label.append(select);
        filterArea.append(label);
      };

      createFilter('kind', '기록 종류', events.map((event) => event.kind),
        (value) => labeled('kind', value));
      // 앱 ID가 비어 있는 기록은 원본의 null/없음을 그대로 구분한다.
      createFilter('app', '업무 앱',
        events.map((event) => event.appId == null ? '' : String(event.appId)),
        (value) => appName(value));
      createFilter('access', '접속 상태', events.map((event) => event.state?.access ?? 'unknown'),
        (value) => labeled('access', value));

      root.append(filterArea, count, listHost);
      let selectedEventId = null;
      const showEvidenceOrRules = (detail, title, rows) => {
        detail.append(make('h5', title));
        if (!Array.isArray(rows) || rows.length === 0) {
          detail.append(make('p', title + ' 정보가 없습니다.'));
          return;
        }
        const list = document.createElement('ul');
        for (const row of rows) {
          list.append(make('li', 'ID: ' + text(row?.id) + ' · 내용: ' + text(row?.text, '내용 없음')));
        }
        detail.append(list);
      };
      const renderList = () => {
        const filtered = events.filter((event) => {
          const eventApp = event.appId == null ? '' : String(event.appId);
          return (filters.kind.value === 'all' || event.kind === filters.kind.value)
            && (filters.app.value === 'all' || eventApp === filters.app.value)
            && (filters.access.value === 'all' || event.state?.access === filters.access.value);
        });
        count.textContent = '표시 ' + filtered.length + '건 / 받은 기록 ' + events.length + '건';
        listHost.replaceChildren();
        if (filtered.length === 0) {
          listHost.append(make('p', '해당 조건의 기록이 없습니다.'));
          return;
        }

        const list = document.createElement('ul');
        for (const event of filtered) {
          const row = document.createElement('li');
          row.setAttribute('data-student-event-id', text(event.id));
          row.append(make('p', '사건 ID: ' + text(event.id)
            + ' · 시각: ' + text(event.at)
            + ' · 종류: ' + labeled('kind', event.kind)
            + ' · 앱: ' + appName(event.appId)
            + ' · 요약: ' + text(event.summary, '요약 정보 없음')));

          const button = make('button', text(event.id) + ' 상세');
          button.type = 'button';
          button.setAttribute('aria-label', text(event.id) + ' 상세');
          button.setAttribute('aria-expanded', selectedEventId === event.id ? 'true' : 'false');
          button.addEventListener('click', () => {
            selectedEventId = selectedEventId === event.id ? null : event.id;
            renderList();
            // 새 DOM으로 다시 그려진 동일 기록 버튼에 키보드 초점을 돌린다.
            const current = [...listHost.querySelectorAll('button')].find(
              (candidate) => candidate.textContent === text(event.id) + ' 상세');
            if (current) current.focus();
          });
          row.append(button);

          if (selectedEventId === event.id) {
            const detail = document.createElement('section');
            detail.setAttribute('data-student-event-detail', text(event.id));
            detail.append(make('h4', '사건 ' + text(event.id) + ' 상세'));
            detail.append(make('p', '사건 ID: ' + text(event.id) + ' · 앱: ' + appName(event.appId)));
            detail.append(make('p', '접속 상태: ' + labeled('access', event.state?.access)));
            detail.append(make('p', '세션 상태: ' + labeled('session', event.state?.session)));
            detail.append(make('p', '기기 상태: ' + labeled('device', event.state?.device)));
            showEvidenceOrRules(detail, '근거(evidence)', event.evidence);
            showEvidenceOrRules(detail, '규칙(rules)', event.rules);
            // 실제 목록은 supportedActions가 비어 있어 조치 버튼을 만들지 않는다.
            // 시험용으로 조치가 전달되어도 실행 권한 없이 미지원 버튼만 표시한다.
            if (Array.isArray(event.supportedActions) && event.supportedActions.length > 0) {
              detail.append(make('p', '조치 실행 연결은 준비 중입니다. 다음 조치는 아직 지원하지 않으며 요청을 보내지 않습니다.'));
              const unsupportedList = document.createElement('ul');
              for (const action of event.supportedActions) {
                const entry = document.createElement('li');
                const unsupported = make('button', text(action) + ' 미지원');
                unsupported.type = 'button';
                unsupported.disabled = true;
                unsupported.setAttribute('aria-label', text(action) + ' 미지원');
                entry.append(unsupported);
                unsupportedList.append(entry);
              }
              detail.append(unsupportedList);
            }
            row.append(detail);
          }
          list.append(row);
        }
        listHost.append(list);
      };
      for (const filter of Object.values(filters)) {
        filter.addEventListener('change', () => {
          selectedEventId = null;
          renderList();
        });
      }
      renderList();
      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('section');
      const make = (tag, value) => {
        const element = document.createElement(tag);
        element.textContent = value;
        return element;
      };
      const text = (value, fallback = '확인 불가') =>
        (typeof value === 'string' || typeof value === 'number') && String(value).length > 0
          ? String(value)
          : fallback;
      // 진단 정보와 알림의 텍스트에 비밀 문자열이 섞여 들어오면 출력·복사를 제한한다.
      const secretPattern = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|gh[psu]_[A-Za-z0-9]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|secret|비밀번호|토큰)\s*[:=]\s*\S+)/i;
      const safe = (value, fallback = '확인 불가') => {
        const valueText = text(value, fallback);
        return secretPattern.test(valueText) ? '[비공개]' : valueText;
      };
      const safeCode = (code) => {
        const value = text(code, 'unknown');
        return /^[A-Za-z0-9._:-]{1,100}$/.test(value) ? value : 'unknown';
      };
      const deviceLabels = { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' };
      const sessionLabels = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
      const modeLabels = { connected: '연결됨', demo: '예제 자료', disconnected: '연결 없음', unknown: '확인 불가' };
      const labeled = (labels, value) => {
        const code = typeof value === 'string' && Object.hasOwn(labels, value) ? value : 'unknown';
        return labels[code] + '(' + code + ')';
      };
      const retryAdvice = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요. 자동 재요청하지 않습니다.';
      const errorNotice = (title, resource) => {
        const code = safeCode(resource?.error?.code);
        const message = safe(resource?.error?.message, '오류 내용이 없습니다.');
        const timedOut = /TIME[_-]?OUT|TIMED[_-]?OUT|ETIMEDOUT|DEADLINE|시간\s*(?:이\s*)?초과|timed\s*out/i.test(code + ' ' + message);
        return title + ' 정보를 불러오지 못했습니다. '
          + (timedOut ? '시간 초과: ' : '조회 실패: ')
          + message + ' · 오류 코드: ' + code + '. ' + retryAdvice;
      };

      root.append(make('h3', '기기·세션·알림·도움정보'));
      root.append(make('p', '전체 연결 상태: ' + labeled(modeLabels, mode)));
      root.append(make('p', '등록 기기는 현재 사용자에게 속한 최대 100개만 표시합니다. 운영체제 등 확인되지 않은 값은 추정하지 않습니다.'));
      root.append(make('p', '세션은 현재 검증된 연결 한 개만 대상으로 하며 지난 세션 전체 목록이 아닙니다.'));

      const showResource = (title, resource, emptyText, describe) => {
        const block = document.createElement('section');
        block.append(make('h4', title));
        block.append(make('p', '자료 연결 상태: ' + labeled(modeLabels, resource?.mode)));
        if (resource?.status === 'loading') {
          block.append(make('p', title + ' 정보를 불러오는 중입니다.'));
        } else if (resource?.status === 'error') {
          block.append(make('p', errorNotice(title, resource)));
        } else if (resource?.status === 'ok') {
          if (!Array.isArray(resource.data)) {
            block.append(make('p', title + ' 정보 확인 불가(CONTRACT_MISMATCH): 목록 형식이 올바르지 않습니다.'));
          } else if (resource.data.length === 0) {
            block.append(make('p', emptyText));
          } else {
            block.append(make('p', title + ' ' + resource.data.length + '건 확인'));
            const list = document.createElement('ul');
            for (const item of resource.data) list.append(make('li', describe(item)));
            block.append(list);
          }
        } else {
          block.append(make('p', title + ' 정보를 아직 확인할 수 없습니다.'));
        }
        root.append(block);
      };
      showResource('기기', devices, '등록된 기기가 없습니다.', (device) =>
        '기기 ID: ' + safe(device?.id) + ' · 이름: ' + safe(device?.label, '이름 정보 없음')
        + ' · 상태: ' + labeled(deviceLabels, device?.status));
      showResource('세션', sessions, '현재 연결이 없습니다.', (session) =>
        '세션 ID: ' + safe(session?.id) + ' · 상태: ' + labeled(sessionLabels, session?.status));

      const alertArea = document.createElement('section');
      alertArea.append(make('h4', '알림'));
      if (!Array.isArray(notifications) || notifications.length === 0) {
        alertArea.append(make('p', '주의할 알림이 없습니다.'));
      } else {
        const list = document.createElement('ul');
        for (const item of notifications) {
          list.append(make('li', '알림 자료(resource): ' + safe(item?.resource)
            + ' · 코드(code): ' + safeCode(item?.code)
            + ' · 메시지(message): ' + safe(item?.message, '메시지가 없습니다.')));
        }
        alertArea.append(list);
        alertArea.append(make('p', '알림을 확인하세요. 조회·연결 문제라면 ' + retryAdvice));
      }
      root.append(alertArea);

      const help = document.createElement('section');
      help.append(make('h4', '연결 도움정보'));
      help.append(make('p', '도움정보는 지원 담당자에게 문의할 때 쓰는 정보입니다. 비밀번호·토큰·API 키를 포함하지 않고 사용자가 누를 때만 복사합니다.'));
      const copyButton = make('button', '도움정보 복사');
      copyButton.type = 'button';
      copyButton.disabled = true;
      copyButton.setAttribute('aria-label', '도움정보 복사');
      const feedback = make('p', '');
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');

      if (diagnostics?.status === 'loading') {
        help.append(make('p', '도움정보를 불러오는 중입니다.'));
      } else if (diagnostics?.status === 'error') {
        help.append(make('p', errorNotice('도움정보', diagnostics)));
      } else if (diagnostics?.status === 'ok') {
        if (!diagnostics.data || typeof diagnostics.data !== 'object' || Array.isArray(diagnostics.data)) {
          help.append(make('p', '도움정보 확인 불가(CONTRACT_MISMATCH): 진단 자료 형식이 올바르지 않습니다.'));
        } else {
          // 서버 원본 객체의 다른 필드는 절대로 복사하지 않는다.
          // 필드 허용 목록 + 각 값의 형식·길이 검사. 비정상 값은 원문 대신 확인 불가로 표시한다.
          // 비밀처럼 보이는 텍스트를 단순 정규식으로 가리는 것만으로 안전하다고 가정하지 않는다.
          const diagnosticRules = {
            requestId: /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/,
            component: /^[A-Za-z][A-Za-z0-9._-]{0,63}$/,
            version: /^v?[0-9]{1,6}\.[0-9]{1,6}\.[0-9]{1,6}(?:[-+][A-Za-z0-9.-]{1,40})?$/,
            checkedAt: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/,
            engineMode: /^(?:connected|demo|disconnected|unknown)$/,
            engineCode: /^[A-Z][A-Z0-9_]{0,79}$/,
          };
          const diagnosticValue = (field, value) => {
            if (typeof value !== 'string' || !diagnosticRules[field].test(value)
                || secretPattern.test(value)) return '확인 불가';
            if (field === 'checkedAt' && !Number.isFinite(Date.parse(value))) return '확인 불가';
            return value;
          };
          const info = {
            requestId: diagnosticValue('requestId', diagnostics.data.requestId),
            component: diagnosticValue('component', diagnostics.data.component),
            version: diagnosticValue('version', diagnostics.data.version),
            checkedAt: diagnosticValue('checkedAt', diagnostics.data.checkedAt),
            engine: {
              mode: diagnosticValue('engineMode', diagnostics.data.engine?.mode),
              code: diagnosticValue('engineCode', diagnostics.data.engine?.code),
            },
          };
          const safeHelpText = [
            'requestId: ' + info.requestId,
            'component: ' + info.component,
            'version: ' + info.version,
            'checkedAt: ' + info.checkedAt,
            'engine.mode: ' + info.engine.mode,
            'engine.code: ' + info.engine.code,
          ].join('\n');
          const preview = make('pre', safeHelpText);
          preview.setAttribute('tabindex', '0');
          help.append(make('p', '복사 가능한 도움정보(허용된 여섯 필드만 표시):'), preview);
          copyButton.disabled = false;
          copyButton.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(safeHelpText);
              feedback.textContent = '도움정보를 복사했습니다. 전달 전 내용을 확인하세요.';
            } catch {
              feedback.textContent = '자동 복사를 사용할 수 없습니다. 위 도움정보를 선택하고 Ctrl+C로 복사하세요.';
            }
          });
        }
      } else {
        help.append(make('p', '도움정보를 아직 조회하지 않았습니다. 제공 화면의 도움정보 불러오기 버튼을 직접 누르세요.'));
      }
      help.append(copyButton, feedback);
      root.append(help);
      return root;
    },
    renderVulnerabilities({ status = 'idle', mode = null, data = null, error = null } = {}) {
      // Provided app.js owns the request, timeout, cancellation and generation checks.
      // Every call draws a fresh view; old results are never cached or reused.
      const root = document.createElement('section');
      const add = (parent, tag, text) => {
        const node = document.createElement(tag);
        node.textContent = String(text);
        parent.append(node);
        return node;
      };
      const redact = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|gh[psu]_[A-Za-z0-9]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*\S+)/i;
      const safe = value => {
        if (typeof value !== 'string' && typeof value !== 'number') return '확인 불가';
        const s = String(value);
        return s && s.length <= 500 && !/[\u0000-\u001f\u007f]/.test(s) && !redact.test(s)
          ? s : '확인 불가';
      };
      const code = value => typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value)
        ? value : 'UNVERIFIABLE';
      const exactVersion = value => typeof value === 'string'
        && /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(value);
      const scanLabels = {
        complete: '모두 조회(complete): 승인된 공개 패키지의 OSV 조회 완료',
        partial: '일부 조회 실패(partial): 확인된 취약점은 유지, 나머지는 확인 불가',
        not_checked: '아직 조회 안 함(not_checked): 승인된 공개 조회 대상이 없어 미조회',
        not_configured: '조회 준비 미완료(not_configured): 운영자의 대상 프로젝트 설정이 필요함',
        unverifiable: 'lock 파일 확인 불가(unverifiable): 설치 정보의 대조 결과 확인 불가'
      };
      const packageLabels = {
        known_vulnerabilities: '알려진 취약점 있음(known_vulnerabilities)',
        none_found: '조회 범위에서 알려진 항목 없음(none_found). 앱 전체가 안전하다는 뜻은 아님',
        unverifiable: '조회 확인 불가(unverifiable). 취약점 없음으로 단정할 수 없음'
      };

      add(root, 'h3', '설치 패키지와 OSV 취약점 정보 대조');
      if (status === 'idle') {
        add(root, 'p', '조회 전(idle): 아직 설치 패키지 취약점 조회를 하지 않았습니다.');
        add(root, 'p', '조회하려면 제공 화면의 「설치 패키지 조회」를 직접 누르세요.');
        return root;
      }
      if (status === 'loading') {
        add(root, 'p', '조회 중(loading): 응답 확인 전입니다. 이전 패키지 결과는 현재 결과가 아닙니다.');
        return root;
      }
      if (status === 'error') {
        add(root, 'p', '조회 실패(error): 패키지 취약점 조회 결과를 확인할 수 없습니다.');
        add(root, 'p', '오류 코드(error.code): ' + code(error?.code));
        add(root, 'p', '오류 메시지(error.message): ' + safe(error?.message));
        add(root, 'p', '이전 결과는 표시하지 않습니다. 조회 실패는 취약점 없음이 아닙니다. 필요하면 직접 다시 조회하세요.');
        return root;
      }
      if (status !== 'ok' || !data || !Object.hasOwn(scanLabels, data.status)) {
        add(root, 'p', '조회 결과 확인 불가(unverifiable): 올바른 OSV 조회 정보를 확인할 수 없습니다.');
        add(root, 'p', '취약점 없음이나 안전으로 단정하지 않습니다.');
        return root;
      }
      add(root, 'p', '전체 조회 상태(data.status): ' + scanLabels[data.status]);
      if (mode != null) add(root, 'p', '조회 모드(mode): ' + safe(mode));
      add(root, 'p', '검증 대상: package-lock.json과 설치된 node_modules 메타데이터의 버전 대조(제공 서버 조회 결과).');
      if (data.lockfileVersion != null) add(root, 'p', '잠금 파일 형식(lockfileVersion): ' + safe(data.lockfileVersion));
      if (data.lockfileHash != null) add(root, 'p', '잠금 파일 해시(lockfileHash): ' + safe(data.lockfileHash));
      if (data.checkedAt != null) add(root, 'p', '전체 조회 시각(checkedAt): ' + safe(data.checkedAt));
      if (data.code != null) add(root, 'p', '조회 코드: ' + code(data.code));
      if (['not_checked', 'not_configured', 'unverifiable'].includes(data.status)) {
        add(root, 'p', '미조회·설정 미완료·대조 불가 상태는 취약점 없음이 아닙니다. 조회 대상과 허용 패키지는 운영자가 설정합니다.');
        return root;
      }
      if (!Array.isArray(data.packages)) {
        add(root, 'p', '패키지 조회 결과 확인 불가: 목록 형식이 올바르지 않습니다.');
        return root;
      }
      if (data.packages.length === 0) {
        add(root, 'p', '표시할 패키지 결과가 없습니다. 알려진 취약점 없음이나 전체 안전을 보증하지 않습니다.');
        return root;
      }
      const table = document.createElement('table');
      const head = document.createElement('thead');
      const headings = document.createElement('tr');
      for (const h of ['패키지명', '정확한 설치 버전', '조회 상태', 'OSV 출처', '패키지 조회 시각', '취약점 ID·수정 시각']) {
        add(headings, 'th', h);
      }
      head.append(headings);
      table.append(head);
      const body = document.createElement('tbody');
      for (const pkg of data.packages) {
        if (!pkg || typeof pkg.name !== 'string' || !pkg.name || !exactVersion(pkg.version)
          || !Object.hasOwn(packageLabels, pkg.status)) {
          add(root, 'p', '패키지 항목 확인 불가: 정확한 설치 버전 또는 상태를 검증하지 못했습니다.');
          continue;
        }
        const row = document.createElement('tr');
        row.setAttribute('data-student-package-name', pkg.name);
        row.setAttribute('data-student-package-version', pkg.version);
        add(row, 'td', safe(pkg.name));
        add(row, 'td', '설치 버전(version): ' + pkg.version);
        const findings = Array.isArray(pkg.vulnerabilities) ? pkg.vulnerabilities : [];
        const partial = pkg.status === 'unverifiable' && findings.length > 0;
        add(row, 'td', partial
          ? '일부 확인·전체 조회 확인 불가(unverifiable). 받은 취약점 ID는 유지합니다.'
          : packageLabels[pkg.status]);
        add(row, 'td', safe(pkg.source));
        add(row, 'td', safe(pkg.checkedAt));
        const result = document.createElement('td');
        if (findings.length === 0) {
          add(result, 'p', pkg.status === 'none_found'
            ? '조회 범위에서 알려진 취약점 ID 없음' : '취약점 ID 확인 불가 또는 미조회');
        } else {
          const list = document.createElement('ul');
          for (const finding of findings) {
            add(list, 'li', finding && finding.id && finding.modified
              ? '취약점 ID(id): ' + safe(finding.id) + ' · 수정 시각(modified): ' + safe(finding.modified)
              : '취약점 ID 또는 수정 시각 확인 불가');
          }
          result.append(list);
        }
        row.append(result);
        body.append(row);
      }
      table.append(body);
      root.append(table);
      if (data.status === 'partial') {
        add(root, 'p', '일부 조회 실패(partial): 이미 확인된 취약점 ID는 유지합니다. 확인하지 못한 패키지는 취약점 없음이나 안전이 아닙니다.');
      }
      add(root, 'p', 'OSV에서 조회 시점에 알려진 항목이 없다는 것은 패키지와 앱 전체의 안전을 보증하지 않습니다.');
      return root;
    },
    /*
     * 17단계 정적 검수용 제공 소스 호출 경로(원본 코드 위치·구문; 실행/권한 성공 증거 아님).
     * 이 주석은 제공 파일을 대체하지 않고, 읽기 제한이 있을 때 해당 원문 위치를 안내한다.
     * public/app.js:953-959: onclick: (e) => requestExplain(event, e.currentTarget)
     * public/app.js:996: aiRequest('/api/ai/explain', { body: { eventId: event.id }, signal: controller.signal })
     * src/server.mjs:466: if(req.method==='POST'&&url.pathname==='/api/ai/explain'&&nativeHost){
     * src/server.mjs:504: const raw=await bounded(()=>service.explainIncident(incident,options));
     * src/server.mjs:527: if(req.method==='POST'&&url.pathname==='/api/ai/explain'){
     * src/server.mjs:541: const output=await bounded(()=>mappedService().explainIncident(...));
     * src/ai/service.mjs:268: (await import('../../vendor/clco-http.mjs')).createClcoClient
     * src/ai/service.mjs:372: Reflect.apply(method.value,activeClient,[body,{signal}])
     * src/ai/service.mjs:386: activeClient.chat({ model, stream: false, messages: [...] }, { signal })
     * vendor/clco-http.mjs:119-122: async chat(body, options = {}) {
     *   const result = await request('/chat/completions', body, options);
     * vendor/clco-http.mjs:65: fetch(base.href.replace(/\/$/, '') + endpoint, { ... })
     * public/app.js:1007-1016: validExplanation(result.data, event) 성공 후에만
     *   state.selectedExplanation.resource = { status: 'ok', data: explanation, meta: result.meta };
     * 연결 점검은 src/ai/service.mjs:296의 listModels로 별도 처리된다.
     * 실제 ai.explain 권한 및 외부 모델 응답 성공 여부는 이 주석으로 증명할 수 없다.
     */
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted = false } = {}) {
      const root = document.createElement('section');
      const make = (tag, value) => {
        const element = document.createElement(tag);
        element.textContent = value;
        return element;
      };
      const modeLabels = {
        connected: '연결됨', demo: '예제 자료', disconnected: '연결 없음', unknown: '확인 불가',
      };
      const codeText = (value) =>
        typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value)
          ? value
          : 'AI_REQUEST_UNVERIFIED';
      // 입력 계약의 error.message는 제공 화면에서 안전한 문구로 정규화된다.
      // 비밀 또는 제어문자가 보이면 원문을 재출력하지 않는다.
      const messageText = (value) => {
        if (typeof value !== 'string' || value.length === 0 || value.length > 350
          || /[\u0000-\u001f\u007f]/.test(value)
          || /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|gh[psu]_[A-Za-z0-9]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*\S+)/i.test(value)) {
          return '오류 메시지를 안전하게 표시할 수 없습니다. 담당자에게 오류 코드를 전달하세요.';
        }
        return value;
      };
      const errorGuidance = (code) => {
        if (['ON_AI_PROVISIONING_PENDING', 'ON_AI_AUTHORIZATION_CHANGED',
          'SUBJECT_SCOPE_UNVERIFIED', 'AI_REQUEST_UNVERIFIED', 'ON_AI_SCOPE_UNVERIFIED',
          'ENGINE_NOT_CONNECTED'].includes(code)) {
          return '계정 연결 또는 앱 권한이 아직 준비되지 않았거나 확인 불가입니다. 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.';
        }
        if (['WB_CLCO_AUTH_REQUIRED', 'AUTH_REQUIRED', 'UNAUTHORIZED'].includes(code)) {
          return 'AI 인증을 확인하지 못했습니다. 계정 연결을 직접 다시 확인하고 담당자에게 문의하세요.';
        }
        if (['WB_CLCO_ACCESS_BLOCKED', 'ACCESS_BLOCKED', 'FORBIDDEN'].includes(code)) {
          return 'AI 접근이 제한되어 있습니다. 앱 이용 권한을 담당자에게 확인하세요.';
        }
        if (['WB_CLCO_COHORT_BUDGET_EXHAUSTED', 'WB_CLCO_LIMIT_REACHED',
          'LIMIT_REACHED', 'BUDGET_EXHAUSTED'].includes(code)) {
          return 'AI 사용량 또는 이용 한도 문제입니다. 반 담당자에게 확인하세요.';
        }
        if (['WB_CLCO_SESSION_CLOSED', 'SESSION_CLOSED'].includes(code)) {
          return '현재 AI 이용 시간이 아닙니다. 이용 가능한 시간을 확인하세요.';
        }
        if (['WB_CLCO_RATE_LIMITED', 'RATE_LIMITED', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT',
          'WB_CLCO_TIMEOUT', 'TIMEOUT', 'WB_CLCO_NETWORK_ERROR',
          'WB_CLCO_SERVER_UNAVAILABLE', 'NETWORK_ERROR'].includes(code)) {
          return '요청 제한·시간 초과 또는 네트워크/서버 응답 문제입니다. 잠시 뒤 사용자가 직접 다시 점검하세요.';
        }
        if (['WB_CLCO_CANCELLED', 'CANCELLED', 'REQUEST_CANCELLED'].includes(code)) {
          return 'AI 연결 점검이 취소됐습니다. 이전 점검 결과는 현재 결과가 아닙니다. 다시 점검하려면 사용자가 직접 눌러야 합니다.';
        }
        if (['MODEL_NOT_CONFIGURED', 'ON_AI_MODEL_LIST_EMPTY', 'MODEL_LIST_EMPTY'].includes(code)) {
          return '현재 앱 권한으로 쓸 수 있는 AI 모델이 없습니다. 담당자에게 모델 허용 설정 확인을 요청하세요.';
        }
        return 'AI 연결 또는 응답을 확인할 수 없습니다. 담당자에게 오류 코드를 알려 주세요.';
      };
      root.append(make('h3', '알레프게이트 AI 연결 점검'));
      const modeCode = typeof mode === 'string' && Object.hasOwn(modeLabels, mode) ? mode : 'unknown';
      root.append(make('p', '연결 모드: ' + modeLabels[modeCode] + '(' + modeCode + ')'));

      // 호출마다 현재 스냅샷만 새 DOM에 그린다. idle·loading·error 시 과거 모델 수를 재사용하지 않는다.
      if (status === 'idle') {
        root.append(make('p', 'AI 연결 점검 전입니다. 현재 계정의 앱 권한과 모델 응답을 아직 확인하지 않았습니다.'));
        root.append(make('p', '연결·승인을 완료한 뒤 「현재 API 연결 점검」을 직접 누르세요. 자동 재점검하지 않습니다.'));
        return root;
      }
      if (status === 'loading') {
        root.append(make('p', 'AI 연결 점검 중입니다. 아직 연결 성공·모델 응답·사건 설명 성공을 확인하지 않았습니다.'));
        root.append(make('p', '취소하거나 계정을 변경하면 이전 점검 결과는 현재 결과가 아닙니다.'));
        return root;
      }
      if (status === 'error') {
        const code = codeText(error?.code);
        root.append(make('p', 'AI 연결 점검 실패 · 오류 코드(error.code): ' + code));
        root.append(make('p', '오류 메시지(error.message): ' + messageText(error?.message)));
        root.append(make('p', errorGuidance(code)));
        root.append(make('p', '점검 실패는 사건 설명 성공이 아닙니다. 이전 모델 수·권한 확인 결과는 현재 결과로 표시하지 않습니다.'));
        root.append(make('p', '재점검은 사용자가 「현재 API 연결 점검」을 직접 눌러야 합니다. 자동 재시도하지 않습니다.'));
        return root;
      }
      if (status !== 'ok' || data?.transportChecked !== true
          || !['test', 'verified'].includes(data.audienceAuthorization)
          || !Number.isInteger(data.modelCount) || data.modelCount < 0
          || data.modelCount > 10000) {
        root.append(make('p', 'AI 연결 결과 확인 불가(unknown): 점검 데이터가 올바르지 않으며 성공으로 간주하지 않습니다.'));
        return root;
      }

      if (data.audienceAuthorization === 'test') {
        root.append(make('p', '시험 연결 점검(test) · 모델 응답을 시험한 결과로, 실제 앱 권한 검증 완료가 아닙니다.'));
      } else {
        root.append(make('p', '앱 권한 확인 후 점검(verified) · 해당 시각에 앱 권한과 모델 응답을 확인한 결과입니다.'));
      }
      if (modeCode === 'demo') {
        root.append(make('p', '예제 자료(demo)입니다. 실제 알레프게이트 연결 성공이 아닙니다.'));
      }
      root.append(make('p', '전송·모델 응답 점검: 수행됨(transportChecked=true)'));
      root.append(make('p', '응답 모델 수(modelCount): ' + data.modelCount + '개'));
      root.append(make('p', '점검 시각(checkedAt): ' +
        (typeof checkedAt === 'string' && checkedAt ? checkedAt : '확인 불가')));
      if (data.modelCount === 0) {
        root.append(make('p', '응답 모델 수가 0개입니다. 현재 사용할 수 있는 모델을 확인할 수 없으므로 담당자에게 모델 허용 설정을 문의하세요.'));
      }
      // 연결 점검이 확인한 것은 모델 목록/전송 결과뿐이며 사건 설명 실행 증거가 아니다.
      root.append(make('p', '연결만 점검했습니다. 사건 설명은 아직 실행하지 않았습니다. 보안 기록에서 별도 요청해야 합니다.'));
      root.append(make('p', '이 화면의 explanationAccepted는 사건 설명 실행 결과를 의미하지 않습니다('
        + (explanationAccepted === true ? '요청 정보 확인 필요' : 'false') + ').'));
      root.append(make('p', '다시 점검은 사용자가 「현재 API 연결 점검」 버튼을 직접 누를 때만 수행합니다.'));
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('section');
      const make = (tag, value) => {
        const node = document.createElement(tag);
        node.textContent = value;
        return node;
      };
      const codeText = (value) =>
        typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value)
          ? value : 'AI_REQUEST_UNVERIFIED';
      const safeMessage = (value) => {
        if (typeof value !== 'string' || !value || value.length > 350
          || /[\u0000-\u001f\u007f]/.test(value)
          || /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|gh[psu]_[A-Za-z0-9]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*\S+)/i.test(value)) {
          return '오류 메시지 확인 불가. 담당자에게 오류 코드를 전달하세요.';
        }
        return value;
      };
      const fail = (reason, code) => {
        root.append(make('p', 'AI 설명 확인 불가: ' + reason));
        if (code) root.append(make('p', '오류 코드(error.code): ' + codeText(code)));
        root.append(make('p', '설명의 근거나 사건이 확인되지 않았습니다. 내용을 추측하지 않으며 기존 보안 기록은 그대로입니다.'));
        return root;
      };
      root.append(make('h3', 'AI 사건 설명(참고용)'));
      if (explanation.status === 'error') {
        root.append(make('p', 'AI 설명 실패 · 오류 코드(error.code): ' + codeText(explanation.error?.code)));
        root.append(make('p', '오류 메시지(error.message): ' + safeMessage(explanation.error?.message)));
        const reasonCode = codeText(explanation.error?.code);
        const evidenceProblem = ['ON_AI_INVALID_INPUT', 'ON_AI_INVALID_OUTPUT', 'CONTRACT_MISMATCH', 'ENGINE_RESULT_UNVERIFIED'].includes(reasonCode);
        root.append(make('p', evidenceProblem
          ? '근거 부족·입력 오류·응답 불일치 등으로 설명에 필요한 근거를 확인할 수 없습니다.'
          : 'AI 연결·권한·요청 오류 또는 근거 확인 실패로 설명을 완료하지 못했습니다.'));
        root.append(make('p', '기록은 그대로입니다. AI 실패는 업무 앱 판정이나 보안 기록을 변경하지 않으며 과제 실패를 뜻하지 않습니다.'));
        return root;
      }
      if (!event || typeof event.id !== 'string' || !event.id) {
        root.append(make('p', '보안 기록에서 기록을 먼저 고르세요. AI 설명은 아직 실행되지 않았습니다.'));
        return root;
      }
      if (explanation?.status === 'idle' || !explanation?.status) {
        root.append(make('p', '선택한 사건의 AI 설명은 아직 요청하지 않았습니다.'));
        return root;
      }
      if (explanation.status === 'loading') {
        root.append(make('p', 'AI 설명 요청 중입니다. 이 사건의 설명 결과는 아직 확인되지 않았습니다.'));
        return root;
      }
      if (explanation.status !== 'ok') return fail('설명 결과 상태를 확인할 수 없습니다.', explanation.error?.code);

      const data = explanation.data;
      if (data?.executed === true) return fail('AI가 이미 조치를 실행했다고 답한 설명은 사용할 수 없습니다.', explanation.error?.code);
      if (!data || typeof data.summary !== 'string' || !data.summary.trim()
          || data.executed !== false || data.requiresHumanConfirmation !== true) {
        return fail('설명 형식이 올바르지 않거나 조치가 실행됐다고 표시되어 사용할 수 없습니다.', explanation.error?.code);
      }
      if (!Array.isArray(event.evidence) || !Array.isArray(event.rules)
          || !event.state || typeof event.state !== 'object' || Array.isArray(event.state)
          || !Array.isArray(event.supportedActions) || !Array.isArray(data.evidenceIds)
          || !Array.isArray(data.proposals)) {
        return fail('사건 근거·규칙·상태 또는 설명 자료가 누락되었습니다.', explanation.error?.code);
      }
      if (!event.rules.length) return fail('규칙 근거 부족: 이 사건의 규칙 원문을 확인할 수 없습니다.', explanation.error?.code);
      const entries = event.evidence;
      const validEntry = (entry) => entry && typeof entry.id === 'string' && !!entry.id
        && typeof entry.text === 'string' && !!entry.text.trim();
      if (!entries.every(validEntry) || !event.rules.every(validEntry)) {
        return fail('근거 또는 규칙의 ID와 원문을 확인할 수 없습니다.', explanation.error?.code);
      }
      const evidenceById = new Map(entries.map((entry) => [entry.id, entry.text]));
      const cited = data.evidenceIds;
      const uniqueCitations = new Set(cited);
      if (!entries.length || evidenceById.size !== entries.length
          || cited.length !== entries.length || uniqueCitations.size !== cited.length
          || cited.some(id => typeof id !== 'string' || !evidenceById.has(id))) {
        return fail('근거 부족 또는 AI 설명의 근거 ID가 현재 사건의 근거와 맞지 않습니다.', explanation.error?.code);
      }
      const actions = new Set(event.supportedActions);
      if (data.proposals.some(p => !p || typeof p.action !== 'string'
          || !actions.has(p.action) || typeof p.reason !== 'string' || !p.reason.trim()
          || !Array.isArray(p.evidenceIds) || !p.evidenceIds.length
          || p.evidenceIds.some(id => !evidenceById.has(id)))) {
        return fail('AI 제안의 조치 또는 근거가 현재 사건과 맞지 않습니다.', explanation.error?.code);
      }

      // AI 응답에 비밀값이 포함되면 표시하지 않고 성공 표식도 붙이지 않는다.
      const sensitive = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|gh[psu]_[A-Za-z0-9]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*\S+)/i;
      if (sensitive.test(data.summary) || data.proposals.some(p => sensitive.test(p.reason))) {
        return fail('AI 설명에 표시할 수 없는 비밀 형태의 정보가 포함되어 있습니다.', explanation.error?.code);
      }
      // 성공 표식은 모든 근거·사건·제안 검증을 끝낸 경우에만 기록한다.
      root.setAttribute('data-student-explanation-event', event.id);
      root.append(make('p', '사건 ID: ' + event.id));
      root.append(make('p', 'AI 요약(참고용): ' + data.summary));
      root.append(make('p', '설명 확인 시각: ' +
        (typeof checkedAt === 'string' && checkedAt ? checkedAt : '확인 불가')));
      if (explanation.mode === 'demo') {
        root.append(make('p', '예제 자료(demo)입니다. 운영 환경의 AI 설명 성공을 인증하지 않습니다.'));
      }
      const evidenceList = make('h4', '이 사건에서 인용한 근거');
      root.append(evidenceList);
      const citations = document.createElement('ul');
      for (const id of cited) citations.append(make('li', '근거 ' + id + ' — ' + evidenceById.get(id)));
      root.append(citations);

      root.append(make('h4', '현재 사건의 규칙'));
      const rules = document.createElement('ul');
      for (const rule of event.rules) rules.append(make('li', '규칙 ' + rule.id + ' — ' + rule.text));
      root.append(rules);

      root.append(make('h4', '확인할 수 없는 현재 상태'));
      const unknownLabels = { access: '접속', session: '세션', device: '기기' };
      const unknowns = Object.entries(unknownLabels)
        .filter(([key]) => event.state[key] === 'unknown')
        .map(([, label]) => label + ': 확인 불가(unknown)');
      if (!unknowns.length) root.append(make('p', '확인 불가 상태: 없음'));
      else {
        const unknownList = document.createElement('ul');
        for (const description of unknowns) unknownList.append(make('li', description));
        root.append(unknownList);
      }
      root.append(make('p', 'AI 설명은 기존 근거의 해석이며, 확인 불가(unknown)를 정상 또는 안전으로 바꾸지 않습니다.'));

      root.append(make('h4', 'AI 조치 제안'));
      if (!data.proposals.length) {
        root.append(make('p', event.supportedActions.length === 0
          ? '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).'
          : '현재 사건에 대해 AI가 제안한 조치가 없습니다.'));
      } else {
        const proposals = document.createElement('ul');
        for (const proposal of data.proposals) {
          const referenced = proposal.evidenceIds.join(', ');
          proposals.append(make('li', '제안: ' + proposal.action + ' · 이유: ' + proposal.reason
            + ' · 근거 ID: ' + referenced + ' · 사람 확인이 필요하며 실행되지 않았습니다.'));
        }
        root.append(proposals);
      }
      root.append(make('p', '모든 제안은 사람이 확인하기 전에는 실행되지 않았습니다. 이 화면에는 집행 버튼이 없습니다.'));
      return root;
    },
    renderAction({ status = 'idle', event = null, actionId = null, target = null,
      receipt = null, observation = null, message = null, confirmationExpiresAt = null, error = null } = {}) {
      // Each invocation renders only its current input; no old ticket, intent or result is stored.
      const root = document.createElement('section');
      const show = (tag, content) => {
        const node = document.createElement(tag);
        node.textContent = content;
        root.append(node);
      };
      const safe = value => {
        if (!['string', 'number'].includes(typeof value)) return '확인 불가';
        const s = String(value);
        if (!s || s.length > 500 || /[\u0000-\u001f\u007f]/.test(s)
          || /(?:authorization|bearer|password|secret|api.key|access.token|refresh.token)\s*[:= ]\s*\S+/i.test(s)) return '확인 불가';
        return s;
      };
      const id = value => typeof value === 'string' && safe(value) !== '확인 불가';
      const eId = id(event?.id) ? event.id : null;
      const aId = id(actionId) ? actionId : null;
      const rId = id(receipt?.requestId) ? receipt.requestId : null;
      const receiptId = id(receipt?.receiptId) ? receipt.receiptId : null;
      const state = typeof status === 'string' ? status : 'unknown';
      show('h3', 'AI 조치 제안 및 연동 시스템 결과');
      if (state === 'idle') {
        show('p', '아직 미실행(idle): AI 제안만으로 조치가 실행되지는 않습니다.');
        show('p', '조치 화면 취소는 이미 서버에 전달된 조치 효과를 되돌리지 않습니다.');
        return root;
      }

      if ((id(receipt?.eventId) && receipt.eventId !== eId)
        || (id(receipt?.actionId) && receipt.actionId !== aId)) {
        show('p', '결과 불명(unknown): 현재 사건·조치와 영수증의 사건·조치가 일치하지 않습니다.');
        show('p', '새 집행 요청을 보내지 말고 연동 시스템 결과만 재조회하세요.');
        return root;
      }

      if (state === 'loading') {
        show('p', '조치 준비 또는 연동 시스템 결과 조회 중(loading)이며 결과는 아직 확인되지 않았습니다.');
      } else if (state === 'prepared') {
        show('p', '준비됨·미실행(prepared): 조치를 실행하지 않았습니다.');
        show('p', '실제 대상과 사람 확인 기한을 확인한 뒤 제공 화면에서 별도로 확인해야 합니다.');
      } else if (state === 'executing') {
        show('p', '서버에 전달 중(executing): 사람 확인 후 요청 전송 중이며 아직 실행 결과가 없습니다.');
      } else if (state === 'pending') {
        show('p', '서버 접수·처리 중(pending): 접수 응답(ACK)은 조치 성공이나 효과 확인이 아닙니다.');
      } else if (state === 'succeeded') {
        if (observation?.effectApplied === true && id(observation?.observedAt)
          && receiptId && (!receipt?.status || receipt.status === 'succeeded')) {
          show('p', '연동 시스템 실제 관측 결과: 효과 확인(succeeded).');
          show('p', 'effectApplied: true');
          show('p', '관측 시각(observedAt): ' + safe(observation.observedAt));
          show('p', '영수증(receiptId): ' + safe(receiptId));
        } else {
          show('p', '결과 불명(unknown): 실제 효과, 관측 시각 또는 영수증이 확인되지 않았습니다.');
          show('p', '성공이나 효과 없음으로 단정하지 말고 연동 시스템 결과만 재조회하세요.');
        }
      } else if (state === 'denied') {
        show('p', '연동 시스템 거절(denied): 조치 효과 확인 상태가 아닙니다.');
      } else if (state === 'failed') {
        show('p', '연동 시스템 실패(failed): 조치 효과 확인 상태가 아닙니다.');
      } else if (state === 'unknown') {
        show('p', '결과 불명(unknown): 성공 또는 효과 없음으로 단정할 수 없습니다.');
        show('p', '같은 조치를 다시 실행하지 말고 「연동 시스템 결과만 재조회」로 원래 요청의 결과를 확인하세요.');
      } else if (state === 'expired') {
        show('p', '확인 기한 만료(expired): 이전 준비로는 실행할 수 없으므로 다시 준비하세요.');
      } else if (state === 'error') {
        show('p', '요청 처리 안 됨(error): 조치 성공이나 효과를 확인하지 못했습니다.');
      } else {
        show('p', '결과 불명(unknown): 상태를 확인할 수 없습니다. 연동 시스템 결과만 재조회하세요.');
      }

      // Bind event and request identifiers only to this invocation's current snapshot.
      if (eId) root.setAttribute('data-student-action-event', eId);
      if (rId) root.setAttribute('data-student-action-request', rId);
      if (eId) show('p', '사건 ID(event.id): ' + safe(eId));
      if (Array.isArray(event?.evidence)) {
        const ids = event.evidence.filter(row => id(row?.id)).map(row => row.id);
        if (ids.length) show('p', '현재 사건의 근거 ID: ' + ids.map(safe).join(', '));
      }
      if (aId) show('p', '조치 ID(actionId): ' + safe(aId));
      if (id(target?.id)) show('p', '실제 대상 ID(target.id): ' + safe(target.id));
      if (Number.isSafeInteger(target?.generation) && target.generation > 0) show('p', '대상 세대(target.generation): ' + target.generation);
      if (rId) show('p', '요청 ID(requestId): ' + safe(rId));
      if (receiptId) show('p', '영수증 ID(receiptId): ' + safe(receiptId));
      if (Number.isSafeInteger(receipt?.version) && receipt.version > 0) show('p', '결과 버전(version): ' + receipt.version);
      if (state === 'prepared' || state === 'expired') show('p', '사람 확인 기한(confirmationExpiresAt): ' + safe(confirmationExpiresAt));
      if (typeof receipt?.replayed === 'boolean') {
        show('p', '같은 요청 재확인(replayed): ' + receipt.replayed);
        if (receipt.replayed) show('p', '동일 requestId의 재응답이며 새 집행 결과가 아닙니다. 중복 요청하지 말고 결과만 재조회하세요.');
      }
      if (receipt?.superseded === true) show('p', '이전 응답(superseded)은 최신 결과가 아니므로 재조회하세요.');
      if (state === 'failed' || state === 'denied') show('p', '처리 사유(message): ' + safe(message));
      if (state === 'loading' && message != null) show('p', '진행 안내(message): ' + safe(message));
      if (state === 'error' || (state === 'unknown' && error)) {
        const code = typeof error?.code === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(error.code)
          ? error.code : 'ACTION_RESULT_UNVERIFIED';
        show('p', '오류 코드(error.code): ' + code);
        show('p', '오류 메시지(error.message): ' + safe(error?.message));
      }
      if (state === 'prepared') show('p', '제안, 사람 확인, 서버 전달, 접수(ACK), 실제 효과 관측은 각각 다른 단계입니다.');
      if (state === 'pending' || state === 'executing') show('p', '현재는 요청 진행 상태일 뿐 실제 효과 관측에 따른 완료 상태가 아닙니다.');
      show('p', '이 학생 화면에는 집행 버튼이 없습니다. 준비·사람 확인·결과 재조회는 제공 화면에서만 진행합니다.');
      return root;
    },
  };
}
