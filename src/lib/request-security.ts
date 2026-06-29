import { NextRequest, NextResponse } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

//Conserva i contatori tra richieste gestite dalla stessa istanza server.
const globalRateLimitStore = globalThis as typeof globalThis & {
  __pirellaRateLimitStore?: RateLimitStore;
};

const rateLimitStore =
  globalRateLimitStore.__pirellaRateLimitStore ?? new Map<string, RateLimitEntry>();

globalRateLimitStore.__pirellaRateLimitStore = rateLimitStore;

export function getClientIp(request: NextRequest) {
  //Vercel inserisce l'IP originale nel primo valore di x-forwarded-for.
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function applyRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  //Usa una finestra fissa semplice e prevedibile per ciascuna chiave.
  const now = Date.now();
  const current = rateLimitStore.get(options.key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs;
    rateLimitStore.set(options.key, { count: 1, resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt };
  }

  current.count += 1;

  //Elimina periodicamente i contatori scaduti per contenere la memoria.
  if (rateLimitStore.size > 5_000) {
    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt <= now) rateLimitStore.delete(key);
    }
  }

  return {
    allowed: current.count <= options.limit,
    remaining: Math.max(0, options.limit - current.count),
    resetAt: current.resetAt,
  };
}

export function rateLimitResponse(resetAt: number) {
  //Retry-After indica al client quando potrà riprovare.
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1_000));

  return NextResponse.json(
    { error: "Troppe richieste. Riprova tra qualche minuto." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
      },
    },
  );
}

export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");

  //Alcuni client non-browser non inviano Origin; quelli browser vengono verificati.
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost ?? request.headers.get("host");

    return Boolean(host && originUrl.host === host);
  } catch {
    return false;
  }
}

export function forbiddenOriginResponse() {
  return NextResponse.json(
    { error: "Origine della richiesta non consentita." },
    { status: 403 },
  );
}

export async function readJsonBody<T>(request: NextRequest, maxBytes: number) {
  //Controlla tipo e dimensione dichiarata prima di leggere il body.
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false as const, status: 415, error: "Content-Type non valido." };
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false as const, status: 413, error: "Richiesta troppo grande." };
  }

  const rawBody = await request.text();

  //Ricontrolla i byte reali quando Content-Length manca o non è affidabile.
  if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
    return { ok: false as const, status: 413, error: "Richiesta troppo grande." };
  }

  try {
    return { ok: true as const, value: JSON.parse(rawBody) as T };
  } catch {
    return { ok: false as const, status: 400, error: "Body JSON non valido." };
  }
}
