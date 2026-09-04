import { format } from "date-fns";
import type { PreferenceResultResponse } from "@/types/preference";
import { getResultTheme } from "@/features/onboarding/utils/resultTheme";
import StampPhoto from "@/features/onboarding/components/StampPhoto";

interface ResultTypeCardProps {
  result: PreferenceResultResponse;
}

/**
 * 결과 화면 상단 유형 카드 (기능명세 1.2.2).
 * 우표형 일러스트(StampPhoto, 공유 카드와 동일 컴포넌트) + "나는 OOO" + 키워드 칩 + 유형 설명.
 *
 * TODO: 키워드 칩 데이터 확정. (backend/design)
 *   현재 mbtiTag(예: 성찰·역사)와 디자인 칩(느린산책/골목탐색/기록/사진)이 다름.
 *   칩용 필드가 별도인지 확인 필요. 지금은 mbtiTag를 칩으로 노출.
 */

const ResultTypeCard = ({ result }: ResultTypeCardProps) => {
  const { type, mbtiName, mbtiTag, mbtiImg, mbtiDescription } = result;
  const theme = getResultTheme(type);
  // 지금은 "오늘" 날짜 도장이라 new Date()로 충분하다.
  // TODO: 실제 방문 날짜(REST에서 오는 ISO 문자열)를 표시하게 되면
  // new Date(isoString) 대신 date-fns parseISO를 써야 한다.
  const stampDate = format(new Date(), "yyyy.MM.dd");

  return (
    <section className="px-6 pt-4">
      <div className="border-neutral-03 relative overflow-hidden rounded-[40px] border bg-white p-6">
        <p className="text-primary-08 text-[12px] font-semibold tracking-[0.14em]">
          YOUR TRAVEL TYPE
        </p>

        <div className="mt-5 flex items-end gap-4">
          {/* 우표형 일러스트 (살짝 기울임). 배경이 흰 페이지라 유형색으로 톱니를 보이게 한다. */}
          <div className="relative aspect-3/4 w-[43%] shrink-0">
            <StampPhoto
              src={mbtiImg}
              alt={mbtiName}
              className="-rotate-2"
              paperColor={theme.accent}
              notchRadius={8}
            />

            <div className="border-neutral-07 bg-neutral-01 absolute -top-4 -right-6 flex h-14 w-14 -rotate-12 flex-col items-center justify-center rounded-full border-2">
              <span className="text-neutral-07 text-[10px] leading-none font-bold">
                光州
              </span>
              <span className="text-neutral-04 mt-0.5 text-[7px] leading-none">
                {stampDate}
              </span>
            </div>
          </div>

          <div className="pb-2 text-left">
            <p className="text-neutral-04 text-[16px] font-medium">나는</p>
            <h1 className="text-neutral-07 mt-1 text-[40px] leading-[1.2] font-bold tracking-[-0.02em]">
              {mbtiName}
            </h1>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {mbtiTag.map((tag) => (
            <span
              key={tag}
              className="border-neutral-07 text-neutral-07 rounded-full border px-3 py-1.5 text-[13px] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="text-neutral-07 mt-4 text-[15px] leading-[1.55]">
          {mbtiDescription}
        </p>
      </div>
    </section>
  );
};

export default ResultTypeCard;
