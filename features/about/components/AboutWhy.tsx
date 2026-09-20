import AboutEyebrow from "@/features/about/components/AboutEyebrow";
import AboutReveal from "@/features/about/components/AboutReveal";
import AboutScrollText from "@/features/about/components/AboutScrollText";

const WHY_STORY =
  "광주는 오랫동안 특정한 기억과 5월이라는 시간으로 불려 왔어요. 그 기억은 지금도 이 도시의 깊은 뿌리예요. 그리고 그 너머에는 골목의 맛과 전시장의 불빛, 오래된 길과 사람들의 오늘이 있어요.";

const WHY_CLOSING =
  "‘너머’는 5월을 지나쳐 가자는 말이 아니에요. 5월을 품은 채, 그 너머의 오늘까지 걸어가 보자는 뜻이에요.";

/**
 * SECTION 02. WHY — 왜 ‘너머’인가.
 * 역사적 의미를 지우지 않으면서, 그 너머에 있는 현재의 광주를 발견하겠다는 방향.
 * 문단은 스크롤에 맞춰 단어가 하나씩 또렷해진다.
 */
const AboutWhy = () => (
  <section className="bg-neutral-01 text-neutral-07 px-6 py-32">
    <AboutReveal>
      <AboutEyebrow index="02" label="WHY" className="text-primary-08" />
      <h2 className="mt-6 text-[40px] leading-[1.2] font-bold tracking-[-0.04em] break-keep">
        광주를 하나의
        <br />
        계절에 가두지
        <br />
        않도록.
      </h2>
    </AboutReveal>

    <AboutScrollText
      text={WHY_STORY}
      className="mt-16 text-[22px] leading-[1.6] font-medium tracking-[-0.02em] break-keep"
    />

    <AboutReveal className="mt-14">
      <p className="text-neutral-04 border-neutral-03 border-l-2 pl-4 text-[15px] leading-[1.7] break-keep">
        {WHY_CLOSING}
      </p>
    </AboutReveal>
  </section>
);

export default AboutWhy;
