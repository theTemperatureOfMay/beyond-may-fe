---
version: "0.1"
name: "Beyond May — Gwangju Companion Map"
description: "광주와 5·18의 기억을 존중하면서 오늘의 여행으로 연결하는 모바일 서비스 디자인 계약"
colors:
  canvas: "#FDFFF9"
  surface: "#FFFFFF"
  surface-muted: "#EDEDED"
  ink: "#141414"
  ink-muted: "#60646A"
  border: "#DDDDDD"
  brand-orange: "#E74D22"
  brand-violet: "#6E4DE4"
  focus: "#5A4EFF"
  error: "#B3262E"
  error-surface: "#FFEBE8"
  route: "#FFC9D7"
  location: "#E0305F"
  type-thinker: "#6E4DE4"
  type-foodie: "#FF9E28"
  type-artist: "#A4DD62"
  type-remember: "#4D7AE4"
typography:
  display:
    {
      fontFamily: "Pretendard JP, system-ui, sans-serif",
      fontSize: "4rem",
      fontWeight: 700,
      lineHeight: 1.18,
      letterSpacing: "-0.02em",
    }
  headline-lg:
    {
      fontFamily: "Pretendard JP, system-ui, sans-serif",
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
    }
  headline-md:
    {
      fontFamily: "Pretendard JP, system-ui, sans-serif",
      fontSize: "1.75rem",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "-0.01em",
    }
  title-lg:
    {
      fontFamily: "Pretendard JP, system-ui, sans-serif",
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    }
  title-md:
    {
      fontFamily: "Pretendard JP, system-ui, sans-serif",
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.4,
    }
  body-lg:
    {
      fontFamily: "Pretendard JP, system-ui, sans-serif",
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.6,
    }
  body-md:
    {
      fontFamily: "Pretendard JP, system-ui, sans-serif",
      fontSize: "0.9375rem",
      fontWeight: 400,
      lineHeight: 1.55,
    }
  body-sm:
    {
      fontFamily: "Pretendard JP, system-ui, sans-serif",
      fontSize: "0.8125rem",
      fontWeight: 400,
      lineHeight: 1.5,
    }
  label:
    {
      fontFamily: "Pretendard JP, system-ui, sans-serif",
      fontSize: "0.75rem",
      fontWeight: 500,
      lineHeight: 1.35,
      letterSpacing: "0.02em",
    }
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
  hero-card: "40px"
  full: "9999px"
spacing:
  none: "0px"
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  section: "32px"
  section-lg: "40px"
  page: "48px"
  hero: "64px"
  gutter: "24px"
components:
  button-primary:
    {
      backgroundColor: "{colors.ink}",
      textColor: "{colors.canvas}",
      typography: "{typography.body-md}",
      rounded: "{rounded.full}",
      height: "48px",
      padding: "0 20px",
    }
  button-secondary:
    {
      backgroundColor: "transparent",
      textColor: "{colors.ink}",
      typography: "{typography.body-md}",
      rounded: "{rounded.full}",
      height: "48px",
      padding: "0 20px",
    }
  button-icon:
    {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.ink}",
      rounded: "{rounded.full}",
      size: "44px",
    }
  input:
    {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.ink}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      height: "48px",
      padding: "0 16px",
    }
  modal:
    {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.ink}",
      rounded: "{rounded.lg}",
      padding: "24px",
    }
  bottom-sheet:
    {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.ink}",
      rounded: "{rounded.xl}",
      padding: "24px",
    }
---

# Beyond May Product Design Contract

> 상태: 출시 목표를 위한 검토 초안이다. 현재 구현을 묘사하는 문서가 아니라 앞으로의 디자인 판단 기준이다.
>
> 영향 표기: `[V]` 시각 표현, `[F]` 프론트엔드 동작, `[B]` 백엔드 또는 공유 인터페이스 계약.

## Product Direction

Beyond May는 **일출빛이 비치는 여행 기록장과 시민의 지도를 한 화면에 겹친 서비스**다. 광주와 5·18의 기억을 존중하면서 오늘의 장소를 걷고 기록하고 다음 사람과 연결하도록 돕는다.

- **기록 모드:** 홈, 성향 결과, 공유 카드. 주황·보라의 빛, 우표, 소인, 사진을 사용한다.
- **이동 모드:** 장소 선택, 코스, 탐험 지도. 오프화이트와 차콜을 중심으로 명료하고 조작하기 쉽게 만든다.

두 모드는 동일한 타이포그래피, 버튼, 여백, 아이콘을 공유한다. 브랜드 색은 중요한 전환과 성취에만 사용한다.

## Product Principles

1. 역사·추모 장소를 `싫어요`, 실패, 점수 같은 언어로 평가하지 않는다.
2. 한 화면에는 사용자가 이해할 수 있는 주 행동 하나를 둔다.
3. 지도가 실패해도 장소 목록과 다음 행동을 사용할 수 있어야 한다.
4. 모션은 진행, 선택, 위치, 방문 완료를 설명할 때만 사용한다.
5. 빈 화면과 오류 화면에는 이유와 가능한 다음 행동을 제공한다.
6. 브랜드 장식보다 대비, 글자 확대, 키보드, 터치 영역을 우선한다.

## Detailed Documents

필요한 범위의 문서만 읽되, 화면 전체를 변경할 때는 아래 순서로 확인한다.

| 순서 | 문서                                                           | 다루는 내용                                          |
| ---- | -------------------------------------------------------------- | ---------------------------------------------------- |
| 1    | [Foundations](docs/design/foundations.md)                      | 색상, 타이포그래피, 간격, 깊이, 형태                 |
| 2    | [User Flows and Navigation](docs/design/flows.md)              | 사용자 여정, Back 규칙, 결과·장소 선택 흐름          |
| 3    | [Components and Interaction States](docs/design/components.md) | 버튼, 입력, 모달, 시트, 카드, 지도와 상태            |
| 4    | [Product Quality](docs/design/quality.md)                      | 로딩, 오류, 빈 화면, 권한, 접근성, 반응형, 출시 점검 |
| 5    | [Implementation Impact](docs/design/implementation.md)         | `[V]`·`[F]`·`[B]` 범위와 조사 출처                   |

## Working Rules

- `[B]` 항목은 API 응답 예시와 담당자 합의 없이 구현하지 않는다.
- 흐름을 먼저 합의한 뒤 각 사용자 여정 안에서 `[V]`, `[F]`, `[B]`를 함께 검토한다.
- 새 UI 라이브러리나 별도 CSS 파일을 추가하지 않는다.
- 현재 UI와 문서가 충돌하면 이 문서를 출시 목표로 취급하되, 확정되지 않은 결정은 코드보다 먼저 문서에서 합의한다.

## Launch Goals

- 처음 온 사용자가 도움 없이 `성향 검사 → 결과 → 등록 → 장소 선택 → 코스`를 완료한다.
- 어느 화면에서도 뒤로 가기의 결과를 예측할 수 있다.
- 장소 카드를 모두 확인한 뒤 다음 행동이 분명하다.
- 위치 권한을 거부하거나 지도가 실패해도 나머지 기능을 계속 사용할 수 있다.
- 320px 너비, 200% 글자 확대, 키보드 조작에서도 핵심 행동이 손실되지 않는다.
