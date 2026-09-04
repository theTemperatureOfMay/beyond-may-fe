"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import useGeolocationStore from "@/stores/geolocationStore";
import useCreateVisitMutation from "@/features/explore/hooks/useCreateVisitMutation";
import {
  getDistanceInMeters,
  isWithinVisitRadius,
  formatRemainingDistance,
} from "@/lib/geo/distance";
import type { VisitResponse } from "@/types/exploration";

interface VisitFooterProps {
  /** 인증할 장소 ID */
  placeId: number;
  /** 장소 좌표 (거리 계산용) */
  latitude: number;
  longitude: number;
  /** 이미 방문했는지 (부모가 밝힌 장소 조회로 판단해 전달) */
  isVisited: boolean;
  /** 코스에서 지금 방문할 차례인지 */
  isCurrent: boolean;
  /** 현재 탐험 ID */
  explorationId: number;
  /** 인증 성공 시 */
  onVisitSuccess: (response: VisitResponse) => void;
}

const IS_MOCK_DEMO = process.env.NODE_ENV === "development";

const VisitFooter = ({
  placeId,
  latitude,
  longitude,
  isVisited,
  isCurrent,
  explorationId,
  onVisitSuccess,
}: VisitFooterProps) => {
  const coordinates = useGeolocationStore((state) => state.coordinates);
  const permission = useGeolocationStore((state) => state.permission);
  const isAccurate = useGeolocationStore((state) => state.isAccurate);
  const { mutate, isPending, isSuccess } = useCreateVisitMutation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const distance = coordinates
    ? getDistanceInMeters(
        { latitude: coordinates.latitude, longitude: coordinates.longitude },
        { latitude, longitude },
      )
    : null;

  const withinRadius =
    coordinates !== null &&
    isWithinVisitRadius(
      { latitude: coordinates.latitude, longitude: coordinates.longitude },
      { latitude, longitude },
    );

  const canVerify =
    isCurrent &&
    !isVisited &&
    permission !== "denied" &&
    ((isAccurate && withinRadius) ||
      (IS_MOCK_DEMO && coordinates === null && permission === "prompt")) &&
    !isPending;

  const handleVerify = (): void => {
    const verificationCoordinates =
      coordinates ??
      (IS_MOCK_DEMO && permission === "prompt"
        ? { latitude, longitude, accuracy: 10 }
        : null);

    if (!verificationCoordinates || !isCurrent) {
      return;
    }
    setErrorMessage(null);

    mutate(
      {
        explorationId,
        placeId,
        latitude: verificationCoordinates.latitude,
        longitude: verificationCoordinates.longitude,
        accuracyMeters: verificationCoordinates.accuracy,
      },
      {
        onSuccess: (response) => {
          onVisitSuccess(response);
        },
        onError: () => {
          setErrorMessage("인증에 실패했어요. 잠시 후 다시 시도해 주세요.");
        },
      },
    );
  };

  const buttonLabel =
    isVisited || isSuccess
      ? "인증 완료"
      : IS_MOCK_DEMO && !withinRadius
        ? "방문 인증 체험"
        : "지도 밝히기";

  return (
    <div>
      {/* 방문 상태별 안내 */}
      {!isCurrent ? (
        <p className="text-neutral-04 mb-3 text-[13px]">
          현재 목적지를 먼저 방문해 주세요.
        </p>
      ) : isVisited ? (
        <p className="text-neutral-04 mb-3 text-[13px]">
          이미 빛을 남긴 장소예요.
        </p>
      ) : IS_MOCK_DEMO && !withinRadius ? (
        <p className="bg-primary-04 text-neutral-06 mb-3 rounded-xl px-3 py-2 text-[12px] leading-[1.5]">
          개발용 Mock 체험에서는 실제 위치와 관계없이 인증할 수 있어요.
        </p>
      ) : permission === "denied" ? (
        <p className="text-neutral-04 mb-3 text-[13px] leading-[1.5]">
          위치 권한이 꺼져 있어 방문 인증을 사용할 수 없어요.
        </p>
      ) : coordinates !== null && !isAccurate ? (
        <p className="text-neutral-04 mb-3 text-[13px]" role="status">
          GPS 오차가 50m 이하가 될 때까지 위치를 확인하고 있어요.
        </p>
      ) : coordinates === null ? (
        <p className="text-neutral-04 mb-3 text-[13px]" role="status">
          방문 인증을 위해 현재 위치를 확인하고 있어요.
        </p>
      ) : !withinRadius && distance !== null ? (
        <p className="text-neutral-04 mb-3 text-[13px]">
          {formatRemainingDistance(distance)}
        </p>
      ) : null}

      {errorMessage && (
        <p
          className="bg-caution-01 text-caution-02 mb-3 rounded-xl px-3 py-2 text-[12px]"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <Button
        onClick={handleVerify}
        disabled={!canVerify || isSuccess}
        isLoading={isPending}
        variant="solid"
        size="lg"
        className="w-full"
      >
        {buttonLabel}
      </Button>

      {IS_MOCK_DEMO && isCurrent && !isVisited && !errorMessage && (
        <button
          type="button"
          onClick={() =>
            setErrorMessage(
              "인증에 실패했어요. 위치를 확인하고 다시 시도해 주세요.",
            )
          }
          className="text-neutral-04 focus-visible:outline-primary-03 mt-3 min-h-11 w-full text-[12px] underline underline-offset-4"
        >
          개발용 · 인증 실패 화면 보기
        </button>
      )}
    </div>
  );
};

export default VisitFooter;
