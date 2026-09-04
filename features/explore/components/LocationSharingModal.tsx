"use client";

import useUpdateLocationSharingMutation from "@/features/explore/hooks/useUpdateLocationSharingMutation";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface LocationSharingModalProps {
  explorationId: string;
  /** 선택 완료 시 (공유 여부 관계없이 모달 닫기) */
  onClose: () => void;
}

/**
 * 위치 공유 옵트인 모달 (4.3.2).
 * 탐험 지도 최초 진입 시 표시. 기본값은 비공유,
 * "공유하기" 선택 시에만 PATCH로 위치 공유 on.
 */
const LocationSharingModal = ({
  explorationId,
  onClose,
}: LocationSharingModalProps) => {
  const { mutate, isPending, isError } =
    useUpdateLocationSharingMutation(explorationId);

  const handleShare = (): void => {
    mutate({ enabled: true }, { onSuccess: onClose });
  };

  return (
    <Modal open onClose={onClose}>
      <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
        LOCATION SHARING
      </p>
      <h2 className="text-neutral-07 mt-2 text-left text-[20px] font-semibold">
        내 위치를 팀과 공유할까요?
      </h2>
      <p className="text-neutral-04 mt-3 text-left text-[13px] leading-[1.55]">
        공유하면 팀원 지도에 내 위치가 표시돼요. 방문 인증에 필요한 기기 위치
        권한과는 별도로 선택할 수 있어요.
      </p>

      {isError && (
        <p
          className="bg-caution-01 text-caution-02 mt-3 rounded-xl px-3 py-2 text-[12px]"
          role="alert"
        >
          위치 공유 설정을 저장하지 못했어요. 다시 시도해 주세요.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <Button
          onClick={onClose}
          disabled={isPending}
          size="lg"
          className="order-2 w-full"
        >
          나중에
        </Button>
        <Button
          onClick={handleShare}
          disabled={isPending}
          isLoading={isPending}
          variant="solid"
          size="lg"
          className="w-full"
        >
          팀과 위치 공유하기
        </Button>
      </div>
    </Modal>
  );
};

export default LocationSharingModal;
