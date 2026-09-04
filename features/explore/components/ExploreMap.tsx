"use client";

import { useState } from "react";
import KakaoMap from "@/components/map/Map";
import MyLocationButton from "@/components/map/MyLocationButton";
import Button from "@/components/ui/Button";
import useGeolocation from "@/features/explore/hooks/useGeolocation";
import useGeolocationStore from "@/stores/geolocationStore";
import { toLatLng } from "@/features/explore/utils/toLatLng";
import type { LatLng } from "@/types/map";

/** 광주 중심 좌표 — 위치 취득 전 지도 기본 중심 */
const GWANGJU_CENTER: LatLng = { lat: 35.1595, lng: 126.8526 };

const ExploreMap = () => {
  const retryLocation = useGeolocation({ enabled: true });

  const coordinates = useGeolocationStore((state) => state.coordinates);
  const permission = useGeolocationStore((state) => state.permission);
  const isAccurate = useGeolocationStore((state) => state.isAccurate);
  const locationError = useGeolocationStore((state) => state.error);

  const [mapError, setMapError] = useState(false);
  const [isPermissionNoticeVisible, setIsPermissionNoticeVisible] =
    useState(true);

  const [panTo, setPanTo] = useState<LatLng | null>(null);
  const [panToNonce, setPanToNonce] = useState(0);

  const myLocation = coordinates ? toLatLng(coordinates) : undefined;

  const center = myLocation ?? GWANGJU_CENTER;

  const handleMyLocation = (): void => {
    if (!coordinates) return;
    setPanTo(toLatLng(coordinates));
    setPanToNonce((prev) => prev + 1);
  };

  if (mapError) {
    return (
      <section className="bg-neutral-01 flex h-dvh flex-col items-center justify-center px-8 text-center">
        <div
          className="bg-neutral-02 flex h-16 w-16 items-center justify-center rounded-full text-[24px]"
          aria-hidden="true"
        >
          ⌁
        </div>
        <h1 className="text-neutral-07 mt-5 text-[20px] font-semibold">
          지도를 불러오지 못했어요
        </h1>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
          연결 상태를 확인한 뒤 지도를 다시 불러와 주세요.
        </p>
        <Button
          variant="solid"
          size="lg"
          className="mt-5 w-full"
          onClick={() => setMapError(false)}
        >
          지도 다시 불러오기
        </Button>
      </section>
    );
  }

  return (
    <div className="relative h-dvh w-full">
      <KakaoMap
        center={center}
        markers={[]}
        myLocation={myLocation}
        panTo={panTo}
        panToNonce={panToNonce}
        onError={() => setMapError(true)}
      />

      {coordinates && (
        <MyLocationButton
          onClick={handleMyLocation}
          className="absolute right-4 bottom-6 z-30"
        />
      )}

      {permission === "denied" && isPermissionNoticeVisible && (
        <section className="border-neutral-03 absolute right-5 bottom-[max(20px,env(safe-area-inset-bottom))] left-5 z-40 rounded-[20px] border bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          <h2 className="text-neutral-07 text-[18px] font-semibold">
            위치 없이 지도를 둘러볼게요
          </h2>
          <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
            현재 위치와 방문 인증은 사용할 수 없지만 코스 지도는 계속 볼 수
            있어요.
          </p>
          <Button
            size="lg"
            className="mt-4 w-full"
            onClick={() => setIsPermissionNoticeVisible(false)}
          >
            위치 없이 계속하기
          </Button>
        </section>
      )}

      {permission !== "denied" && locationError && !coordinates && (
        <section className="border-neutral-03 absolute right-5 bottom-[max(20px,env(safe-area-inset-bottom))] left-5 z-40 rounded-[20px] border bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          <h2 className="text-neutral-07 text-[18px] font-semibold">
            현재 위치를 찾지 못했어요
          </h2>
          <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
            위치 권한과 기기 설정을 확인한 뒤 다시 시도해 주세요.
          </p>
          <Button
            variant="solid"
            size="lg"
            className="mt-4 w-full"
            onClick={retryLocation}
          >
            내 위치 다시 확인
          </Button>
        </section>
      )}

      {permission === "prompt" && !locationError && !coordinates && (
        <div
          className="bg-neutral-07 text-neutral-01 absolute top-20 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-[12px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.14)]"
          role="status"
        >
          현재 위치를 확인하고 있어요
        </div>
      )}

      {permission === "granted" && !isAccurate && (
        <div
          className="bg-neutral-07 text-neutral-01 absolute top-20 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-[12px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.14)]"
          role="status"
        >
          현재 위치를 정확히 확인하고 있어요
        </div>
      )}
    </div>
  );
};

export default ExploreMap;
