"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import CourseMapView from "@/features/course/components/CourseMapView";
import useConfirmCourseMutation from "@/features/course/hooks/useConfirmCourseMutation";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";
import useStartExplorationMutation from "@/features/explore/hooks/useStartExplorationMutation";
import useSessionStore from "@/stores/sessionStore";
import { getCourses } from "@/services/api/course/courseApi";
import { getExplorationStatus } from "@/services/api/exploration/explorationApi";
import { QUERY_KEYS } from "@/services/constant/queryKey";
import { getApiCode, getApiErrorData } from "@/services/lib/axios";
import DuplicateExplorationState from "@/features/explore/components/DuplicateExplorationState";
import type { DuplicateExplorationErrorData } from "@/types/exploration";

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
  const [hasStartError, setHasStartError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [duplicateData, setDuplicateData] =
    useState<DuplicateExplorationErrorData | null>(null);
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

  const { mutate: startExploration, isPending: isStarting } =
    useStartExplorationMutation();
  const setExplorationId = useSessionStore((state) => state.setExplorationId);
  const queryClient = useQueryClient();
  const isConfirmed = course?.status === "CONFIRMED";
  // 상세 응답에는 탐험 ID가 없으므로 선택한 코스의 목록 항목에서 찾는다.
  const coursesQuery = useQuery({
    queryKey: QUERY_KEYS.COURSE.LIST(),
    queryFn: getCourses,
    enabled: isConfirmed,
    staleTime: 0,
  });
  const targetExplorationId = coursesQuery.data?.courses.find(
    (item) => String(item.courseId) === courseId,
  )?.explorationId;
  const explorationIdStr =
    targetExplorationId == null ? "" : String(targetExplorationId);
  const statusQuery = useQuery({
    queryKey: QUERY_KEYS.EXPLORATION.STATUS(explorationIdStr),
    queryFn: () => getExplorationStatus(explorationIdStr),
    enabled: isConfirmed && explorationIdStr.length > 0,
    staleTime: 0,
  });
  const exploration = statusQuery.data;
  const isExplorationLoading =
    isConfirmed &&
    (coursesQuery.isPending ||
      coursesQuery.isFetching ||
      (explorationIdStr.length > 0 &&
        (statusQuery.isPending || statusQuery.isFetching)));
  const hasExplorationError =
    isConfirmed &&
    (coursesQuery.isError ||
      statusQuery.isError ||
      !targetExplorationId ||
      (exploration && String(exploration.courseId) !== courseId));

  const handleConfirmCourse = () => {
    confirmCourse(courseId, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        void refetch();
      },
      onError: (error) => {
        const code = getApiCode(error);
        // 이미 다른 활성 탐험 참여 중 → 기존 탐험 이동/이탈 후 재확정
        if (code === "EXPLORATION409") {
          const data = getApiErrorData<DuplicateExplorationErrorData>(error);
          if (data) {
            setIsConfirmOpen(false);
            setDuplicateData(data);
            return;
          }
        }
        // 이미 확정된 코스 → 확정 상태로 갱신(다음 화면)
        if (code === "COURSE409") {
          setIsConfirmOpen(false);
          void refetch();
          return;
        }
        // 없는 코스 → 재시도 무의미, 새로 만들기로
        if (code === "COURSE404") {
          router.replace("/places");
          return;
        }
        // 그 외 → 기존 generic 에러(hasConfirmError) 유지
      },
    });
  };

  const handleCopyShareLink = async (): Promise<void> => {
    const shareUrl = `${window.location.origin}/explore/${courseId}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // clipboard 미지원(구형·비-https) 폴백: 임시 textarea로 복사
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
    } catch {
      // 복사 자체가 실패하면 토스트를 띄우지 않음 (거짓 "복사됨" 방지)
      setIsCopied(false);
    }
  };

  const handleStart = (requestLocation: boolean): void => {
    if (
      !targetExplorationId ||
      exploration?.status !== "BEFORE" ||
      !exploration.permissions.canStart
    ) {
      setHasStartError(true);
      return;
    }
    setHasStartError(false);

    const goToExplore = () =>
      startExploration(String(targetExplorationId), {
        onSuccess: (data) => {
          setExplorationId(data.explorationId);
          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.EXPLORATION.ALL,
          });
          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.COURSE.LIST(),
          });
          router.push(`/explore/${courseId}/map`);
        },
        onError: () => setHasStartError(true),
      });

    if (requestLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(goToExplore, goToExplore, {
        enableHighAccuracy: true,
        timeout: 8000,
      });
      return;
    }
    goToExplore();
  };

  if (isLoading || isExplorationLoading) {
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

  if (isError || !course || hasExplorationError) {
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
            onClick={() => {
              void refetch();
              if (isConfirmed) void coursesQuery.refetch();
              if (explorationIdStr) void statusQuery.refetch();
            }}
          >
            코스 다시 불러오기
          </Button>
        </section>
      </main>
    );
  }

  const isOngoing = exploration?.status === "ONGOING";
  const isCompleted = exploration?.status === "COMPLETED";

  return (
    <>
      <CourseMapView
        course={course}
        backHref={fromHub ? "/course" : "/places"}
        onDetailClick={() =>
          router.push(`/course/${courseId}/detail${fromHub ? "?from=hub" : ""}`)
        }
        onConfirmClick={
          course.status === "DRAFT" ? () => setIsConfirmOpen(true) : undefined
        }
        onShareClick={isConfirmed ? () => setIsShareOpen(true) : undefined}
        startLabel={
          isOngoing
            ? "탐험 계속하기"
            : isCompleted
              ? "여행 기록 보기"
              : "탐험 시작"
        }
        onStartClick={
          isConfirmed
            ? () => {
                if (isCompleted) {
                  router.push("/record?tab=completed");
                  return;
                }
                if (exploration?.currentParticipant.status === "LEFT") {
                  router.push(`/explore/${courseId}`);
                  return;
                }
                if (isOngoing && targetExplorationId) {
                  setExplorationId(targetExplorationId);
                  router.push(`/explore/${courseId}/map`);
                  return;
                }
                setHasStartError(false);
                setIsStartOpen(true);
              }
            : undefined
        }
        onRedesignClick={
          // TODO(#56 여파): 팀원 수(teamMemberCount)는 코스 응답에 없음(exploration 소관).
          // 명세 3.3.1 "팀원 합류 전에만 재설계" 가드는 participants API 연결 후 복원.
          isConfirmed ? () => router.push("/places") : undefined
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
          <p
            className="text-caution-02 mt-3 text-center text-[12px]"
            role="alert"
          >
            코스를 확정하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
      </Modal>

      {duplicateData && (
        <DuplicateExplorationState
          activeExplorationId={duplicateData.activeExplorationId}
          onLeaveSuccess={() => {
            setDuplicateData(null);
            handleConfirmCourse();
          }}
        />
      )}

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
          <p className="text-neutral-06 truncate text-[12px]">
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
          위치는 내 위치 표시, 팀원 공유, 100m 이내 방문 인증에만 사용해요. 권한
          없이도 코스 미리보기는 가능합니다.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => handleStart(true)}
            disabled={isStarting}
          >
            위치 켜고 탐험 시작
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => handleStart(false)}
            disabled={isStarting}
          >
            권한 없이 코스 미리보기
          </Button>
        </div>
        {hasStartError && (
          <p
            className="text-caution-02 mt-3 text-center text-[12px]"
            role="alert"
          >
            탐험을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}
      </Modal>
    </>
  );
};

export default CoursePage;
