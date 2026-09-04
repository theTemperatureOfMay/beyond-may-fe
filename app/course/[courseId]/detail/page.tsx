"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import CourseTimelineView from "@/features/course/components/CourseTimelineView";
import useConfirmCourseMutation from "@/features/course/hooks/useConfirmCourseMutation";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ from?: string }>;
}

/**
 * 코스 타임라인(시간대별 동선) 화면 (기능명세 3.1.2).
 * 지도 화면의 "코스 상세" 진입점. courseId로 조회해 타임라인을 렌더한다.
 */
const CourseDetailPage = ({ params, searchParams }: CourseDetailPageProps) => {
  const { courseId } = use(params);
  const { from } = use(searchParams);
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const fromHub = from === "hub";
  const mapHref = `/course/${courseId}${fromHub ? "?from=hub" : ""}`;
  const {
    data: course,
    isLoading,
    isError,
    refetch,
  } = useGetCourseDetailQuery(courseId);
  const {
    mutate: confirmCourse,
    isPending: isConfirming,
    isError: hasConfirmError,
  } = useConfirmCourseMutation();

  const handleConfirmCourse = () => {
    confirmCourse(courseId, {
      onSuccess: () => router.push(`/course/${courseId}`),
    });
  };

  if (isLoading) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <AppHeader backHref={mapHref} showMenu={false} />
        <div className="space-y-5 px-6 pt-8" role="status">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex animate-pulse items-center gap-4">
              <div className="bg-neutral-03 h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-neutral-03 h-4 w-2/3 rounded" />
                <div className="bg-neutral-02 h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (isError || !course) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <AppHeader backHref={mapHref} showMenu={false} />
        <section className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h1 className="text-neutral-07 text-[20px] font-semibold">
            코스 일정을 불러오지 못했어요
          </h1>
          <Button
            variant="solid"
            size="lg"
            className="mt-5 w-full"
            onClick={() => refetch()}
          >
            일정 다시 불러오기
          </Button>
        </section>
      </main>
    );
  }

  const canEdit = course.status === "DRAFT";

  return (
    <>
      <CourseTimelineView
        course={course}
        backHref={mapHref}
        onUseCourse={canEdit ? () => setIsConfirmOpen(true) : undefined}
        isUsingCourse={isConfirming}
        hasUseCourseError={hasConfirmError}
        onEditWithAi={
          canEdit
            ? () =>
                router.push(
                  `/course/${courseId}/edit?mode=ai${fromHub ? "&from=hub" : ""}`,
                )
            : undefined
        }
        onEditManually={
          canEdit
            ? () =>
                router.push(
                  `/course/${courseId}/edit?mode=manual${fromHub ? "&from=hub" : ""}`,
                )
            : undefined
        }
      />
      <Modal open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          이 코스를 확정할까요?
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          확정 후에는 코스를 수정할 수 없어요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            isLoading={isConfirming}
            onClick={handleConfirmCourse}
          >
            코스 확정하기
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => setIsConfirmOpen(false)}
          >
            취소
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default CourseDetailPage;
