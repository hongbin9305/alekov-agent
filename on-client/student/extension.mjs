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
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
