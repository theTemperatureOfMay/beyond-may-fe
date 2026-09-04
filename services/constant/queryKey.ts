export const QUERY_KEYS = {
  PREFERENCE: {
    ALL: ["preference"] as const,
    QUESTIONS: () => [...QUERY_KEYS.PREFERENCE.ALL, "questions"] as const,
    RESULT: (userId: number) =>
      [...QUERY_KEYS.PREFERENCE.ALL, "result", userId] as const,
  },
  COURSE: {
    ALL: ["course"] as const,
    LIST: () => [...QUERY_KEYS.COURSE.ALL, "list"] as const,
    DETAIL: (courseId: string) =>
      [...QUERY_KEYS.COURSE.ALL, "detail", courseId] as const,
  },
  PLACE: {
    ALL: ["place"] as const,
    DETAIL: (placeId: number) =>
      [...QUERY_KEYS.PLACE.ALL, "detail", placeId] as const,
    RECOMMENDATIONS: () =>
      [...QUERY_KEYS.PLACE.ALL, "recommendations"] as const,
  },
  EXPLORATION: {
    ALL: ["exploration"] as const,
    PARTICIPANTS: (explorationId: string) =>
      [...QUERY_KEYS.EXPLORATION.ALL, "participants", explorationId] as const,
    LIST: (status: "ONGOING" | "COMPLETED") =>
      [...QUERY_KEYS.EXPLORATION.ALL, "list", status] as const,
    STATUS: (explorationId: string) =>
      [...QUERY_KEYS.EXPLORATION.ALL, "status", explorationId] as const,
  },
} as const;
