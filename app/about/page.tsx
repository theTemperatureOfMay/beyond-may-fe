import AboutCredits from "@/features/about/components/AboutCredits";
import AboutStory from "@/features/about/components/AboutStory";

/**
 * 서비스 소개(ABOUT) 화면.
 * 사이드바 "서비스 소개" 링크의 진입점. 기능 목록이 아니라
 * "광주는 5월에만 존재하는 도시가 아니다 / 사람마다 발견하는 광주는 다르다"를
 * 중심으로 스크롤하며 읽는 브랜드 스토리로 구성한다.
 * 맨 아래에는 공공저작물 이미지 출처를 표시한다.
 *
 * overflow-x-clip은 가로 넘침만 잘라내고 스크롤 컨테이너를 만들지 않으므로
 * 내부 섹션의 position: sticky가 그대로 동작한다.
 */
const AboutPage = () => (
  <main className="bg-neutral-01 mx-auto w-full max-w-[430px] overflow-x-clip">
    <AboutStory />
    <AboutCredits />
  </main>
);

export default AboutPage;
