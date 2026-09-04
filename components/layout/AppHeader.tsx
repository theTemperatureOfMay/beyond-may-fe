import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import Home from "@/components/ui/icons/Home";
import ChevronLeft from "@/components/ui/icons/ChevronLeft";
import Hamburger from "@/components/ui/icons/Hamburger";
import HelpCircle from "@/components/ui/icons/HelpCircle";

interface AppHeaderProps {
  /**
   * 햄버거 클릭 시 호출. 사이드바 열기 담당.
   * TODO: 사이드바(설정/위치 이동 등) 내용 확정 후 연결. 미지정 시 버튼은 비활성처럼 동작.
   */
  onOpenMenu?: () => void;
  /**
   * 우측 햄버거(메뉴) 노출 여부. 기본 true.
   * 결과 로딩처럼 Home만 필요한 화면에서는 false로 넘겨 Home만 표시.
   */
  showMenu?: boolean;
  /** 홈처럼 좌측 이동 액션이 없는 화면에서는 false로 숨긴다. */
  showHome?: boolean;
  /** 선형 여정의 명시적 상위 경로. 지정하면 Home 대신 Back을 표시한다. */
  backHref?: string;
  /** 저장되지 않은 작업 확인처럼 이동 전에 처리가 필요할 때 사용한다. */
  onBack?: () => void;
  onHome?: () => void;
  /**
   * 헤더 중앙에 표시할 라벨 (예: 장소 카드덱의 남은 장소 수).
   * 지정 시에만 렌더링되며, 나머지 화면 레이아웃에는 영향을 주지 않는다.
   */
  centerLabel?: ReactNode;
  /**
   * 지정 시 우측에 도움말 아이콘을 추가한다.
   * 예: 장소 카드덱에서 스와이프 안내 화면을 다시 연다.
   */
  onOpenHelp?: () => void;
  className?: string;
}

/**
 * 각 페이지 상단 공용 헤더 (기능명세 메인 등).
 * 전역 layout에 두지 않고, 헤더가 필요한 페이지가 직접 삽입한다.
 *
 * - 좌측 Home: 루트('/')로 이동
 * - 우측 Hamburger: 사이드바 토글 (내용 미정), showMenu=false면 숨김
 *
 * 색은 currentColor 기반이라 부모에서 text-* 로 제어한다.
 * 기본 아이콘 색은 neutral-03(메인 그라디언트 배경 기준)이며,
 * 밝은 배경 화면에서는 className으로 text-* 를 넘겨 덮어쓴다.
 */
const AppHeader = ({
  onOpenMenu,
  showMenu = true,
  showHome = true,
  backHref,
  onBack,
  onHome,
  centerLabel,
  onOpenHelp,
  className,
}: AppHeaderProps) => {
  return (
    <header
      className={cn(
        "text-neutral-07 relative z-20 flex min-h-16 items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))]",
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="이전 화면으로 이동"
          className="focus-visible:outline-primary-03 flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : backHref ? (
        <Link
          href={backHref}
          aria-label="이전 화면으로 이동"
          className="focus-visible:outline-primary-03 flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : onHome ? (
        <button
          type="button"
          onClick={onHome}
          aria-label="홈으로 이동"
          className="focus-visible:outline-primary-03 flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Home className="h-6 w-6" />
        </button>
      ) : showHome ? (
        <Link
          href="/"
          aria-label="홈으로 이동"
          className="focus-visible:outline-primary-03 flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Home className="h-6 w-6" />
        </Link>
      ) : (
        <span className="h-11 w-11" aria-hidden="true" />
      )}

      {centerLabel !== undefined && (
        <span className="absolute top-1/2 left-1/2 max-w-[60%] -translate-x-1/2 -translate-y-1/2 truncate pt-[max(12px,env(safe-area-inset-top))] text-[13px] font-medium text-current">
          {centerLabel}
        </span>
      )}

      <div className="flex items-center">
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            aria-label="스와이프 안내 다시 보기"
            className="focus-visible:outline-primary-03 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <HelpCircle className="h-6 w-6" />
          </button>
        )}
        {showMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="메뉴 열기"
            className="focus-visible:outline-primary-03 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Hamburger className="h-6 w-6" />
          </button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
