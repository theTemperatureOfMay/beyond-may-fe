"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";

import { cn } from "@/lib/cn";
import CircleIconButton from "@/components/ui/CircleIconButton";
import ImageIcon from "@/components/ui/icons/Image";
import Undo from "@/components/ui/icons/Undo";
import Close from "@/components/ui/icons/Close";
import HeartFilled from "@/components/ui/icons/HeartFilled";

type SwipeDirection = "like" | "dislike";

/** 카드 표시에 필요한 최소 필드. 추천 목록·추천 회차 등 어떤 장소 응답이든 이 모양만 맞으면 된다 */
interface DeckPlace {
  placeId: number;
  name: string;
  category: string;
  tags: string[];
  thumbnailUrl: string | null;
}

interface PlaceCardDeckProps {
  places: DeckPlace[];
  /** 지금까지 좋아요로 담은 장소 수 (늘어날 때마다 알림을 띄우는 데 사용) */
  likedCount: number;
  /** 최상단 카드 탭 시 (장소 상세 열기) */
  onSelectTopPlace: (placeId: number) => void;
  /** 좋아요/싫어요 확정 시 (제스처·버튼 공통) */
  onSwipe: (direction: SwipeDirection) => void;
  onUndo: () => void;
  canUndo: boolean;
  /** 최대 장소 수에 도달해 더 담을 수 없는 상태. 좋아요는 막고 카드는 그대로 둔다 */
  isLikeBlocked?: boolean;
  /** 막힌 상태에서 좋아요를 시도했을 때 (안내 모달 등) */
  onLikeBlocked?: () => void;
}

/** 담은 장소 알림이 떠 있는 시간 (ms) */
const LIKED_TOAST_DURATION = 1600;

/** 겹쳐 보일 뒷카드 수 (최상단 포함) */
const MAX_VISIBLE_CARDS = 3;
/** 이 이상 드래그하면 스와이프로 확정 (px) */
const SWIPE_DISTANCE_THRESHOLD = 120;
/** 짧게 튕기듯 스와이프해도 확정되는 속도 기준 (px/s) */
const SWIPE_VELOCITY_THRESHOLD = 500;
const EXIT_X = 500;

interface DeckCardProps {
  place: DeckPlace;
  stackIndex: number;
  isTop: boolean;
  isExiting: boolean;
  exitInfo: { direction: SwipeDirection; velocityX: number };
  visibleCount: number;
  onPointerDown: () => void;
  onDrag: (
    event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => void;
  onDragEnd: (
    event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => void;
  onTap: () => void;
  onSelectTopPlace: (placeId: number) => void;
  onAnimationComplete: () => void;
}

/**
 * 카드 한 장. x 좌표(드래그 중인 위치)에서 기울기를 실시간으로 파생시켜,
 * 손끝을 그대로 따라가는 느낌을 준다.
 * 카드마다 독립된 motion value가 필요해 배열 map 밖의 컴포넌트로 분리했다.
 */
const DeckCard = ({
  place,
  stackIndex,
  isTop,
  isExiting,
  exitInfo,
  visibleCount,
  onPointerDown,
  onDrag,
  onDragEnd,
  onTap,
  onSelectTopPlace,
  onAnimationComplete,
}: DeckCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-EXIT_X, EXIT_X], [-24, 24]);

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      style={{
        x,
        rotate,
        zIndex: isExiting ? MAX_VISIBLE_CARDS + 1 : visibleCount - stackIndex,
      }}
      onPointerDown={isTop ? onPointerDown : undefined}
      onDrag={isTop ? onDrag : undefined}
      onDragEnd={isTop ? onDragEnd : undefined}
      onTap={isTop ? onTap : undefined}
      onKeyDown={
        isTop
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectTopPlace(place.placeId);
              }
            }
          : undefined
      }
      role={isTop ? "button" : undefined}
      tabIndex={isTop ? 0 : -1}
      aria-label={isTop ? `${place.name} 상세 보기` : undefined}
      aria-hidden={!isTop}
      onAnimationComplete={onAnimationComplete}
      initial={false}
      animate={{ y: stackIndex * 8, scale: 1 - stackIndex * 0.04, opacity: 1 }}
      exit={{
        x: exitInfo.direction === "like" ? EXIT_X : -EXIT_X,
        opacity: 0,
        transition: {
          type: "spring",
          stiffness: 180,
          damping: 20,
          mass: 0.6,
          velocity: exitInfo.velocityX,
        },
      }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className={cn(
        "border-neutral-03 bg-neutral-02 focus-visible:outline-primary-03 rounded-card absolute inset-0 overflow-hidden border focus-visible:outline-2 focus-visible:outline-offset-2",
        isTop
          ? "shadow-strong cursor-grab active:cursor-grabbing"
          : "shadow-soft pointer-events-none",
      )}
    >
      {place.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={place.thumbnailUrl}
          alt={place.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="bg-primary-04 relative flex h-full w-full items-center justify-center overflow-hidden">
          <span
            aria-hidden="true"
            className="border-primary-01/80 absolute -top-16 -right-16 h-64 w-64 rounded-full border-[48px]"
          />
          <div className="text-neutral-07 relative flex flex-col items-center gap-3">
            <ImageIcon className="h-8 w-8" />
            <span className="text-[13px] font-semibold">{place.name}</span>
          </div>
        </div>
      )}

      {isTop && (
        <>
          <span className="text-neutral-07 absolute top-5 left-5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium">
            {place.category}
          </span>

          <div className="from-neutral-07/90 via-neutral-07/55 absolute inset-x-0 bottom-0 bg-linear-to-t to-transparent px-6 pt-24 pb-6">
            <h3 className="text-[20px] font-semibold text-white">
              {place.name}
            </h3>
            {place.tags[0] && (
              <p className="mt-1 text-[13px] text-white/80">
                #{place.tags[0]} · 나의 여행 성향 추천
              </p>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

/**
 * 장소 선택 카드덱 (기능명세 2.1.1~2.1.3).
 * 뒤에 살짝 겹친 카드 스택으로 보여주고, 최상단 카드만 탭해서 상세를 열거나
 * 좌우로 드래그해서 싫어요/좋아요를 확정할 수 있다. 하단 버튼도 같은 동작을 한다.
 *
 * 확정과 동시에 onSwipe로 부모 상태를 바로 갱신해 다음 카드가 즉시 앞으로 나오게 하고,
 * 날아가는 카드는 AnimatePresence의 exit로 화면에서 독립적으로 사라진다
 * (상태 갱신을 기다렸다가 다음 카드를 보여주면 그 사이 뚝 끊기는 느낌이 남).
 */
const PlaceCardDeck = ({
  places,
  likedCount,
  onSelectTopPlace,
  onSwipe,
  onUndo,
  canUndo,
  isLikeBlocked = false,
  onLikeBlocked,
}: PlaceCardDeckProps) => {
  const visiblePlaces = places.slice(0, MAX_VISIBLE_CARDS);
  const topPlace = visiblePlaces[0];
  // 카드별 exit 방향(placeId로 구분) — 공유 상태로 두면 한 카드가 날아가는 도중
  // 다음 스와이프가 발생했을 때 그 값이 바뀌어 방향이 도중에 틀어지는 문제가 있었다.
  const [exitDirections, setExitDirections] = useState<
    Map<number, { direction: SwipeDirection; velocityX: number }>
  >(new Map());
  // 드래그가 실제로 일어났는지 (tap 오작동 방지용)
  const didDrag = useRef(false);
  const [showLikedToast, setShowLikedToast] = useState(false);
  const prevLikedCount = useRef(likedCount);

  // likedCount가 늘어날 때만(되돌리기로 줄어들 땐 제외) 알림을 띄운다
  useEffect(() => {
    if (likedCount > prevLikedCount.current) {
      setShowLikedToast(true);
      const timer = setTimeout(
        () => setShowLikedToast(false),
        LIKED_TOAST_DURATION,
      );
      prevLikedCount.current = likedCount;
      return () => clearTimeout(timer);
    }
    prevLikedCount.current = likedCount;
  }, [likedCount]);

  const commitSwipe = (direction: SwipeDirection, velocityX = 0) => {
    if (!topPlace) return;
    // 카드는 날려 보내지 않는다 — 드래그 중이었다면 제자리로 돌아온다
    if (direction === "like" && isLikeBlocked) {
      onLikeBlocked?.();
      return;
    }
    setExitDirections((prev) => {
      const next = new Map(prev);
      next.set(topPlace.placeId, { direction, velocityX });
      return next;
    });
    // exit 방향이 반영된 렌더가 먼저 커밋된 뒤에 카드를 배열에서 제거해야
    // AnimatePresence가 올바른 exit 값을 기억한 채로 사라진다.
    // (같은 배치에서 같이 처리되면 제거되는 카드는 방향이 반영되기 전 값으로 나간다.)
    requestAnimationFrame(() => onSwipe(direction));
  };

  const handleDrag = (
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => {
    if (Math.abs(info.offset.x) > 4) {
      didDrag.current = true;
    }
  };

  const handleDragEnd = (
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => {
    if (
      info.offset.x > SWIPE_DISTANCE_THRESHOLD ||
      info.velocity.x > SWIPE_VELOCITY_THRESHOLD
    ) {
      commitSwipe("like", info.velocity.x);
      return;
    }
    if (
      info.offset.x < -SWIPE_DISTANCE_THRESHOLD ||
      info.velocity.x < -SWIPE_VELOCITY_THRESHOLD
    ) {
      commitSwipe("dislike", info.velocity.x);
    }
    // 임계값 미달이면 dragConstraints(고정점)에 의해 자동으로 중앙 복귀
  };

  const handleTap = (placeId: number) => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    onSelectTopPlace(placeId);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative h-[clamp(360px,56dvh,500px)] w-full max-w-[342px]">
        <AnimatePresence>
          {showLikedToast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-neutral-07 text-neutral-01 shadow-soft absolute top-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium whitespace-nowrap"
            >
              <HeartFilled className="h-3.5 w-3.5" />
              담은 장소 {likedCount}개
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {visiblePlaces.map((place, stackIndex) => {
            // 스와이프가 확정된 카드는 배열에서 실제로 제거되기 전 마지막 렌더에서
            // isTop을 false로 미리 꺼둬야 한다 — AnimatePresence는 제거된 카드를
            // "그 마지막 렌더 상태"로 얼려서 exit 애니메이션을 재생하기 때문에,
            // 여기서 안 끄면 카드가 날아가는 동안 계속 드래그 가능한 최상단으로 남아
            // 뒤 카드의 입력을 가로챈다.
            const isExiting = exitDirections.has(place.placeId);
            const isTop = stackIndex === 0 && !isExiting;
            const exitInfo = exitDirections.get(place.placeId) ?? {
              direction: "like" as SwipeDirection,
              velocityX: 0,
            };

            return (
              <DeckCard
                key={place.placeId}
                place={place}
                stackIndex={stackIndex}
                isTop={isTop}
                isExiting={isExiting}
                exitInfo={exitInfo}
                visibleCount={visiblePlaces.length}
                onPointerDown={() => {
                  didDrag.current = false;
                }}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onTap={() => handleTap(place.placeId)}
                onSelectTopPlace={onSelectTopPlace}
                onAnimationComplete={() => {
                  setExitDirections((prev) => {
                    if (!prev.has(place.placeId)) return prev;
                    const next = new Map(prev);
                    next.delete(place.placeId);
                    return next;
                  });
                }}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <div className="relative mt-6 flex w-full max-w-[342px] items-center justify-center gap-3">
        <CircleIconButton
          icon={<Undo className="h-5 w-5" />}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="되돌리기"
          className="absolute left-0 h-11 w-11"
        />
        <CircleIconButton
          icon={<Close className="h-6 w-6" />}
          onClick={() => commitSwipe("dislike")}
          disabled={!topPlace}
          aria-label="싫어요"
          className="text-neutral-06 h-16 w-16"
        />
        <CircleIconButton
          icon={<HeartFilled className="h-6 w-6" />}
          variant="dark"
          onClick={() => commitSwipe("like")}
          disabled={!topPlace}
          aria-label="좋아요"
          className="bg-location h-16 w-16"
        />
      </div>
      <p className="text-neutral-04 mt-5 text-center text-[12px]">
        카드를 누르면 장소 정보를 자세히 볼 수 있어요.
      </p>
    </div>
  );
};

export default PlaceCardDeck;
