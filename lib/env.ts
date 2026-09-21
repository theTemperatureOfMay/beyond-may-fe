// 환경변수를 한 곳에서 검증하고 내보냄
// 값이 없으면 앱 시작 시 명확한 에러로 표출 -> 헤매는 걸 방지

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `환경변수 ${name}가 설정되지 않았습니다. .env.local 파일을 확인하세요.`,
    );
  }
  return value;
}

export const ENV = {
  KAKAO_MAP_KEY: required(
    "NEXT_PUBLIC_KAKAO_MAP_KEY",
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY,
  ),
  SOCKET_URL: required(
    "NEXT_PUBLIC_SOCKET_URL",
    process.env.NEXT_PUBLIC_SOCKET_URL,
  ),
  API_BASE_URL: required(
    "NEXT_PUBLIC_API_BASE_URL",
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ),
};
