"use client";

import FullPageState from "@/components/ui/FullPageState";

interface ErrorPageProps {
  reset: () => void;
}

const ErrorPage = ({ reset }: ErrorPageProps) => (
  <FullPageState
    eyebrow="잠시 문제가 생겼어요"
    title="일시적인 서버 오류가 발생했어요"
    description="문제를 확인하고 있어요. 입력한 내용은 유지했으니 잠시 후 다시 시도해 주세요."
    actionLabel="다시 시도"
    onAction={reset}
  />
);

export default ErrorPage;
