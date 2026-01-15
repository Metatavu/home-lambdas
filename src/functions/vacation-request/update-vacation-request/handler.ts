import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { vacationRequestService } from "src/database/services";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import type { VacationRequest } from "src/generated/homeLambdasModels/model/vacationRequest";
import { VacationRequestStatuses } from "src/generated/homeLambdasModels/model/vacationRequestStatuses";
import {
  deductVacationDaysForApproval,
  getContractedWeek,
  getLatestStatus,
  returnVacationDaysForRejection,
  validateVacationApproval
} from "src/libs/vacation-utils";
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
    /**
     * Handles vacation request approval flow.
     * Deducts vacation days from user's balance before updating the database.
     * Implements compensating transaction: if database update fails, vacation days are returned.
     */
    if (currentStatus === VacationRequestStatuses.Approved && statusChanged) {
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
          body: JSON.stringify(updatedVacationRequest as unknown as VacationRequest)
        };
      } catch (dbError) {
        console.error("Database update failed, rolling back vacation day deduction", dbError);
        await returnVacationDaysForRejection(userId, startDate, endDate, contractedWeek);
        throw dbError;
      }
    }

    /**
     * Handles vacation request rejection/cancellation flow.
     * Updates database status before returning vacation days to user's balance.
     * If returning days fails, logs error but considers operation successful as status change takes priority.
     */
    if (
      existingLatestStatus === VacationRequestStatuses.Approved &&
      statusChanged &&
      currentStatus !== VacationRequestStatuses.Approved
    ) {
      const updatedVacationRequest =
        await vacationRequestService.updateVacationRequest(vacationRequestUpdates);

      try {
        await returnVacationDaysForRejection(
          userId,
          existingVacationRequest.startDate,
          existingVacationRequest.endDate,
          contractedWeek
        );

        await sendNotifications();

        return {
          statusCode: 200,
          body: JSON.stringify(updatedVacationRequest as unknown as VacationRequest)
        };
      } catch (keycloakError) {
        console.error("Failed to return vacation days after status change.", keycloakError);

        return {
          statusCode: 200,
          body: JSON.stringify(updatedVacationRequest as unknown as VacationRequest)
        };
      }
    }

    const updatedVacationRequest =
      await vacationRequestService.updateVacationRequest(vacationRequestUpdates);

    await sendNotifications();

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
