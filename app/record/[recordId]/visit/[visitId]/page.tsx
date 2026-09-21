"use client";

import { use, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getTravelTypeDotClass } from "@/lib/travelTypeStyles";
import useGetTeamVisitsQuery from "@/features/record/hooks/useGetTeamVisitsQuery";
import useSaveVisitRecordMutation from "@/features/record/hooks/useSaveVisitRecordMutation";

const MAX_PHOTOS = 3;
const MAX_MEMO = 2000;

interface VisitRecordPageProps {
  params: Promise<{ recordId: string; visitId: string }>;
}

/** 방문 기록 작성 (5.2.1-B) — 사진(최대 3장)·메모 저장. recordId=explorationId. */
const VisitRecordPage = ({ params }: VisitRecordPageProps) => {
  const { recordId, visitId } = use(params);
  const router = useRouter();
  const backTo = "/record?tab=visits";
  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace(backTo);
  };

  const { data, isLoading } = useGetTeamVisitsQuery(recordId);
  const visit =
    data?.visits.find((item) => String(item.visitId) === visitId) ?? null;

  const { mutate: saveRecord, isPending: isSaving } =
    useSaveVisitRecordMutation();

  const [memoDraft, setMemoDraft] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  // 초기값은 서버 memo, 사용자가 입력하면 draft 우선 (effect 동기화 제거)
  const memo = memoDraft ?? visit?.memo ?? "";

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  );

  if (isLoading) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center">
        <p className="text-neutral-04 text-[14px]">불러오고 있어요…</p>
      </main>
    );
  }

  if (!visit) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center px-8 text-center">
        <p className="text-neutral-04 text-[14px]">
          방문 기록을 찾을 수 없어요.
        </p>
      </main>
    );
  }

  const existingPhotos = visit.photos;
  const totalCount = existingPhotos.length + files.length;
  const remaining = MAX_PHOTOS - totalCount;

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;
    setFiles((prev) =>
      [...prev, ...picked].slice(0, MAX_PHOTOS - existingPhotos.length),
    );
  };

  const handleRemoveStaged = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    saveRecord(
      { visitId: visit.visitId, memo, photos: files },
      { onSuccess: handleBack },
    );
  };

  return (
    <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col pb-[max(24px,env(safe-area-inset-bottom))]">
      <AppHeader onBack={handleBack} showMenu={false} centerLabel="방문 기록" />

      <div className="flex flex-1 flex-col px-6 pt-4">
        {/* 장소 + 상태 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "h-3 w-3 shrink-0 rounded-full",
                getTravelTypeDotClass(visit.place.travelMbtiType),
              )}
              aria-hidden="true"
            />
            <h1 className="text-neutral-07 truncate text-[16px] font-bold">
              {visit.place.name}
            </h1>
            <span className="text-neutral-04 shrink-0 text-[12px]">
              인증 완료
            </span>
          </div>
          <span className="bg-neutral-02 text-neutral-04 shrink-0 rounded-full px-3 py-1 text-[11px] font-medium">
            새 기록 작성
          </span>
        </div>

        {/* 사진 */}
        <p className="text-neutral-07 mt-6 text-[13px] font-medium">
          사진 (최대 {MAX_PHOTOS}장)
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {Array.from({ length: MAX_PHOTOS }).map((_, slot) => {
            const existing = existingPhotos[slot];
            const stagedIndex = slot - existingPhotos.length;
            const stagedPreview =
              stagedIndex >= 0 ? previews[stagedIndex] : undefined;
            const isUploadSlot = slot === totalCount && remaining > 0;

            if (existing) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`e-${existing.visitPhotoId}`}
                  src={existing.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              );
            }
            if (stagedPreview) {
              return (
                <div key={`s-${stagedIndex}`} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stagedPreview}
                    alt=""
                    aria-hidden="true"
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStaged(stagedIndex)}
                    aria-label="사진 제거"
                    className="bg-neutral-07/70 absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full text-[13px] text-white"
                  >
                    ×
                  </button>
                </div>
              );
            }
            if (isUploadSlot) {
              return (
                <label
                  key={`u-${slot}`}
                  className="border-neutral-03 text-neutral-04 flex aspect-square w-full cursor-pointer items-center justify-center rounded-xl border border-dashed text-[24px]"
                >
                  +
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handlePick}
                  />
                </label>
              );
            }
            return (
              <div
                key={`p-${slot}`}
                className="border-neutral-03 aspect-square w-full rounded-xl border"
              />
            );
          })}
        </div>

        {/* 메모 */}
        <textarea
          value={memo}
          onChange={(event) =>
            setMemoDraft(event.target.value.slice(0, MAX_MEMO))
          }
          maxLength={MAX_MEMO}
          placeholder="이곳에서의 기록을 남겨보세요"
          className="border-neutral-03 placeholder:text-neutral-04 text-neutral-07 mt-4 min-h-56 w-full resize-none rounded-[16px] border p-4 text-[14px] leading-[1.6] outline-none"
        />

        {/* 건너뛰기 */}
        <button
          type="button"
          onClick={handleBack}
          className="text-neutral-04 hover:text-neutral-06 mt-4 min-h-11 text-center text-[13px]"
        >
          건너뛰기
        </button>

        <div className="mt-auto pt-4">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={handleSave}
            isLoading={isSaving}
          >
            기록 저장
          </Button>
        </div>
      </div>
    </main>
  );
};

export default VisitRecordPage;
