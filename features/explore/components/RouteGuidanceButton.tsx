"use client";

import Stop from "@/components/ui/icons/Stop";

interface RouteGuidanceButtonProps {
  onClick: () => void;
}

const RouteGuidanceButton = ({ onClick }: RouteGuidanceButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-neutral-07 text-neutral-01 focus-visible:outline-primary-03 flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2"
  >
    <Stop className="h-4 w-4" />
    길안내 중지
  </button>
);

export default RouteGuidanceButton;
