import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { buildStampPath } from "@/features/onboarding/utils/stampPath";

interface StampPhotoProps {
  src?: string;
  alt: string;
  className?: string;
  /** 톱니 반지름(px). 실제 우표처럼 카드 크기와 무관하게 일정한 크기를 유지한다. */
  notchRadius?: number;
  /** 톱니 사이 직선 구간 길이(px). 기본값은 notchRadius와 동일. */
  gap?: number;
  /** 모서리 여백(px). 넓을수록 톱니가 가운데로 밀집된다. 기본값은 notchRadius의 2배. */
  cornerMargin?: number;
  /** 우표 여백(종이) 색. 밝은 배경 위에서는 흰색 대신 진한 색을 줘야 톱니가 보인다. */
  paperColor?: string;
}

const DEFAULT_SIZE = { width: 160, height: 200 };

/**
 * 실제 우표 디자인 — 사방 톱니가 있는 흰 여백(종이) 안에
 * 얇은 테두리로 프레임된 사진이 놓인 형태. (테두리 라인 하나만 그리는
 * 방식이 아니라, 흰 여백 + 인셋 프레임의 2겹 구조로 실제 우표를 재현한다.)
 *
 * 컨테이너 실제 렌더 크기를 ResizeObserver로 측정해 그 픽셀 단위로
 * 톱니 path를 만들기 때문에, 카드마다 크기가 달라져도 톱니 크기가
 * 일정하게 유지된다 (실제 우표가 크기와 무관하게 톱니 간격이 일정한 것과 동일).
 */
const StampPhoto = ({
  src,
  alt,
  className,
  notchRadius = 4,
  gap,
  cornerMargin = notchRadius * 2,
  paperColor = "var(--color-neutral-01)",
}: StampPhotoProps) => {
  const clipId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(DEFAULT_SIZE);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // offsetWidth/Height: rotate 등 transform의 영향을 받지 않는 실제 레이아웃 크기.
    // getBoundingClientRect()는 회전된 요소의 축 정렬 바운딩 박스(실제보다 커짐)를
    // 반환하므로 톱니 path가 어긋나 모서리가 삐죽해지는 원인이 된다.
    const updateSize = () => {
      const { offsetWidth, offsetHeight } = el;
      if (offsetWidth > 0 && offsetHeight > 0) {
        setSize({ width: offsetWidth, height: offsetHeight });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stampPath = useMemo(
    () =>
      buildStampPath({
        width: size.width,
        height: size.height,
        notchRadius,
        gap,
        cornerMargin,
      }),
    [size.width, size.height, notchRadius, gap, cornerMargin],
  );

  const inset = Math.max(cornerMargin, 7); // 모서리 여백에 비례한 인셋. 최소 7px 이상
  const innerX = inset;
  const innerY = inset;
  const innerWidth = Math.max(size.width - inset * 2, 1);
  const innerHeight = Math.max(size.height - inset * 2, 1);

  return (
    <div ref={containerRef} className={cn("relative h-full w-full", className)}>
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <rect
              x={innerX}
              y={innerY}
              width={innerWidth}
              height={innerHeight}
            />
          </clipPath>
        </defs>
        {/* 우표 여백(종이) */}
        <path d={stampPath} fill={paperColor} />
        {/* 인셋 프레임: 실제 사진 + 얇은 테두리 */}
        <rect
          x={innerX}
          y={innerY}
          width={innerWidth}
          height={innerHeight}
          fill={src ? "var(--color-neutral-03)" : paperColor}
        />
        {!src && (
          <circle
            cx={innerX + innerWidth}
            cy={innerY}
            r={Math.min(innerWidth, innerHeight) * 0.44}
            fill="none"
            stroke="var(--color-neutral-01)"
            strokeWidth={Math.max(12, innerWidth * 0.12)}
            opacity={0.35}
            clipPath={`url(#${clipId})`}
          />
        )}
        {src && (
          // 주의(CORS): crossOrigin="anonymous"는 원격 서버가 CORS를 허용해야 유효하다.
          // 허용되지 않으면 캔버스가 오염되어 useCaptureImage의 캡처(toBlob)가 실패한다.
          // 자세한 내용은 hooks/useCaptureImage.ts 상단 주석 참고.
          <image
            href={src}
            x={innerX}
            y={innerY}
            width={innerWidth}
            height={innerHeight}
            preserveAspectRatio="xMidYMid slice"
            crossOrigin="anonymous"
            clipPath={`url(#${clipId})`}
          />
        )}
      </svg>
      {!src && (
        <span className="text-neutral-07 absolute inset-0 flex items-center justify-center px-8 text-center text-[12px] font-semibold">
          {alt}
        </span>
      )}
    </div>
  );
};

export default StampPhoto;
