"use client";

import { use, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import SidebarProfileMenu from "@/components/layout/sidebar/SidebarProfileMenu";
import KakaoMap from "@/components/map/Map";
import PlaceDetailSheet from "@/components/place-detail/PlaceDetailSheet";
import Button from "@/components/ui/Button";
import FullPageState from "@/components/ui/FullPageState";
import Modal from "@/components/ui/Modal";
import ExploreHeader from "@/features/explore/components/ExploreHeader";
import LocationSharingModal from "@/features/explore/components/LocationSharingModal";
import TeamBadge from "@/features/explore/components/TeamBadge";
import TeamParticipantsSheet from "@/features/explore/components/TeamParticipantsSheet";
import VisitMap from "@/features/explore/components/VisitMap";
import useGetExplorationStatusQuery from "@/features/explore/hooks/useGetExplorationStatusQuery";
import useGetParticipantsQuery from "@/features/explore/hooks/useGetParticipantsQuery";
import { getCourseMapData } from "@/features/course/utils/courseMapAdapter";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";
import { postJoin, postStart } from "@/services/api/exploration/explorationApi";
import useSessionStore from "@/stores/sessionStore";
import type { CourseDetailResponse, CoursePlace } from "@/types/course";
import type { PlaceDetailResponse } from "@/types/place";

interface ExplorePageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ stage?: string; state?: string }>;
}

export default function ExplorePage({
  params,
  searchParams,
}: ExplorePageProps) {
  const { courseId } = use(params);
  const { stage, state } = use(searchParams);
  const router = useRouter();
  const isLoggedIn = useSessionStore((session) => session.isLoggedIn);
  const setSession = useSessionStore((session) => session.setSession);
  const [hasJoined, setHasJoined] = useState(isLoggedIn);
  const [hasStarted, setHasStarted] = useState(stage === "ongoing");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTeamSheetOpen, setIsTeamSheetOpen] = useState(false);
  const [isLocationSharingOpen, setIsLocationSharingOpen] = useState(true);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [isLeaveExistingOpen, setIsLeaveExistingOpen] = useState(false);

  const {
    data: course,
    isLoading: isCourseLoading,
    isError: isCourseError,
    refetch: refetchCourse,
  } = useGetCourseDetailQuery(courseId);
  const {
    data: exploration,
    isLoading: isExplorationLoading,
    isError: isExplorationError,
    refetch: refetchExploration,
  } = useGetExplorationStatusQuery(courseId);
  const explorationId = exploration?.explorationId;
  const {
    data: participantsData,
    isPending: isParticipantsPending,
    isError: isParticipantsError,
  } = useGetParticipantsQuery(
    explorationId ? String(explorationId) : "",
    explorationId !== undefined && hasJoined,
  );
  const joinMutation = useMutation({ mutationFn: () => postJoin(courseId) });
  const startMutation = useMutation({
    mutationFn: () => postStart(String(explorationId)),
    onSuccess: () => setHasStarted(true),
  });

  if (state === "expired") {
    return (
      <FullPageState
        eyebrow="공유 링크 만료"
        title="초대 링크의 시간이 지났어요"
        description="이 링크는 3일 동안만 참여에 사용할 수 있어요. 코스 만든 사람에게 새 링크를 요청해 주세요."
        actionLabel="홈으로 돌아가기"
        actionHref="/"
      />
    );
  }

  if (state === "duplicate") {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-8 text-center">
        <div className="bg-primary-04 text-primary-08 flex h-16 w-16 items-center justify-center rounded-full text-[26px]" aria-hidden="true">!</div>
        <p className="text-primary-08 mt-6 text-[12px] font-semibold tracking-[0.12em]">ACTIVE JOURNEY</p>
        <h1 className="text-neutral-07 mt-2 text-[24px] font-bold">이미 참여 중인 지도가 있어요</h1>
        <p className="text-neutral-04 mt-3 text-[14px] leading-[1.6]">한 번에 하나의 지도에만 참여할 수 있어요. 새 지도에 참여하려면 기존 지도에서 먼저 나가야 해요.</p>
        <Button variant="solid" size="lg" className="mt-7 w-full" onClick={() => router.push("/explore/course_01J?stage=ongoing")}>기존 지도로 이동</Button>
        <Button size="lg" className="mt-2 w-full" onClick={() => setIsLeaveExistingOpen(true)}>나가고 새 지도 참여</Button>
        <Modal open={isLeaveExistingOpen} onClose={() => setIsLeaveExistingOpen(false)}>
          <h2 className="text-neutral-07 text-left text-[20px] font-semibold">기존 지도에서 나갈까요?</h2>
          <p className="text-neutral-04 mt-2 text-left text-[13px] leading-[1.55]">기존 참여 이력과 방문 기록은 보존되고, 새 지도에 합류합니다.</p>
          <Button variant="solid" size="lg" className="mt-5 w-full" onClick={() => router.replace(`/explore/${courseId}?stage=preview`)}>나가고 새 지도 참여</Button>
          <Button size="lg" className="mt-2 w-full" onClick={() => setIsLeaveExistingOpen(false)}>취소</Button>
        </Modal>
      </main>
    );
  }

  if (state === "timeout") {
    return (
      <FullPageState
        eyebrow="요청 지연"
        title="시간이 오래 걸리고 있어요"
        description="입력한 내용은 유지했어요. 연결 상태를 확인한 뒤 다시 시도해 주세요."
        actionLabel="다시 시도"
        actionHref={`/explore/${courseId}`}
      />
    );
  }

  if (isCourseLoading || isExplorationLoading) {
    return (
      <main
        className="bg-neutral-02 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-8"
        role="status"
      >
        <div className="border-primary-08 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-neutral-05 mt-4 text-[14px]">
          코스와 팀 정보를 확인하고 있어요.
        </p>
      </main>
    );
  }

  if (
    isCourseError ||
    isExplorationError ||
    !course ||
    !exploration ||
    explorationId === undefined
  ) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-8 text-center">
        <div
          className="bg-neutral-02 flex h-16 w-16 items-center justify-center rounded-full text-[24px]"
          aria-hidden="true"
        >
          ⌁
        </div>
        <h1 className="text-neutral-07 mt-5 text-[20px] font-semibold">
          탐험을 불러오지 못했어요
        </h1>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
          연결 상태를 확인한 뒤 다시 시도하거나 홈으로 돌아가 주세요.
        </p>
        <Button
          variant="solid"
          size="lg"
          className="mt-5 w-full"
          onClick={() => {
            void refetchCourse();
            void refetchExploration();
          }}
        >
          탐험 다시 불러오기
        </Button>
        <Button size="lg" className="mt-2 w-full" onClick={() => router.push("/")}>
          홈으로 돌아가기
        </Button>
      </main>
    );
  }

  if (!hasJoined) {
    return (
      <JoinGate
        course={course}
        isJoining={joinMutation.isPending}
        hasError={joinMutation.isError}
        onJoin={(nickname, code) => {
          setSession(nickname, code);
          localStorage.setItem("accessToken", "mock-team-token");
          joinMutation.mutate(undefined, {
            onSuccess: () => setHasJoined(true),
          });
        }}
      />
    );
  }

  const participants = participantsData?.participants ?? [];
  const participantCount =
    participantsData?.participantCount ?? exploration.participantCount;
  const isPreview =
    !hasStarted &&
    (stage === "preview" ||
      (stage !== "ongoing" && exploration.status === "BEFORE"));
  const shouldAskLocationSharing =
    !isPreview &&
    !exploration.currentParticipant.locationSharingEnabled &&
    isLocationSharingOpen;

  const handleStart = (requestLocation: boolean): void => {
    const start = () => startMutation.mutate();
    if (requestLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(start, start, {
        enableHighAccuracy: true,
        timeout: 8000,
      });
      return;
    }
    start();
  };

  return (
    <main className="bg-neutral-02 relative mx-auto h-dvh w-full max-w-[430px] overflow-hidden">
      {isPreview ? (
        <PreExploreView
          course={course}
          isStarting={startMutation.isPending}
          hasStartError={startMutation.isError}
          onStart={handleStart}
        />
      ) : (
        <VisitMap
          explorationId={explorationId}
          places={course.places}
          participants={participants}
          currentRole={exploration.currentParticipant.role}
        />
      )}

      <ExploreHeader
        center={
          <TeamBadge
            participantCount={participantCount}
            onClick={() => setIsTeamSheetOpen(true)}
          />
        }
        onOpenMenu={() => setIsMenuOpen(true)}
        onHome={() => setIsExitOpen(true)}
      />

      {isTeamSheetOpen && (
        <TeamParticipantsSheet
          participantCount={participantCount}
          participants={participants}
          isPending={isParticipantsPending}
          isError={isParticipantsError}
          isOngoing={!isPreview}
          onClose={() => setIsTeamSheetOpen(false)}
        />
      )}

      {shouldAskLocationSharing && (
        <LocationSharingModal
          explorationId={String(explorationId)}
          onClose={() => setIsLocationSharingOpen(false)}
        />
      )}

      <Sidebar open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <SidebarProfileMenu />
      </Sidebar>

      <Modal open={isExitOpen} onClose={() => setIsExitOpen(false)}>
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          {isPreview ? "코스 미리보기를 나갈까요?" : "탐험을 나갈까요?"}
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          {isPreview
            ? "팀 합류 상태는 유지돼요. 내 코스에서 다시 확인할 수 있어요."
            : "지금까지 밝힌 장소는 저장돼요. 내 코스에서 언제든 이어갈 수 있어요."}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => router.replace("/")}
          >
            홈으로 이동
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => setIsExitOpen(false)}
          >
            {isPreview ? "코스 계속 보기" : "탐험 계속하기"}
          </Button>
        </div>
      </Modal>
    </main>
  );
}

interface JoinGateProps {
  course: CourseDetailResponse;
  isJoining: boolean;
  hasError: boolean;
  onJoin: (nickname: string, code: number) => void;
}

const JoinGate = ({ course, isJoining, hasError, onJoin }: JoinGateProps) => {
  const [isReturning, setIsReturning] = useState(false);
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [issuedCode] = useState(37);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const isValid =
    nickname.trim().length > 0 &&
    nickname.trim().length <= 10 &&
    (!isReturning || /^([1-9]|[1-9][0-9])$/.test(code));

  return (
    <main className="bg-neutral-01 mx-auto min-h-dvh w-full max-w-[430px] pb-10">
      <AppHeader backHref="/" showMenu={false} centerLabel="팀 코스 초대" />
      <section className="px-6 pt-8">
        <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
          WALK TOGETHER
        </p>
        <h1 className="text-neutral-07 mt-2 text-[28px] leading-[1.3] font-bold">
          {course.title}에
          <br />
          함께할까요?
        </h1>
        <p className="text-neutral-04 mt-3 text-[14px] leading-[1.6]">
          {course.places.length}곳 · 예상 {Math.ceil(course.summary.estimatedDurationMinutes / 60)}시간
        </p>

        <div className="border-neutral-03 mt-7 grid grid-cols-2 rounded-full border bg-white p-1">
          <button
            type="button"
            aria-pressed={!isReturning}
            onClick={() => setIsReturning(false)}
            className={`min-h-10 rounded-full text-[13px] font-semibold ${!isReturning ? "bg-neutral-07 text-white" : "text-neutral-04"}`}
          >
            처음 왔어요
          </button>
          <button
            type="button"
            aria-pressed={isReturning}
            onClick={() => setIsReturning(true)}
            className={`min-h-10 rounded-full text-[13px] font-semibold ${isReturning ? "bg-neutral-07 text-white" : "text-neutral-04"}`}
          >
            계정이 있어요
          </button>
        </div>

        <label className="text-neutral-07 mt-6 block text-[13px] font-semibold">
          닉네임
          <input
            value={nickname}
            maxLength={10}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="팀에서 사용할 이름"
            className="border-neutral-03 mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-[14px]"
          />
        </label>
        {isReturning && (
          <label className="text-neutral-07 mt-4 block text-[13px] font-semibold">
            식별코드
            <input
              value={code}
              maxLength={2}
              inputMode="numeric"
              onChange={(event) => setCode(event.target.value)}
              placeholder="1~99"
              className="border-neutral-03 mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-[14px]"
            />
          </label>
        )}
        <Button
          variant="solid"
          size="lg"
          className="mt-6 w-full"
          disabled={!isValid}
          isLoading={isJoining}
          onClick={() => {
            if (isReturning) {
              onJoin(nickname.trim(), Number(code));
            } else {
              setIsCodeOpen(true);
            }
          }}
        >
          {isReturning ? "로그인하고 합류" : "닉네임 만들고 합류"}
        </Button>
        {hasError && (
          <p className="text-caution-02 mt-3 text-center text-[12px]" role="alert">
            팀에 합류하지 못했어요. 초대 링크와 입력값을 확인해 주세요.
          </p>
        )}
      </section>

      <Modal open={isCodeOpen} onClose={() => undefined}>
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          당신의 식별코드
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          이 코드를 잃으면 계정을 복구할 수 없어요. 지금 캡처해 두세요.
        </p>
        <p className="border-neutral-03 bg-neutral-02 mt-4 rounded-xl border px-4 py-5 text-center text-[28px] font-bold tracking-[0.18em]">
          {issuedCode}
        </p>
        <Button
          variant="solid"
          size="lg"
          className="mt-5 w-full"
          onClick={() => onJoin(nickname.trim(), issuedCode)}
        >
          확인하고 팀 합류
        </Button>
      </Modal>
    </main>
  );
};

interface PreExploreViewProps {
  course: CourseDetailResponse;
  isStarting: boolean;
  hasStartError: boolean;
  onStart: (requestLocation: boolean) => void;
}

const PreExploreView = ({
  course,
  isStarting,
  hasStartError,
  onStart,
}: PreExploreViewProps) => {
  const [isListOpen, setIsListOpen] = useState(false);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<CoursePlace | null>(null);
  const { center, markers, route } = getCourseMapData(course.places);
  const placeDetail: PlaceDetailResponse | null = selectedPlace
    ? {
        placeId: Number(selectedPlace.placeId),
        name: selectedPlace.name,
        category: selectedPlace.category,
        travelMbtiType: selectedPlace.curatedType ?? "thinker",
        tags: selectedPlace.summary ? [selectedPlace.summary] : [],
        address: selectedPlace.address,
        latitude: selectedPlace.location.lat,
        longitude: selectedPlace.location.lng,
        businessHours: null,
        description:
          selectedPlace.summary ?? "상세 설명 정보 없음",
        thumbnailUrl: selectedPlace.thumbnailUrl || null,
      }
    : null;

  const openPlace = (placeId: string): void => {
    setIsListOpen(false);
    setSelectedPlace(
      course.places.find((place) => place.placeId === placeId) ?? null,
    );
  };

  return (
    <div className="relative h-full w-full">
      {hasMapError ? (
        <section className="h-full overflow-y-auto px-6 pt-24 pb-60">
          <h1 className="text-neutral-07 text-[22px] font-bold">
            지도 대신 코스 목록을 보여드려요
          </h1>
          <ol className="mt-5 space-y-2">
            {course.places.map((place) => (
              <li key={place.placeId}>
                <button
                  type="button"
                  onClick={() => openPlace(place.placeId)}
                  className="border-neutral-03 min-h-14 w-full rounded-2xl border bg-white px-4 text-left text-[14px] font-semibold"
                >
                  {place.order}. {place.name}
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <KakaoMap
          center={center}
          markers={markers}
          route={route}
          onMarkerClick={openPlace}
          onError={() => setHasMapError(true)}
        />
      )}

      <section className="absolute inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-30 rounded-[24px] bg-white p-5 shadow-[0_14px_42px_rgba(0,0,0,0.2)]">
        <p className="text-primary-08 text-[11px] font-semibold tracking-[0.1em]">
          EXPLORATION PREVIEW
        </p>
        <h1 className="text-neutral-07 mt-2 truncate text-[21px] font-bold">
          {course.title}
        </h1>
        <p className="text-neutral-04 mt-1 text-[12px]">
          {course.places.length}곳 · 예상 {Math.ceil(course.summary.estimatedDurationMinutes / 60)}시간
        </p>
        <div className="mt-4 flex gap-2">
          <Button size="lg" className="flex-1" onClick={() => setIsListOpen(true)}>
            전체 목록 보기
          </Button>
          <Button
            variant="solid"
            size="lg"
            className="flex-1"
            onClick={() => setIsStartOpen(true)}
          >
            탐험 시작
          </Button>
        </div>
      </section>

      <Modal open={isListOpen} onClose={() => setIsListOpen(false)} className="max-h-[80dvh] overflow-y-auto">
        <h2 className="text-neutral-07 text-[20px] font-semibold">전체 코스</h2>
        <ol className="mt-4 space-y-2">
          {course.places.map((place) => (
            <li key={place.placeId}>
              <button
                type="button"
                onClick={() => openPlace(place.placeId)}
                className="border-neutral-03 flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3 text-left"
              >
                <span className="bg-neutral-07 text-neutral-01 flex h-8 w-8 items-center justify-center rounded-full text-[12px]">{place.order}</span>
                <span className="min-w-0 flex-1">
                  <span className="text-neutral-07 block truncate text-[13px] font-semibold">{place.name}</span>
                  <span className="text-neutral-04 text-[11px]">{place.estimatedArrivalTime} 도착 예정</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Modal>

      {placeDetail && (
        <div className="fixed inset-0 z-60">
          <div className="bg-neutral-07/35 absolute inset-0" onClick={() => setSelectedPlace(null)} aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[430px]">
            <PlaceDetailSheet
              place={placeDetail}
              onClose={() => setSelectedPlace(null)}
              footer={<Button size="lg" className="w-full" onClick={() => setSelectedPlace(null)}>정보 확인 완료</Button>}
            />
          </div>
        </div>
      )}

      <Modal open={isStartOpen} onClose={() => setIsStartOpen(false)}>
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          현재 위치를 사용하시겠어요?
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          허용하면 방문 인증과 주변 추천을 사용할 수 있어요. 거부해도 코스는
          볼 수 있습니다.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button variant="solid" size="lg" className="w-full" isLoading={isStarting} onClick={() => onStart(true)}>
            위치 허용하고 시작
          </Button>
          <Button size="lg" className="w-full" disabled={isStarting} onClick={() => onStart(false)}>
            제한된 기능으로 시작
          </Button>
        </div>
        {hasStartError && <p className="text-caution-02 mt-3 text-center text-[12px]" role="alert">탐험을 시작하지 못했어요. 다시 시도해 주세요.</p>}
      </Modal>
    </div>
  );
};
