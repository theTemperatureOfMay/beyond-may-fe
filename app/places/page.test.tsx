import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import PlacesPage from "./page";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const createRecommendationSet = vi.hoisted(() => vi.fn());
const resetRecommendationSet = vi.hoisted(() => vi.fn());
const replaceBatchReactions = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/features/places/hooks/useGetCurrentRecommendationQuery", () => ({
  default: () => ({ data: null }),
}));
vi.mock("@/features/places/hooks/useCreateRecommendationSetMutation", () => ({
  default: () => ({
    mutate: createRecommendationSet,
    reset: resetRecommendationSet,
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/features/places/hooks/useReplaceBatchReactionsMutation", () => ({
  default: () => ({
    mutate: replaceBatchReactions,
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/features/places/hooks/useGetPlaceDetailQuery", () => ({
  default: () => ({ data: null, isPending: false }),
}));
vi.mock("@/features/course/hooks/useGenerateCourseMutation", () => ({
  default: () => ({
    mutate: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/components/layout/AppHeader", () => ({ default: () => null }));
vi.mock("@/components/layout/sidebar/Sidebar", () => ({ default: () => null }));
vi.mock("@/components/layout/sidebar/SidebarProfileMenu", () => ({
  default: () => null,
}));
vi.mock("@/components/place-detail/PlaceDetailSheet", () => ({
  default: () => null,
}));
vi.mock("@/components/ui/CircleIconButton", () => ({
  default: () => null,
}));
vi.mock("@/components/ui/Modal", () => ({ default: () => null }));
vi.mock("@/components/ui/icons/Close", () => ({ default: () => null }));
vi.mock("@/components/ui/icons/Image", () => ({ default: () => null }));
vi.mock("@/features/course/components/MaxPlacesModal", () => ({
  default: () => null,
}));
vi.mock("@/components/ui/TimeoutState", () => ({ default: () => null }));
vi.mock("@/features/places/components/PlaceSwipeGuide", () => ({
  default: () => null,
}));
vi.mock("@/features/places/components/TravelPeriodScreen", () => ({
  default: ({ onNext }: { onNext: () => void }) => (
    <button type="button" onClick={onNext}>
      다음 · 장소 고르기
    </button>
  ),
}));
vi.mock("@/features/places/components/PlaceCardDeck", () => ({
  default: ({
    onSwipe,
  }: {
    onSwipe: (direction: "like" | "dislike") => void;
  }) => (
    <button type="button" onClick={() => onSwipe("like")}>
      장소 좋아요
    </button>
  ),
}));
vi.mock("@/components/ui/Button", () => ({
  default: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("beyond-may-swipe-guide-seen", "true");
});

afterEach(() => {
  cleanup();
});

it("추천 회차 반응 실패 시 동일한 요청 payload로 재시도한다", async () => {
  render(<PlacesPage />);

  fireEvent.click(screen.getByRole("button", { name: "다음 · 장소 고르기" }));
  const createOptions = createRecommendationSet.mock.calls[0]?.[1] as {
    onSuccess: (data: unknown) => void;
  };
  act(() => {
    createOptions.onSuccess({
      recommendationId: 7,
      minimumSelectionCount: 1,
      selectionReady: false,
      batch: {
        batchNumber: 3,
        completed: false,
        places: [{ placeId: 101 }, { placeId: 102 }],
      },
    });
  });

  const likeButton = await screen.findByRole("button", { name: "장소 좋아요" });
  fireEvent.click(likeButton);
  fireEvent.click(screen.getByRole("button", { name: "장소 좋아요" }));

  expect(replaceBatchReactions).toHaveBeenCalledTimes(1);
  const firstCall = replaceBatchReactions.mock.calls[0] as [
    unknown,
    { onError: (error: Error) => void },
  ];

  act(() => {
    firstCall[1].onError(new Error("network error"));
  });
  expect(
    await screen.findByText("추천 장소를 불러오지 못했어요"),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "장소 다시 불러오기" }));

  expect(replaceBatchReactions).toHaveBeenCalledTimes(2);
  expect(replaceBatchReactions.mock.calls[1]?.[0]).toEqual(firstCall[0]);
});

it("추천 생성 취소 시 요청을 중단하고 늦은 응답을 무시한다", async () => {
  render(<PlacesPage />);

  fireEvent.click(screen.getByRole("button", { name: "다음 · 장소 고르기" }));
  const firstCall = createRecommendationSet.mock.calls[0] as [
    { signal: AbortSignal },
    { onSuccess: (data: unknown) => void },
  ];

  fireEvent.click(
    screen.getByRole("button", { name: "취소하고 기간 다시 선택" }),
  );
  expect(resetRecommendationSet).toHaveBeenCalledTimes(1);
  expect(firstCall[0].signal.aborted).toBe(true);

  fireEvent.click(screen.getByRole("button", { name: "다음 · 장소 고르기" }));
  act(() => {
    firstCall[1].onSuccess({
      recommendationId: 99,
      minimumSelectionCount: 1,
      selectionReady: false,
      batch: {
        batchNumber: 1,
        completed: false,
        places: [{ placeId: 999 }],
      },
    });
  });

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });
  expect(
    screen.queryByRole("button", { name: "장소 좋아요" }),
  ).not.toBeInTheDocument();
});
