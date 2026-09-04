import { useEffect, useState } from "react";
import { GPS_ACCURACY_THRESHOLD_METERS } from "@/lib/geo/distance";
import useGeolocationStore from "@/stores/geolocationStore";

interface UseGeolocationParams {
  /** 위치 추적 시작 여부 (탐험 진입 시 true) */
  enabled?: boolean;
}

/**
 * 브라우저 Geolocation API로 실시간 위치를 추적하고 store를 갱신.
 * 명세 4.3.1: 위치 업데이트 실시간, 권한 거부 시 위치 기반 기능 비활성화.
 */
const useGeolocation = ({
  enabled = true,
}: UseGeolocationParams = {}): (() => void) => {
  const [requestKey, setRequestKey] = useState(0);
  const setCoordinates = useGeolocationStore((state) => state.setCoordinates);
  const setPermission = useGeolocationStore((state) => state.setPermission);
  const setAccurate = useGeolocationStore((state) => state.setAccurate);
  const setError = useGeolocationStore((state) => state.setError);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!("geolocation" in navigator)) {
      setError("이 브라우저에서는 위치 기능을 사용할 수 없습니다.");
      return;
    }

    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setPermission("granted");
        setError(null);
        setCoordinates({ latitude, longitude, accuracy });
        setAccurate(accuracy <= GPS_ACCURACY_THRESHOLD_METERS);
      },
      (positionError) => {
        if (positionError.code === positionError.PERMISSION_DENIED) {
          setPermission("denied");
          setError("위치 권한이 거부되었습니다.");
        } else {
          setError("위치를 확인하지 못했습니다.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [
    enabled,
    requestKey,
    setCoordinates,
    setPermission,
    setAccurate,
    setError,
  ]);

  return () => setRequestKey((previous) => previous + 1);
};

export default useGeolocation;
