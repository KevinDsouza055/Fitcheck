import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@gymos.in";

export async function sendRenewalReminder(opts: {
  to: string;
  memberName: string;
  gymName: string;
  planName: string;
  expiryDate: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `⚠️ Your ${opts.gymName} membership expires soon`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#F97316">Hi ${opts.memberName},</h2>
        <p>Your <strong>${opts.planName}</strong> membership at <strong>${opts.gymName}</strong> expires on <strong>${opts.expiryDate}</strong>.</p>
        <p>Renew now to continue your fitness journey!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#F97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">
          Renew Membership →
        </a>
        <p style="margin-top:24px;color:#64748B;font-size:12px">— The ${opts.gymName} Team</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(opts: {
  to: string;
  memberName: string;
  gymName: string;
  planName: string;
  expiryDate: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `🎉 Welcome to ${opts.gymName}!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#10B981">Welcome, ${opts.memberName}! 💪</h2>
        <p>Your <strong>${opts.planName}</strong> membership at <strong>${opts.gymName}</strong> is now active.</p>
        <p>Your membership is valid until <strong>${opts.expiryDate}</strong>.</p>
        <p style="margin-top:24px;color:#64748B;font-size:12px">— The ${opts.gymName} Team</p>
      </div>
    `,
  });
}

export async function sendPaymentReceipt(opts: {
  to: string;
  memberName: string;
  gymName: string;
  amount: number;
  planName: string;
  paymentMethod: string;
  paymentDate: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `✅ Payment confirmed — ${opts.gymName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <h2 style="color:#10B981">Payment Confirmed</h2>
        <p>Hi ${opts.memberName},</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748B">Amount</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-weight:700">₹${opts.amount.toLocaleString("en-IN")}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748B">Plan</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${opts.planName}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748B">Method</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${opts.paymentMethod}</td></tr>
          <tr><td style="padding:8px 0;color:#64748B">Date</td><td style="padding:8px 0">${opts.paymentDate}</td></tr>
        </table>
        <p style="margin-top:24px;color:#64748B;font-size:12px">— The ${opts.gymName} Team</p>
      </div>
    `,
  });
}
