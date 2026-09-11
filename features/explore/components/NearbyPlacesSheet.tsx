"use client";

import type { NearbyPlace } from "@/types/exploration";
import { formatWalkingTime } from "@/lib/geo/distance";
import Close from "@/components/ui/icons/Close";

interface NearbyPlacesSheetProps {
  places: NearbyPlace[];
  onSelectPlace: (placeId: number) => void;
  onClose: () => void;
}

const NearbyPlacesSheet = ({
  places,
  onSelectPlace,
  onClose,
}: NearbyPlacesSheetProps) => {
  const renderBody = () => {
    return (
      <>
        <div className="flex items-center justify-between">
          <p className="text-neutral-04 text-[12px]">
            주변 추천 · 반경 1km · 최대 3곳
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="주변 장소 목록 닫기"
            className="text-neutral-04 focus-visible:outline-primary-03 flex h-11 w-11 items-center justify-center rounded-full"
          >
            <Close className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-3 flex flex-col">
          {places.map((place) => (
            <li key={place.placeId} className="flex items-center gap-3 py-3">
              <button
                type="button"
                onClick={() => onSelectPlace(place.placeId)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <div className="bg-neutral-02 h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  {place.thumbnailUrl && (
                    <img
                      src={place.thumbnailUrl}
                      alt={place.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-neutral-07 truncate text-[15px] font-semibold">
                    {place.name}
                  </p>
                  <p className="text-neutral-04 text-[13px]">
                    {formatWalkingTime(place.distanceMeters)} · {place.category}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <>
      <div
        className="bg-neutral-07/35 fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="주변 장소 추천"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] rounded-t-[24px] bg-white px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        {renderBody()}
      </div>
    </>
  );
};

export default NearbyPlacesSheet;
