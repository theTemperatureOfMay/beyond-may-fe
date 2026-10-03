import { Suspense } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import CourseEditPage from "./page";

const router = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));
const courseStatus = vi.hoisted(() => ({ value: "CONFIRMED" }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/hooks/queries/useGetCourseDetailQuery", () => ({
  useGetCourseDetailQuery: () => ({
    data: { courseId: 4, status: courseStatus.value },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/components/layout/AppHeader", () => ({
  default: () => null,
}));
vi.mock("@/components/map/Map", () => ({
  default: () => null,
}));
vi.mock("@/components/ui/Button", () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));
vi.mock("@/stores/sessionStore", () => ({
  default: (selector: (state: { nickname: string | null }) => unknown) =>
    selector({ nickname: null }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

it("확정된 코스의 직접 편집 URL에서는 편집기를 열지 않는다", async () => {
  await act(async () => {
    render(
      <Suspense>
        <CourseEditPage
          params={Promise.resolve({ courseId: "4" })}
          searchParams={Promise.resolve({ mode: "manual" })}
        />
      </Suspense>,
    );
  });

  expect(
    screen.getByText("확정된 코스는 수정할 수 없어요"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "코스 상세 보기" }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "코스 상세 보기" }));
  expect(router.replace).toHaveBeenCalledWith("/course/4");
});
