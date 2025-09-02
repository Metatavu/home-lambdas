import { Resend } from "resend";
import Config from "src/app/config"; 
import { VacationDetails } from "src/types";

/**
 * Temporary polyfill for Node <18, remove after node upgrade
 */
import { fetch, Headers, Request, Response } from "undici";
(globalThis as any).fetch = fetch;
(globalThis as any).Headers = Headers;
(globalThis as any).Request = Request;
(globalThis as any).Response = Response;

const resend = new Resend(Config.get().email.resendApiKey);
const adminEmails = Config.get().email.adminEmails;

/**
 * Format a date string from yyyy-mm-dd to dd-mm-yyyy
 *
 * @param date - Date string in yyyy-mm-dd format
 * @returns Date string in dd-mm-yyyy format
 */
function formatDate(date: string): string {
    return date.split("-").reverse().join("-");
}

/**
 * Send a generic email
 *
 * @param to - Recipient email address
 * @param subject - Subject line of the email
 * @param html - HTML content of the email
 */
async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { error } = await resend.emails.send({
    from: "Metatavu Home <onboarding@resend.dev>",
    to,
    subject,
    html
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

/**
 * Generic function to notify admins about a vacation
 *
 * @param vacationDetails - Details of the vacation
 * @param subject - Subject line for the email
 * @param header - Header text displayed in the email body
 */
async function notifyAdminsVacationByEmail(
  vacationDetails: VacationDetails,
  subject: string,
  header: string
) {
  if (adminEmails.length === 0) {
    throw new Error("ADMIN_EMAILS environment variable is empty or not set.");
  }
  const homeUrl = Config.get().homeBaseUrl;
  const vacationLink = `${homeUrl}/admin/vacations`;

  const html = `
    <p><strong>${header}</strong></p>
    <p>User: ${vacationDetails.user}</p>
    <p>Start Date: ${formatDate(vacationDetails.startDate)}</p>
    <p>End Date: ${formatDate(vacationDetails.endDate)}</p>
    <p>Type: ${vacationDetails.type || "Not provided"}</p>
    <p>Update status: <a href="${vacationLink}">Update status here</a></p>
  `;

  for (const to of adminEmails) {
    await sendEmail({ to: to.trim(), subject, html });
  }
}

/**
 * Notify admins when a vacation is submitted
 *
 * @param vacationDetails - Details of the submitted vacation
 */
export async function notifyAdminsVacationSubmittedByEmail(
  vacationDetails: VacationDetails
) {
  await notifyAdminsVacationByEmail(
    vacationDetails,
    "New Vacation Request Submitted",
    "New Vacation Submitted"
  );
}

/**
 * Notify admins when a vacation request is deleted
 *
 * @param vacationDetails - Details of the deleted vacation
 */
export async function notifyAdminsVacationDeletedByEmail(
  vacationDetails: VacationDetails
) {
  await notifyAdminsVacationByEmail(
    vacationDetails,
    "Vacation Request Deleted",
    "Vacation Request Deleted"
  );
}

/**
 * Notify user when their vacation status is updated
 *
 * @param to - Email address of the user
 * @param updatedStatus - Updated vacation status
 */
export async function notifyUserVacationStatusUpdatedByEmail({
  to,
  updatedStatus
}: {
  to: string;
  updatedStatus: string;
}) {
  const subject = "Your Vacation Request Status Was Updated";
  const html = `
    <p>Your vacation request status has been updated to <strong>${updatedStatus}</strong>.</p>
    <p>If you have questions, please contact your admin.</p>
  `;

  await sendEmail({ to, subject, html });
}