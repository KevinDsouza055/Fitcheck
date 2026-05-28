const WAPI_URL = process.env.WHATSAPP_API_URL ?? "https://api.interakt.ai/v1/public/message/";
const WAPI_KEY = process.env.WHATSAPP_API_KEY ?? "";

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!WAPI_KEY) {
    console.warn("WhatsApp API key not configured");
    return { success: false, error: "WhatsApp not configured" };
  }

  // Normalize phone
  const normalized = phone.replace(/\D/g, "");
  const withCountry = normalized.startsWith("91") ? normalized : `91${normalized}`;

  try {
    const res = await fetch(WAPI_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(WAPI_KEY).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        countryCode: "91",
        phoneNumber: withCountry,
        type: "Text",
        data: { message },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function sendRenewalReminder(opts: {
  phone: string;
  memberName: string;
  gymName: string;
  planName: string;
  expiryDate: string;
  template: string;
}) {
  const message = fillTemplate(opts.template, {
    name: opts.memberName,
    gym: opts.gymName,
    plan: opts.planName,
    date: opts.expiryDate,
  });
  return sendWhatsAppMessage(opts.phone, message);
}

export async function sendWelcomeMessage(opts: {
  phone: string;
  memberName: string;
  gymName: string;
  planName: string;
  expiryDate: string;
  template: string;
}) {
  const message = fillTemplate(opts.template, {
    name: opts.memberName,
    gym: opts.gymName,
    plan: opts.planName,
    date: opts.expiryDate,
  });
  return sendWhatsAppMessage(opts.phone, message);
}
