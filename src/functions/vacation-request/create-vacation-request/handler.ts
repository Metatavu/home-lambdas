import { dtoToEntity, entityToDto } from "src/database/dtos/vacationDtos";
import { vacationRequestService } from "src/database/services";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import type { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { middyfy } from "src/libs/lambda";
import {
  getContractedWeek,
  splitVacationDaysByYear,
  validateVacationDays
} from "src/libs/vacation-utils";
import { notifyAdminsVacationSubmittedAll } from "src/notifications/vacation-notifications";
import type vacationRequestSchema from "src/schema/vacationRequest";
import { v4 as uuidv4 } from "uuid";

/**
 * Handler for creating a new vacation request entry in DynamoDB.
 *
 * @param event - API Gateway event containing the request body.
 * @returns Response object with status code
 */
export const createVacationRequestHandler: ValidatedEventAPIGatewayProxyEvent<
  typeof vacationRequestSchema
> = async (event) => {
  const { body } = event;
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is required." })
    };
  }

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
      body: JSON.stringify({ error: "Invalid request body. Some data is missing." })
    };
  }

  const newVacationRequestId = uuidv4();
  const api = CreateKeycloakApiService();
  const userDetails = await api.findUser(userId);

  try {
    const contractedWeek = await getContractedWeek(userId);
    const daysByYear = splitVacationDaysByYear(startDate, endDate, contractedWeek);

    for (const [year, daysInYear] of Object.entries(daysByYear)) {
      const hasEnoughDays = await validateVacationDays(userId, daysInYear, year);
      if (!hasEnoughDays) {
        return {
          statusCode: 409,
          body: JSON.stringify({
            message: `Cannot create request: you do not have enough remaining vacation days for ${year}.`
          })
        };
      }
    }

    const vacationDto = {
      id: newVacationRequestId,
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
    };

    const vacationEntity = dtoToEntity(vacationDto);

    const createdVacationRequest =
      await vacationRequestService.createVacationRequest(vacationEntity);

    const createdVacationRequestDto = entityToDto(createdVacationRequest);

    if (draft === false) {
      await notifyAdminsVacationSubmittedAll({
        id: newVacationRequestId,
        user: userDetails.firstName,
        startDate,
        endDate,
        type
      });
    }
    return {
      statusCode: 201,
      body: JSON.stringify(createdVacationRequestDto)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Failed to create vacation request entry ${error}`
    };
  }
};

export const main = middyfy(createVacationRequestHandler);
