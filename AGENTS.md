# AGENTS.md — Beyond May Frontend

AI 코딩 어시스턴트(Claude, Gemini, Cursor 등)가 이 프로젝트에서 코드를 작성할 때 지켜야 할 규칙.

## 프로젝트 개요

- 광주 5·18 테마 여행 앱 프론트엔드
- Next.js(App Router) + TypeScript + Tailwind CSS

## 기술 스택 (임의로 다른 라이브러리 추가 금지)

- 상태: 서버=React Query(@tanstack/react-query) / 클라이언트=Zustand
- HTTP: axios (services/lib/axios.ts 인스턴스 사용, fetch 금지)
- 실시간: @stomp/stompjs (STOMP, lib/socket.ts 단일 클라이언트)
- 스타일: Tailwind + cn() 헬퍼(clsx+tailwind-merge). 별도 CSS 파일 금지
- 폼: react-hook-form + zod (+ @hookform/resolvers)
- 지도: react-kakao-maps-sdk
- 날짜: date-fns

## 폴더 구조

- app/ : 라우팅 (page.tsx, layout.tsx)
- features/ : 기능별 모듈 (onboarding, places, course, explore, record)
- components/ : 공용 컴포넌트 (map, place-detail, share-sheet, ui)
- lib/ : 유틸 (cn, env, queryClient, socket)
- services/ : API 계층 (lib/axios, constant/endpoint, api/{도메인})
- stores/ : Zustand 스토어
- types/ : 공유 타입 (인터페이스 계약)
- mocks/ : msw 핸들러

## 네이밍 규칙

- 컴포넌트 / Class: PascalCase (RankTable, UserProfile)
- 컴포넌트 파일: PascalCase.tsx (Button.tsx)
- 일반 파일: camelCase (userService.ts, placeApi.ts)
- Custom Hook: use\*.ts (useUserList.ts)
- API 함수 파일: {resource}Api.ts (placeApi.ts)
- 타입 정의 파일: \*.ts (user.ts, common.ts)
- 테스트 파일: \*.test.ts
- 라우트 폴더(app/): kebab-case (team-explore) — URL이 되므로
- 일반 폴더(features/ 등): kebab-case (place-detail)
- 변수/함수: camelCase / 상수: BIG_SNAKE_CASE
- 타입/인터페이스: PascalCase, I/T/Type 접두사 금지(제네릭 T 제외). Props/State/Request/Response 접미사
- 함수 접두사: get / create / check / handle / is·has·can

## 상태 관리

- 서버에서 오는 데이터 = React Query
- 클라이언트 전용 상태(세션·선택값·UI) = Zustand
- 판단 기준: "서버에 존재하는 데이터인가?" → 예: React Query / 아니오: Zustand
- Zustand 파일: stores/{도메인}Store.ts / 훅: use + 도메인 + Store (useSessionStore)

## API 규칙

- axios 인스턴스는 services/lib/axios.ts 사용 (fetch 금지)
- 엔드포인트는 services/constant/endpoint.ts의 API_ENDPOINTS 사용 (/api/ prefix, 도메인별 그룹화)
- API 함수 네이밍: HTTP 메서드 + 명사 (postNickname, getPlaceDetail)
- Request/Response 타입 반드시 정의
- 모든 응답은 공통 래퍼 { code, data, message }로 온다 → types/common.ts의 ApiResponse<T>
- 응답 인터셉터는 response.data(래퍼)까지만 반환. 실제 데이터는 함수에서 res.data로 꺼냄
  (이유: 함수에서 code·message를 확인해야 하므로 data까지 벗기지 않음)
- 요청 인터셉터: 세션 토큰 자동 첨부 (Authorization: Bearer {token}) / 응답 인터셉터: 공통 에러 + 401 처리
- 백엔드 응답 키는 camelCase (placeImg, visitedAt). 타입도 camelCase로 맞춤
- 날짜: REST·소켓 payload 모두 ISO 8601 문자열(예: 2026-08-15T14:32:10+09:00) — 소켓도 epoch ms 아님 
- 화면 표시는 date-fns로 변환

## React Query 규칙 (v5 객체 문법)

- useQuery({ queryKey, queryFn }) 형태 사용 (v4 배열 인자 문법 금지)
- QueryKey는 하드코딩 금지, QueryKey Factory 사용 (services/constant/queryKey.ts)
- 훅 네이밍: use + 행위 + 대상 + Query / Mutation (useGetUserListQuery, useCreateUserMutation)
- 토큰 저장 등 side effect는 onSuccess/onError에서 처리

## 실시간(STOMP) 규칙

- @stomp/stompjs 사용, 클라이언트는 lib/socket.ts 단일 생성
- STOMP destination 구조는 백엔드 확정 채널을 따름 (types/socket.ts)
  - 구독(SUBSCRIBE): /topic/explorations/{explorationId}/{visits|locations|events}
  - 발행(SEND): /app/explorations/{explorationId}/locations
- 연결: CONNECT /ws (SockJS 미사용)
- 인증: STOMP CONNECT 프레임 헤더에 토큰 (Authorization: Bearer)
- STOMP 메시지 body는 문자열 → 수신 시 JSON.parse, 송신 시 JSON.stringify
- 구독은 컴포넌트 언마운트 시 반드시 unsubscribe (또는 연결 해제로 정리)
- 소켓 payload의 userId 등 식별자는 서버가 인증으로 식별하며, 클라이언트가 보낸 값은 신뢰하지 않음 (전송 방식과 무관한 보안 규칙)

## Import 규칙

- 경로 별칭: @/\* 하나만 사용 (@/components/..., @/lib/..., @/services/...)
- Barrel Export(index.ts 재export) 금지 (Tree-shaking)
- 단일 export 시 default export 사용

## 환경변수

- 브라우저용은 NEXT*PUBLIC* 접두사
- process.env 직접 접근 대신 lib/env.ts의 ENV 객체 사용
- .env.local 커밋 금지, .env.example(값 비움)은 커밋

## Git 컨벤션

- 커밋 형식: type: 작업 내용 (#이슈번호) 예) feat: 검색 필터링 추가 (#29)
- 커밋 type: feat, fix, refactor, style, design, docs, test, chore, rename, init, revert
- 브랜치 형식: type/이슈번호-설명 (kebab-case) 예) chore/25-initial-commit
- 브랜치 type: feature, release, hotfix, fix, ui, chore
- 기본 브랜치 develop / 피처 브랜치에서 개발 후 develop으로 PR
- 이슈·PR 제목 형식: [TYPE]: 작업 내용 예) [FEAT] 마이페이지 구현

## 코드 작성 시 주의

- TypeScript strict 모드. any 남용 금지, 매개변수·반환·props·상태 타입 명시 필수
- 화살표 함수 사용. const 우선, var 금지. 구조 분해 할당 활용, 약어 금지
- 컴포넌트는 함수형. 'use client'는 필요한 경우에만
- 주석은 JSDoc, 구현 상세가 아닌 "의도" 중심으로

---

# 작업 프로세스 (코드 작성 시 이 순서를 따를 것)

AI는 코드를 바로 작성하기 전에 아래 프로세스를 따른다. 이 프로젝트는 3인(A/B/C)이
기능별 feature 폴더를 나눠 병렬로 작업하며, 백엔드와 인터페이스 계약을 맞춘 뒤 진행한다.

## 0. 작업 시작 전: 이슈 → 브랜치 생성 (제일 먼저)

새 작업을 시작하면 코드/계획보다 먼저 이슈와 브랜치를 준비한다.

### (1) 이슈 생성 (내용 제안)

AI는 GitHub 이슈를 직접 생성할 수 없으므로, 아래 형식의 이슈 내용을 만들어 제안한다.
사용자가 GitHub에서 이슈를 생성하고 번호를 확인한다.

- 제목 형식: [TYPE]: 작업 내용
- 예: [FEAT] 성향 검사 질문 화면 구현
- TYPE은 커밋/라벨 타입과 일치: FEAT, FIX, REFACTOR, STYLE, DESIGN, DOCS, TEST, CHORE 등
- 본문에 작업 목적·범위·체크리스트를 간단히 포함한다.

### (2) 브랜치 생성 (명령 안내)

이슈 번호를 확인한 뒤 develop에서 분기하며, 아래 명령을 안내한다.

```
git checkout develop
git pull upstream develop
git checkout -b type/이슈번호-설명
```

- 브랜치 형식: type/이슈번호-설명 (kebab-case)
- 브랜치 type: feature / fix / ui / chore / release / hotfix (작업 성격에 맞게)
- 예: feature/12-onboarding-test, ui/8-map-base, chore/25-initial-commit

### (3) 확인 후 진행

- 제안한 이슈 내용과 브랜치명을 사용자에게 알린 뒤, 1번(계획)으로 넘어간다.

## 1. 계획 먼저 (바로 코딩 금지)

기능 요청을 받으면 코드부터 짜지 말고 먼저 다음을 목록으로 제시하고 확인받는다.

- 만들거나 수정할 파일 목록
- 필요한 타입(인터페이스 계약)
- 백엔드 API 의존 여부 (필요한 엔드포인트/응답 형태)
  큰 기능은 2~5개의 작은 단위로 쪼개서 단계별로 확인받으며 진행한다.

## 2. 인터페이스 계약(타입) 우선

- 새 기능은 types/에 필요한 타입을 먼저 정의한 뒤 구현한다.
- A/B/C가 주고받는 공유 타입(지도 props, 소켓 이벤트, 방문 데이터 등)은
  types/에 정의하고 "계약"으로 취급한다. 계약 변경 시 관련 담당자와 합의 후 수정한다.
- 백엔드 응답은 공통 래퍼 ApiResponse<T>({ code, data, message })를 전제로 한다.
- 응답 키는 camelCase. 날짜는 REST·소켓 payload 모두 ISO 8601 문자열.
- 백엔드와 주고받는 타입은 API 응답 예시(JSON)를 근거로 정의한다.

## 3. 구현 순서

컴포넌트/기능 작업은 다음 순서로 진행한다.
types(계약) → services(API 함수) → hooks(React Query/Zustand) → components/features(UI)

- 서버 데이터는 React Query, 클라이언트 상태는 Zustand.
- UI는 Tailwind + cn() 헬퍼로 작성.

## 4. 담당 영역 존중 (충돌 방지)

- 작업은 해당 기능의 feature 폴더 안에서 한다.
  - features/onboarding, features/places, features/record → A
  - features/course + components/map → B
  - features/explore + 실시간(socket)·GPS → C
- 공용 컴포넌트(components/map, components/place-detail, components/share-sheet)를
  수정할 때는 소유자와 계약을 깨지 않도록 주의하고, 인터페이스 변경은 명시적으로 알린다.

## 5. 백엔드 미확정 시 mock 우선 (병렬 개발)

- 백엔드 응답이 아직 확정되지 않은 부분은 추측으로 확정하지 말고,
  mocks/handlers.ts(msw)에 계약 기준 mock을 만들어 병렬로 개발한다.
- 실제 API 연결은 백엔드 응답 예시(JSON)가 확정된 후 교체한다.
- 미확정 항목(인증 방식, 타임스탬프 단위, WebSocket payload 등)은 TODO 주석으로 남긴다.

## 6. 불확실하면 질문

요구사항·API 스펙·계약이 불명확하면 추측해서 구현하지 말고 먼저 질문한다.
특히 다음은 반드시 확인 후 진행한다.

- 백엔드 응답 형태가 미확정인 API
- 공유 컴포넌트/타입의 변경
- 여러 담당자에게 영향을 주는 구조 변경

## 7. 완료 후 요약

작업을 마치면 다음을 요약한다.

- 변경/생성한 파일 목록
- 남은 TODO 또는 백엔드 확인 필요 사항
- 다음에 이어서 할 작업

## 8. 커밋 & PR

- 하나의 의미 단위로 커밋한다. (여러 기능을 한 커밋에 섞지 않음)
- 커밋 메시지: type: 작업 내용 (#이슈번호)
- 작업 후 develop으로 PR한다. PR 제목: [TYPE]: 작업 내용
- PR 본문에 관련 이슈(closes #번호)와 작업 내용·체크리스트를 포함한다.
