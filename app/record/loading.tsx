import AppHeader from "@/components/layout/AppHeader";

const RecordLoading = () => (
  <main
    className="bg-neutral-01 mx-auto min-h-dvh w-full max-w-[430px] animate-pulse"
    aria-busy="true"
    aria-label="여행 기록을 불러오는 중"
  >
    <AppHeader showMenu={false} centerLabel="여행 기록" />
    <section className="px-6 pt-7">
      <div className="bg-neutral-02 h-3 w-24 rounded-full" />
      <div className="bg-neutral-02 mt-4 h-9 w-56 rounded-lg" />
      <div className="bg-neutral-02 mt-2 h-9 w-44 rounded-lg" />
      <div className="bg-neutral-02 mt-5 h-4 w-64 rounded-full" />
      <div className="bg-neutral-02 mt-12 h-[330px] rounded-[24px]" />
    </section>
  </main>
);

export default RecordLoading;
