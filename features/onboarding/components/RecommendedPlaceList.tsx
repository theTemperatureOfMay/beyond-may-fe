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
 * TODO: placeImg URL 확정 전까지 회색 placeholder 표시. (backend)
 */

const RecommendedPlaceList = ({
  mbtiName,
  places,
}: RecommendedPlaceListProps) => {
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
          <li
            key={place.placeId}
            className="border-neutral-03 overflow-hidden rounded-[20px] border bg-white"
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
              <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
                {place.placeIntro}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RecommendedPlaceList;
