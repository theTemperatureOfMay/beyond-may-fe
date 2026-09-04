"use client";

import { useState } from "react";

import AppHeader from "@/components/layout/AppHeader";
import ShareSheet from "@/components/share-sheet/ShareSheet";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Share from "@/components/ui/icons/Share";
import {
  formatElapsedTime,
  formatRecordDate,
  formatRecordTime,
  type TravelRecord,
} from "@/features/record/mockRecords";
import { useCaptureImage } from "@/hooks/useCaptureImage";

const SHARE_VERSIONS = [{ id: "journey", label: "여행 기록" }];

interface RecordDetailProps {
  record: TravelRecord;
}

const RecordDetail = ({ record }: RecordDetailProps) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [hasCaptureError, setHasCaptureError] = useState(false);
  const {
    ref: shareCardRef,
    isCapturing,
    download,
    share,
  } = useCaptureImage<HTMLDivElement>();
  const fileName = `beyond-may-record-${record.recordId}`;

  const handleDownload = async (): Promise<void> => {
    try {
      await download({ fileName });
    } catch {
      setHasCaptureError(true);
    }
  };

  const handleShare = async (): Promise<void> => {
    const result = await share({
      fileName,
      shareTitle: record.title,
      shareText: `${formatRecordDate(record.completedAt)}, 광주에서 완주한 여행 기록`,
    });
    if (result === "failed") setHasCaptureError(true);
  };

  return (
    <main className="bg-neutral-01 mx-auto min-h-dvh w-full max-w-[430px] pb-[max(48px,env(safe-area-inset-bottom))]">
      <div className="relative">
        <AppHeader
          backHref="/record"
          showMenu={false}
          centerLabel="여행 기록"
          className="absolute inset-x-0 top-0 text-white"
        />
        <button
          type="button"
          aria-label="여행 기록 공유하기"
          onClick={() => setIsShareOpen(true)}
          className="focus-visible:outline-primary-03 absolute top-[max(12px,env(safe-area-inset-top))] right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Share className="h-5 w-5" />
        </button>

        <section className="relative flex min-h-[410px] flex-col justify-end overflow-hidden bg-[linear-gradient(155deg,#6E4DE4_0%,#BFBaff_42%,#F9D4C9_76%,#E74D22_140%)] px-6 pb-8 text-white">
          <div className="absolute top-20 right-[-58px] h-64 w-64 rounded-full border-[48px] border-white/12" />
          <div className="absolute top-32 right-12 h-5 w-5 rounded-full bg-white" />
          <div className="absolute top-[166px] right-[66px] h-px w-44 -rotate-[22deg] bg-white/70" />
          <div className="absolute top-[204px] left-[92px] h-3 w-3 rounded-full bg-white/80" />
          <p className="relative text-[13px] font-semibold tracking-[0.08em] text-white/80">
            JOURNEY COMPLETE
          </p>
          <h1 className="relative mt-3 text-[36px] leading-[1.1] font-bold tracking-[-0.05em]">
            {record.title}
          </h1>
          <p className="relative mt-3 max-w-[300px] text-[14px] leading-[1.6] text-white/85">
            {record.description}
          </p>
          <time className="relative mt-5 text-[13px] font-medium text-white/80">
            {formatRecordDate(record.completedAt)}
          </time>
        </section>
      </div>

      <section
        aria-label="여행 요약"
        className="border-neutral-03 grid grid-cols-3 border-b py-6 text-center"
      >
        <div>
          <strong className="block text-[22px] font-bold">
            {record.places.length}
          </strong>
          <span className="text-neutral-04 mt-1 block text-[11px]">
            방문 장소
          </span>
        </div>
        <div className="border-neutral-03 border-x">
          <strong className="block text-[22px] font-bold">
            {(record.distanceMeters / 1000).toFixed(1)}km
          </strong>
          <span className="text-neutral-04 mt-1 block text-[11px]">
            걸은 거리
          </span>
        </div>
        <div>
          <strong className="block text-[22px] font-bold">
            {formatElapsedTime(record.elapsedMinutes)}
          </strong>
          <span className="text-neutral-04 mt-1 block text-[11px]">
            여행 시간
          </span>
        </div>
      </section>

      <section className="px-6 pt-9" aria-labelledby="visited-place-title">
        <p className="text-primary-08 text-[12px] font-semibold">완주 100%</p>
        <h2
          id="visited-place-title"
          className="mt-1 text-[22px] font-bold tracking-[-0.03em]"
        >
          이날 밝힌 장소
        </h2>
        <ol className="mt-6">
          {record.places.map((place, index) => (
            <li
              key={place.placeId}
              className="relative flex gap-4 pb-7 last:pb-0"
            >
              {index < record.places.length - 1 && (
                <span
                  className="bg-primary-04 absolute top-9 bottom-0 left-[15px] w-px"
                  aria-hidden="true"
                />
              )}
              <span className="bg-primary-08 text-neutral-01 relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold">
                ✓
              </span>
              <div className="border-neutral-03 min-w-0 flex-1 border-b pb-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="truncate text-[16px] font-semibold">
                    {place.name}
                  </h3>
                  <time className="text-neutral-04 shrink-0 text-[11px]">
                    {formatRecordTime(place.visitedAt)}
                  </time>
                </div>
                <p className="text-neutral-04 mt-1 text-[13px] leading-[1.5]">
                  {place.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="bg-neutral-02/70 mx-6 mt-10 rounded-[24px] p-5"
        aria-labelledby="companion-title"
      >
        <p className="text-neutral-04 text-[12px] font-medium">TOGETHER</p>
        <h2 id="companion-title" className="mt-1 text-[18px] font-bold">
          함께 걸은 동행
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {record.companionNames.map((name) => (
            <span
              key={name}
              className="border-neutral-03 flex items-center gap-2 rounded-full border bg-white py-2 pr-3 pl-2 text-[13px] font-medium"
            >
              <span className="bg-neutral-07 text-neutral-01 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold">
                {name.charAt(0)}
              </span>
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="px-6 pt-8">
        <Button
          variant="solid"
          size="lg"
          icon={<Share className="h-4.5 w-4.5" />}
          onClick={() => setIsShareOpen(true)}
          className="w-full"
        >
          이 여행 기록 공유하기
        </Button>
      </section>

      <ShareSheet
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        versions={SHARE_VERSIONS}
        selectedVersionId="journey"
        onSelectVersion={() => undefined}
        onDownload={handleDownload}
        onShare={handleShare}
        isProcessing={isCapturing}
      >
        <div
          ref={shareCardRef}
          className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(155deg,#6E4DE4_0%,#BFBaff_42%,#F9D4C9_78%,#E74D22_140%)] p-6 text-white"
        >
          <div className="absolute top-[-40px] right-[-60px] h-56 w-56 rounded-full border-[42px] border-white/15" />
          <div className="absolute top-24 right-12 h-4 w-4 rounded-full bg-white" />
          <div className="relative flex h-full flex-col">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-white/75">
              5월 너머의 광주
            </p>
            <div className="mt-auto">
              <p className="text-[11px] font-semibold text-white/75">
                JOURNEY COMPLETE
              </p>
              <p className="mt-2 text-[30px] leading-tight font-bold tracking-[-0.05em]">
                {record.title}
              </p>
              <p className="mt-4 text-[12px] text-white/80">
                {formatRecordDate(record.completedAt)}
              </p>
              <div className="mt-5 grid grid-cols-3 border-y border-white/30 py-4 text-center">
                <div>
                  <strong className="block text-[18px]">
                    {record.places.length}
                  </strong>
                  <span className="text-[9px] text-white/70">장소</span>
                </div>
                <div className="border-x border-white/30">
                  <strong className="block text-[18px]">
                    {(record.distanceMeters / 1000).toFixed(1)}km
                  </strong>
                  <span className="text-[9px] text-white/70">거리</span>
                </div>
                <div>
                  <strong className="block text-[18px]">
                    {record.companionNames.length}
                  </strong>
                  <span className="text-[9px] text-white/70">동행</span>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-[11px] leading-[1.5] text-white/80">
                {record.places.map((place) => place.name).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </ShareSheet>

      <Modal open={hasCaptureError} onClose={() => setHasCaptureError(false)}>
        <h2 className="text-[17px] font-bold">이미지를 만들지 못했어요</h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.6]">
          잠시 후 다시 시도해 주세요.
        </p>
        <Button
          variant="solid"
          size="lg"
          className="mt-5 w-full"
          onClick={() => setHasCaptureError(false)}
        >
          확인
        </Button>
      </Modal>
    </main>
  );
};

export default RecordDetail;
