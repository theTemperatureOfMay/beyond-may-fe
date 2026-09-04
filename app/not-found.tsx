import FullPageState from "@/components/ui/FullPageState";

const NotFound = () => (
  <FullPageState
    eyebrow="404 · 길을 잃었어요"
    title="페이지를 찾을 수 없어요"
    description="주소가 바뀌었거나 삭제된 페이지예요. 홈에서 다시 찾아보세요."
    actionLabel="홈으로 돌아가기"
    actionHref="/"
  />
);

export default NotFound;
