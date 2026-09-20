"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface MaxPlacesModalProps {
  open: boolean;
  onClose: () => void;
  /** 이 여행 기간에 담을 수 있는 최대 장소 수 */
  maxCount: number;
}

/**
 * 기간별 최대 장소 수를 넘겨 담으려 할 때 띄우는 안내 모달.
 * 장소 선택(카드덱)과 코스 직접·AI 수정에서 함께 쓴다.
 */
const MaxPlacesModal = ({ open, onClose, maxCount }: MaxPlacesModalProps) => (
  <Modal open={open} onClose={onClose}>
    <h2 className="text-neutral-07 text-center text-[20px] font-semibold">
      더 이상 담을 수 없어요
    </h2>
    <p className="text-neutral-04 mt-2 text-center text-[13px] leading-[1.55]">
      이번 여행에는 장소를 최대 {maxCount}곳까지 담을 수 있어요.
      <br />
      담은 장소를 하나 빼고 다시 시도해 주세요.
    </p>
    <Button variant="solid" size="lg" className="mt-6 w-full" onClick={onClose}>
      확인
    </Button>
  </Modal>
);

export default MaxPlacesModal;
