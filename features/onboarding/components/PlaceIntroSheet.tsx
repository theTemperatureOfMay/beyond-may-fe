"use client";

import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
} from "framer-motion";

import useDialogFocus from "@/hooks/useDialogFocus";
import Close from "@/components/ui/icons/Close";
import type { RecommendedPlace } from "@/types/preference";

/** 이 이상 끌어내리거나 이 속도로 튕기면 시트를 닫는다 */
const CLOSE_DISTANCE_THRESHOLD = 100;
const CLOSE_VELOCITY_THRESHOLD = 500;

interface PlaceIntroSheetProps {
  /** null이면 닫힘 */
  place: RecommendedPlace | null;
  onClose: () => void;
}

interface SheetPanelProps {
  place: RecommendedPlace;
  onClose: () => void;
}

const SheetPanel = ({ place, onClose }: SheetPanelProps) => {
  const dialogRef = useDialogFocus<HTMLDivElement>(true, onClose);
  const dragControls = useDragControls();

  const handleDragEnd = (
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => {
    if (
      info.offset.y > CLOSE_DISTANCE_THRESHOLD ||
      info.velocity.y > CLOSE_VELOCITY_THRESHOLD
    ) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        className="bg-neutral-07/50 absolute inset-0 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={place.placeName}
        tabIndex={-1}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.25 }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
        className="relative flex max-h-[88dvh] w-full max-w-[430px] flex-col rounded-t-[24px] bg-white shadow-[0_-12px_40px_rgba(20,20,20,0.16)] focus:outline-none"
      >
        {/* 손잡이 영역에서만 드래그를 받아, 본문 스크롤과 충돌하지 않게 한다. */}
        <div
          onPointerDown={(event) => dragControls.start(event)}
          className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-2"
        >
          <span
            aria-hidden="true"
            className="bg-neutral-03 h-1 w-10 rounded-full"
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="text-neutral-05 focus-visible:outline-primary-03 absolute top-2 right-4 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Close className="h-5 w-5" />
        </button>

        <div className="scrollbar-hide overflow-y-auto px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
          {place.placeImg && (
            <div className="bg-neutral-02 aspect-video w-full overflow-hidden rounded-[20px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={place.placeImg}
                alt={place.placeName}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <p className="text-neutral-04 mt-4 text-[12px] font-medium">
            {place.category}
          </p>
          <h2 className="text-neutral-07 mt-1 text-[20px] font-semibold">
            {place.placeName}
          </h2>
          <p className="text-neutral-07 mt-3 text-[14px] leading-[1.6] whitespace-pre-line">
            {place.placeIntro}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * 결과 화면 추천 장소 카드의 설명이 3줄에서 잘려 뒤 내용이 안 보이는 문제를 풀기 위한
 * 전체 설명 바텀시트. 손잡이를 아래로 끌어내리거나 딤 영역/닫기 버튼/Escape로 닫는다.
 *
 * 장소 상세 API 없이 이미 받아 둔 RecommendedPlace만으로 그려서 추가 요청이 없다.
 */
const PlaceIntroSheet = ({ place, onClose }: PlaceIntroSheetProps) => (
  <AnimatePresence>
    {place && (
      <SheetPanel key={place.placeId} place={place} onClose={onClose} />
    )}
  </AnimatePresence>
);

export default PlaceIntroSheet;
