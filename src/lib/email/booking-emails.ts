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
  customerMessage?: string | null;
};

type BookingAdminNotificationPayload = {
  to: string;
  bookingId: string;
  receivedAt: string | null;
  ownerName: string;
  ownerSurname: string;
  ownerEmail: string;
  ownerPhone: string;
  dogName: string;
  dogBreed: string | null;
  dogSize: string;
  dogAge: number | null;
  dogSex: string;
  dogSterilized: boolean | null;
  dogs?: Array<{
    name: string;
    breed: string | null;
    size: string;
    age: number | null;
    sex: string;
    sterilized: boolean | null;
  }>;
  startDate: string;
  endDate: string;
  expectedArrivalTime?: string | null;
  expectedPickupTime?: string | null;
  stayType: string;
  source: string;
  submittedFromAdmin?: boolean;
  status: string;
  notes: string | null;
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Non disponibile";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non disponibile";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getOptionalText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "Non indicato";
}

function getOptionalTime(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value.slice(0, 5) : "Non indicato";
}

function escapeHtmlWithLineBreaks(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function getDogSizeLabel(size: string) {
  const labels: Record<string, string> = {
    small: "Piccola",
    medium: "Media",
    large: "Grande",
    giant: "Gigante",
  };

  return labels[size] ?? size;
}

function getDogSexLabel(sex: string) {
  const labels: Record<string, string> = {
    male: "Maschio",
    female: "Femmina",
    unknown: "Non indicato",
  };

  return labels[sex] ?? sex;
}

function getSterilizedLabel(value: boolean | null) {
  if (value === true) {
    return "Si";
  }

  if (value === false) {
    return "No";
  }

  return "Non indicato";
}

function getStayTypeLabel(stayType: string) {
  const labels: Record<string, string> = {
    day_care: "Asilo giornaliero",
    overnight: "Pensione con pernottamento",
  };

  return labels[stayType] ?? stayType;
}

function getSourceLabel(source: string) {
  const labels: Record<string, string> = {
    online: "Form pubblico",
    phone: "Telefono",
    admin: "Admin",
  };

  return labels[source] ?? source;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "In attesa",
    confirmed: "Confermata",
    rejected: "Rifiutata",
    completed: "Completata",
    cancelled: "Cancellata",
  };

  return labels[status] ?? status;
}

function getEmailFrom() {
  const defaultFrom = `${siteConfig.name} <noreply@pirellapetresort.it>`;
  const configuredFrom = process.env.EMAIL_FROM ?? defaultFrom;

  if (/no-?reply@/i.test(configuredFrom)) {
    return configuredFrom;
  }

  console.warn("EMAIL_FROM is not noreply: using default noreply sender.");

  return defaultFrom;
}

function getEmailReplyTo() {
  return process.env.EMAIL_REPLY_TO ?? siteConfig.email;
}

function getStatusContent(status: BookingEmailStatus): EmailContent {
  switch (status) {
    case "confirmed":
      return {
        subject: "Prenotazione confermata",
        preview: "La tua prenotazione è stata confermata da Pirella Pet Resort.",
        eyebrow: "Prenotazione confermata",
        title: "La tua prenotazione è confermata",
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
          "La tua richiesta non può essere confermata per le date selezionate.",
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
  const replyTo = escapeHtml(getEmailReplyTo());
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const safeSiteUrl = siteUrl ? escapeHtml(siteUrl) : "";
  const customerMessage = payload.customerMessage?.trim();

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
            ${
              customerMessage
                ? `<tr>
              <td style="padding:6px 28px 12px;">
                <div style="border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;padding:18px 20px;text-align:left;">
                  <div style="color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Messaggio dalla struttura</div>
                  <div style="margin-top:8px;color:#0f172a;font-size:15px;line-height:1.7;">${escapeHtmlWithLineBreaks(customerMessage)}</div>
                </div>
              </td>
            </tr>`
                : ""
            }
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
    ...(payload.customerMessage?.trim()
      ? [
          "",
          "Messaggio dalla struttura:",
          payload.customerMessage.trim(),
        ]
      : []),
    "",
    `Per domande puoi scrivere a ${getEmailReplyTo()} o agli altri contatti disponibili sul sito.`,
  ].join("\n");
}

function getAdminDetailRows(
  rows: Array<{ label: string; value: string | number | null | undefined }>,
) {
  return rows
    .map(
      (row, index) => `
                  <tr>
                    <td style="padding:14px 18px;${
                      index === rows.length - 1
                        ? ""
                        : "border-bottom:1px solid #e2e8f0;"
                    }">
                      <div style="color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(row.label)}</div>
                      <div style="margin-top:5px;color:#0f172a;font-size:16px;font-weight:700;line-height:1.45;">${escapeHtml(String(row.value ?? "Non indicato"))}</div>
                    </td>
                  </tr>`,
    )
    .join("");
}

function getAdminDetailSection(
  title: string,
  rows: Array<{ label: string; value: string | number | null | undefined }>,
) {
  return `
                <div style="margin-top:18px;">
                  <div style="margin-bottom:8px;color:#1d4ed8;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(title)}</div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;overflow:hidden;">
                    ${getAdminDetailRows(rows)}
                  </table>
                </div>`;
}

function getAdminDogSections(payload: BookingAdminNotificationPayload) {
  const dogs =
    payload.dogs && payload.dogs.length > 0
      ? payload.dogs
      : [
          {
            name: payload.dogName,
            breed: payload.dogBreed,
            size: payload.dogSize,
            age: payload.dogAge,
            sex: payload.dogSex,
            sterilized: payload.dogSterilized,
          },
        ];

  return dogs
    .map((dog, index) =>
      getAdminDetailSection(dogs.length === 1 ? "Cane" : `Cane ${index + 1}`, [
        { label: "Nome", value: dog.name },
        { label: "Razza", value: getOptionalText(dog.breed) },
        { label: "Taglia", value: getDogSizeLabel(dog.size) },
        {
          label: "Eta",
          value: dog.age === null ? "Non indicata" : `${dog.age} anni`,
        },
        { label: "Sesso", value: getDogSexLabel(dog.sex) },
        { label: "Sterilizzato", value: getSterilizedLabel(dog.sterilized) },
      ]),
    )
    .join("");
}

function getAdminDogText(payload: BookingAdminNotificationPayload) {
  const dogs =
    payload.dogs && payload.dogs.length > 0
      ? payload.dogs
      : [
          {
            name: payload.dogName,
            breed: payload.dogBreed,
            size: payload.dogSize,
            age: payload.dogAge,
            sex: payload.dogSex,
            sterilized: payload.dogSterilized,
          },
        ];

  return dogs
    .flatMap((dog, index) => [
      dogs.length === 1 ? "Cane" : `Cane ${index + 1}`,
      `Nome: ${dog.name}`,
      `Razza: ${getOptionalText(dog.breed)}`,
      `Taglia: ${getDogSizeLabel(dog.size)}`,
      `Eta: ${dog.age === null ? "Non indicata" : `${dog.age} anni`}`,
      `Sesso: ${getDogSexLabel(dog.sex)}`,
      `Sterilizzato: ${getSterilizedLabel(dog.sterilized)}`,
      "",
    ])
    .join("\n")
    .trimEnd();
}

function getAdminNotificationHtml(payload: BookingAdminNotificationPayload) {
  const ownerFullName = `${payload.ownerName} ${payload.ownerSurname}`.trim();
  const siteName = escapeHtml(siteConfig.name);
  const isAdminCreated = payload.submittedFromAdmin || payload.source !== "online";
  const notificationTitle = isAdminCreated
    ? "Prenotazione inserita da admin"
    : "Richiesta da confermare";
  const notificationEyebrow = isAdminCreated
    ? "Inserimento admin"
    : "Nuova richiesta";
  const notificationIntro = isAdminCreated
    ? "Una nuova prenotazione e stata inserita dall'area admin. Di seguito trovi tutti i dati salvati."
    : "Una nuova richiesta di prenotazione e stata inviata dal form pubblico. Di seguito trovi tutti i dati inseriti dal cliente.";
  const notificationPreview = isAdminCreated
    ? `Prenotazione inserita da admin per ${payload.dogName} da ${ownerFullName}.`
    : `Nuova richiesta online per ${payload.dogName} da ${ownerFullName}.`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const adminBookingsUrl = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}/admin/prenotazioni`
    : "";
  const safeAdminBookingsUrl = adminBookingsUrl
    ? escapeHtml(adminBookingsUrl)
    : "";

  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>Nuova richiesta di prenotazione</title>
  </head>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(notificationPreview)}
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
                <div style="display:inline-block;width:72px;height:72px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:38px;font-weight:800;line-height:72px;text-align:center;">!</div>
                <div style="margin-top:24px;color:#1d4ed8;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(notificationEyebrow)}</div>
                <h1 style="margin:12px auto 0;max-width:520px;color:#020617;font-size:34px;line-height:1.08;font-weight:800;">${escapeHtml(notificationTitle)}</h1>
                ${isAdminCreated ? `<p style="margin:18px auto 0;max-width:520px;color:#475569;font-size:16px;line-height:1.7;">${escapeHtml(notificationIntro)}</p>` : ""}
                ${isAdminCreated ? "" : `
                <p style="margin:18px auto 0;max-width:520px;color:#475569;font-size:16px;line-height:1.7;">Una nuova richiesta di prenotazione è stata inviata dal form pubblico. Di seguito trovi tutti i dati inseriti dal cliente.</p>
                `}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 12px;">
                ${getAdminDetailSection("Prenotazione", [
                  { label: "ID prenotazione", value: payload.bookingId },
                  { label: "Ricevuta il", value: formatDateTime(payload.receivedAt) },
                  { label: "Origine", value: getSourceLabel(payload.source) },
                  { label: "Stato", value: getStatusLabel(payload.status) },
                  { label: "Tipologia", value: getStayTypeLabel(payload.stayType) },
                  { label: "Periodo", value: getDateSummary(payload.startDate, payload.endDate) },
                  { label: "Orario previsto di arrivo", value: getOptionalTime(payload.expectedArrivalTime) },
                  { label: "Orario previsto di ritiro", value: getOptionalTime(payload.expectedPickupTime) },
                  { label: "Note cliente", value: getOptionalText(payload.notes) },
                ])}
                ${getAdminDetailSection("Proprietario", [
                  { label: "Nome", value: ownerFullName },
                  { label: "Email", value: payload.ownerEmail },
                  { label: "Telefono", value: payload.ownerPhone },
                ])}
                ${getAdminDogSections(payload)}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 34px;text-align:center;">
                ${
                  safeAdminBookingsUrl
                    ? `<a href="${safeAdminBookingsUrl}" style="display:inline-block;margin-top:6px;background:#facc15;color:#172554;border-radius:999px;padding:13px 22px;font-size:14px;font-weight:800;text-decoration:none;">Apri gestione prenotazioni</a>`
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

function getAdminNotificationText(payload: BookingAdminNotificationPayload) {
  const ownerFullName = `${payload.ownerName} ${payload.ownerSurname}`.trim();
  const isAdminCreated = payload.submittedFromAdmin || payload.source !== "online";
  const notificationIntro = isAdminCreated
    ? "Una nuova prenotazione e stata inserita dall'area admin."
    : "Una nuova richiesta di prenotazione e stata inviata dal form pubblico.";

  return [
    `${siteConfig.name} - Nuova richiesta di prenotazione`,
    "",
    "Una nuova richiesta di prenotazione è stata inviata dal form pubblico.",
    "",
    "Prenotazione",
    `ID prenotazione: ${payload.bookingId}`,
    `Ricevuta il: ${formatDateTime(payload.receivedAt)}`,
    `Origine: ${getSourceLabel(payload.source)}`,
    `Stato: ${getStatusLabel(payload.status)}`,
    `Tipologia: ${getStayTypeLabel(payload.stayType)}`,
    `Periodo: ${getDateSummary(payload.startDate, payload.endDate)}`,
    `Orario previsto di arrivo: ${getOptionalTime(payload.expectedArrivalTime)}`,
    `Orario previsto di ritiro: ${getOptionalTime(payload.expectedPickupTime)}`,
    `Note cliente: ${getOptionalText(payload.notes)}`,
    "",
    "Proprietario",
    `Nome: ${ownerFullName}`,
    `Email: ${payload.ownerEmail}`,
    `Telefono: ${payload.ownerPhone}`,
    "",
    getAdminDogText(payload),
  ]
    .join("\n")
    .replace(
      /Una nuova richiesta di prenotazione .*form pubblico\./,
      notificationIntro,
    );
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
  const from = getEmailFrom();
  const replyTo = getEmailReplyTo();

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

export async function sendBookingAdminNotificationEmail(
  payload: BookingAdminNotificationPayload,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing: admin booking email skipped.");
    return;
  }

  if (!payload.to) {
    console.warn("Admin booking email recipient missing: email skipped.");
    return;
  }

  const subjectPrefix =
    payload.submittedFromAdmin || payload.source !== "online"
      ? "Prenotazione inserita da admin"
      : "Nuova richiesta di prenotazione";

  const { error } = await getResendClient().emails.send({
    from: getEmailFrom(),
    to: payload.to,
    replyTo: getEmailReplyTo(),
    subject: `${subjectPrefix} - ${payload.dogName}`,
    html: getAdminNotificationHtml(payload),
    text: getAdminNotificationText(payload),
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
