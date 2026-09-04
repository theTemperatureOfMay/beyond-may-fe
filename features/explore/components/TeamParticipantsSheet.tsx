"use client";

import { cn } from "@/lib/cn";
import useDialogFocus from "@/hooks/useDialogFocus";
import LocationOff from "@/components/ui/icons/LocationOff";
import Close from "@/components/ui/icons/Close";
import type { ExplorationParticipant } from "@/types/exploration";

/** 아바타 배경색 후보 (participantId로 고정 선택) */
const AVATAR_COLORS = [
  "bg-neutral-07",
  "bg-neutral-06",
  "bg-neutral-04",
  "bg-neutral-05",
  "bg-neutral-03",
];

interface TeamParticipantsSheetProps {
  participantCount: number;
  participants: ExplorationParticipant[];
  isPending: boolean;
  isError: boolean;
  /** 탐험 진행 중 여부. true면 방문 수·위치 배지 표시, false(탐험 전)면 닉네임만 */
  isOngoing?: boolean;
  onClose: () => void;
}

const TeamParticipantsSheet = ({
  participantCount,
  participants,
  isPending,
  isError,
  isOngoing = true,
  onClose,
}: TeamParticipantsSheetProps) => {
  const dialogRef = useDialogFocus<HTMLDivElement>(true, onClose);

  return (
    <div className="fixed inset-0 z-50">
      {/* 오버레이 */}
      <div
        className="bg-neutral-07/35 absolute inset-0 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* 시트 */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="팀원 목록"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-[430px] rounded-t-[24px] bg-white px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] focus:outline-none"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-neutral-07 text-[20px] font-semibold">
            함께 걷는 팀원 {participantCount}명
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="팀원 목록 닫기"
            className="text-neutral-04 focus-visible:outline-primary-03 flex h-11 w-11 items-center justify-center rounded-full"
          >
            <Close className="h-4 w-4" />
          </button>
        </div>

        {isPending && (
          <p
            className="text-neutral-04 py-9 text-center text-[14px]"
            role="status"
          >
            팀원을 불러오고 있어요.
          </p>
        )}

        {isError && (
          <p className="text-neutral-04 py-9 text-center text-[14px]">
            팀원 목록을 불러오지 못했어요.
          </p>
        )}

        {!isPending && !isError && participants.length === 0 && (
          <p className="text-neutral-04 py-9 text-center text-[14px]">
            아직 참여한 팀원이 없어요.
          </p>
        )}

        {!isPending && !isError && participants.length > 0 && (
          <ul className="mt-4 flex flex-col">
            {participants.map((participant) => (
              <li
                key={participant.participantId}
                className="border-neutral-02 flex items-center gap-3 border-b px-1.5 py-3.5 last:border-b-0"
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white",
                    AVATAR_COLORS[
                      participant.participantId % AVATAR_COLORS.length
                    ],
                  )}
                >
                  {participant.displayName.charAt(0)}
                </div>

                <div className="flex-1">
                  <p className="text-neutral-07 text-[15px] font-medium">
                    {participant.displayName}
                  </p>
                  {isOngoing && (
                    <p className="text-neutral-04 text-[12px]">
                      {participant.visitedPlaceCount}개 완료
                    </p>
                  )}
                </div>

                {isOngoing && !participant.locationSharingEnabled && (
                  <span className="bg-neutral-02 text-neutral-04 flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] whitespace-nowrap">
                    <LocationOff className="h-2.5 w-2.5" />
                    위치 비공개
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="text-neutral-04 mt-4 text-[12px] leading-[1.5]">
          {isOngoing
            ? "위치 미공유 팀원은 목록엔 노출되지만 지도에는 마커를 표시하지 않습니다."
            : "탐험 전이라 방문 완료 개수는 표시되지 않고 닉네임만 노출됩니다."}
        </p>
      </div>
    </div>
  );
};

export default TeamParticipantsSheet;
