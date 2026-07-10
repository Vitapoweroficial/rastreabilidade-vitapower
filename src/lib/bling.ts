import { db } from "@/lib/db";

export const BLING_API_BASE = "https://api.bling.com.br/Api/v3";
const BLING_AUTH_URL = "https://www.bling.com.br/Api/v3/oauth/authorize";
const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";

type TokenRow = { id: number; access_token: string; refresh_token: string | null; expires_at: string; created_at: string; updated_at: string };

export function getBlingConfig() {
  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;
  const redirectUri = process.env.BLING_REDIRECT_URI ?? "http://localhost:3000/api/auth/bling/callback";
  if (!clientId || !clientSecret) throw new Error("Configure BLING_CLIENT_ID e BLING_CLIENT_SECRET no .env.local.");
  return { clientId, clientSecret, redirectUri };
}

export function getBlingAuthorizationUrl() {
  const { clientId, redirectUri } = getBlingConfig();
  const params = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri, state: "vita-power-workspace" });
  return `${BLING_AUTH_URL}?${params.toString()}`;
}

function saveTokens(data: { access_token: string; refresh_token?: string; expires_in?: number }) {
  const expiresAt = new Date(Date.now() + ((data.expires_in ?? 3600) - 60) * 1000).toISOString();
  db.prepare(`INSERT INTO bling_oauth_tokens (id, access_token, refresh_token, expires_at, updated_at)
    VALUES (1, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET access_token=excluded.access_token, refresh_token=COALESCE(excluded.refresh_token, bling_oauth_tokens.refresh_token), expires_at=excluded.expires_at, updated_at=datetime('now')`)
    .run(data.access_token, data.refresh_token ?? null, expiresAt);
}

export function getBlingToken() { return db.prepare("SELECT * FROM bling_oauth_tokens WHERE id = 1").get() as TokenRow | undefined; }
export function isBlingConnected() { const t = getBlingToken(); return Boolean(t?.access_token); }

async function tokenRequest(body: URLSearchParams) {
  const { clientId, clientSecret } = getBlingConfig();
  const res = await fetch(BLING_TOKEN_URL, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.description || data?.error_description || "Falha ao autenticar no Bling.");
  saveTokens(data);
}

export async function exchangeBlingCode(code: string) {
  const { redirectUri } = getBlingConfig();
  await tokenRequest(new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }));
}

async function getValidAccessToken() {
  const token = getBlingToken();
  if (!token) throw new Error("Bling ainda não conectado. Acesse /test/bling e autentique.");
  if (new Date(token.expires_at).getTime() > Date.now()) return token.access_token;
  if (!token.refresh_token) throw new Error("Token expirado e sem refresh token. Reconecte o Bling em /test/bling.");
  await tokenRequest(new URLSearchParams({ grant_type: "refresh_token", refresh_token: token.refresh_token }));
  const refreshed = getBlingToken();
  if (!refreshed) throw new Error("Não foi possível renovar o token do Bling.");
  return refreshed.access_token;
}

export async function blingGet(path: string, params?: Record<string, string | number | undefined>) {
  const accessToken = await getValidAccessToken();
  const url = new URL(`${BLING_API_BASE}${path}`);
  Object.entries(params ?? {}).forEach(([k, v]) => { if (v !== undefined && v !== "") url.searchParams.set(k, String(v)); });
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.description || data?.message || `Erro ${res.status} ao consultar Bling.`);
  return data;
}
