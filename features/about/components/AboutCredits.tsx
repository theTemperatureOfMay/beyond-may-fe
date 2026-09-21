import type { ReactNode } from "react";

import {
  ABOUT_DISCOVER_ORDER,
  ABOUT_TYPE_STORY,
} from "@/features/about/constants/aboutContent";

/** 장소 사진 출처가 적용되는 사진: 성향별 결과 사진 4장 + 마지막 화면 배경 */
const PLACE_PHOTOS: string[] = [
  ...ABOUT_DISCOVER_ORDER.map((type) => ABOUT_TYPE_STORY[type].photo),
  "/images/about/re_bg.jpg",
];

interface CreditItemProps {
  title: string;
  /** 출처 대상 이미지를 겹쳐 보여주는 작은 썸네일 묶음 */
  thumbnails: ReactNode;
  children: ReactNode;
}

const CreditItem = ({ title, thumbnails, children }: CreditItemProps) => (
  <div className="border-neutral-03 border-t py-7">
    <div className="flex items-center justify-between gap-4">
      <h3 className="text-neutral-07 text-[16px] font-semibold">{title}</h3>
      <div aria-hidden="true" className="flex -space-x-2.5">
        {thumbnails}
      </div>
    </div>
    <p className="text-neutral-04 mt-3 text-[13px] leading-[1.7] break-keep">
      {children}
    </p>
  </div>
);

/**
 * 이미지 출처 표기.
 * 서비스에 사용된 공공저작물(오매나 캐릭터·관광 사진)의 공공누리 제2유형
 * (출처표시·상업적 이용금지) 조건에 따른 필수 표기라 페이지 개편과 무관하게 유지한다.
 * 카드 대신 구분선으로 나눈 목록으로 두고, 실제 사용한 캐릭터·사진을 썸네일로 보여준다.
 */
const AboutCredits = () => (
  <section className="bg-neutral-01 px-6 pt-20 pb-[max(56px,env(safe-area-inset-bottom))]">
    <p className="text-neutral-05 text-[12px] font-semibold tracking-[0.16em]">
      CREDITS
    </p>
    <h2 className="text-neutral-07 mt-3 text-[24px] font-bold tracking-[-0.03em]">
      이미지 출처
    </h2>
    <p className="text-neutral-04 mt-2 mb-8 text-[14px] leading-[1.6] break-keep">
      5월 너머의 광주에 쓰인 이미지의 출처를 밝혀요.
    </p>

    <CreditItem
      title="오매나"
      thumbnails={ABOUT_DISCOVER_ORDER.map((type) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={type}
          src={ABOUT_TYPE_STORY[type].character}
          alt=""
          className="bg-neutral-02 ring-neutral-01 h-11 w-11 rounded-full object-contain p-1 ring-2"
        />
      ))}
    >
      OMAENA © 2020. Gwangju Metropolitan City. All Rights Reserved.
      <br />
      광주광역시 공식 관광 캐릭터를 성향 유형별로 재구성해 사용했습니다.
    </CreditItem>

    <CreditItem
      title="장소 사진"
      thumbnails={PLACE_PHOTOS.map((photo) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo}
          src={photo}
          alt=""
          className="ring-neutral-01 h-11 w-11 rounded-xl object-cover ring-2"
        />
      ))}
    >
      일부 장소 사진은 광주문화관광(tour.gwangju.go.kr)에서 제공받은
      공공저작물이며, 출처표시·상업적 이용금지 조건으로 사용했습니다.
    </CreditItem>

    <div className="border-neutral-03 border-t" />
  </section>
);

export default AboutCredits;
