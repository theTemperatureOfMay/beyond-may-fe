import type { PreferenceType } from "@/types/preference";

/**
 * ABOUT 페이지 콘텐츠 상수.
 *
 * 색은 globals.css의 --color-theme-* 토큰을 Tailwind 클래스로 참조한다.
 * (클래스로 참조하지 않는 CSS 변수는 빌드에서 제거되므로, 클래스 문자열은 반드시
 * 리터럴로 적는다.)
 * 사진·캐릭터 경로는 이곳 한 곳에서만 관리해 이미지 교체가 쉽도록 한다.
 */
interface AboutTypeStory {
  /** 짧은 이름 (예술) */
  label: string;
  /** 유형 이름 (예술러) */
  name: string;
  /** DISCOVER 섹션 설명 */
  discoverDescription: string;
  /** MY GWANGJU 섹션 문장 */
  myGwangjuLine: string;
  myGwangjuSubLine: string;
  /** 유형색 배경 + 그 위에서 읽히는 글자색 */
  panelClass: string;
  /** SVG fill-current / stroke-current 에 쓰는 유형 대표색 */
  dotClass: string;
  /** 유형색 위에 올라가는 숫자·아이콘 색 (SVG fill) */
  onDotFillClass: string;
  /** 장소 사진 (캐릭터가 합성된 결과 화면 사진) */
  photo: string;
  /** 투명 배경 오매나 캐릭터 */
  character: string;
  /**
   * MY GWANGJU 패널에서 캐릭터 폭(Tailwind w-*). 예술·미식은 가로로 넓고 사색·기억은
   * 세로로 길어, 같은 폭을 주면 넓은 쪽이 작아 보이므로 성향마다 눈에 보이는 크기를 맞춘다.
   */
  myGwangjuCharacterWidthClass: string;
}

export const ABOUT_TYPE_STORY: Record<PreferenceType, AboutTypeStory> = {
  THINKER: {
    label: "사색",
    name: "사색러",
    discoverDescription: "잠시 걸음을 늦추고 도시를 바라볼 수 있는 공간",
    myGwangjuLine: "사색을 좋아하는 사람에게는 천천히 걸을 수 있는 장소를.",
    myGwangjuSubLine: "오래 머물수록 깊어지는 광주",
    panelClass: "bg-theme-purple-01 text-white",
    dotClass: "text-theme-purple-01",
    onDotFillClass: "fill-white",
    photo: "/images/thinker.png",
    character: "/images/omaena/thinker-magnifier.png",
    myGwangjuCharacterWidthClass: "w-[52%]",
  },
  FOODIE: {
    label: "미식",
    name: "미식러",
    discoverDescription: "광주에서만 만날 수 있는 음식과 로컬 맛집",
    myGwangjuLine: "미식을 좋아하는 사람에게는 광주의 맛을.",
    myGwangjuSubLine: "골목마다 다른 한 끼의 광주",
    panelClass: "bg-theme-orange-01 text-neutral-07",
    dotClass: "text-theme-orange-01",
    onDotFillClass: "fill-neutral-07",
    photo: "/images/foodie.png",
    character: "/images/omaena/foodie-spoon.png",
    myGwangjuCharacterWidthClass: "w-[70%]",
  },
  ARTIST: {
    label: "예술",
    name: "예술러",
    discoverDescription: "도시 곳곳에서 만나는 예술과 창작의 공간",
    myGwangjuLine: "예술을 좋아하는 사람에게는 예술이 머무는 공간을.",
    myGwangjuSubLine: "색과 결을 눈에 담는 광주",
    panelClass: "bg-theme-green-02 text-neutral-07",
    dotClass: "text-theme-green-02",
    onDotFillClass: "fill-neutral-07",
    photo: "/images/artist.png",
    character: "/images/omaena/artist-palette.png",
    myGwangjuCharacterWidthClass: "w-[74%]",
  },
  REMEMBERER: {
    label: "기억",
    name: "기억러",
    discoverDescription: "도시의 역사와 이야기를 담은 장소",
    myGwangjuLine: "기억을 따라가고 싶은 사람에게는 도시의 이야기를.",
    myGwangjuSubLine: "장소에 남은 시간을 걷는 광주",
    panelClass: "bg-theme-blue-02 text-white",
    dotClass: "text-theme-blue-02",
    onDotFillClass: "fill-white",
    photo: "/images/remember.png",
    character: "/images/omaena/remember-candle.png",
    myGwangjuCharacterWidthClass: "w-[52%]",
  },
};

/** WALK 섹션 지도 위를 걷는 오매나 캐릭터. 고른 성향과 상관없이 항상 같은 캐릭터다. */
export const ABOUT_WALK_CHARACTER = "/images/omaena/thinker-backpack.png";

/** DISCOVER 섹션: 예술 → 미식 → 기억 → 사색 */
export const ABOUT_DISCOVER_ORDER: PreferenceType[] = [
  "ARTIST",
  "FOODIE",
  "REMEMBERER",
  "THINKER",
];

/** MY GWANGJU 섹션 탭 순서: 사색 → 미식 → 예술 → 기억 */
export const ABOUT_MY_GWANGJU_ORDER: PreferenceType[] = [
  "THINKER",
  "FOODIE",
  "ARTIST",
  "REMEMBERER",
];

/** CHOOSE 섹션 스와이프 데모 카드. 사진은 저장소에 있는 광주 장소 사진을 쓴다. */
export const ABOUT_CHOOSE_DECK: { id: string; label: string; photo: string }[] =
  [
    { id: "artist", label: "예술", photo: "/images/artist.png" },
    { id: "foodie", label: "미식", photo: "/images/foodie.png" },
    { id: "remember", label: "기억", photo: "/images/remember.png" },
    { id: "thinker", label: "사색", photo: "/images/thinker.png" },
  ];

/** TOGETHER 섹션에서 순서대로 뜨는 팀 진행 알림 */
export const ABOUT_TOGETHER_TOASTS: { type: PreferenceType; text: string }[] = [
  { type: "ARTIST", text: "예술러가 첫 번째 장소를 밝혔어요" },
  { type: "FOODIE", text: "미식러가 두 번째 장소에 도착했어요" },
  { type: "REMEMBERER", text: "기억러가 세 번째 장소를 밝혔어요" },
  { type: "THINKER", text: "사색러가 네 번째 장소로 향하고 있어요" },
];
