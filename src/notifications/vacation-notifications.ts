import { 
  notifyAdminsVacationSubmittedSlack,
  notifyAdminsVacationDeletedSlack,
  notifyUserVacationStatusUpdatedSlack
} from "./vacation-slack-utils";

import {
  notifyAdminsVacationSubmittedByEmail,
  notifyAdminsVacationDeletedByEmail,
  notifyUserVacationStatusUpdatedByEmail
} from "./vacation-email-utils";
import { VacationDetails } from "src/types";

/**
 * Combined: Notify admins when a vacation is submitted (Slack + Email)
 *
 * @param details - Details of the submitted vacation
 * @returns A Promise that resolves when both Slack and email notifications have been sent
 */
export async function notifyAdminsVacationSubmittedAll(details: VacationDetails): Promise<void> {
  await Promise.all([
    notifyAdminsVacationSubmittedSlack(details),
    notifyAdminsVacationSubmittedByEmail(details)
  ]);
}

/**
 * Combined: Notify admins when a vacation is deleted (Slack + Email)
 *
 * @param details - Details of the deleted vacation
 * @returns A Promise that resolves when both Slack and email notifications have been sent
 */
export async function notifyAdminsVacationDeletedAll(details: VacationDetails): Promise<void> {
  await Promise.all([
    notifyAdminsVacationDeletedSlack(details),
    notifyAdminsVacationDeletedByEmail(details)
  ]);
}

/**
 * Combined: Notify a user when their vacation status is updated (Slack + Email)
 *
 * @param email - Email address of the user
 * @param updatedStatus - Updated vacation status
 * @returns A Promise that resolves when both Slack and email notifications have been sent
 */
export async function notifyUserVacationStatusUpdatedAll({
  email,
  updatedStatus
}: {
  email: string;
  updatedStatus: string;
}): Promise<void> {
  await Promise.all([
    notifyUserVacationStatusUpdatedSlack(email, updatedStatus),
    notifyUserVacationStatusUpdatedByEmail({ to: email, updatedStatus })
  ]);
}