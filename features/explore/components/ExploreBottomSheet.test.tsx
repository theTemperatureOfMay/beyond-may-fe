import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ExploreBottomSheet from "./ExploreBottomSheet";

const baseProps = {
  nextPlaceName: "국립5·18민주묘지",
  visitedCount: 1,
  totalCount: 3,
  isSimulationEnabled: true,
  isTourRunning: false,
  isTourFinished: false,
  canUseNearby: true,
  onToggleTour: vi.fn(),
  onNearby: vi.fn(),
  onOpenCourse: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("체험 중이 아니고 코스가 남아 있으면 재개할 수 있다", () => {
  render(<ExploreBottomSheet {...baseProps} />);
  const button = screen.getByRole("button", { name: "위치 체험 재개" });
  expect(button).toBeEnabled();
  fireEvent.click(button);
  expect(baseProps.onToggleTour).toHaveBeenCalledTimes(1);
});

it("체험이 진행 중이면 정지할 수 있다", () => {
  render(<ExploreBottomSheet {...baseProps} isTourRunning />);
  expect(screen.getByRole("button", { name: "위치 체험 정지" })).toBeEnabled();
});

it("코스를 완주했거나 탐험이 끝나면 '위치 체험 완료'로 비활성화된다", () => {
  render(
    <ExploreBottomSheet
      {...baseProps}
      nextPlaceName={null}
      visitedCount={3}
      isTourFinished
    />,
  );
  const button = screen.getByRole("button", { name: "위치 체험 완료" });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(baseProps.onToggleTour).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("button", { name: "위치 체험 재개" }),
  ).not.toBeInTheDocument();
});

it("마지막 장소를 인증하는 순간에도 진행 중이면 정지할 수 있다", () => {
  render(<ExploreBottomSheet {...baseProps} isTourRunning isTourFinished />);
  expect(screen.getByRole("button", { name: "위치 체험 정지" })).toBeEnabled();
});

it("위치 체험 모드가 아니면 체험 버튼이 보이지 않는다", () => {
  render(<ExploreBottomSheet {...baseProps} isSimulationEnabled={false} />);
  expect(screen.queryByRole("button", { name: /위치 체험/ })).toBeNull();
});
