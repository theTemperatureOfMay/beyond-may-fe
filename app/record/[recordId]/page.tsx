"use client";

import { use } from "react";

import RecordDetail from "@/features/record/components/RecordDetail";
import useGetExplorationsQuery from "@/features/explore/hooks/useGetExplorationsQuery";
import useGetTeamVisitsQuery from "@/features/record/hooks/useGetTeamVisitsQuery";
import useGetExplorationVisitedPlacesQuery from "@/features/explore/hooks/useGetExplorationVisitedPlacesQuery";
import type { TravelRecord } from "@/features/record/mockRecords";

interface RecordDetailPageProps {
  params: Promise<{ recordId: string }>;
}

/** 여행 기록 상세 (완료된 탐험). recordId = explorationId. */
const RecordDetailPage = ({ params }: RecordDetailPageProps) => {
  const { recordId } = use(params);
  const { data: visitedData } = useGetExplorationVisitedPlacesQuery(recordId);

  const { data: completedData, isLoading: isSummaryLoading } =
    useGetExplorationsQuery("COMPLETED");
  const { data: visitsData, isLoading: isVisitsLoading } =
    useGetTeamVisitsQuery(recordId);

  const summary = completedData?.explorations.find(
    (exploration) => String(exploration.explorationId) === recordId,
  );
  const visits = [...(visitsData?.visits ?? [])].sort(
    (a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime(),
  );

  if (isSummaryLoading || isVisitsLoading) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center">
        <p className="text-neutral-04 text-[14px]">
          여행 기록을 불러오고 있어요…
        </p>
      </main>
    );
  }

  if (!summary || !summary.startedAt) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center px-8 text-center">
        <p className="text-neutral-04 text-[14px]">
          여행 기록을 찾을 수 없어요.
        </p>
      </main>
    );
  }

  const elapsedMinutes =
    summary.completedAt && summary.startedAt
      ? Math.max(
          0,
          Math.round(
            (new Date(summary.completedAt).getTime() -
              new Date(summary.startedAt).getTime()) /
              60000,
          ),
        )
      : 0;

  const record: TravelRecord = {
    recordId,
    explorationId: recordId,
    title: summary.courseTitle,
    description: "",
    startedAt: summary.startedAt,
    completedAt: summary.completedAt ?? summary.startedAt,
    elapsedMinutes,
    distanceMeters: 0,
    companionNames: summary.participantDisplayNames,
    places: visits.map((visit) => ({
      placeId: String(visit.place.placeId),
      name: visit.place.name,
      summary: visit.place.category,
      visitedAt: visit.visitedAt,
      travelMbtiType: visit.place.travelMbtiType,
    })),
  };

  return (
    <RecordDetail
      record={record}
      visitedPlaces={visitedData?.visitedPlaces ?? []}
    />
  );
};

export default RecordDetailPage;
