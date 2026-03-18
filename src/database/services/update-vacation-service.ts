import { entityToDto } from "src/database/dtos/vacationDtos";
import { vacationRequestService } from "src/database/services";
import { VacationRequestStatuses } from "src/generated/homeLambdasModels/model/vacationRequestStatuses";
import {
  deductVacationDaysForApproval,
  getLatestStatus,
  returnVacationDaysForRejection,
  validateVacationApproval
} from "src/libs/vacation-utils";

/**
 * Handles the approval of a vacation request.
 */

export const handleApproval = async (
  userId: string,
  startDate: string,
  endDate: string,
  contractedWeek: number[],
  vacationRequestUpdates: any,
  sendNotifications: () => Promise<void>
) => {
  const validationError = await validateVacationApproval(
    userId,
    startDate,
    endDate,
    contractedWeek
  );
  if (validationError) return validationError;

  await deductVacationDaysForApproval(userId, startDate, endDate, contractedWeek);

  try {
    const updatedVacationRequest =
      await vacationRequestService.updateVacationRequest(vacationRequestUpdates);
    await sendNotifications();

    return {
      statusCode: 200,
      body: JSON.stringify(entityToDto(updatedVacationRequest))
    };
  } catch (dbError) {
    console.error("Database update failed, rolling back vacation day deduction", dbError);
    await returnVacationDaysForRejection(userId, startDate, endDate, contractedWeek);
    throw dbError;
  }
};

/**
 * Handles vacation request rejection.
 */

export const handleRejection = async (
  userId: string,
  existingStartDate: string,
  existingEndDate: string,
  contractedWeek: number[],
  vacationRequestUpdates: any,
  sendNotifications: () => Promise<void>
) => {
  const updatedVacationRequest =
    await vacationRequestService.updateVacationRequest(vacationRequestUpdates);

  try {
    await returnVacationDaysForRejection(
      userId,
      existingStartDate,
      existingEndDate,
      contractedWeek
    );
    await sendNotifications();

    return {
      statusCode: 200,
      body: JSON.stringify(entityToDto(updatedVacationRequest))
    };
  } catch (error) {
    console.error("Failed to return vacation days after status change.", error);

    return {
      statusCode: 200,
      body: JSON.stringify(entityToDto(updatedVacationRequest))
    };
  }
};

export const VacationRequestUpdate = async ({
  existingVacationRequest,
  userId,
  draft,
  startDate,
  endDate,
  days,
  type,
  status,
  message,
  updatedAt,
  contractedWeek,
  sendNotifications
}) => {
  const existingLatestStatus = getLatestStatus(existingVacationRequest.status);
  const newLatestStatus = getLatestStatus(status);
  const statusChanged = existingLatestStatus !== newLatestStatus;
  const currentStatus = Array.isArray(status) ? status.at(-1)?.status : "UNKNOWN";

  const vacationRequestUpdates = {
    id: existingVacationRequest.id,
    userId: existingVacationRequest.userId,
    draft: draft ?? false,
    startDate,
    endDate,
    days,
    type,
    status,
    message,
    createdBy: existingVacationRequest.createdBy,
    createdAt: existingVacationRequest.createdAt,
    updatedAt
  };

  if (currentStatus === VacationRequestStatuses.Approved && statusChanged) {
    return await handleApproval(
      userId,
      startDate,
      endDate,
      contractedWeek,
      vacationRequestUpdates,
      sendNotifications
    );
  }

  if (
    existingLatestStatus === VacationRequestStatuses.Approved &&
    statusChanged &&
    currentStatus !== VacationRequestStatuses.Approved
  ) {
    return await handleRejection(
      userId,
      existingVacationRequest.startDate,
      existingVacationRequest.endDate,
      contractedWeek,
      vacationRequestUpdates,
      sendNotifications
    );
  }

  const updatedVacationRequest =
    await vacationRequestService.updateVacationRequest(vacationRequestUpdates);

  await sendNotifications();

  return {
    statusCode: 200,
    body: JSON.stringify(entityToDto(updatedVacationRequest))
  };
};
