# Implementation Impact

[← 디자인 계약으로 돌아가기](../../design.md)

디자인 결정이 현재 구현에 미치는 범위를 구분한다.

## Impact Levels

### Visual-only `[V]`

- 타이포그래피와 spacing scale 통일
- 색 대비와 focus ring
- 공용 버튼, 입력, 시트의 스타일 통일
- 결과 화면 섹션 순서 변경
- 장소 선택 문구 변경
- 이미지 fallback

### Frontend Behavior `[F]`

- 답변 선택 후 퀴즈 자동 진행과 이전 답변 수정
- Back과 오버레이 history 동작
- 결과 추천 미리보기 펼치기
- 선택 상태와 스크롤 위치 보존
- 시트 focus management와 Escape 처리
- 완료 화면의 선택 다시 보기

### Backend or Shared Contract `[B]`

- 담은 장소 저장
- 선택 장소로 코스 생성
- 신규·복귀 사용자의 정확한 분기 기준
- 탐험 방문 인증과 팀 실시간 상태
- 기록 조회와 오프라인 캐시 범위

구현은 `[V] → [F] → [B]` 순서가 아니라, 먼저 전체 흐름을 합의한 뒤 각 세로 사용자 여정 안에서 필요한 수준을 함께 적용한다. 단, `[B]`는 응답 예시와 타입 계약 확정 전 mock으로만 개발한다.

새 UI 라이브러리나 별도 CSS 파일을 추가하지 않는다. 기존 Tailwind 토큰, `cn()`, 공용 컴포넌트를 정리해 사용한다.

## References

이 문서의 구조와 기준은 2026-09-04에 다음 공개 자료를 조사해 프로젝트 상황에 맞게 적용했다.

- [Google Labs — DESIGN.md Format Specification](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)
- [Google Labs — DESIGN.md Philosophy](https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md)
- [Atlassian Design System — Typography](https://atlassian.design/foundations/typography)
- [Atlassian Design System — Spacing](https://atlassian.design/foundations/spacing)
- [Primer Design System](https://primer.github.io/design/)
- [GOV.UK Service Manual — Map and understand a user's whole problem](https://www.gov.uk/service-manual/design/map-a-users-whole-problem)
- [GOV.UK Design System — Error message](https://design-system.service.gov.uk/components/error-message/)
- [Carbon Design System — Empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/)
- [Carbon Design System — Loading](https://carbondesignsystem.com/patterns/loading-pattern/)
- [W3C — Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C — Understanding Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)
- [W3C — Understanding Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
