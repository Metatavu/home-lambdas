import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { entityToDto } from "src/database/dtos/vacationDtos";
import { vacationRequestService } from "src/database/services";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { handleApproval, handleRejection } from "src/database/services/update-vacation-service";
import { VacationRequestStatuses } from "src/generated/homeLambdasModels/model/vacationRequestStatuses";
import { getContractedWeek, getLatestStatus } from "src/libs/vacation-utils";
import {
  notifyAdminsVacationSubmittedAll,
  notifyUserVacationStatusUpdatedAll
} from "src/notifications/vacation-notifications";
import type vacationRequestSchema from "src/schema/vacationRequest";

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
  const contractedWeek = await getContractedWeek(userId);

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
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error updating vacation request record with id ${id}, ${error}`
    };
  }
};

export const main = middyfy(updateVacationRequestHandler);
