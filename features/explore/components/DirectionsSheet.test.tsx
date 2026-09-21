import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import DirectionsSheet from "./DirectionsSheet";
import type { Directions } from "@/types/route";

afterEach(cleanup);

const directions: Directions = {
  walking: {
    path: [
      { lat: 35.1, lng: 126.9 },
      { lat: 35.11, lng: 126.91 },
    ],
    totalDistance: 850,
    totalTime: 720,
    steps: [{ guidance: "횡단보도 이용", distance: 30, time: 60 }],
  },
  publicTransit: null,
};

it("선택한 이동수단의 상세 정보와 경로 없음 상태를 표시한다", () => {
  const onModeChange = vi.fn();
  const { rerender } = render(
    <DirectionsSheet
      placeName="광주공원"
      directions={directions}
      mode="walking"
      onModeChange={onModeChange}
      onClose={vi.fn()}
      onStart={vi.fn()}
      onCollapse={vi.fn()}
    />,
  );

  expect(screen.getByText("도보 12분 · 850m")).toBeInTheDocument();
  expect(screen.getByText("횡단보도 이용")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "대중교통" }));
  expect(onModeChange).toHaveBeenCalledWith("publicTransit");

  rerender(
    <DirectionsSheet
      placeName="광주공원"
      directions={directions}
      mode="publicTransit"
      onModeChange={onModeChange}
      onClose={vi.fn()}
      onStart={vi.fn()}
      onCollapse={vi.fn()}
    />,
  );
  expect(screen.getByText("경로를 찾을 수 없습니다.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "길안내 시작" })).toBeDisabled();
});

it("60분 이상인 경로는 시간과 두 자리 분으로 표시한다", () => {
  render(
    <DirectionsSheet
      placeName="광주공원"
      directions={{
        ...directions,
        walking: {
          path: [
            { lat: 35.1, lng: 126.9 },
            { lat: 35.11, lng: 126.91 },
          ],
          totalTime: 3660,
          totalDistance: 850,
          steps: [{ guidance: "도보 이동", distance: 3600, time: 3660 }],
        },
      }}
      mode="walking"
      onModeChange={vi.fn()}
      onClose={vi.fn()}
      onStart={vi.fn()}
      onCollapse={vi.fn()}
    />,
  );

  expect(screen.getByText("도보 1시간 01분 · 850m")).toBeInTheDocument();
  expect(screen.getByText("3.6km · 1시간 01분")).toBeInTheDocument();
});

it("60분 미만인 경로는 분으로만 표시한다", () => {
  render(
    <DirectionsSheet
      placeName="광주공원"
      directions={{
        ...directions,
        walking: {
          path: [
            { lat: 35.1, lng: 126.9 },
            { lat: 35.11, lng: 126.91 },
          ],
          totalTime: 3540,
          totalDistance: 850,
          steps: [{ guidance: "도보 이동", distance: 850, time: 3540 }],
        },
      }}
      mode="walking"
      onModeChange={vi.fn()}
      onClose={vi.fn()}
      onStart={vi.fn()}
      onCollapse={vi.fn()}
    />,
  );

  expect(screen.getByText("도보 59분 · 850m")).toBeInTheDocument();
  expect(screen.getByText("850m · 59분")).toBeInTheDocument();
});

it("안내 중에는 접힌 패널을 눌러 상세를 다시 펼친다", () => {
  const onCollapse = vi.fn();
  render(
    <DirectionsSheet
      placeName="광주공원"
      directions={directions}
      mode="walking"
      isGuiding
      isCollapsed
      onModeChange={vi.fn()}
      onClose={vi.fn()}
      onStart={vi.fn()}
      onCollapse={onCollapse}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "길찾기 상세 펼치기" }));
  expect(onCollapse).toHaveBeenCalledWith(false);
});
