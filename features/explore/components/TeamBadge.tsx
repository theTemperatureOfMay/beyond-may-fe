"use client";

interface TeamBadgeProps {
  participantCount: number;
  onClick: () => void;
}

const TeamBadge = ({ participantCount, onClick }: TeamBadgeProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-neutral-07 focus-visible:outline-primary-03 min-h-11 rounded-full bg-white px-4 text-[12px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.14)]"
    >
      ◈ 팀 {participantCount}명
    </button>
  );
};

export default TeamBadge;
