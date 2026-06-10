import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Non autorizzato." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    admin: {
      email: admin.profile.email,
      fullName: admin.profile.full_name,
      role: admin.profile.role,
    },
  });
}