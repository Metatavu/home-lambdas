import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { entityToDto } from "src/database/dtos/vacationDtos";
import type VacationRequestModel from "src/database/models/vacationRequest";
import { vacationRequestService } from "src/database/services";
import { VacationRequestStatuses } from "src/generated/homeLambdasModels/model/vacationRequestStatuses";
import {
  deductVacationDaysForApproval,
  getLatestStatus,
  returnVacationDaysForRejection,
  validateVacationApproval,
  validateVacationDates
} from "src/libs/vacation-utils";
import {
  notifyAdminsVacationSubmittedAll,
  notifyUserVacationStatusUpdatedAll
} from "src/notifications/vacation-notifications";
import type vacationRequestSchema from "src/schema/vacationRequest";
import { CreateKeycloakApiService } from "src/services/keycloak-api-service";

/**
 * Verifies user has enough vacation days and deducts them upon approval of a vacation request.
 *
 * @param userId - The ID of the user requesting vacation.
 * @param startDate - The start date of the vacation.
 * @param prevDays - Amount of days vacation consumed before update.
 * @param prevStatus - Previous status of the vacation.
 * @param vacationRequestUpdates - The vacation request object to update in the database.
 * @param sendNotifications - Callback function to send notifications after successful update.
 */
const handleApproval = async (
  userId: string,
  startDate: string,
  prevDays: number,
  prevStatus: VacationRequestStatuses | undefined,
  vacationRequestUpdates: VacationRequestModel,
  sendNotifications: () => Promise<void>
) => {
  const statusNow = vacationRequestUpdates.status[0].status;
  let daysConsumed = vacationRequestUpdates.days;

  /**
   * If status remained as APPROVED the days should not be deducted again.
   * So if days consumed remain the same, 0 days are deducted. If days consumed increases,
   * the extra days added will be deducted. Note that if days consumed decreases,
   * daysConsumed will be a negative number. This is intentional, as when deducted,
   * it will increase the amount, as x - (-x) is x + x.
   */
  if (prevStatus === statusNow) {
    daysConsumed = daysConsumed - prevDays;
  }
  const validationError = await validateVacationApproval(userId, startDate, daysConsumed);
  if (validationError) return validationError;

  await deductVacationDaysForApproval(userId, startDate, daysConsumed);

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
    await returnVacationDaysForRejection(userId, startDate, daysConsumed);
    throw dbError;
  }
};

/**
 * Handles vacation request rejection/cancellation.
 */
const handleRejection = async (
  userId: string,
  existingStartDate: string,
  prevDays: number,
  vacationRequestUpdates: any,
  sendNotifications: () => Promise<void>
) => {
  const updatedVacationRequest =
    await vacationRequestService.updateVacationRequest(vacationRequestUpdates);

  try {
    await returnVacationDaysForRejection(userId, existingStartDate, prevDays);
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

/**
 * Lambda function to update a vacation request
 *
 * @param event event containing path parameters and a JSON body that matches 'vacationRequestSchema'
 * @return A response object with statuscode
 */
const updateVacationRequestHandler: ValidatedEventAPIGatewayProxyEvent<
  typeof vacationRequestSchema
> = async (event) => {
  const { pathParameters, body } = event;
  const {
    userId,
    draft,
    startDate,
    endDate,
    days,
    type,
    status,
    message,
    createdBy,
    createdAt,
    updatedAt
  } = body;
  const id = pathParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      body: "Bad request, missing id"
    };
  }

  if (
    !userId ||
    !startDate ||
    !endDate ||
    !days ||
    !type ||
    !status ||
    !message ||
    !createdBy ||
    !createdAt ||
    !updatedAt
  ) {
    return {
      statusCode: 400,
      body: "Invalid request body. Some data is missing."
    };
  }

  const existingVacationRequest = await vacationRequestService.findVacationRequest(id);
  if (!existingVacationRequest) {
    return {
      statusCode: 404,
      body: `Vacation request ${id} not found`
    };
  }

  const existingLatestStatus = getLatestStatus(existingVacationRequest.status);
  const newLatestStatus = getLatestStatus(status);

  const statusChanged = existingLatestStatus !== newLatestStatus;
  const draftStatusChanged = existingVacationRequest.draft !== draft;

  const vacationRequestUpdates = {
    id: existingVacationRequest.id,
    userId: existingVacationRequest.userId,
    draft: draft ? draft : false,
    startDate: startDate,
    endDate: endDate,
    days: days,
    type: type,
    status: status,
    message: message,
    createdBy: existingVacationRequest.createdBy,
    createdAt: existingVacationRequest.createdAt,
    updatedAt: updatedAt
  };

  const api = CreateKeycloakApiService();
  const userDetails = await api.findUser(userId);
  const currentStatus = Array.isArray(status) ? status.at(-1)?.status : "UNKNOWN";

  const sendNotifications = async () => {
    if (statusChanged) {
      await notifyUserVacationStatusUpdatedAll({
        email: userDetails.email,
        updatedStatus: currentStatus
      });
    }
    if (draftStatusChanged) {
      await notifyAdminsVacationSubmittedAll({
        id: id,
        user: userDetails.firstName,
        startDate,
        endDate,
        type
      });
    }
  };

  try {
    const checkedDates = await validateVacationDates(startDate, endDate);
    if (!checkedDates) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: `Cannot update request: Start and end dates are not valid. Please ensure that the start date is before the end date and that both dates are in the future.`
        })
      };
    }

    if (currentStatus === VacationRequestStatuses.Approved) {
      return await handleApproval(
        userId,
        startDate,
        existingVacationRequest.days,
        existingLatestStatus,
        vacationRequestUpdates,
        sendNotifications
      );
    }

    const statusChangeToRejected =
      existingLatestStatus === VacationRequestStatuses.Approved &&
      statusChanged &&
      currentStatus !== VacationRequestStatuses.Approved;
    if (statusChangeToRejected) {
      return await handleRejection(
        userId,
        existingVacationRequest.startDate,
        existingVacationRequest.days,
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
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error updating vacation request record with id ${id}, ${error}`
    };
  }
};

export const main = middyfy(updateVacationRequestHandler);
