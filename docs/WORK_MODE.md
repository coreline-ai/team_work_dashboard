# 작업 모드 운영 가이드

## 목적

앞으로 기능 추가/수정 작업을 "한 번에 실행 가능한 표준 흐름"으로 고정합니다.

## 모드 정의

1. PLAN 모드
- 작업 범위 확정
- 영향 파일/권한/데이터 변경점 식별
- 수용 기준(테스트 기준) 확정

2. IMPLEMENT 모드
- 기능 구현
- UI/API/권한 규칙 반영
- 필요 시 시드/문서 동시 업데이트

3. VERIFY 모드
- 정적/빌드/통합 검증 실행
- 표준 명령: `npm run verify:all`
- 포함: `lint + build + e2e`

4. ONE-SHOT 모드
- 데이터 재적재부터 전체 검증까지 일괄 실행
- 표준 명령: `npm run run:once`
- 포함: `prisma:seed + verify:all`

## 실무 규칙

1. 기능 배치 완료 전에는 반드시 VERIFY 모드 통과
2. 데이터/권한 변경이 있으면 ONE-SHOT 모드로 최종 검증
3. 실패 시 해당 단계에서 즉시 중단하고 원인 수정 후 재실행

## 빠른 실행 명령

```bash
npm run verify:all
npm run run:once
```
