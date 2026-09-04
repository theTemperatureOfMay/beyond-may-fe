"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import ChevronRight from "@/components/ui/icons/ChevronRight";
import { postLogout } from "@/services/api/auth/authApi";
import useSessionStore from "@/stores/sessionStore";
import SidebarCodeAccordion from "./SidebarCodeAccordion";

interface SidebarProfileMenuProps {
  /** 성향 검사 결과 유형명 (예: "사색러"). 아직 검사 전이면 undefined — 뱃지 숨김 */
  mbtiName?: string;
}

const MENU_ITEM_CLASS =
  "flex min-h-14 w-full cursor-pointer items-center justify-between border-b border-neutral-02 py-4 text-[15px] font-medium text-neutral-07 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-03";
const PREFERENCE_RESULT_KEY = "beyond-may-preference-result";

const subscribePreferenceResult = (onStoreChange: () => void): (() => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

const getSavedMbtiName = (): string | undefined => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(PREFERENCE_RESULT_KEY) ?? "null",
    ) as { mbtiName?: unknown } | null;
    return typeof saved?.mbtiName === "string" ? saved.mbtiName : undefined;
  } catch {
    return undefined;
  }
};

/**
 * 사이드바 로그인 상태 콘텐츠 (프로필 메뉴).
 * 닉네임은 세션 스토어에서 직접 읽는다 — 이 컴포넌트는 로그인 상태에서만
 * 마운트되므로 세션에 닉네임이 있다고 가정한다.
 */
const SidebarProfileMenu = ({ mbtiName }: SidebarProfileMenuProps) => {
  const savedMbtiName = useSyncExternalStore(
    subscribePreferenceResult,
    getSavedMbtiName,
    () => undefined,
  );
  const nickname = useSessionStore((state) => state.nickname);
  const identificationCode = useSessionStore(
    (state) => state.identificationCode,
  );
  const clearSession = useSessionStore((state) => state.clearSession);
  const displayedMbtiName = mbtiName ?? savedMbtiName;

  const handleLogout = async () => {
    await postLogout().catch(() => undefined);
    localStorage.removeItem("accessToken");
    clearSession();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <div
          className="bg-primary-06 h-16 w-16 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <div>
          <p className="text-neutral-07 text-[16px] font-semibold">
            {nickname}
          </p>
          {displayedMbtiName && (
            <span className="bg-primary-06 text-neutral-01 mt-1 inline-block rounded-full px-2.5 py-1 text-[12px] font-medium">
              {displayedMbtiName}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col">
        {identificationCode && (
          <SidebarCodeAccordion code={String(identificationCode)} />
        )}

        <Link href="/onboarding/result" className={MENU_ITEM_CLASS}>
          내 성향 결과
          <ChevronRight className="text-neutral-04 h-3 w-3" />
        </Link>

        <Link href="/record?tab=ongoing" className={MENU_ITEM_CLASS}>
          진행 중인 코스
          <ChevronRight className="text-neutral-04 h-3 w-3" />
        </Link>

        <Link href="/record" className={MENU_ITEM_CLASS}>
          여행 기록
          <ChevronRight className="text-neutral-04 h-3 w-3" />
        </Link>

        <Link href="/record?tab=map" className={MENU_ITEM_CLASS}>
          밝힌 지도
          <ChevronRight className="text-neutral-04 h-3 w-3" />
        </Link>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={handleLogout}
        className="text-neutral-04 focus-visible:outline-primary-03 min-h-11 cursor-pointer rounded-lg py-3 text-left text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        로그아웃
      </button>
    </div>
  );
};

export default SidebarProfileMenu;
