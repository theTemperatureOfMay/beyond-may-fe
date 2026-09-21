import { createRef } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import VisitMap, { type VisitMapHandle } from "./VisitMap";
import type { CoursePlace } from "@/types/course";
import type { MapProps } from "@/types/map";

const mapProps = vi.hoisted(() => ({ calls: [] as unknown[] }));
vi.mock("@/components/map/Map", () => ({
  default: (props: unknown) => {
    mapProps.calls.push(props);
    return null;
  },
}));

const place = (placeId: number, visitOrder: number): CoursePlace => ({
  placeId,
  name: `장소 ${placeId}`,
  category: "문화",
  address: "광주",
  latitude: 35.15 + visitOrder * 0.001,
  longitude: 126.85 + visitOrder * 0.001,
  dayNumber: 1,
  visitOrder,
  estimatedStayMinutes: 30,
  travelModeFromPrevious: null,
});

const places = [place(1, 1), place(2, 2), place(3, 3)];
const center = { lat: 35.15, lng: 126.85 };

const lastProps = (): MapProps =>
  mapProps.calls[mapProps.calls.length - 1] as MapProps;

beforeEach(() => {
  mapProps.calls.length = 0;
});
afterEach(cleanup);

it("내 위치만 계속 바뀌어도 지도에 넘기는 핀 배열은 그대로다", () => {
  // 실제 페이지도 방문 목록을 메모이제이션해서 같은 참조로 넘긴다.
  const visited = [1];
  const { rerender } = render(
    <VisitMap
      places={places}
      center={center}
      visitedPlaceIds={visited}
      currentPlaceId={2}
      myLocation={{ lat: 35.1, lng: 126.8 }}
    />,
  );
  const firstMarkers = lastProps().markers;

  // 위치 체험은 좌표를 50ms마다 바꾼다 — 같은 places/방문 정보로 위치만 바뀐 재렌더
  for (let step = 1; step <= 5; step += 1) {
    rerender(
      <VisitMap
        places={places}
        center={center}
        visitedPlaceIds={visited}
        currentPlaceId={2}
        myLocation={{ lat: 35.1 + step * 0.0001, lng: 126.8 }}
      />,
    );
  }

  // 위치가 바뀔 때마다 핀이 다시 만들어지면 지도가 겹침 묶음을 50ms마다 다시 계산한다.
  expect(lastProps().markers).toBe(firstMarkers);
});

it("방문 완료·다음 목적지가 바뀌면 핀을 다시 만든다", () => {
  const visited = [1];
  const { rerender } = render(
    <VisitMap
      places={places}
      center={center}
      visitedPlaceIds={visited}
      currentPlaceId={2}
    />,
  );
  const before = lastProps().markers;

  const visitedNext = [1, 2];
  rerender(
    <VisitMap
      places={places}
      center={center}
      visitedPlaceIds={visitedNext}
      currentPlaceId={3}
    />,
  );

  const after = lastProps().markers;
  expect(after).not.toBe(before);
  expect(after.find((marker) => marker.id === "2")?.visited).toBe(true);
  expect(after.find((marker) => marker.id === "3")?.isCurrent).toBe(true);
  // 핀 번호는 방문 여부와 상관없이 코스 전체 기준 고정 순번이다(타임라인과 같은 규칙)
  expect(after.map((marker) => marker.order)).toEqual([1, 2, 3]);
});

it("panToPosition을 부르면 지도가 해당 좌표로 이동하도록 요청한다", () => {
  const ref = createRef<VisitMapHandle>();
  render(<VisitMap ref={ref} places={places} center={center} />);
  const firstNonce = lastProps().panToNonce;

  act(() => ref.current?.panToPosition({ lat: 35.2, lng: 126.9 }));

  expect(lastProps().panTo).toEqual({ lat: 35.2, lng: 126.9 });
  expect(lastProps().panToNonce).toBe((firstNonce ?? 0) + 1);
});
