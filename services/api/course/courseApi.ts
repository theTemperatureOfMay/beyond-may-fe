import { API_ENDPOINTS } from "@/services/constant/endpoint";
import { api } from "@/services/lib/axios";
import type {
  ConfirmCourseResponse,
  CourseDetailResponse,
  CourseListResponse,
  GenerateCourseRequest,
  GenerateCourseResponse,
  RefineCourseRequest,
  UpdateCourseRequest,
} from "@/types/course";

/** 로그인 사용자의 초안·진행·완료 코스를 조회한다. */
export const getCourses = async (): Promise<CourseListResponse> => {
  const response = await api.get<CourseListResponse>(API_ENDPOINTS.course.list);
  return response.data!;
};

/** 초안 코스를 확정해 탐험에 사용할 수 있게 한다. */
export const postCourseConfirm = async (
  courseId: string,
): Promise<ConfirmCourseResponse> => {
  const response = await api.post<ConfirmCourseResponse>(
    API_ENDPOINTS.course.confirm(courseId),
  );
  return response.data!;
};

/** 선택한 장소를 이동 순서에 맞춘 초안 코스로 생성한다. */
export const postCourseGeneration = async (
  body: GenerateCourseRequest,
): Promise<GenerateCourseResponse> => {
  const response = await api.post<GenerateCourseResponse>(
    API_ENDPOINTS.course.aiGeneration,
    body,
  );
  return response.data!;
};

/**
 * 확정된 코스 상세를 조회한다.
 * 팀 탐험 지도·공유 링크 진입·여행 기록 복귀 화면에서 사용된다.
 */
export const getCourseDetail = async (
  courseId: string,
): Promise<CourseDetailResponse> => {
  const response = await api.get<CourseDetailResponse>(
    API_ENDPOINTS.course.detail(courseId),
  );
  return response.data!;
};

/** 자연어 요청으로 코스 순서를 다시 추천받는다. */
export const postCourseRefine = async (
  courseId: string,
  body: RefineCourseRequest,
): Promise<CourseDetailResponse> => {
  const response = await api.post<CourseDetailResponse>(
    API_ENDPOINTS.course.refine(courseId),
    body,
  );
  return response.data!;
};

/** 코스명과 장소 순서를 직접 저장한다. */
export const patchCourse = async (
  courseId: string,
  body: UpdateCourseRequest,
): Promise<CourseDetailResponse> => {
  const response = await api.patch<CourseDetailResponse>(
    API_ENDPOINTS.course.detail(courseId),
    body,
  );
  return response.data!;
};
