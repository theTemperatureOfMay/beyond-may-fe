"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import CourseTimelineView from "@/features/course/components/CourseTimelineView";
import useConfirmCourseMutation from "@/features/course/hooks/useConfirmCourseMutation";
import DuplicateExplorationState from "@/features/explore/components/DuplicateExplorationState";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";
import { getApiCode, getApiErrorData } from "@/services/lib/axios";
import type { DuplicateExplorationErrorData } from "@/types/exploration";

import Sidebar from "@/components/layout/sidebar/Sidebar";
import SidebarProfileMenu from "@/components/layout/sidebar/SidebarProfileMenu";
import SidebarLoginForm from "@/components/layout/sidebar/SidebarLoginForm";
import useSessionStore from "@/stores/sessionStore";

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ from?: string; added?: string }>;
}

const CourseDetailPage = ({ params, searchParams }: CourseDetailPageProps) => {
  const { courseId } = use(params);
  const { from, added } = use(searchParams);
  const router = useRouter();
  const fromHub = from === "hub";

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [duplicateData, setDuplicateData] =
    useState<DuplicateExplorationErrorData | null>(null);
  const nickname = useSessionStore((state) => state.nickname);

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
      onError: (error) => {
        if (getApiCode(error) !== "EXPLORATION409") return;
        const data = getApiErrorData<DuplicateExplorationErrorData>(error);
        if (!data) return;
        setIsConfirmOpen(false);
        setDuplicateData(data);
      },
    });
  };

  const handleBack = () => router.back();

  if (isLoading) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <AppHeader
          onBack={handleBack}
          showMenu={true}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
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
        <AppHeader
          onBack={handleBack}
          showMenu={true}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
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

  const addedPlaceIds =
    course.status === "CONFIRMED" || !added
      ? []
      : added
          .split(",")
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id));
  const isDraft = course.status === "DRAFT";

  return (
    <>
      <CourseTimelineView
        course={course}
        addedPlaceIds={addedPlaceIds}
        onBack={handleBack}
        onOpenMenu={() => setIsMenuOpen(true)}
        onUseCourse={isDraft ? () => setIsConfirmOpen(true) : undefined}
        isUsingCourse={isDraft ? isConfirming : false}
        hasUseCourseError={isDraft ? hasConfirmError : false}
        onEditWithAi={
          isDraft
            ? () =>
                router.push(
                  `/course/${courseId}/edit?mode=ai${fromHub ? "&from=hub" : ""}`,
                )
            : undefined
        }
        onEditManually={
          isDraft
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

      {duplicateData && (
        <DuplicateExplorationState
          activeExplorationId={duplicateData.activeExplorationId}
          purpose="confirm"
          onLeaveSuccess={() => {
            setDuplicateData(null);
            handleConfirmCourse();
          }}
        />
      )}

      <Sidebar open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        {nickname ? <SidebarProfileMenu /> : <SidebarLoginForm />}
      </Sidebar>
    </>
  );
};

export default CourseDetailPage;
