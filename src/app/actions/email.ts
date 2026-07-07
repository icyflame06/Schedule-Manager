"use server";

import { Resend } from "resend";
import { Booking, MeetingType, Profile } from "@/types";
import { format } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Palsa Scheduling <onboarding@resend.dev>";

function formatDateTime(isoString: string, timezone: string = "UTC") {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function guestEmailHtml(
  booking: Booking,
  meetingType: MeetingType,
  host: Profile
) {
  const start = formatDateTime(booking.start_time, host.timezone);
  const meetLinkBlock = booking.meet_link
    ? `<a href="${booking.meet_link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Join Google Meet</a>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
          <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
            <span style="font-size:24px;font-weight:700;color:#fff;">C</span>
          </div>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Booking Confirmed!</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your meeting has been scheduled</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;">Hi <strong>${booking.guest_name}</strong>,</p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;">Your meeting with <strong>${host.full_name}</strong> is confirmed. Here are the details:</p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
              <div style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Meeting</div>
              <div style="color:#111827;font-size:15px;font-weight:600;">${meetingType.title}</div>
            </td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
              <div style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Date & Time</div>
              <div style="color:#111827;font-size:15px;font-weight:600;">${start}</div>
            </td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
              <div style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Duration</div>
              <div style="color:#111827;font-size:15px;font-weight:600;">${meetingType.duration} minutes</div>
            </td></tr>
            <tr><td style="padding:16px 20px;">
              <div style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Host</div>
              <div style="color:#111827;font-size:15px;font-weight:600;">${host.full_name}</div>
            </td></tr>
          </table>

          ${meetLinkBlock}

          ${booking.guest_notes ? `<p style="margin:24px 0 0;color:#6b7280;font-size:13px;"><strong>Your notes:</strong> ${booking.guest_notes}</p>` : ""}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Powered by <strong>Palsa</strong> Premium Scheduling</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function hostEmailHtml(
  booking: Booking,
  meetingType: MeetingType,
  host: Profile
) {
  const start = formatDateTime(booking.start_time, host.timezone);
  const meetLinkBlock = booking.meet_link
    ? `<a href="${booking.meet_link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Join Google Meet</a>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#059669,#0d9488);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">New Booking Received!</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Someone just booked time with you</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;">Hi <strong>${host.full_name}</strong>,</p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;"><strong>${booking.guest_name}</strong> has booked a <strong>${meetingType.title}</strong> with you.</p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
              <div style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Guest</div>
              <div style="color:#111827;font-size:15px;font-weight:600;">${booking.guest_name} &lt;${booking.guest_email}&gt;</div>
            </td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
              <div style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Meeting</div>
              <div style="color:#111827;font-size:15px;font-weight:600;">${meetingType.title}</div>
            </td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
              <div style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Date & Time</div>
              <div style="color:#111827;font-size:15px;font-weight:600;">${start}</div>
            </td></tr>
            <tr><td style="padding:16px 20px;">
              <div style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Duration</div>
              <div style="color:#111827;font-size:15px;font-weight:600;">${meetingType.duration} minutes</div>
            </td></tr>
          </table>

          ${booking.guest_notes ? `<p style="margin:0 0 16px;color:#374151;font-size:14px;background:#fffbeb;padding:12px 16px;border-radius:8px;border-left:3px solid #f59e0b;"><strong>Guest notes:</strong> ${booking.guest_notes}</p>` : ""}
          ${meetLinkBlock}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Powered by <strong>Palsa</strong> Premium Scheduling</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendBookingConfirmationEmails(
  booking: Booking,
  meetingType: MeetingType,
  host: Profile
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set – skipping confirmation emails");
    return;
  }

  const results = await Promise.allSettled([
    // Email to guest
    resend.emails.send({
      from: FROM_EMAIL,
      to: booking.guest_email,
      subject: `Booking Confirmed: ${meetingType.title} with ${host.full_name}`,
      html: guestEmailHtml(booking, meetingType, host),
    }),
    // Email to host
    resend.emails.send({
      from: FROM_EMAIL,
      to: host.email,
      subject: `New Booking: ${meetingType.title} with ${booking.guest_name}`,
      html: hostEmailHtml(booking, meetingType, host),
    }),
  ]);

  results.forEach((result, i) => {
    const target = i === 0 ? `guest (${booking.guest_email})` : `host (${host.email})`;
    if (result.status === "rejected") {
      console.error(`[Email] Failed to send to ${target}:`, result.reason);
    } else if (result.value.error) {
      console.error(`[Email] Resend error for ${target}:`, result.value.error);
    } else {
      console.log(`[Email] Confirmation sent to ${target} ✅`);
    }
  });
}
