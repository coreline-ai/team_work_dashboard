# 프로젝트 대시보드 최종 마감 계획 (잔여 항목 0)

## 완료 기준

- [x] 팀 멤버별 업무 상세(전체 펼침형) 제공
- [x] 프로젝트 전체 일정 간트 도표 제공
- [x] 간트 주/월 스케일 전환 제공
- [x] 간트 줌(7일/30일/전체) 제공
- [x] 간트 드래그 커스텀 줌 제공(구간 선택)
- [x] `/dashboard/projects/:id` 반영
- [x] `/projects/:id` 동일 정보구조 반영
- [x] 공개 API 응답 확장(memberWorkloads, schedule)
- [x] lint/build/e2e 전체 통과

## 구현 내역 요약

1. 타입 확장
- `src/types/domain.ts`
- `ProjectMemberTaskDetail`, `ProjectMemberWorkload`, `ProjectScheduleLane`, `ProjectScheduleOverview` 추가
- `PublicProjectOverview` 확장

2. 집계 로직 확장
- `src/lib/projects.ts`
- 멤버별 업무 상세 + 프로젝트 스케줄 간트 데이터 계산

3. UI 확장
- `src/components/dashboard/project-dashboard-page.tsx`
- 멤버 상세 섹션 + 간트 탭/스케일/줌 컨트롤 + 드래그 커스텀 줌 추가

4. 상세 페이지 동기화
- `src/app/projects/[id]/page.tsx`
- 공통 대시보드 컴포넌트 재사용

5. 회귀/검증
- `e2e/multi-project-management.spec.ts` 시나리오 확장
- 최종 검증: lint/build/e2e 통과

## 남은 항목

- 현재 기준 기능 잔여 항목 없음
- 후속 개선은 성능 고도화(대량 데이터 캐싱/가상화) 범주로 별도 트랙 관리
