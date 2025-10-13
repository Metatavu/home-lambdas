import { VacationDetails } from "src/types";
import * as nodemailer from "nodemailer";
import Config from "src/app/config";
import { VacationRequestStatus } from "src/generated/homeLambdasModels/model/vacationRequestStatus";
const adminEmails = Config.get().email.adminEmails;
const Host = Config.get().email.mailgunSmtpHost;
const Port = Config.get().email.mailgunPort;
const User = Config.get().email.mailgunSmtpUser;
const Password = Config.get().email.mailgunSmtpPassword;
// Create a reusable transporter using Mailgun SMTP
const transporter = nodemailer.createTransport({
  host: Host,
  port: Port,
  auth: {
    user: User,
    pass: Password,
  },
});
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
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const info = await transporter.sendMail({
      from: "Metatavu Home <onboarding@mailgun.dev>", 
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
  } catch (error) {
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
  const vacationLink = `${homeUrl}/admin/vacations?selectedId=${vacationDetails.id}`;

  const html = `
    <p><strong>${header}</strong></p>
    <p>User: ${vacationDetails.user}</p>
    <p>Start Date: ${formatDate(vacationDetails.startDate)}</p>
    <p>End Date: ${formatDate(vacationDetails.endDate)}</p>
    <p>Type: ${vacationDetails.type || "Not provided"}</p>
    <p>Update status: <a href=${vacationLink}>Update status here</a></p>
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
  updatedStatus: VacationRequestStatus;
}) {
  const subject = "Your Vacation Request Status Was Updated";
  const html = `
    <p>Your vacation request status has been updated to <strong>${updatedStatus}</strong>.</p>
    <p>If you have questions, please contact your admin.</p>
  `;

  await sendEmail({ to, subject, html });
}
