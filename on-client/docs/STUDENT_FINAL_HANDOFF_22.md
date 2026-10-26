# hongbin 최종 인수인계 · 재현 검증 및 릴리스 기록 (22단계)

> **프로젝트:** ALEPH 보안 Agent `hongbin`. **릴리스 상태: 검증 중(release candidate), v1.0 인증 아님.** 본 문서는 학생 작성이며 제공 소스·제공 문서·설정·판정 코드를 바꾸지 않는다. 공식 AI의 커밋 원문 검토 통과와 실제 환경 재현/실운영 인증은 별개다.

## 1. 버전·저장소·동일 커밋 기준

| 항목 | 기록 |
|---|---|
| 공개 GitHub 저장소 | `https://github.com/hongbin9305/alekov-agent` |
| 제출 브랜치 | `main` |
| **21단계까지의 재현 준비 기준 커밋(40자리)** | `e368c9332f5e1121a273607b25996cc5ce1eb48e` |
| **22단계 제출/실행 기준** | 본 문서와 README 수정이 포함된 최종 **하나의** 커밋. ALEPH 포털에 입력할 40자리 SHA와 새 폴더의 `git rev-parse HEAD`가 정확히 일치해야 한다. |
| 제공 앱 `package.json` 버전 | `0.2.11` |
| Node.js 계약 | `package.json` `engines.node = 24.19.0`. 제공 시작 도구는 Node 22~24를 허용하고 24.19.0을 권장 |
| 학생 릴리스 분류 | 22단계 원문 검토용 `release candidate`. 실제 SDP·AI·조치 집행 누락으로 `v1.0` 표기 보류 |
| 이전 단계 기능 | `student/extension.mjs`의 8개 `render*` 함수와 제공 서버를 그대로 보존 |

**최종 커밋 번호를 문서 안에 자기 자신으로 적을 수는 없다.** 커밋 내용이 바뀌면 SHA도 바뀌기 때문이다. 대신 위의 변경 전 **기준 SHA**를 명시하고, 최종 SHA는 GitHub 커밋·ALEPH 입력값·새 폴더에서 `git rev-parse HEAD`로 함께 검증한다. 문서와 코드가 **동일한 최종 SHA**의 스냅샷이어야 한다. 서로 다른 과거 단계의 통과를 합쳐 최종 릴리스의 새 환경 통합 시험 성공으로 표시하지 않는다.

## 2. 기존 원본 보존과 새 폴더에서 최종 커밋 받기

기존 Workbench 프로젝트의 수정 사항·미커밋 파일·Git 기록을 **보존**한다. 이 문서에서 기존 프로젝트 경로를 임의로 가정하지 않는다. 현재 프로젝트의 Git 최상위에서 `git status --short`와 `git rev-parse HEAD`를 확인하여 **개인 실행 기록에만** 남길 수 있다. 기존 작업을 `git reset --hard`, 강제 pull, 삭제, 덮어쓰기 하지 않는다.

다음은 Windows PowerShell에서 **별도의 빈 상위 폴더**를 열어 실행할 명령이다. `<제출한 22단계 커밋 40자리>`만 실제 제출 SHA로 바꾸고 실행한다. Git과 Node.js가 설치돼 있어야 한다. 아래 명령은 작성자가 사용자 PC에서 실행한 것이 아니라, 현재 Git 저장소·시작 스크립트에 맞춰 작성한 재현 절차다.

```powershell
# 새 빈 작업 위치의 PowerShell에서 진행한다. 기존 프로젝트에서는 실행하지 않는다.
$repoUrl = 'https://github.com/hongbin9305/alekov-agent.git'
$finalCommit = '<제출한 22단계 커밋 40자리>'
$dest = Join-Path (Get-Location) 'hongbin-stage22-clean'
if ($finalCommit -notmatch '^[0-9a-f]{40}$') { throw '제출한 실제 SHA 40자리를 넣으세요.' }
if (Test-Path -LiteralPath $dest) { throw '동명 폴더가 이미 있습니다. 빈 작업 위치를 고르세요.' }

git clone --no-checkout $repoUrl $dest
if ($LASTEXITCODE -ne 0) { throw 'GitHub 복제 실패 — 접속/권한을 확인하세요.' }
git -C $dest checkout --detach $finalCommit
if ($LASTEXITCODE -ne 0) { throw '제출 SHA 체크아웃 실패 — 원문 확인 불가.' }
$actualCommit = (git -C $dest rev-parse HEAD).Trim()
if ($actualCommit -ne $finalCommit) { throw '원하는 최종 커밋과 실제 HEAD가 다릅니다.' }

Set-Location (Join-Path $dest 'on-client')
Get-Location
node --version
npm --version
git --version
npm run check
```

기대하는 `package.json` 스크립트: `check = node --check student/extension.mjs`; 별도 npm `dependencies`/`devDependencies` 선언 없음. **현재 Git 원문에는 `on-client/package-lock.json`이 없다.** 새 폴더에서 불필요하게 `npm install`, `npm audit fix` 또는 버전 강등을 수행하지 않는다. 따라서 미설정된 OSV 패키지 조회를 취약점 없음이라고 주장하지 않는다.

## 3. 앱 실행·브라우저·종료·재실행

위 명령으로 이동한 **새 폴더의 `on-client` PowerShell**에서 제공된 실제 시작 도구를 실행한다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

코드의 정상 시작 신호는 **`케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5189/ 을 여세요.`** 및 **`서버가 응답한 것만 확인했습니다. AI 연결 상태는 화면에서 따로 확인해 주세요.`** 이다. `케셰브`는 제공 시작 틀 이름이고 프로젝트 표시 이름 `hongbin`과 다르므로 정상이다.

1. 브라우저에서 `http://127.0.0.1:5189/` 접속. `보호 현황` 화면과 기본 상태 문구·메뉴가 나오는지 기록한다.
2. 기본 실행에서 `disconnected`·`ENGINE_NOT_CONNECTED`가 나올 수 있다. 이는 로컬 HTTP 서버 성공과 운영 SDP 연결 실패/미설정을 구분하는 증거이며, 실제 인증 성공이 아니다.
3. **종료:** 위 명령을 실행 중인 PowerShell에서 `Ctrl+C`. 앱이 종료됐는지 그 브라우저 주소가 더는 응답하지 않는 것으로 확인한다.
4. **재실행:** 같은 새 폴더 `on-client`에서 시작 명령을 다시 실행하고, 페이지·현재 상태가 다시 나오는지 대조한다.
5. 포트 5189가 이미 사용 중이면 기존 프로그램을 종료하지 말고 시작 도구에 `-Port 5190`을 붙인다. 그때는 주소도 `http://127.0.0.1:5190/`으로 바꾼다.

서버의 `npm start`, `npm run demo`도 `package.json`에 정의돼 있으나, **`demo` 자료는 예제이며 실제 연결·운영 성공과 다르다.** 별도 호스트·열쇠·인증서를 이전 작업 폴더에서 복사하거나 새로 생성하지 않는다. 계정/SDP/AI 연결은 운영자 승인 절차가 별도로 필요하다. `npm run check`는 문법만 검사한다.

## 4. 재현 실측 기록 — 완료된 검증과 아직 하지 않은 검증

### 4.1 이 작업에서 실제 실행한 별도 폴더 시험(범위를 명시)

**검증 소스는 최종 커밋이 아닌 과거 17단계 기준 SHA `fcfc85ef8f5e85b8468612ad7a42630d8d187181`이다.** 과거 제출 JSON의 압축 원문을 **별도 Linux 작업 폴더**로 복원했고, Git tree SHA `2cfac9f37016e64e978bb92f421801ca719c44c8`를 계산해 당시 원문과 일치함을 확인했다. 이 구별 없이 아래 결과를 현재 **최종 커밋의 새 폴더 통합 재현 성공**으로 옮겨 적지 않는다.

| 확인 시각 (UTC) | 대상 소스/환경 | 실제 수행 | 실제 관찰값 | 판정 범위 |
|---|---|---|---|---|
| 2026-10-26 약 02:16 | `fcfc85ef…` / Linux, Node `v22.16.0`, npm `10.9.2`, Git `2.47.3` | `npm run check` | 종료 코드 0; 당시 `student/extension.mjs` 문법 통과 | 17단계 기준 코드만 |
| 2026-10-26T02:16:25Z | 같은 기준 / 기본 `ON_PORT=55189` | `node src/server.mjs` 및 HTTP GET | `/` → 200, `/api/diagnostics` → 200(`disconnected`, `ENGINE_NOT_CONNECTED`), `/api/me` → 503, `/api/vulnerabilities` → 200(`not_configured`) | 기본 연결 없음이 정상 구별됨 |
| 2026-10-26T02:17:02Z | 같은 기준 / `ON_PORT=55190`, `--demo` | 로컬 HTTP GET | `/`·`/api/me`·`/api/apps`·`/api/events` → 200, 모드 `demo`, 예제 사건 `event-01`, `/api/vulnerabilities` → `not_configured` | **예제 데이터** 응답, 실운영 성취 아님 |
| 2026-10-26 | 최신 공개 GitHub `main`, `e368c933…` 기준 | 폴더·`package.json`·학생 함수·21단계 실행 설명 원문 확인 | Node 계약 `24.19.0`, 앱 버전 `0.2.11`, 8개 `render*` 함수·실행 도구 경로 확인 | **원문 확인**, 실제 사용자 PC 명령 실행 아님 |
| **미확인** | **22단계 최종 커밋** / 새 Windows PowerShell 폴더 | 위 2~3장 `git clone`, `checkout`, `npm run check`, 브라우저/종료/재실행 전체 | **실제 출력·확인 시각·같은 최종 SHA의 결과 미확인** | 직접 확인 전 **검증 중** |

본 검증 환경에서는 GitHub 주소 DNS 접근이 차단되어 `git clone`에 `Could not resolve host: github.com`이 반환됐다. 따라서 **GitHub에서 최종 SHA를 새 폴더에 직접 내려받았다고 주장하지 않는다.** 21단계 이후 추가된 것은 문서이며, 기존 학생 UI 함수의 후보 모의 테스트 이력(18~20단계)도 최종 Windows 누적 통합 시험을 대신하지 않는다. PowerShell 시작 도구는 이 Linux 시험에서 실행하지 못했고, `src/server.mjs`를 직접 실행했다.

### 4.2 13~21단계 누적 인수인계 표

확인일 `2026-10-26`은 이번 **원문 대조 및 한정된 Linux 스모크 테스트를 기록한 날짜**이지, 각 단계 공식 서버의 채점 시각을 주장하는 값이 아니다. 이전 과제의 공식 통과 여부는 학습자의 단계 진행/보고와 별개이며, *이 최종 커밋을 새로운 Windows 환경에서 통합 재현*한 근거는 아직 없다.

| 단계 | 현재 누적 소스에서 확인할 기능·위치 | 증거·확인 결과 | 최종 동일 SHA/실연동 확인 |
|---|---|---|---|
| 13 | `renderIdentity` — 로그인·기기·세션 표시 | `student/extension.mjs` 원문 존재; 기본 모드의 미연결/예제는 구분해야 함 | 미확인 |
| 14 | `renderDecision` — `allow/deny/challenge/unknown` 판정 구분 | 학생 함수·제공 `/api/access` 원문 확인 | 미확인 |
| 15 | `renderEvents` — 접속/XDR 기록·근거·규칙 | 학생 함수 원문 확인; 17기준 `demo`에서 `event-01` API 200 | 실제 SDP/최종 브라우저 재현 미확인 |
| 16 | `renderStatus` — 오류/빈 목록/수동 복구/도움정보 | 학생 함수와 제공 진단 경로 원문 확인 | 미확인 |
| 17 | `renderAiConnection` — 연결 점검·권한/한도 오류 구분 | 현재 학생 표시 코드와 `/api/ai/check` 원문 확인; 단계 통과는 사용자 보고 | 실제 앱 `ai.explain` 권한·게이트 응답 미확인 |
| 18 | `renderExplanation` — 동일 사건 근거 ID/규칙/unknown/미집행 | 학생 구현 원문 확인; 이전 모의 입력 테스트와 사용자 통과 보고 | 최종 실제 AI 사건 호출 미확인 |
| 19 | `renderAction` — 제안/사람 확인/`pending` ACK/실제 관측 효과 | 학생 구현 원문 확인; 이전 모의 테스트와 사용자 통과 보고 | 운영 원천 집행기·효과 관측 **미완료/미확인** |
| 20 | `renderVulnerabilities` — 정확한 버전·OSV 상태·partial 유지 | 학생 구현 원문 확인; 이전 모의 테스트와 사용자 통과 보고 | 실제 설치 패키지·OSV 외부 조회 미확인 |
| 21 | `README.md`, `docs/STUDENT_RUNBOOK.md` — 실행/구성/장애 안내 | GitHub 기준 `e368c933…`에 두 문서 존재·경로 원문 대조 | 새 Windows PowerShell 사용자 실행 미확인 |

**결과 용어:** `원문 확인` = 파일의 기능 구현을 읽음; `모의 검증` = 예제 또는 가짜 입력; `HTTP 실측` = 위 명시된 기준 SHA·Linux 로컬 API에서 실제 받은 결과; `연결 없음` = 미승인/미연결; `미확인` = 실행하지 않았거나 증거 없음. `demo`는 **실제 연동 재현됨**으로 기재하지 않는다. 17~21단계 개별 통과/모의 테스트 결과는 22단계 최종 버전 전체에 자동 합산하지 않는다.

## 5. 재현용 파일·설정과 이동 제한

| 이동·보존 대상 | 이동하는 방법 | 제한 |
|---|---|---|
| Git 추적 소스(`on-client/src`, `public`, `student`, `tools`, `README`, `docs`, `package.json`) | 동일 SHA로 `git clone` → `checkout --detach`, `git rev-parse HEAD` 비교 | 새 폴더에서 원래 작업 폴더를 덮어쓰지 않음 |
| 비밀 없는 설정 견본 `on-client/.env.example` | Git 추적 견본만 함께 이동 | 예시에 없는 실제 민감한 설정값을 추측·기입하지 않음 |
| 서버 계정·앱 AI 자격·SDP 호스트 인증 자료 | **별도 운영자 승인·안전한 재발급 또는 공식 이관 절차** | 기존 개인 설정/토큰/인증서/키를 Git·README·ZIP·로그로 복사하지 않음 |
| 실제 사용자 이벤트/접속/XDR 기록 | 운영 원천/SDP의 별도 권한·보존·복원 정책 사용 | 코드 복제는 운영 서버 데이터 백업이 아님 |
| 서버 조치 접수 기록/감사 이력 | 제공 `src/actions/store.mjs`가 **별도 지정된 기존 SQLite DB**에 `alekov_action_*` 테이블로 기록하도록 설계 | 미연결 실행에는 생성된 DB 없음. 유효한 운영 DB가 있다면 운영자가 쓰기 정지·일관성 스냅샷·검증/복구 승인 담당. 학생이 DB를 임의 복사·삭제·초기화하지 않음 |
| 학생 로컬 설명서, 개인 재현 로그·캡처 | 비밀 없는 파일만 별도 안전한 위치에 백업하고 원본/사본 해시 비교 | 실명/비밀/내부 네트워크 로그는 외부 공개 저장소·AI 입력에 넣지 않음 |
| 브라우저 일시 상태·조치 확인 티켓 | 재실행 후 제공 화면을 통해 다시 확인 | 메모리의 티켓은 복구/재집행 권한이 아님. `조치 화면 취소`는 기존 효과 취소가 아님 |

**백업 계획:** (1) 작업 변경 상태를 먼저 `git status --short`로 확인하고 필요한 본인 소스 변경은 별도로 정상 커밋한다. (2) GitHub 커밋 SHA와 작업 폴더의 원문·문서 백업 위치를 기록한다. (3) 개인 로그·캡처를 비밀값 검사 뒤 별도 보관한다. (4) 운영 DB/사용자 사건 데이터는 프로젝트 Git에 넣지 않고 운영자가 자체 일관성 있는 백업과 복구 가능 여부를 검사한다. (5) 복원 연습은 **새 빈 폴더에 해당 SHA 체크아웃 → 비밀 없는 소스 검증 → 운영자 승인 설정 복원(필요한 경우에만) → 기능별 조회** 순서로 한다. 기존 운영 DB를 직접 덮어쓰지 않는다.

`git clone` 성공은 오직 **소스 복원**이지 운영 DB·권한·감사 로그 복원 성공이 아니다. 백업이 확인되지 않았을 때도 실패를 성공으로 바꾸지 않는다.

## 6. 미해결·지원 범위·수료 조건

- 현재 배포본 `on-client/package.json`은 **`0.2.11`**, 본 문서의 학생 릴리스 상태는 **`검증 중 / release candidate`**다. 실제 동작이 미확인인 환경을 `v1.0`이나 운영 인증으로 표시하지 않는다.
- 기본 실행은 SDP 엔진과 AI/Native Host 권한이 준비되지 않으면 `disconnected`/`ENGINE_NOT_CONNECTED` 또는 `NATIVE_HOST_DISABLED`를 보일 수 있다.
- 운영 **19단계 실제 집행 연결**은 여전히 준비되지 않았다. `pending` ACK만으로 `succeeded` 효과 관측을 주장하지 않는다.
- `package-lock.json`·설치된 `node_modules` 검증과 OSV 실조회는 운영 승인 대상 설정이 없어 미확인. `not_checked`와 `not_configured`는 "취약점 없음"이 아니다.
- 실환경의 실제 사용자 로그인, 계정/앱 AI 승인, 개인정보·기기 상태, 조치 영수증·보안 기록 복원은 별도 권한과 증거가 필요하다.
- **22단계 공식 통과**는 ALEPH 서버가 같은 제출 커밋의 코드·문서를 읽고 요건과 대조하는 학습 단계 수료다. **실제 운영 배포, v1.0 인증, 새 환경 자동 재현 보증이 아니다.**
- 이후 Windows에서 최종 SHA를 실제로 확인한 경우에도, 결과를 추가하려면 관찰일·환경·SHA·실제 응답을 새 문서/커밋에 기록해 그 새 SHA로 일관되게 제출해야 한다. 서로 다른 커밋의 결과를 이어 붙이지 않는다.

## 7. 최종 제출 점검

- [x] 기존 `student/extension.mjs`와 제공 서버/화면/설정 변경 없음(문서만 추가).
- [x] GitHub URL·`main`·21단계 기준 SHA 40자리를 본 문서에 명시.
- [x] 최종 SHA를 새 폴더에 고정하는 PowerShell 복제·체크아웃·검증·실행/종료/재실행 순서 작성.
- [x] 13~21단계 누적 구현/확인 근거·시각·미확인 항목 작성.
- [x] 별도 폴더의 제한된 실제 Linux HTTP 실측을 구버전 SHA로 명확히 구분.
- [x] 데이터 보존·복원·민감 설정 분리와 운영 한계 작성.
- [ ] 최종 22단계 커밋의 Windows 새 환경 전체 재현: **미확인**.
- [ ] 실제 SDP/AI/조치 집행/OSV 운영 연결: **미확인 또는 준비 전**.
- [ ] ALEPH 공식 22단계 판정: **제출 후 확인**.

관련 문서: [학생 실행 설명서](STUDENT_RUNBOOK.md), [제공 실행 안내](STUDENT_LAUNCH_GUIDE.md), [오류 진단](CONNECTION_TROUBLESHOOT.md), [SDP 호스트](SDP_HOST_CONNECTION.md), [AI 연결](AI_SETUP_GUIDE.md).
