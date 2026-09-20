"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ServerErrorState from "@/components/ui/ServerErrorState";
import useGetExplorationStatusQuery from "@/features/explore/hooks/useGetExplorationStatusQuery";
import useLeaveExplorationMutation from "@/features/explore/hooks/useLeaveExplorationMutation";

interface DuplicateExplorationStateProps {
  /** EXPLORATION409 응답에서 받은, 현재 활성 참여 중인 탐험 ID */
  activeExplorationId: number;
  /** "나가고 새 지도 참여하기" 성공 시 — 부모가 새 코스 join을 재시도 */
  onLeaveSuccess: () => void;
  /** 중복 탐험을 해결한 뒤 이어갈 작업 */
  purpose?: "join" | "confirm";
}

/**
 * 중복 참여 차단 모달 (6.4.1).
 * "기존 지도로 이동" 또는 "나가고 새 지도 참여하기" 중 하나를 선택하게 함.
 * 선택 전까지 닫을 수 없는 모달이라 onClose는 no-op으로 둠.
 */
const DuplicateExplorationState = ({
  activeExplorationId,
  onLeaveSuccess,
  purpose = "join",
}: DuplicateExplorationStateProps) => {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [hasLeaveError, setHasLeaveError] = useState(false);

  const { data: activeStatus } = useGetExplorationStatusQuery(
    String(activeExplorationId),
  );
  const { mutate: leave, isPending: isLeaving } = useLeaveExplorationMutation();
  const isConfirmPurpose = purpose === "confirm";

  const handleGoToExisting = (): void => {
    if (!activeStatus) return;
    router.push(`/explore/${activeStatus.courseId}/map`);
  };

  const handleLeave = (): void => {
    leave(String(activeExplorationId), {
      onSuccess: () => {
        setIsConfirmOpen(false);
        onLeaveSuccess();
      },
      onError: () => {
        setIsConfirmOpen(false);
        setHasLeaveError(true);
      },
    });
  };

  if (hasLeaveError) {
    return <ServerErrorState onRetry={handleLeave} />;
  }

  return (
    <>
      <Modal open={!isConfirmOpen} onClose={() => {}}>
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          {isConfirmPurpose ? (
            <>
              기존 지도를 나가고
              <br />이 코스를 확정할까요?
            </>
          ) : (
            <>
              이미 참여 중인
              <br />
              지도가 있어요.
            </>
          )}
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          {isConfirmPurpose ? (
            "새 코스를 확정하려면 먼저 기존 지도에서 나가야 해요."
          ) : (
            <>
              한 번에 하나의 지도에만 참여할 수 있어요.
              <br />새 지도에 참여하려면 먼저 기존 지도에서 나가야 해요.
            </>
          )}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            disabled={!activeStatus}
            onClick={handleGoToExisting}
          >
            기존 지도로 이동
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => setIsConfirmOpen(true)}
          >
            {isConfirmPurpose
              ? "나가고 코스 확정하기"
              : "나가고 새 지도 참여하기"}
          </Button>
        </div>
      </Modal>

      <Modal open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          {isConfirmPurpose
            ? "기존 지도를 나가고 코스를 확정할까요?"
            : "기존 지도에서 나갈까요?"}
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          지금까지 밝힌 기록은 그대로 보관돼요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => setIsConfirmOpen(false)}
          >
            돌아가기
          </Button>
          <Button
            size="lg"
            className="w-full"
            isLoading={isLeaving}
            onClick={handleLeave}
          >
            나가기
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default DuplicateExplorationState;
