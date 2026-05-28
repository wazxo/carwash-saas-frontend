type TokenPayload = {
  accessToken: string;
  refreshToken: string;
};

type TwoFactorPayload = {
  requiresTwoFactor: true;
  tempToken: string;
  message?: string;
};

type Wrapped<T> = {
  data?: T;
};

export function unwrapAuthPayload<T extends TokenPayload | TwoFactorPayload>(
  payload: T | Wrapped<T>
): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    payload.data &&
    typeof payload.data === "object"
  ) {
    return payload.data;
  }

  return payload as T;
}

export function assertTokenPayload(payload: unknown): asserts payload is TokenPayload {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("accessToken" in payload) ||
    !("refreshToken" in payload) ||
    typeof (payload as { accessToken?: unknown }).accessToken !== "string" ||
    typeof (payload as { refreshToken?: unknown }).refreshToken !== "string"
  ) {
    throw new Error("Authentication response did not include valid tokens");
  }
}
