import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  applyRateLimit,
  forbiddenOriginResponse,
  getClientIp,
  isSameOriginRequest,
  rateLimitResponse,
  readJsonBody,
} from "@/lib/request-security";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

const LOGIN_WINDOW_MS = 15 * 60 * 1_000;

export async function POST(request: NextRequest) {
  //La login accetta solo richieste provenienti dal sito stesso.
  if (!isSameOriginRequest(request)) return forbiddenOriginResponse();

  const ip = getClientIp(request);
  //Il limite per IP frena attacchi distribuiti su più account.
  const ipLimit = applyRateLimit({
    key: `admin-login:ip:${ip}`,
    limit: 20,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.resetAt);

  const parsedBody = await readJsonBody<LoginBody>(request, 4_096);

  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.error },
      { status: parsedBody.status },
    );
  }

  const email =
    typeof parsedBody.value.email === "string"
      ? parsedBody.value.email.trim().toLowerCase()
      : "";
  const password =
    typeof parsedBody.value.password === "string"
      ? parsedBody.value.password
      : "";

  if (!email || email.length > 254 || !password || password.length > 256) {
    return NextResponse.json(
      { error: "Credenziali non valide." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  //Il limite più stretto per IP+email rallenta il brute force mirato.
  const accountLimit = applyRateLimit({
    key: `admin-login:account:${ip}:${email}`,
    limit: 5,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!accountLimit.allowed) return rateLimitResponse(accountLimit.resetAt);

  //L'autenticazione server-side consente di applicare i controlli precedenti.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: "Credenziali non valide." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  //Una sessione valida non basta: il profilo deve avere il ruolo admin.
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Credenziali non valide." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
