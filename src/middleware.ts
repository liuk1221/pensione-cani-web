import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAdminPage =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  const isAdminApi = pathname.startsWith("/api/admin");
  //La login deve restare pubblica per poter creare la sessione.
  const isPublicAdminApi = pathname === "/api/admin/login";

  if ((!isAdminPage && !isAdminApi) || isPublicAdminApi) {
    return NextResponse.next();
  }

  //Protegge le modifiche admin da richieste cross-site e body eccessivi.
  if (isAdminApi && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

    if (origin) {
      try {
        if (!host || new URL(origin).host !== host) {
          return NextResponse.json(
            { error: "Origine della richiesta non consentita." },
            { status: 403 },
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Origine della richiesta non consentita." },
          { status: 403 },
        );
      }
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);

    if (Number.isFinite(contentLength) && contentLength > 65_536) {
      return NextResponse.json(
        { error: "Richiesta troppo grande." },
        { status: 413 },
      );
    }
  }

  if (!supabaseUrl || !publishableKey) {
    return new NextResponse("Supabase non configurato.", {
      status: 500,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set(
      "redirectTo",
      pathname + request.nextUrl.search,
    );

    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
