import { useMutation } from "@tanstack/react-query";

import { postCourseGeneration } from "@/services/api/course/courseApi";
import type {
  GenerateCourseRequest,
  GenerateCourseResponse,
} from "@/types/course";

const useGenerateCourseMutation = () =>
  useMutation<GenerateCourseResponse, Error, GenerateCourseRequest>({
    mutationFn: postCourseGeneration,
  });

export default useGenerateCourseMutation;
