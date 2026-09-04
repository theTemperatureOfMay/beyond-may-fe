"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import { getCourses } from "@/services/api/course/courseApi";
import { QUERY_KEYS } from "@/services/constant/queryKey";
import type { CourseDetailResponse, CourseStatus } from "@/types/course";

const STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: "초안",
  CONFIRMED: "출발 전",
  IN_PROGRESS: "여행 중",
  COMPLETED: "완료",
};

const STATUS_CLASSES: Record<CourseStatus, string> = {
  DRAFT: "bg-primary-04 text-primary-08",
  CONFIRMED: "bg-primary-01 text-neutral-07",
  IN_PROGRESS: "bg-primary-08 text-white",
  COMPLETED: "bg-neutral-02 text-neutral-04",
};

const getCourseAction = (course: CourseDetailResponse) => {
  if (course.status === "IN_PROGRESS") {
    return { href: `/explore/${course.courseId}`, label: "여행 이어가기" };
  }
  if (course.status === "COMPLETED") {
    return { href: `/record/${course.courseId}`, label: "기록 보기" };
  }
  return {
    href: `/course/${course.courseId}?from=hub`,
    label: "코스 확인",
  };
};

const CoursePage = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.COURSE.LIST(),
    queryFn: getCourses,
  });

  return (
    <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <AppHeader backHref="/" showMenu={false} centerLabel="내 코스" />

      <section className="px-6 pt-5 pb-7">
        <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
          MY ROUTES
        </p>
        <h1 className="text-neutral-07 mt-2 text-[28px] leading-[1.3] font-bold">
          다시 걷고 싶은
          <br />
          광주를 골라보세요
        </h1>
        <p className="text-neutral-04 mt-3 text-[14px] leading-[1.6]">
          만들던 코스부터 완료한 여행까지 한곳에서 이어볼 수 있어요.
        </p>
      </section>

      {isLoading && (
        <div className="space-y-4 px-6" role="status" aria-label="코스 로딩 중">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="border-neutral-03 h-44 animate-pulse rounded-[24px] border bg-white p-5"
            >
              <div className="bg-neutral-03 h-5 w-16 rounded-full" />
              <div className="bg-neutral-03 mt-5 h-6 w-3/4 rounded" />
              <div className="bg-neutral-02 mt-3 h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <section className="flex flex-1 flex-col items-center justify-center px-8 pb-20 text-center">
          <h2 className="text-neutral-07 text-[20px] font-semibold">
            코스를 불러오지 못했어요
          </h2>
          <p className="text-neutral-04 mt-2 text-[13px]">
            연결 상태를 확인한 뒤 다시 시도해 주세요.
          </p>
          <Button
            variant="solid"
            size="lg"
            className="mt-5 w-full"
            onClick={() => void refetch()}
          >
            다시 불러오기
          </Button>
        </section>
      )}

      {!isLoading && !isError && data?.courses.length === 0 && (
        <section className="flex flex-1 flex-col items-center justify-center px-8 pb-20 text-center">
          <div
            className="bg-primary-04 flex h-16 w-16 items-center justify-center rounded-full text-[24px]"
            aria-hidden="true"
          >
            ↗
          </div>
          <h2 className="text-neutral-07 mt-6 text-[24px] font-bold">
            아직 만든 코스가 없어요
          </h2>
          <p className="text-neutral-04 mt-2 text-[14px] leading-[1.6]">
            가고 싶은 장소를 담으면 이동 순서에 맞춘 코스를 만들 수 있어요.
          </p>
        </section>
      )}

      {data && data.courses.length > 0 && (
        <ul className="space-y-4 px-6 pb-8">
          {data.courses.map((course) => {
            const action = getCourseAction(course);
            const progress = Math.round(
              (course.summary.visitedPlaceCount /
                Math.max(course.summary.totalPlaceCount, 1)) *
                100,
            );

            return (
              <li
                key={course.courseId}
                className="border-neutral-03 rounded-[24px] border bg-white p-5 shadow-[0_10px_28px_rgba(20,20,20,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASSES[course.status]}`}
                    >
                      {STATUS_LABELS[course.status]}
                    </span>
                    <h2 className="text-neutral-07 mt-3 truncate text-[20px] font-bold">
                      {course.title}
                    </h2>
                  </div>
                  <span className="text-neutral-04 shrink-0 text-[12px]">
                    {course.summary.totalPlaceCount}곳
                  </span>
                </div>

                <p className="text-neutral-04 mt-2 text-[13px]">
                  약 {Math.round(course.summary.estimatedDurationMinutes / 60)}
                  시간 ·{" "}
                  {(course.summary.estimatedDistanceMeters / 1000).toFixed(1)}
                  km
                </p>

                {(course.status === "IN_PROGRESS" ||
                  course.status === "COMPLETED") && (
                  <div className="mt-4">
                    <div className="text-neutral-04 mb-1.5 flex justify-between text-[11px]">
                      <span>{course.summary.visitedPlaceCount}곳 방문</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="bg-neutral-02 h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary-08 h-full rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/course/${course.courseId}/detail?from=hub`}
                    className="border-neutral-07 text-neutral-07 focus-visible:outline-primary-03 flex min-h-11 flex-1 items-center justify-center rounded-full border px-4 text-[13px] font-medium"
                  >
                    일정 보기
                  </Link>
                  <Link
                    href={action.href}
                    className="bg-neutral-07 text-neutral-01 focus-visible:outline-primary-03 flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-[13px] font-medium"
                  >
                    {action.label}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="sticky bottom-0 mt-auto border-t border-black/5 bg-white/95 px-6 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] backdrop-blur">
        <Link
          href="/places"
          className="bg-primary-08 text-white-01 focus-visible:outline-primary-03 flex min-h-12 w-full items-center justify-center rounded-full px-5 text-[15px] font-semibold"
        >
          새 코스 만들기
        </Link>
      </div>
    </main>
  );
};

export default CoursePage;
