# 프로젝트별 권한/필터 조합 E2E 체크리스트

## 1) 이번 배치에서 자동화하는 핵심 시나리오

1. 공개 접근
- 게스트가 `/`, `/dashboard/portfolio`, `/dashboard/projects/:id`, `/tasks`, `/projects`, `/team-members`, `/search` 접속 가능
- 게스트가 `/settings` 접근 시 `/login` 리다이렉트

2. 관리자 모드 UI 게이팅
- 팀장(ADMIN) 로그인 시 헤더에 `관리 모드 OFF/ON` 토글 노출
- 기본값 OFF에서 프로젝트/팀원 관리자 패널 미노출
- ON 전환 시 관리자 패널 노출
- 팀원(MEMBER)/게스트에게 관리자 토글 및 관리자 패널 완전 미노출

3. 프로젝트 쓰기 권한
- 게스트 `POST /api/projects` = `401`
- 팀원 `POST /api/projects` = `403`
- 팀장 `POST /api/projects` = `201`

4. 태스크 권한
- 팀원은 본인 비관련(본인 생성/담당 아님) 태스크 `PATCH` 시 `403`
- 팀장은 동일 태스크 `PATCH` 가능(`200`)

5. 태스크 멀티필터 조합
- `projectId + status + phase + q` 조합 조회 시 결과가 모두 조건을 만족
- 공개 API(`/api/public/tasks`)와 인증 API(`/api/tasks`) 모두 검증

6. 고급검색 상세 필터
- `/api/public/search`와 `/api/search`에서 `scope/status/phase/projectId` 적용
- MEMBER는 타인 비관련 태스크 검색 결과 미노출

## 2) 이번 배치에서 선반영하는 추가 보완

1. API 일관성: 아카이브 프로젝트 태스크를 기본 조회(공개/보호/검색)에서 제외
2. 테스트 안정성: 로그인/관리모드/관리패널에 `data-testid` 추가
3. 테스트 픽스처: E2E 전용 프로젝트/태스크를 사전 준비해서 필터 검증의 결정성 보장

## 3) 후속 권장 작업(이번 배치 외)

1. E2E를 CI 파이프라인(GitHub Actions 등)에 연결
2. 대량 데이터 성능 시나리오(프로젝트 100+, 태스크 10k+) 부하 테스트 추가
3. 감사로그(AuditLog) 검증 테스트 확장
4. 프로젝트별 권한 정책 확장(ProjectMember 모델 도입 시) 회귀 테스트 세트 분리
