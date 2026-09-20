"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import PlaceIntroSheet from "@/features/onboarding/components/PlaceIntroSheet";
import type { RecommendedPlace } from "@/types/preference";

interface RecommendedPlaceListProps {
  /** 유형명 (제목 "OOO를 위한 광주"에 사용) */
  mbtiName: string;
  places: RecommendedPlace[];
}

/**
 * 결과 화면 추천 장소 목록 (기능명세 1.2.2).
 * "OOO를 위한 광주" 제목 + 장소 카드(사진 + 이름 + 한 줄 설명) 5개 이상.
 *
 * placeImg URL 이미지 없으면 회색 placeholder 표시.
 * 설명이 3줄에서 잘리므로 카드를 탭하면 전체 설명 바텀시트(PlaceIntroSheet)를 띄운다.
 */

const RecommendedPlaceList = ({
  mbtiName,
  places,
}: RecommendedPlaceListProps) => {
  const [selectedPlace, setSelectedPlace] = useState<RecommendedPlace | null>(
    null,
  );

  return (
    <section className="mt-10 px-6">
      <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
        PLACE PREVIEW
      </p>
      <h2 className="text-neutral-07 mt-2 text-[20px] font-semibold">
        {mbtiName}를 위한 광주
      </h2>
      <p className="text-neutral-04 mt-1 text-[13px]">
        성향과 잘 맞는 장소를 먼저 살펴보세요.
      </p>

      <ul className="mt-5 flex flex-col gap-4">
        {places.map((place) => (
          <motion.li
            key={place.placeId}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="border-neutral-03 overflow-hidden rounded-[20px] border bg-white"
          >
            <button
              type="button"
              onClick={() => setSelectedPlace(place)}
              aria-label={`${place.placeName} 설명 전체 보기`}
              className="focus-visible:outline-primary-03 block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:-outline-offset-2"
            >
              {/* 장소 사진 (URL 없으면 회색 placeholder) */}
              <div className="bg-neutral-02 relative aspect-video w-full overflow-hidden">
                {place.placeImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={place.placeImg}
                    alt={place.placeName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="bg-primary-04 absolute inset-0 flex items-end overflow-hidden p-5">
                    <span
                      aria-hidden="true"
                      className="border-primary-01/80 absolute -top-12 -right-10 h-40 w-40 rounded-full border-[28px]"
                    />
                    <span className="text-neutral-07 relative text-[13px] font-semibold">
                      광주 · {place.placeName}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-neutral-04 text-[12px] font-medium">
                  {place.category}
                </p>
                <h3 className="text-neutral-07 mt-1 text-[16px] font-semibold">
                  {place.placeName}
                </h3>
                <p className="text-neutral-04 mt-2 line-clamp-3 text-[13px] leading-[1.5]">
                  {place.placeIntro}
                </p>
                <span className="text-primary-08 mt-2 inline-block text-[12px] font-semibold">
                  자세히 보기
                </span>
              </div>
            </button>
          </motion.li>
        ))}
      </ul>

      <PlaceIntroSheet
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
      />
    </section>
  );
};

export default RecommendedPlaceList;
