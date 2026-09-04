import { http, HttpResponse, delay } from "msw";
import type { ExplorationStatusResponse } from "@/types/exploration";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const MOCK_STATUS: ExplorationStatusResponse = {
  explorationId: 44,
  courseId: 31,
  status: "ONGOING",
  startedByParticipantId: 70,
  startedAt: "2026-08-15T10:00:00+09:00",
  completedAt: null,
  participantCount: 4,
  teamVisitedPlaceCount: 3,
  courseProgress: {
    completedCoursePlaceCount: 2,
    totalCoursePlaceCount: 5,
    completionRate: 40,
  },
  currentParticipant: {
    participantId: 72,
    role: "MEMBER",
    status: "ACTIVE",
    locationSharingEnabled: false,
  },
};

export const explorationStatusHandlers = [
  http.get(`${BASE_URL}/api/v1/explorations/:explorationId`, async ({ params }) => {
    await delay(300);
    const isDraftCourse = String(params.explorationId).startsWith("course_draft");
    return HttpResponse.json({
      message: "성공입니다.",
      code: "COMMON200",
      data: isDraftCourse
        ? {
            ...MOCK_STATUS,
            status: "BEFORE",
            startedByParticipantId: null,
            startedAt: null,
            currentParticipant: {
              ...MOCK_STATUS.currentParticipant,
              role: "OWNER",
            },
          }
        : MOCK_STATUS,
      success: true,
    });
  }),
];
