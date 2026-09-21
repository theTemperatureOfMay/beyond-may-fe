import { useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar";
import SidebarLoginForm from "./SidebarLoginForm";
import { postLogin } from "@/services/api/auth/authApi";
import useSessionStore from "@/stores/sessionStore";

vi.mock("@/services/api/auth/authApi", () => ({ postLogin: vi.fn() }));

const Menu = () => {
  const [open, setOpen] = useState(true);
  const isLoggedIn = useSessionStore((state) => state.isLoggedIn);
  return (
    <>
      <button onClick={() => setOpen(true)}>메뉴 열기</button>
      <Sidebar open={open} onClose={() => setOpen(false)}>
        {isLoggedIn ? <p>로그인한 사용자</p> : <SidebarLoginForm />}
      </Sidebar>
    </>
  );
};

beforeEach(() => {
  vi.resetAllMocks();
  useSessionStore.getState().clearSession();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const submitLogin = async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Menu />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "닉네임" }), {
    target: { value: "테스트" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "식별코드" }), {
    target: { value: "1" },
  });
  const submit = screen.getByRole("button", { name: "여행 이어가기" });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
};

it("로그인 성공 시 메뉴를 닫고 로그인 후에는 다시 열 수 있다", async () => {
  vi.mocked(postLogin).mockResolvedValue({
    userId: 1,
    nickname: "테스트",
    token: "test-token",
  });
  await submitLogin();
  await waitFor(() => expect(useSessionStore.getState().isLoggedIn).toBe(true));
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "메뉴" }),
    ).not.toBeInTheDocument(),
  );
  fireEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
  expect(
    await screen.findByRole("dialog", { name: "메뉴" }),
  ).toBeInTheDocument();
  expect(screen.getByText("로그인한 사용자")).toBeInTheDocument();
});

it("로그인 성공 시 이전 성향 결과를 초기화한다", async () => {
  useSessionStore.getState().setPreferenceType("ARTIST");
  useSessionStore.getState().setLocalPreference({
    userId: 1,
    nickname: "이전 사용자",
    preferenceType: "ARTIST",
    thinkerScore: 1,
    foodieScore: 2,
    artistScore: 3,
    remembererScore: 4,
  });
  vi.mocked(postLogin).mockResolvedValue({
    userId: 1,
    nickname: "테스트",
    token: "test-token",
  });

  await submitLogin();

  await waitFor(() => {
    expect(useSessionStore.getState().preferenceType).toBeNull();
    expect(useSessionStore.getState().localPreference).toBeNull();
  });
});

it("로그인 실패 시 메뉴와 입력 폼을 유지한다", async () => {
  vi.mocked(postLogin).mockRejectedValue(new Error("로그인 실패"));
  await submitLogin();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "닉네임 또는 식별코드가 올바르지 않아요.",
  );
  expect(screen.getByRole("dialog", { name: "메뉴" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "닉네임" })).toHaveValue("테스트");
  expect(useSessionStore.getState().isLoggedIn).toBe(false);
});
