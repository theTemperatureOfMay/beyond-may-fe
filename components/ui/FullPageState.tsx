import Link from "next/link";

import Button from "@/components/ui/Button";

interface FullPageStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const FullPageState = ({
  eyebrow = "5월 너머의 광주",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: FullPageStateProps) => (
  <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-8 text-center">
    <div
      className="border-primary-08 bg-primary-04 text-primary-08 flex h-16 w-16 -rotate-3 items-center justify-center rounded-2xl border-2 border-dashed text-[18px] font-bold"
      aria-hidden="true"
    >
      光州
    </div>
    <p className="text-primary-08 mt-6 text-[12px] font-semibold tracking-[0.12em]">
      {eyebrow}
    </p>
    <h1 className="text-neutral-07 mt-2 text-[24px] font-bold">{title}</h1>
    <p className="text-neutral-04 mt-3 text-[14px] leading-[1.6]">
      {description}
    </p>
    {actionLabel && actionHref && (
      <Link
        href={actionHref}
        className="bg-neutral-07 text-neutral-01 focus-visible:outline-primary-03 mt-7 flex min-h-12 w-full items-center justify-center rounded-full px-5 text-[15px] font-medium"
      >
        {actionLabel}
      </Link>
    )}
    {actionLabel && onAction && (
      <Button
        variant="solid"
        size="lg"
        className="mt-7 w-full"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    )}
  </main>
);

export default FullPageState;
