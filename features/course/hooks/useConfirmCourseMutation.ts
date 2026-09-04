import { useMutation } from "@tanstack/react-query";

import { postCourseConfirm } from "@/services/api/course/courseApi";
import type { ConfirmCourseResponse } from "@/types/course";

const useConfirmCourseMutation = () =>
  useMutation<ConfirmCourseResponse, Error, string>({
    mutationFn: postCourseConfirm,
  });

export default useConfirmCourseMutation;
