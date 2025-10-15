import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { vacationRequestService } from "src/database/services";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import type { VacationRequest } from "src/generated/homeLambdasModels/model/vacationRequest";
import { splitVacationDaysByYear, updateRemainingVacationDays } from "src/libs/vacation-utils";
import { notifyUserVacationStatusUpdatedAll } from "src/notifications/vacation-notifications";
import type vacationRequestSchema from "src/schema/vacationRequest";

/**
 * Lambda function to update a vacation request
 *
 * @param event event
 * Type mismatches between VacationRequestModel and VacationRequest:
 * - VacationRequestModel may be missing 'message' property required by VacationRequest.
 * - 'createdAt', 'updatedAt', 'startDate', 'endDate' are 'string' here, but VacationRequest expects 'Date'.
 */

// NOTE: Type mismatches between VacationRequestModel and VacationRequest (e.g. missing 'message', type differences).
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
  const statusChanged = existingVacationRequest.status !== status;

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

  try {
    const updatedVacationRequest =
      await vacationRequestService.updateVacationRequest(vacationRequestUpdates);
    if (statusChanged) {
      const currentStatus = Array.isArray(status) ? status.at(-1)?.status : "UNKNOWN";
      await notifyUserVacationStatusUpdatedAll({
        email: userDetails.email,
        updatedStatus: currentStatus
      });
    }
    if (status === "APPROVED") {
      const daysByYear = splitVacationDaysByYear(startDate, endDate);
      for (const [year, daysInYear] of Object.entries(daysByYear)) {
        await updateRemainingVacationDays(userId, daysInYear, year);
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify(updatedVacationRequest as unknown as VacationRequest)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error updating vacation request record with id ${id}, ${error}`
    };
  }
};

export const main = middyfy(updateVacationRequestHandler);
