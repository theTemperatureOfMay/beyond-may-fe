interface ClusterMarkerProps {
  count: number;
  onClick?: () => void;
}

const CLUSTER_COLOR = "40, 40, 40"; // 차콜 (유형색 안 섞음)

/**
 * 클러스터 마커 — 겹친 미방문 핀을 묶어 차콜 원 + 개수(N)로 표시한다.
 * 유형색을 섞지 않고 차콜 단색으로 통일 (작은 핀에 4색은 안 읽히므로).
 * 클릭 시 해당 위치로 확대해 개별 핀으로 펼치는 동작은 호출부에서 연결한다.
 */
const ClusterMarker = ({ count, onClick }: ClusterMarkerProps) => {
  // 묶인 개수가 많을수록 살짝 크게 (시각적 밀도 표현)
  const visualSize = count >= 10 ? 44 : count >= 5 ? 40 : 36;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`장소 ${count}곳 모음`}
      className="focus-visible:outline-primary-03 flex h-11 w-11 items-center justify-center rounded-full font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        width: visualSize,
        height: visualSize,
        minWidth: 44,
        minHeight: 44,
        backgroundColor: `rgba(${CLUSTER_COLOR}, 0.92)`,
        border: "2px solid white",
        boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
        fontSize: visualSize * 0.36,
      }}
    >
      {count}
    </button>
  );
};

export default ClusterMarker;
