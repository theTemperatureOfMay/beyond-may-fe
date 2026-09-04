import type { CoursePlace } from "@/types/course";

/** 한 장소를 한 칸 이동하고 화면·저장에 쓰는 order를 다시 매긴다. */
export const moveCoursePlace = (
  places: CoursePlace[],
  index: number,
  direction: -1 | 1,
): CoursePlace[] => {
  const destination = index + direction;
  if (destination < 0 || destination >= places.length) return places;

  const reordered = [...places];
  const [place] = reordered.splice(index, 1);
  if (!place) return places;
  reordered.splice(destination, 0, place);
  return reordered.map((item, itemIndex) => ({
    ...item,
    order: itemIndex + 1,
  }));
};
