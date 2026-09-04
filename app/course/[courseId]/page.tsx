"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import CourseMapView from "@/features/course/components/CourseMapView";
import useConfirmCourseMutation from "@/features/course/hooks/useConfirmCourseMutation";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ from?: string }>;
}

/**
 * 추천 코스 지도 화면 (기능명세 3.1.1).
 * courseId로 코스를 조회해 지도·요약 패널을 렌더한다.
 */
const CoursePage = ({ params, searchParams }: CoursePageProps) => {
  const { courseId } = use(params);
  const { from } = use(searchParams);
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const fromHub = from === "hub";
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
      onSuccess: () => {
        setIsConfirmOpen(false);
        void refetch();
      },
    });
  };

  const handleCopyShareLink = async (): Promise<void> => {
    await navigator.clipboard?.writeText(
      `${window.location.origin}/explore/${courseId}`,
    );
    setIsCopied(true);
  };

  const handleStart = (requestLocation: boolean): void => {
    if (requestLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => router.push(`/explore/${courseId}?stage=ongoing`),
        () => router.push(`/explore/${courseId}?stage=ongoing`),
        { enableHighAccuracy: true, timeout: 8000 },
      );
      return;
    }
    router.push(`/explore/${courseId}?stage=preview`);
  };

  if (isLoading) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <AppHeader
          backHref={fromHub ? "/course" : "/places"}
          showMenu={false}
        />
        <div className="flex flex-1 flex-col justify-end" role="status">
          <div className="bg-neutral-02 flex-1 animate-pulse" />
          <div className="border-neutral-03 space-y-3 border-t bg-white p-6">
            <div className="bg-neutral-03 h-3 w-20 rounded-full" />
            <div className="bg-neutral-03 h-6 w-48 rounded-full" />
            <div className="bg-neutral-03 h-12 w-full rounded-full" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !course) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <AppHeader
          backHref={fromHub ? "/course" : "/places"}
          showMenu={false}
        />
        <section className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h1 className="text-neutral-07 text-[20px] font-semibold">
            코스를 불러오지 못했어요
          </h1>
          <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
            연결 상태를 확인한 뒤 다시 시도해 주세요.
          </p>
          <Button
            variant="solid"
            size="lg"
            className="mt-5 w-full"
            onClick={() => refetch()}
          >
            코스 다시 불러오기
          </Button>
        </section>
      </main>
    );
  }

  const isConfirmed = course.status === "CONFIRMED";

  return (
    <>
      <CourseMapView
        course={course}
        backHref={fromHub ? "/course" : "/places"}
        onDetailClick={() =>
          router.push(
            `/course/${courseId}/detail${fromHub ? "?from=hub" : ""}`,
          )
        }
        onConfirmClick={
          course.status === "DRAFT" ? () => setIsConfirmOpen(true) : undefined
        }
        onShareClick={isConfirmed ? () => setIsShareOpen(true) : undefined}
        onStartClick={isConfirmed ? () => setIsStartOpen(true) : undefined}
        onRedesignClick={
          isConfirmed && course.summary.teamMemberCount === 1
            ? () => router.push("/places")
            : undefined
        }
        isConfirming={isConfirming}
        hasConfirmError={hasConfirmError}
      />

      <Modal open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          이 코스를 확정할까요?
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          확정 후에는 코스를 수정할 수 없어요. 팀원이 합류하기 전에는 다시
          설계할 수 있습니다.
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
            다시 확인
          </Button>
        </div>
        {hasConfirmError && (
          <p className="text-error mt-3 text-center text-[12px]" role="alert">
            코스를 확정하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
      </Modal>

      <Modal open={isShareOpen} onClose={() => setIsShareOpen(false)}>
        <p className="text-primary-08 text-[12px] font-semibold tracking-[0.1em]">
          TEAM INVITATION
        </p>
        <h2 className="text-neutral-07 mt-2 text-[20px] font-semibold">
          함께 걸을 사람을 초대해요
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          공유 링크는 발급 시점부터 3일 동안 참여에 사용할 수 있어요.
        </p>
        <div className="border-neutral-03 bg-neutral-02 mt-4 overflow-hidden rounded-xl border px-4 py-3">
          <p className="truncate text-[12px] text-neutral-06">
            {typeof window !== "undefined"
              ? `${window.location.origin}/explore/${courseId}`
              : `/explore/${courseId}`}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => void handleCopyShareLink()}
          >
            {isCopied ? "링크가 복사되었습니다" : "링크 복사"}
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              if (navigator.share) {
                void navigator.share({
                  title: course.title,
                  text: "5월 너머의 광주 코스에 함께해요.",
                  url: `${window.location.origin}/explore/${courseId}`,
                });
              } else {
                void handleCopyShareLink();
              }
            }}
          >
            카카오톡·시스템 공유
          </Button>
        </div>
      </Modal>

      <Modal open={isStartOpen} onClose={() => setIsStartOpen(false)}>
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          현재 위치를 켜고 탐험할까요?
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          위치는 내 위치 표시, 팀원 공유, 100m 이내 방문 인증에만 사용해요.
          권한 없이도 코스 미리보기는 가능합니다.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => handleStart(true)}
          >
            위치 켜고 탐험 시작
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => handleStart(false)}
          >
            권한 없이 코스 미리보기
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default CoursePage;
