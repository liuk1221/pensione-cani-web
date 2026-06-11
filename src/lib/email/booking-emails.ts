import { Resend } from "resend";
import { fromDateKey } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";

type BookingEmailStatus = "received" | "confirmed" | "rejected" | "completed";

type BookingEmailPayload = {
  to: string;
  ownerName: string;
  dogName: string;
  startDate: string;
  endDate: string;
  status: BookingEmailStatus;
};

type EmailContent = {
  subject: string;
  preview: string;
  eyebrow: string;
  title: string;
  message: string;
  accentColor: string;
  badgeBackground: string;
  badgeText: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(fromDateKey(dateKey));
}

function getDateSummary(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return `Giornata del ${formatDate(startDate)}`;
  }

  return `Dal ${formatDate(startDate)} al ${formatDate(endDate)}`;
}

function getStatusContent(status: BookingEmailStatus): EmailContent {
  switch (status) {
    case "confirmed":
      return {
        subject: "Prenotazione confermata",
        preview: "La tua prenotazione e stata confermata da Pirella Pet Resort.",
        eyebrow: "Prenotazione confermata",
        title: "La tua prenotazione e confermata",
        message:
          "Abbiamo verificato la disponibilita e confermato la prenotazione. Ti aspettiamo nella data indicata.",
        accentColor: "#15803d",
        badgeBackground: "#dcfce7",
        badgeText: "#166534",
      };
    case "rejected":
      return {
        subject: "Richiesta di prenotazione non confermata",
        preview:
          "La tua richiesta non puo essere confermata per le date selezionate.",
        eyebrow: "Richiesta non confermata",
        title: "Non possiamo confermare questa richiesta",
        message:
          "Ci dispiace, per le date indicate non riusciamo a confermare la prenotazione. Puoi contattarci per valutare date alternative.",
        accentColor: "#b91c1c",
        badgeBackground: "#fee2e2",
        badgeText: "#991b1b",
      };
    case "completed":
      return {
        subject: "Prenotazione completata",
        preview: "La prenotazione risulta completata. Grazie da Pirella Pet Resort.",
        eyebrow: "Prenotazione completata",
        title: "Grazie per aver scelto Pirella Pet Resort",
        message:
          "La prenotazione risulta completata. Speriamo di rivedervi presto e restiamo a disposizione per nuove richieste.",
        accentColor: "#1d4ed8",
        badgeBackground: "#dbeafe",
        badgeText: "#1e40af",
      };
    case "received":
    default:
      return {
        subject: "Richiesta di prenotazione ricevuta",
        preview:
          "Abbiamo ricevuto la tua richiesta di prenotazione. Ti risponderemo al piu presto.",
        eyebrow: "Richiesta ricevuta",
        title: "Abbiamo ricevuto la tua richiesta",
        message:
          "La prenotazione non è ancora definitiva: controlleremo la disponibilita e riceverai una seconda email con conferma o eventuale rifiuto.",
        accentColor: "#1d4ed8",
        badgeBackground: "#dcfce7",
        badgeText: "#166534",
      };
  }
}

function getEmailHtml(payload: BookingEmailPayload) {
  const content = getStatusContent(payload.status);
  const ownerName = escapeHtml(payload.ownerName);
  const dogName = escapeHtml(payload.dogName);
  const dateSummary = escapeHtml(getDateSummary(payload.startDate, payload.endDate));
  const siteName = escapeHtml(siteConfig.name);
  const replyTo = escapeHtml(process.env.EMAIL_REPLY_TO ?? siteConfig.email);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const safeSiteUrl = siteUrl ? escapeHtml(siteUrl) : "";

  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(content.subject)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(content.preview)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;margin:0;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:28px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.10);">
            <tr>
              <td style="background:#1d4ed8;padding:22px 28px;color:#ffffff;">
                <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${siteName}</div>
                <div style="margin-top:8px;font-size:26px;line-height:1.2;font-weight:800;">Aggiornamento prenotazione</div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 28px 10px;text-align:center;">
                <div style="display:inline-block;width:72px;height:72px;border-radius:999px;background:${content.badgeBackground};color:${content.badgeText};font-size:38px;font-weight:800;line-height:72px;text-align:center;">&#10003;</div>
                <div style="margin-top:24px;color:${content.accentColor};font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(content.eyebrow)}</div>
                <h1 style="margin:12px auto 0;max-width:520px;color:#020617;font-size:34px;line-height:1.08;font-weight:800;">${escapeHtml(content.title)}</h1>
                <p style="margin:18px auto 0;max-width:520px;color:#475569;font-size:16px;line-height:1.7;">Ciao ${ownerName}, ${escapeHtml(content.message)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 12px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;">
                  <tr>
                    <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                      <div style="color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Cane</div>
                      <div style="margin-top:6px;color:#0f172a;font-size:18px;font-weight:800;">${dogName}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Periodo</div>
                      <div style="margin-top:6px;color:#0f172a;font-size:18px;font-weight:800;">${dateSummary}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 34px;text-align:center;">
                <p style="margin:0 auto;max-width:520px;color:#64748b;font-size:14px;line-height:1.6;">
                  Per domande o modifiche puoi scrivere a <a href="mailto:${replyTo}" style="color:#1d4ed8;font-weight:700;text-decoration:none;">${replyTo}</a> o agli altri contatti disponibili sul sito.
                </p>
                ${
                  safeSiteUrl
                    ? `<a href="${safeSiteUrl}" style="display:inline-block;margin-top:24px;background:#facc15;color:#172554;border-radius:999px;padding:13px 22px;font-size:14px;font-weight:800;text-decoration:none;">Visita il sito</a>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function getEmailText(payload: BookingEmailPayload) {
  const content = getStatusContent(payload.status);

  return [
    `${siteConfig.name} - ${content.subject}`,
    "",
    `Ciao ${payload.ownerName},`,
    content.message,
    "",
    `Cane: ${payload.dogName}`,
    `Periodo: ${getDateSummary(payload.startDate, payload.endDate)}`,
    "",
    `Per domande puoi scrivere a ${process.env.EMAIL_REPLY_TO ?? siteConfig.email} o agli altri contatti disponibili sul sito.`,
  ].join("\n");
}

async function sendBookingEmail(payload: BookingEmailPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing: booking email skipped.");
    return;
  }

  if (!payload.to) {
    console.warn("Booking email recipient missing: booking email skipped.");
    return;
  }

  const content = getStatusContent(payload.status);
  const from = process.env.EMAIL_FROM ?? `${siteConfig.name} <noreply@pirellapetresort.it>`;
  const replyTo = process.env.EMAIL_REPLY_TO ?? siteConfig.email;

  const { error } = await getResendClient().emails.send({
    from,
    to: payload.to,
    replyTo,
    subject: content.subject,
    html: getEmailHtml(payload),
    text: getEmailText(payload),
  });

  if (error) {
    throw error;
  }
}

export async function sendBookingReceivedEmail(
  payload: Omit<BookingEmailPayload, "status">,
) {
  await sendBookingEmail({
    ...payload,
    status: "received",
  });
}

export async function sendBookingStatusEmail(payload: BookingEmailPayload) {
  if (!["confirmed", "rejected", "completed"].includes(payload.status)) {
    return;
  }

  await sendBookingEmail(payload);
}
