import { Resend } from "resend";
import * as dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];

if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY in environment variables");
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
}

/**
 * Generic function to notify admins about a vacation
 */
async function notifyAdminsVacationByEmail(
    vacationDetails: {
        user: string;
        startDate: string;
        endDate: string;
        type?: string;
    },
    subject: string,
    header: string
    ) {
    if (adminEmails.length === 0) {
        throw new Error("ADMIN_EMAILS environment variable is empty or not set.");
    }

    const html = `
        <p><strong>${header}</strong></p>
        <p>User: ${vacationDetails.user}</p>
        <p>Start Date: ${vacationDetails.startDate}</p>
        <p>End Date: ${vacationDetails.endDate}</p>
        <p>Reason: ${vacationDetails.type || "Not provided"}</p>
    `;

    for (const to of adminEmails) {
        await sendEmail({ to: to.trim(), subject, html });
    }
}

/**
 * Notify admins when a vacation is submitted
 */
export async function notifyAdminsVacationSubmittedByEmail(
    vacationDetails: Parameters<typeof notifyAdminsVacationByEmail>[0]
    ) {
    await notifyAdminsVacationByEmail(
        vacationDetails,
        "New Vacation Request Submitted",
        "New Vacation Submitted"
    );
}

/**
 * Notify admins when a vacation request is deleted
 */
export async function notifyAdminsVacationDeletedByEmail(
    vacationDetails: Parameters<typeof notifyAdminsVacationByEmail>[0]
    ) {
    await notifyAdminsVacationByEmail(
        vacationDetails,
        "Vacation Request Deleted",
        "Vacation Request Deleted"
    );
}

/**
 * Notify user when their vacation status is updated
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
