import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

type AdminLoginPageProps = {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirectTo?.startsWith("/admin")
    ? params.redirectTo
    : "/admin";

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
          Area admin
        </p>

        <h1 className="text-3xl font-bold text-slate-950">Accesso admin</h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Inserisci le credenziali amministratore per gestire prenotazioni,
          disponibilità e contenuti del sito.
        </p>

        <div className="mt-8">
          <AdminLoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </section>
  );
}