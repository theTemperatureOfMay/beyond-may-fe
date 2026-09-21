interface AboutMapBackdropProps {
  /** 선 색을 정하는 text-* 클래스 (stroke가 currentColor를 따른다) */
  className?: string;
}

/** 지도 연출 뒤에 깔리는 도시 격자 일러스트. SVG 안에서 <g>로 쓴다. */
const AboutMapBackdrop = ({ className }: AboutMapBackdropProps) => (
  <g
    className={className}
    stroke="currentColor"
    strokeWidth={1}
    fill="none"
    aria-hidden="true"
  >
    <path d="M0 90H320" />
    <path d="M0 200H320" />
    <path d="M0 310H320" />
    <path d="M80 0V400" />
    <path d="M190 0V400" />
    <path d="M270 0V400" />
    <path d="M0 380L320 20" />
    <path d="M0 150L200 400" />
  </g>
);

export default AboutMapBackdrop;
