import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { id } = await context.params;

  const { error } = await supabaseAdmin
    .from("availability_overrides")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Availability override delete error:", error);

    return NextResponse.json(
      { error: "Errore durante l’eliminazione del blocco manuale." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}