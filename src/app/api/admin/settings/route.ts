import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("id, total_boxes, business_email, notification_email")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Settings fetch error:", error);

    return NextResponse.json(
      { error: "Errore durante il caricamento impostazioni." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    settings: data,
  });
}

export async function PATCH(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  let body: {
    totalBoxes?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido." }, { status: 400 });
  }

  const totalBoxes = Number(body.totalBoxes);

  if (!Number.isInteger(totalBoxes) || totalBoxes < 0) {
    return NextResponse.json(
      { error: "Numero box non valido." },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .update({
      total_boxes: totalBoxes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select("id, total_boxes")
    .single();

  if (error) {
    console.error("Settings update error:", error);

    return NextResponse.json(
      { error: "Errore durante l’aggiornamento impostazioni." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    settings: data,
  });
}