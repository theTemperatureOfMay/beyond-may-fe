"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import GradientBackground from "@/components/ui/GradientBackground";
import AppHeader from "@/components/layout/AppHeader";
import ShareSheet from "@/components/share-sheet/ShareSheet";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Share from "@/components/ui/icons/Share";
import Undo from "@/components/ui/icons/Undo";
import { useCaptureImage } from "@/hooks/useCaptureImage";
import { useGetPreferenceResultQuery } from "@/features/onboarding/hooks/useGetPreferenceResultQuery";
import useSessionStore from "@/stores/sessionStore";
import ResultTypeCard from "@/features/onboarding/components/ResultTypeCard";
import NicknameRegisterSection from "@/features/onboarding/components/NicknameRegisterSection";
import RecommendedPlaceList from "@/features/onboarding/components/RecommendedPlaceList";
import ShareRecordCard from "@/features/onboarding/components/ShareRecordCard";
import ShareCollageCard from "@/features/onboarding/components/ShareCollageCard";

/**
 * 성향 검사 결과 화면 (기능명세 1.2.2).
 *
 * 결과 계산을 기다리는 로딩 화면을 먼저 보여주고,
 * 결과 도착 시 유형 카드 + 추천 장소 목록으로 자동 전환.
 *
 * 결과 화면 본문은 흰 배경·검정 텍스트로 고정 (유형별 그라디언트는 공유 카드에서만).
 *
 * TODO: userId는 세션/로그인에서 얻어야 하나 현재 미확정 → 임시값 사용. (#13 세션)
 */

/** 공유 이미지 버전: 화면 그대로(기록형) / 우표 엽서(스토리형, 원본 피그마 목업 기준) */
const SHARE_VERSIONS = [
  { id: "record", label: "결과 카드" },
  { id: "collage", label: "우표 엽서" },
] as const;
type ShareVersionId = (typeof SHARE_VERSIONS)[number]["id"];

const ResultPage = () => {
  const router = useRouter();
  // 진입 시점 세션 상태를 스냅샷으로 고정 — 등록 도중 setSession으로 isLoggedIn이
  // true로 바뀌어도 NicknameRegisterSection(식별코드 모달 포함)이 중간에 언마운트되지 않게 한다.
  const [hadSessionOnEnter] = useState(
    () => useSessionStore.getState().isLoggedIn,
  );
  // TODO: 실제 userId를 세션에서 가져오도록 교체. (#13)
  const TEMP_USER_ID = 1;

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isAlmostDone, setIsAlmostDone] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [shareVersion, setShareVersion] = useState<ShareVersionId>("record");
  /** 이미지 생성 실패 시 다시 시도할 동작을 담아둔다. null이면 에러 모달 닫힘. */
  const [captureRetry, setCaptureRetry] = useState<(() => void) | null>(null);
  const {
    ref: shareCardRef,
    isCapturing,
    download,
    share,
  } = useCaptureImage<HTMLDivElement>();

  const { data, isLoading, isError, refetch } =
    useGetPreferenceResultQuery(TEMP_USER_ID);

  useEffect(() => {
    if (!isLoading) return;
    const timer = window.setTimeout(() => setIsAlmostDone(true), 1200);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (data) {
      localStorage.setItem("beyond-may-preference-result", JSON.stringify(data));
    }
  }, [data]);

  // 로딩/에러: 결과 계산 대기 화면 (그라디언트 배경)
  if (isLoading || isError || !data) {
    return (
      <main className="bg-neutral-01 relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden">
        <GradientBackground className="opacity-70" />

        {/* 상단 헤더 (Home). 로딩 화면 디자인 기준 */}
        <AppHeader
          showMenu={false}
          onHome={isLoading ? () => setIsLeaveOpen(true) : undefined}
          className="text-neutral-04"
        />

        {isError ? (
          <section className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-neutral-07/70 text-[15px]">
              결과를 불러오지 못했어요.
            </p>
            <Button size="lg" onClick={() => refetch()}>
              다시 시도
            </Button>
          </section>
        ) : (
          <>
            <section className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <p className="text-neutral-07 text-[20px] leading-relaxed font-medium">
                {isAlmostDone ? (
                  "거의 완료되었습니다"
                ) : (
                  <>
                    당신의 여행 유형을
                    <br />
                    분석하고 있어요
                  </>
                )}
              </p>
              <span
                className="border-neutral-07/20 border-t-neutral-07 mt-2 block h-[42px] w-[42px] animate-spin rounded-full border-2"
                role="status"
                aria-label="여행 유형을 분석하는 중"
              />
            </section>
            <p className="text-neutral-05 mt-28 text-center text-[14px]">
              뒤로 가지 말고 잠시만 기다려 주세요.
            </p>
          </>
        )}

        <Modal open={isLeaveOpen} onClose={() => setIsLeaveOpen(false)}>
          <h2 className="text-neutral-07 text-[20px] font-semibold">
            결과를 계산하고 있어요. 나가시겠어요?
          </h2>
          <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
            나가도 답변은 24시간 동안 저장돼요.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button
              variant="solid"
              size="lg"
              className="w-full"
              onClick={() => router.push("/")}
            >
              나가기
            </Button>
            <Button
              size="lg"
              className="w-full"
              onClick={() => setIsLeaveOpen(false)}
            >
              기다리기
            </Button>
          </div>
        </Modal>
      </main>
    );
  }

  const handleDownload = async () => {
    try {
      await download({ fileName: `beyond-may-${data.type}-${shareVersion}` });
    } catch {
      setCaptureRetry(() => handleDownload);
    }
  };

  const handleShare = async () => {
    const result = await share({
      fileName: `beyond-may-${data.type}-${shareVersion}`,
      shareTitle: `나는 ${data.mbtiName}`,
      shareText: `광주 여행 성향 검사 결과: ${data.mbtiName}`,
    });
    if (result === "failed") {
      setCaptureRetry(() => handleShare);
    }
  };

  // 결과 도착: 유형 카드 + 추천 장소 (흰 배경)
  return (
    <main className="bg-neutral-01 mx-auto min-h-[100dvh] w-full max-w-[430px] pb-[max(48px,env(safe-area-inset-bottom))]">
      <AppHeader showMenu={false} className="text-neutral-04" />

      <ResultTypeCard result={data} />

      {!hadSessionOnEnter ? (
        <NicknameRegisterSection />
      ) : (
        <section className="mt-8 px-6">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => router.push("/places")}
          >
            추천 장소 보러 가기
          </Button>
        </section>
      )}

      <RecommendedPlaceList
        mbtiName={data.mbtiName}
        places={data.recommendedPlaces.slice(0, 2)}
      />

      <section className="border-neutral-03 mt-10 border-t px-6 pt-8">
        <p className="text-neutral-04 text-[13px] font-medium">결과 보관하기</p>
        <div className="mt-3 flex gap-3">
          <Button
            size="lg"
            icon={<Share className="h-4.5 w-4.5" />}
            onClick={() => setIsShareOpen(true)}
            className="flex-1"
          >
            결과 공유하기
          </Button>
          <Button
            size="lg"
            icon={<Undo className="h-4.5 w-4.5" />}
            onClick={() => router.push("/onboarding")}
            className="shrink-0 px-4"
          >
            다시 검사
          </Button>
        </div>
        <Button
          size="lg"
          className="mt-3 w-full"
          onClick={async () => {
            await navigator.clipboard?.writeText(
              `${window.location.origin}/result/${data.type}`,
            );
            setIsLinkCopied(true);
          }}
        >
          {isLinkCopied ? "결과 링크가 복사되었습니다" : "결과 링크 복사"}
        </Button>
        <p className="text-neutral-04 mt-2 text-[11px] leading-[1.5]">
          인스타그램은 이미지를 저장한 뒤 앱에서 업로드해 주세요.
        </p>
      </section>

      <ShareSheet
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        versions={[...SHARE_VERSIONS]}
        selectedVersionId={shareVersion}
        onSelectVersion={(id) => setShareVersion(id as ShareVersionId)}
        isProcessing={isCapturing}
        onDownload={handleDownload}
        onShare={handleShare}
      >
        {shareVersion === "record" ? (
          <ShareRecordCard ref={shareCardRef} result={data} />
        ) : (
          <ShareCollageCard ref={shareCardRef} result={data} />
        )}
      </ShareSheet>

      <Modal open={captureRetry !== null} onClose={() => setCaptureRetry(null)}>
        <p className="text-neutral-07 text-[16px] font-semibold">
          이미지를 만들지 못했어요
        </p>
        <p className="text-neutral-05 mt-2 text-[13px] leading-relaxed">
          잠시 후 다시 시도해 주세요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => {
              const retry = captureRetry;
              setCaptureRetry(null);
              retry?.();
            }}
          >
            다시 시도
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => setCaptureRetry(null)}
          >
            닫기
          </Button>
        </div>
      </Modal>
    </main>
  );
};

export default ResultPage;
