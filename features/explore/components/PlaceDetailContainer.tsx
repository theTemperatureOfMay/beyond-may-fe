"use client";

import PlaceDetailSheet from "@/components/place-detail/PlaceDetailSheet";
import VisitFooter from "@/features/explore/components/VisitFooter";
import useGetPlaceDetailQuery from "@/features/explore/hooks/useGetPlaceDetailQuery";
import type { VisitResponse } from "@/types/exploration";

interface PlaceDetailContainerProps {
  /** 선택된 장소 id. null이면 아무것도 렌더하지 않음 */
  placeId: number | null;
  explorationId: number;
  /** 이 장소가 방문 완료됐는지 → footer 분기(밝히기 / 인증완료) */
  isVisited: boolean;
  onClose: () => void;
  onVisitSuccess: (response: VisitResponse) => void;
}

/**
 * 장소 상세 시트를 여닫고 데이터를 조회하는 공용 컨테이너 (4.4.2).
 * 오버레이 + 로딩 + PlaceDetailSheet + VisitFooter 조립을 담당.
 * 탐험 지도·코스 타임라인·주변 장소에서 재사용.
 */
const PlaceDetailContainer = ({
  placeId,
  explorationId,
  isVisited,
  onClose,
  onVisitSuccess,
}: PlaceDetailContainerProps) => {
  const { data: placeDetail, isPending } = useGetPlaceDetailQuery(placeId);

  if (placeId === null) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/12 backdrop-blur-xl"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[430px]">
        {isPending || !placeDetail ? (
          <div className="bg-white-01 rounded-t-2xl p-6 text-center">
            <p className="text-neutral-04 text-sm">
              장소 정보를 불러오고 있어요…
            </p>
          </div>
        ) : (
          <PlaceDetailSheet
            place={placeDetail}
            onClose={onClose}
            footer={
              <VisitFooter
                placeId={placeDetail.placeId}
                latitude={placeDetail.latitude}
                longitude={placeDetail.longitude}
                isVisited={isVisited}
                explorationId={explorationId}
                onVisitSuccess={onVisitSuccess}
                onClose={onClose}
              />
            }
          />
        )}
      </div>
    </div>
  );
};

export default PlaceDetailContainer;
