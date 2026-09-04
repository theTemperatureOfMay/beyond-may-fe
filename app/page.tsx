"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";

import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import SidebarLoginForm from "@/components/layout/sidebar/SidebarLoginForm";
import SidebarProfileMenu from "@/components/layout/sidebar/SidebarProfileMenu";
import GradientBackground from "@/components/ui/GradientBackground";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import Share from "@/components/ui/icons/Share";
import useSessionStore from "@/stores/sessionStore";

/** 세 시안을 보여준 뒤 한 번 더 스크롤하면 기존 온보딩으로 이동한다. */
const FRAME_COUNT = 4;
const FINAL_DESIGN_FRAME_PROGRESS = 2 / 3;

interface HomePageProps {
  searchParams: Promise<{ session?: string }>;
}

const HomePage = ({ searchParams }: HomePageProps) => {
  const { session } = use(searchParams);
  const hasExpiredSession = session === "expired";
  const [isMenuOpen, setIsMenuOpen] = useState(hasExpiredSession);
  const [isFinalFrame, setIsFinalFrame] = useState(false);
  const [isServiceShareOpen, setIsServiceShareOpen] = useState(false);
  const [isShareLinkCopied, setIsShareLinkCopied] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);
  const hasNavigated = useRef(false);
  const isLoggedIn = useSessionStore((state) => state.isLoggedIn);
  const router = useRouter();

  const { scrollYProgress } = useScroll({ container: scrollRef });
  const visualProgress = useTransform(
    scrollYProgress,
    [0, 1 / 3, FINAL_DESIGN_FRAME_PROGRESS],
    [0, 0.5, 1],
  );

  const subtitleTop = useTransform(
    visualProgress,
    [0, 0.5, 1],
    ["61.8%", "32.1%", "32.1%"],
  );
  const titleTop = useTransform(
    visualProgress,
    [0, 0.5, 1],
    ["65.8%", "36%", "10.6%"],
  );
  const textColor = useTransform(
    visualProgress,
    [0, 0.5, 1],
    ["#141414", "#BEC2C0", "#BEC2C0"],
  );
  const startTop = useTransform(
    visualProgress,
    [0, 0.5, 1],
    ["91.5%", "66.5%", "41.5%"],
  );
  useMotionValueEvent(visualProgress, "change", (progress) => {
    setIsFinalFrame(progress > 0.75);
  });
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (isLoggedIn || progress < 0.98 || hasNavigated.current) return;
    hasNavigated.current = true;
    router.push("/onboarding");
  });

  const handleSystemShare = async (): Promise<void> => {
    const shareData = {
      title: "5월 너머의 광주",
      text: "광주 동행 지도, 5월 너머의 광주",
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }

    await navigator.clipboard?.writeText(shareData.url).catch(() => undefined);
    setIsShareLinkCopied(true);
  };

  return (
    <main
      ref={scrollRef}
      className="scrollbar-hide relative mx-auto h-dvh w-full max-w-[430px] snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
    >
      <div
        className="relative isolate"
        style={{ height: `${FRAME_COUNT}00dvh` }}
      >
        <div className="sticky top-0 h-dvh overflow-hidden">
          <GradientBackground progress={visualProgress} />

          <AppHeader
            showHome={false}
            onOpenMenu={() => setIsMenuOpen(true)}
            className="text-white-01"
          />

          {hasExpiredSession && (
            <p
              className="absolute top-[max(72px,calc(env(safe-area-inset-top)+60px))] right-4 left-4 z-30 rounded-2xl bg-white/92 px-4 py-3 text-center text-[13px] font-medium text-neutral-07 shadow-lg backdrop-blur"
              role="alert"
            >
              로그인 시간이 만료됐어요. 다시 로그인해 주세요.
            </p>
          )}

          <motion.button
            type="button"
            aria-label="서비스 공유"
            onClick={() => setIsServiceShareOpen(true)}
            aria-hidden={isFinalFrame}
            tabIndex={isFinalFrame ? -1 : 0}
            className={`focus-visible:outline-primary-03 text-white-01 absolute top-[max(12px,env(safe-area-inset-top))] left-4 z-30 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 ${isFinalFrame ? "pointer-events-none opacity-0" : "opacity-100"}`}
          >
            <Share className="h-5 w-5" />
          </motion.button>

          <motion.p
            style={{ top: subtitleTop, color: textColor }}
            className="absolute left-[7.7%] text-[20px] leading-none font-medium tracking-[0.12em]"
          >
            광주 동행 지도
          </motion.p>

          <motion.h1
            style={{ top: titleTop, color: textColor }}
            className="absolute left-[7.2%] text-[64px] leading-[1.18] font-bold tracking-[-0.035em]"
          >
            5월 너머의
            <br />
            광주
          </motion.h1>

          <motion.div
            style={{ top: startTop }}
            aria-hidden={isFinalFrame}
            className={`absolute inset-x-0 flex justify-center transition-opacity ${isFinalFrame ? "pointer-events-none invisible opacity-0" : "opacity-100"}`}
          >
            <ScrollIndicator
              label="성향 검사 시작"
              href="/onboarding"
              className="gap-0.5"
            />
          </motion.div>

          <AnimatePresence>
            {isLoggedIn && isFinalFrame && (
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                className="absolute inset-x-5 bottom-[max(20px,env(safe-area-inset-bottom))] z-30 rounded-[24px] border border-white/70 bg-white/88 p-5 shadow-[0_18px_50px_rgba(20,20,20,0.16)] backdrop-blur-xl"
                aria-label="다시 방문한 사용자 메뉴"
              >
                <p className="text-neutral-07 text-[18px] font-bold">
                  다시 광주를 걸어볼까요?
                </p>
                <p className="text-neutral-04 mt-1 text-[12px]">
                  만들던 코스와 지난 기록을 여기서 이어볼 수 있어요.
                </p>
                <Link
                  href="/course"
                  className="bg-neutral-07 text-neutral-01 focus-visible:outline-primary-03 mt-4 flex min-h-12 w-full items-center justify-center rounded-full px-4 text-[14px] font-semibold"
                >
                  내 코스에서 이어가기
                </Link>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/record"
                    className="border-neutral-03 text-neutral-07 focus-visible:outline-primary-03 flex min-h-11 items-center justify-center rounded-full border bg-white px-3 text-[13px] font-medium"
                  >
                    여행 기록
                  </Link>
                  <Link
                    href="/places"
                    className="border-neutral-03 text-neutral-07 focus-visible:outline-primary-03 flex min-h-11 items-center justify-center rounded-full border bg-white px-3 text-[13px] font-medium"
                  >
                    새 코스 만들기
                  </Link>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {Array.from({ length: FRAME_COUNT }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 h-dvh snap-start"
            style={{ top: `${index}00dvh` }}
          />
        ))}
      </div>

      <Sidebar open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        {isLoggedIn ? <SidebarProfileMenu /> : <SidebarLoginForm />}
      </Sidebar>

      <Modal
        open={isServiceShareOpen}
        onClose={() => setIsServiceShareOpen(false)}
      >
        <p className="text-primary-08 text-[12px] font-semibold tracking-[0.1em]">
          SHARE THE JOURNEY
        </p>
        <h2 className="text-neutral-07 mt-2 text-[20px] font-semibold">
          광주 동행 지도를 함께 볼까요?
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          링크를 복사하거나 기기의 공유 메뉴에서 카카오톡을 선택해 주세요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => void handleSystemShare()}
          >
            카카오톡·시스템 공유
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={async () => {
              await navigator.clipboard?.writeText(window.location.origin);
              setIsShareLinkCopied(true);
            }}
          >
            {isShareLinkCopied ? "링크가 복사되었습니다" : "링크 복사"}
          </Button>
        </div>
      </Modal>
    </main>
  );
};

export default HomePage;
