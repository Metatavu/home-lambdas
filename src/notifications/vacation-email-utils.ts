import { Resend } from "resend";
import * as dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];

if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY in environment variables");
}

/**
 * Notify admins when a vacation is submitted
 */
export async function notifyAdminsVacationSubmittedByEmail(vacationDetails: {
    userId: string;
    startDate: string;
    endDate: string;
    type?: string;
    }) {
    if (adminEmails.length === 0) {
        throw new Error("ADMIN_EMAILS environment variable is empty or not set.");
    }

    const subject = "New Vacation Request Submitted";
    const html = `
        <p><strong>New Vacation Submitted</strong></p>
        <p>User ID: ${vacationDetails.userId}</p>
        <p>Start Date: ${vacationDetails.startDate}</p>
        <p>End Date: ${vacationDetails.endDate}</p>
        <p>Reason: ${vacationDetails.type || "Not provided"}</p>
    `;

    for (const to of adminEmails) {
        await sendEmail({ to: to.trim(), subject, html });
    }
}

/**
 * Notify user when their vacation status is updated
 */
export async function notifyUserVacationStatusUpdatedByEmail({ to, updatedStatus }: {
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

/**
 * Send a generic email
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

    console.log(`Email sent to ${to}`);
}
