"use client";

import { type ReactNode, useRef, useState } from "react";

import type { PlaceDetailResponse } from "@/types/place";
import { cn } from "@/lib/cn";
import useDialogFocus from "@/hooks/useDialogFocus";

interface PlaceDetailSheetProps {
  place: PlaceDetailResponse;
  /**
   * 하단 액션 영역. 화면마다 버튼 모양이 달라(2.2.4: 꽉 찬 "밝히기" Button,
   * 4.4.2: 닫기·좋아요 원형 아이콘 버튼) 컴포넌트가 직접 렌더링하지 않고
   * 호출하는 화면이 원하는 버튼을 그대로 전달한다.
   */
  footer?: ReactNode;
  /** Escape 키 등 시트 자체의 닫기 상호작용을 부모 상태와 연결한다. */
  onClose?: () => void;
  /** 사진 영역 비율(Tailwind aspect-* 클래스). 화면마다 사진 높이가 달라 조절 가능하게 둠. 기본 aspect-video */
  imageAspectRatio?: string;
  className?: string;
}

/**
 * 장소 상세 정보 공용 바텀시트 (components/place-detail).
 * 사진 캐러셀과 이름·주소·운영시간·태그·설명 표시를 담당하는 공통 구조만 갖고,
 * 하단 액션은 footer prop으로 화면마다 다르게 구성한다.
 * 오픈/클로즈 상태는 갖지 않는 순수 표시 컴포넌트로, 마운트 여부는 부모가 결정한다.
 */
const PlaceDetailSheet = ({
  place,
  footer,
  onClose,
  imageAspectRatio = "aspect-video",
  className,
}: PlaceDetailSheetProps) => {
  const dialogRef = useDialogFocus<HTMLDivElement>(true, onClose);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 실제 API는 thumbnailUrl 1장만 내려주지만, 추후 여러 장 지원 시 그대로
  // 확장할 수 있도록 캐러셀 구조는 유지하고 배열 하나로 감싼다
  const images = [place.thumbnailUrl ?? ""];

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    setActiveImageIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={place.name}
      tabIndex={-1}
      className={cn(
        "flex max-h-[88dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[24px] bg-white focus:outline-none",
        className,
      )}
    >
      <div className="flex-1 overflow-y-auto">
        {/* 장소 사진 배너 — 가로로 꽉 차게, 여러 장이면 옆으로 스와이프 */}
        <div className="relative">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto"
          >
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className={cn(
                  "bg-neutral-02 relative w-full shrink-0 snap-center overflow-hidden",
                  imageAspectRatio,
                )}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={`${place.name} 사진 ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="bg-primary-04 absolute inset-0 flex items-end overflow-hidden p-6">
                    <span
                      aria-hidden="true"
                      className="border-primary-01/80 absolute -top-20 -right-16 h-64 w-64 rounded-full border-[48px]"
                    />
                    <span className="text-neutral-07 relative text-[14px] font-semibold">
                      광주 · {place.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-white",
                    index === activeImageIndex ? "opacity-100" : "opacity-40",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pt-5">
          <p className="text-neutral-04 text-[12px] font-medium">
            {place.category}
          </p>
          <h2 className="text-neutral-07 mt-1 text-[24px] font-bold">
            {place.name}
          </h2>
          <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
            {place.address}
          </p>
          <p className="text-neutral-04 mt-1 text-[13px]">
            {place.businessHours
              ? `운영시간 ${place.businessHours}`
              : "운영시간 정보 없음"}
          </p>

          {place.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {place.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="bg-neutral-02 text-neutral-07 rounded-full px-3 py-1.5 text-[12px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-neutral-07 mt-4 text-[15px] leading-[1.6]">
            {place.description || "상세 설명 정보 없음"}
          </p>
        </div>
      </div>

      {footer && (
        <div className="border-neutral-03 border-t px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}
    </div>
  );
};

export default PlaceDetailSheet;
