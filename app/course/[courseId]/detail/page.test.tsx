import { Suspense, type ComponentProps } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import CourseDetailPage from "./page";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
}));
const confirmCourse = vi.hoisted(() => vi.fn());
const leaveExploration = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/hooks/queries/useGetCourseDetailQuery", () => ({
  useGetCourseDetailQuery: () => ({
    data: {
      courseId: 4,
      title: "새 코스",
      status: "DRAFT",
      travelSchedule: "DAY_TRIP",
      places: [],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/features/course/hooks/useConfirmCourseMutation", () => ({
  default: () => ({
    mutate: confirmCourse,
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/features/explore/hooks/useGetExplorationStatusQuery", () => ({
  default: () => ({
    data: { courseId: 99 },
  }),
}));
vi.mock("@/features/explore/hooks/useLeaveExplorationMutation", () => ({
  default: () => ({
    mutate: leaveExploration,
    isPending: false,
  }),
}));
vi.mock("@/components/layout/AppHeader", () => ({
  default: () => null,
}));
vi.mock("@/components/layout/sidebar/Sidebar", () => ({
  default: () => null,
}));
vi.mock("@/components/layout/sidebar/SidebarProfileMenu", () => ({
  default: () => null,
}));
vi.mock("@/components/layout/sidebar/SidebarLoginForm", () => ({
  default: () => null,
}));
vi.mock("@/components/ui/Modal", () => ({
  default: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div>{children}</div> : null),
}));
vi.mock("@/features/course/components/CourseTimelineView", () => ({
  default: ({
    onUseCourse,
    isUsingCourse,
    hasUseCourseError,
  }: Pick<
    ComponentProps<
      typeof import("@/features/course/components/CourseTimelineView").default
    >,
    "onUseCourse" | "isUsingCourse" | "hasUseCourseError"
  >) => (
    <div>
      <button type="button" onClick={onUseCourse} disabled={isUsingCourse}>
        이 코스 사용
      </button>
      {hasUseCourseError && <p>코스 확정 오류</p>}
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

const renderPage = async () => {
  await act(async () => {
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Suspense>
          <CourseDetailPage
            params={Promise.resolve({ courseId: "4" })}
            searchParams={Promise.resolve({})}
          />
        </Suspense>
      </QueryClientProvider>,
    );
  });
};

it("활성 탐험 충돌 후 기존 탐험을 나가고 코스 확정을 재호출한다", async () => {
  await renderPage();

  fireEvent.click(screen.getByRole("button", { name: "이 코스 사용" }));
  fireEvent.click(screen.getByRole("button", { name: "코스 확정하기" }));

  const firstOptions = confirmCourse.mock.calls[0]?.[1] as {
    onError: (error: unknown) => void;
  };
  act(() => {
    firstOptions.onError({
      apiCode: "EXPLORATION409",
      response: { data: { data: { activeExplorationId: 44 } } },
    });
  });

  fireEvent.click(
    await screen.findByRole("button", { name: "나가고 코스 확정하기" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "나가기" }));

  expect(leaveExploration).toHaveBeenCalledWith("44", expect.any(Object));
  act(() => {
    const leaveOptions = leaveExploration.mock.calls[0]?.[1] as {
      onSuccess: () => void;
    };
    leaveOptions.onSuccess();
  });

  expect(confirmCourse).toHaveBeenCalledTimes(2);
  expect(confirmCourse.mock.calls[1]?.[0]).toBe("4");
});
