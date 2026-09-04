import type { CoursePlace } from "@/types/course";

interface CourseListFallbackProps {
  places: CoursePlace[];
  onRetry?: () => void;
}

/**
 * 지도 렌더 실패 시 대체 화면 (기능명세 3.1.1).
 * 지도 대신 실패 안내 박스와 코스 장소 순서 목록을 보여준다.
 * 하단 요약 패널은 부모(CourseMapView)가 그대로 유지한다.
 */
const CourseListFallback = ({ places, onRetry }: CourseListFallbackProps) => {
  const sorted = [...places].sort((a, b) => a.order - b.order);

  return (
    <div className="overflow-y-auto px-6 pt-24 pb-8">
      {/* 지도 실패 안내 박스 */}
      <div className="border-neutral-03 flex flex-col items-center rounded-[20px] border bg-white px-5 py-6 text-center">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          className="text-neutral-05"
          aria-hidden
        >
          <path
            d="M9 6L4 4v14l5 2 6-2 5 2V6l-5-2-6 2z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M3 3l18 18"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-neutral-07 mt-3 text-[18px] font-semibold">
          지도를 불러오지 못했어요
        </p>
        <p className="text-neutral-04 mt-2 text-[13px]">
          목록으로 코스를 확인할 수 있어요
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="border-neutral-07 text-neutral-07 focus-visible:outline-primary-03 mt-5 flex min-h-11 items-center gap-2 rounded-full border px-5 text-[13px] font-medium"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114-3M20 15a8 8 0 01-14 3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            다시 시도
          </button>
        )}
      </div>

      {/* 코스 장소 목록 */}
      <ul className="mt-6">
        {sorted.map((place) => (
          <li key={place.placeId} className="flex items-center gap-3.5 py-2.5">
            <span className="bg-neutral-07 text-neutral-01 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs">
              {place.order}
            </span>
            <div className="min-w-0">
              <p className="text-neutral-07 truncate text-[15px] font-medium">
                {place.name}
              </p>
              <p className="text-neutral-04 truncate text-[12px]">
                {place.summary}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseListFallback;
