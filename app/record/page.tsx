"use client";

import { use } from "react";
import Link from "next/link";

import AppHeader from "@/components/layout/AppHeader";
import ChevronRight from "@/components/ui/icons/ChevronRight";
import useGetExplorationsQuery from "@/features/explore/hooks/useGetExplorationsQuery";
import { formatRecordDate } from "@/features/record/mockRecords";
import { getJourneyGradient } from "@/features/record/utils/journeyGradient";
import { useQueries } from "@tanstack/react-query";
import { getTeamVisits } from "@/services/api/record/recordApi";
import { QUERY_KEYS } from "@/services/constant/queryKey";
import type { TeamVisit } from "@/types/record";
import useSessionStore from "@/stores/sessionStore";

type RecordTab = "ongoing" | "completed" | "visits";

interface RecordPageProps {
  searchParams: Promise<{ state?: string; tab?: string }>;
}

const TABS: { id: RecordTab; label: string }[] = [
  { id: "ongoing", label: "진행 중" },
  { id: "completed", label: "완료" },
  { id: "visits", label: "방문한 장소" },
];

const RecordPage = ({ searchParams }: RecordPageProps) => {
  const { state, tab } = use(searchParams);
  const isLoggedIn = useSessionStore((state) => state.isLoggedIn);
  const setExplorationId = useSessionStore((state) => state.setExplorationId);
  const activeTab: RecordTab = TABS.some(({ id }) => id === tab)
    ? (tab as RecordTab)
    : "ongoing";
  const isEmpty = state === "empty";

  const {
    data: ongoingData,
    isLoading: isOngoingLoading,
    isError: isOngoingError,
  } = useGetExplorationsQuery("ONGOING");
  const {
    data: completedData,
    isLoading: isCompletedLoading,
    isError: isCompletedError,
  } = useGetExplorationsQuery("COMPLETED");

  const ongoingExplorations = isEmpty ? [] : (ongoingData?.explorations ?? []);
  const activeExploration =
    isLoggedIn && !isOngoingError ? ongoingExplorations[0] : undefined;
  const completedExplorations = isEmpty
    ? []
    : (completedData?.explorations ?? []);

  const explorationIds = [...ongoingExplorations, ...completedExplorations].map(
    (exploration) => String(exploration.explorationId),
  );

  const visitQueries = useQueries({
    queries: explorationIds.map((id) => ({
      queryKey: QUERY_KEYS.RECORD.TEAM_VISITS(id),
      queryFn: () => getTeamVisits(id),
      enabled: !!id,
    })),
  });
  const isVisitsLoading = visitQueries.some((query) => query.isLoading);
  const isVisitsError = visitQueries.some((query) => query.isError);

  // {visit, explorationId}로 모아 placeId 기준 중복 제거 (최근 방문 우선)
  const visitedPlaces = isEmpty
    ? []
    : Array.from(
        visitQueries
          .flatMap((query, index) =>
            (query.data?.visits ?? []).map((visit) => ({
              visit,
              explorationId: explorationIds[index],
            })),
          )
          .sort(
            (a, b) =>
              new Date(b.visit.visitedAt).getTime() -
              new Date(a.visit.visitedAt).getTime(),
          )
          .reduce((map, entry) => {
            if (!map.has(entry.visit.place.placeId))
              map.set(entry.visit.place.placeId, entry);
            return map;
          }, new Map<number, { visit: TeamVisit; explorationId: string }>())
          .values(),
      );

  const stateSuffix = isEmpty ? "&state=empty" : "";

  /** 완료 카드 썸네일 색을 정하려고, 그 탐험에서 밝힌 장소들의 유형을 모은다. */
  const getVisitedTypes = (explorationId: number): string[] => {
    const index = explorationIds.indexOf(String(explorationId));
    return (visitQueries[index]?.data?.visits ?? []).map(
      (visit) => visit.place.travelMbtiType,
    );
  };

  return (
    <main className="bg-neutral-01 mx-auto min-h-dvh w-full max-w-[430px] pb-[max(40px,env(safe-area-inset-bottom))]">
      <AppHeader showBack showMenu={false} centerLabel="여행 기록" />

      <section className="px-6 pt-6 pb-5">
        <p className="text-primary-08 text-[12px] font-semibold tracking-[0.1em]">
          MY JOURNEY
        </p>
        <h1 className="text-neutral-07 mt-2 text-[28px] leading-[1.2] font-bold tracking-[-0.04em]">
          걸었던 광주를
          <br />
          다시 펼쳐보세요
        </h1>
      </section>

      <nav
        aria-label="여행 기록 분류"
        className="scrollbar-hide border-neutral-03 sticky top-0 z-20 flex overflow-x-auto border-y bg-white/95 px-4 backdrop-blur"
      >
        {TABS.map(({ id, label }) => (
          <Link
            key={id}
            href={`/record?tab=${id}${stateSuffix}`}
            replace
            aria-current={activeTab === id ? "page" : undefined}
            className={`relative flex min-h-13 shrink-0 items-center px-3 text-[13px] font-semibold ${
              activeTab === id ? "text-neutral-07" : "text-neutral-04"
            }`}
          >
            {label}
            {activeTab === id && (
              <span className="bg-primary-08 absolute inset-x-3 bottom-0 h-0.5 rounded-full" />
            )}
          </Link>
        ))}
      </nav>

      {activeTab === "ongoing" && (
        <section className="px-6 pt-6">
          <SectionHeading
            title="진행 중인 코스"
            count={ongoingExplorations.length}
          />
          {isOngoingLoading && (
            <div
              className="mt-4 space-y-4"
              role="status"
              aria-label="여행을 불러오고 있어요"
            >
              {[0, 1].map((key) => (
                <div
                  key={key}
                  className="bg-skeleton-shimmer h-36 rounded-[24px]"
                />
              ))}
            </div>
          )}
          {isOngoingError && (
            <p
              className="text-caution-02 py-10 text-center text-[13px]"
              role="alert"
            >
              여행을 불러오지 못했어요.
            </p>
          )}
          {!isOngoingLoading &&
            !isOngoingError &&
            ongoingExplorations.length === 0 && (
              <EmptyRecordState
                title="아직 탐험 중인 코스가 없습니다"
                description="새 코스를 만들거나 초대받은 코스에서 탐험을 시작해 보세요."
                action="새 코스 만들기"
                href="/places"
              />
            )}
          {!isOngoingLoading &&
            !isOngoingError &&
            ongoingExplorations.length > 0 && (
              <div className="mt-4 space-y-4">
                {ongoingExplorations.map((exploration) => (
                  <Link
                    key={exploration.explorationId}
                    href={`/explore/${exploration.courseId}?stage=ongoing`}
                    className="border-neutral-03 block overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_8px_28px_rgba(20,20,20,0.06)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-primary-04 text-primary-08 rounded-full px-3 py-1.5 text-[11px] font-semibold">
                        탐험 중
                      </span>
                      <ChevronRight className="text-neutral-04 h-4 w-4" />
                    </div>
                    <h2 className="text-neutral-07 mt-5 text-[21px] font-bold">
                      {exploration.courseTitle}
                    </h2>
                    <p className="text-neutral-04 mt-2 text-[13px]">
                      {exploration.completedCoursePlaceCount} /{" "}
                      {exploration.totalCoursePlaceCount} 장소 방문 · 팀원{" "}
                      {exploration.participantCount}명
                    </p>
                    <div className="bg-neutral-02 mt-4 h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary-08 h-full rounded-full"
                        style={{
                          width: `${
                            exploration.totalCoursePlaceCount > 0
                              ? (exploration.completedCoursePlaceCount /
                                  exploration.totalCoursePlaceCount) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-primary-08 mt-4 text-[12px] font-semibold">
                      탐험 지도로 돌아가기
                    </p>
                  </Link>
                ))}
              </div>
            )}
        </section>
      )}

      {activeTab === "completed" && (
        <section className="px-6 pt-6">
          <SectionHeading
            title="완료한 코스"
            count={completedExplorations.length}
          />
          {isCompletedLoading && (
            <div
              className="mt-4 space-y-4"
              role="status"
              aria-label="여행을 불러오고 있어요"
            >
              {[0, 1].map((key) => (
                <div
                  key={key}
                  className="bg-skeleton-shimmer h-44 rounded-[24px]"
                />
              ))}
            </div>
          )}
          {isCompletedError && (
            <p
              className="text-caution-02 py-10 text-center text-[13px]"
              role="alert"
            >
              여행을 불러오지 못했어요.
            </p>
          )}
          {!isCompletedLoading &&
            !isCompletedError &&
            completedExplorations.length === 0 && (
              <EmptyRecordState
                title="아직 완료한 코스가 없습니다"
                description="팀과 함께 코스의 장소를 밝히면 이곳에 평생 보관돼요."
                action={activeExploration ? "탐험 계속 하기" : "여행 시작하기"}
                href={
                  activeExploration
                    ? `/explore/${activeExploration.courseId}/map`
                    : "/places"
                }
                onAction={
                  activeExploration
                    ? () => setExplorationId(activeExploration.explorationId)
                    : undefined
                }
              />
            )}
          {!isCompletedLoading &&
            !isCompletedError &&
            completedExplorations.length > 0 && (
              <div className="mt-4 space-y-4">
                {completedExplorations.map((exploration) => (
                  <Link
                    key={exploration.explorationId}
                    href={`/record/${exploration.explorationId}`}
                    className="border-neutral-03 block overflow-hidden rounded-[24px] border bg-white shadow-[0_8px_28px_rgba(20,20,20,0.06)]"
                  >
                    <div
                      className="relative h-28 overflow-hidden"
                      style={{
                        backgroundImage: getJourneyGradient(
                          getVisitedTypes(exploration.explorationId),
                        ),
                      }}
                    >
                      <span className="absolute top-4 left-4 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold">
                        완주
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="text-neutral-04 text-[12px]">
                        {exploration.completedAt
                          ? formatRecordDate(exploration.completedAt)
                          : ""}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <h2 className="min-w-0 flex-1 truncate text-[20px] font-bold">
                          {exploration.courseTitle}
                        </h2>
                        <ChevronRight className="text-neutral-04 h-4 w-4" />
                      </div>
                      <p className="text-neutral-04 mt-2 text-[12px]">
                        {exploration.participantDisplayNames.join(" · ")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
        </section>
      )}
      {activeTab === "visits" && (
        <section className="px-6 pt-6">
          <SectionHeading title="방문한 장소" count={visitedPlaces.length} />
          {isVisitsLoading && (
            <div
              className="mt-4 grid grid-cols-2 gap-3"
              role="status"
              aria-label="방문한 장소를 불러오고 있어요"
            >
              {[0, 1, 2, 3].map((key) => (
                <div
                  key={key}
                  className="bg-skeleton-shimmer aspect-square rounded-[20px]"
                />
              ))}
            </div>
          )}
          {!isVisitsLoading && isVisitsError && (
            <p
              className="text-caution-02 py-10 text-center text-[13px]"
              role="alert"
            >
              방문한 장소를 불러오지 못했어요.
            </p>
          )}
          {!isVisitsLoading && !isVisitsError && visitedPlaces.length === 0 && (
            <EmptyRecordState
              title="아직 방문한 장소가 없습니다"
              description="장소에서 방문을 인증하면 여기에 모여요."
              action="진행 중 코스 보기"
              href="/record?tab=ongoing"
              replace
            />
          )}
          {!isVisitsLoading && !isVisitsError && visitedPlaces.length > 0 && (
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {visitedPlaces.map(({ visit, explorationId }) => {
                const image =
                  visit.photos[0]?.imageUrl ?? visit.place.thumbnailUrl;
                return (
                  <li key={visit.visitId}>
                    <Link
                      href={`/record/${explorationId}/visit/${visit.visitId}`}
                      className="border-neutral-03 block w-full overflow-hidden rounded-[18px] border bg-white text-left"
                    >
                      <div className="bg-neutral-02 relative h-32 w-full overflow-hidden">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-neutral-04 absolute inset-0 flex items-center justify-center text-[11px]">
                            사진 없음
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-neutral-07 truncate text-[14px] font-semibold">
                          {visit.place.name}
                        </p>
                        <p className="text-neutral-04 mt-1 text-[11px]">
                          {visit.place.category} ·{" "}
                          {formatRecordDate(visit.visitedAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </main>
  );
};

const SectionHeading = ({ title, count }: { title: string; count: number }) => (
  <div className="flex items-end justify-between">
    <h2 className="text-neutral-07 text-[18px] font-bold">{title}</h2>
    <p className="text-neutral-04 text-[12px]">{count}개</p>
  </div>
);

interface EmptyRecordStateProps {
  title: string;
  description: string;
  action: string;
  href: string;
  onAction?: () => void;
  replace?: boolean;
}

const EmptyRecordState = ({
  title,
  description,
  action,
  href,
  onAction,
  replace,
}: EmptyRecordStateProps) => (
  <div className="flex flex-col items-center py-20 text-center">
    <div className="border-primary-08 bg-primary-04 text-primary-08 flex h-16 w-14 -rotate-3 items-center justify-center border-4 border-dashed text-[16px] font-bold">
      光州
    </div>
    <h2 className="text-neutral-07 mt-6 text-[20px] font-bold">{title}</h2>
    <p className="text-neutral-04 mt-2 text-[13px] leading-[1.6]">
      {description}
    </p>
    <Link
      href={href}
      replace={replace}
      onClick={onAction}
      className="bg-neutral-07 text-neutral-01 mt-6 flex min-h-12 w-full items-center justify-center rounded-full px-5 text-[14px] font-semibold"
    >
      {action}
    </Link>
  </div>
);

export default RecordPage;
