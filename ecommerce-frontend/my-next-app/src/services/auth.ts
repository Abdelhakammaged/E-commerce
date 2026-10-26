import api from "@/lib/api";
import { setTokens } from "@/lib/cookies";

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/login", payload);
  setTokens(data.accessToken, data.refreshToken);
  return data;
}
