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
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
