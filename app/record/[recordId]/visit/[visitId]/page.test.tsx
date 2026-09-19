import { Suspense } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import VisitRecordPage from "./page";
import AppHeader from "@/components/layout/AppHeader";
import { installAppHistoryTracking } from "@/lib/appHistory";

const router = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/features/record/hooks/useGetTeamVisitsQuery", () => ({
  default: () => ({
    data: {
      visits: [
        { visitId: 9, memo: "", photos: [], place: { name: "방문 장소" } },
      ],
    },
  }),
}));
vi.mock("@/features/record/hooks/useSaveVisitRecordMutation", () => ({
  default: () => ({
    mutate: (_data: unknown, options: { onSuccess: () => void }) =>
      options.onSuccess(),
    isPending: false,
  }),
}));

// 실제 앱처럼 pushState가 앱 안 history 깊이를 기록하게 한다.
installAppHistoryTracking();

beforeEach(() => {
  vi.clearAllMocks();
  router.back.mockImplementation(() => window.history.back());
  router.push.mockImplementation((url: string) =>
    window.history.pushState(null, "", url),
  );
  router.replace.mockImplementation((url: string) =>
    window.history.replaceState(null, "", url),
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderVisit = async () => {
  await act(async () => {
    render(
      <Suspense>
        <VisitRecordPage
          params={Promise.resolve({ recordId: "4", visitId: "9" })}
        />
      </Suspense>,
    );
  });
};

it.each(["이전 화면으로 이동", "건너뛰기", "기록 저장"])(
  "%s 후 목록에서 뒤로가면 상세가 아닌 진입 전 지도로 돌아간다",
  async (action) => {
    window.history.replaceState(null, "", "/explore/4/map");
    window.history.pushState(null, "", "/record?tab=visits");
    window.history.pushState(null, "", "/record/4/visit/9");
    await renderVisit();
    fireEvent.click(screen.getByRole("button", { name: action }));
    await waitFor(() =>
      expect(window.location.pathname + window.location.search).toBe(
        "/record?tab=visits",
      ),
    );
    cleanup();
    render(<AppHeader showBack showMenu={false} />);
    fireEvent.click(screen.getByRole("button", { name: "이전 화면으로 이동" }));
    await waitFor(() =>
      expect(window.location.pathname).toBe("/explore/4/map"),
    );
    expect(router.push).not.toHaveBeenCalled();
  },
);

it("상세 주소로 직접 진입하면 현재 이력을 방문 목록으로 교체한다", async () => {
  window.history.replaceState(null, "", "/record/4/visit/9");
  vi.spyOn(window.history, "length", "get").mockReturnValue(1);
  await renderVisit();
  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로 이동" }));
  expect(router.replace).toHaveBeenCalledWith("/record?tab=visits");
  expect(router.back).not.toHaveBeenCalled();
});
