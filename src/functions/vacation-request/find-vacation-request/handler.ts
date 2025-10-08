import { middyfy } from "src/libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { vacationRequestService } from "src/database/services";
import { VacationRequest } from "src/generated/homeLambdasModels/model/vacationRequest";

/**
 * Lambda for finding a vacation request entry from DynamoDB.
 *
 * @param event event
 * @returns vacation request information as object
 *
 * Type mismatches between VacationRequestModel and VacationRequest:
 * - VacationRequestModel may be missing 'message' property required by VacationRequest.
 * - 'createdAt', 'updatedAt', 'startDate', 'endDate' are 'string' here, but VacationRequest expects 'Date'.
 */

const findVacationRequestHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing or invalid path parameter: id",
      })
    }
  }

  try {
    const vacationRequestById = await vacationRequestService.findVacationRequest(id);

    if (!vacationRequestById) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Vacation Request not found",
        })
      }
    }

    // NOTE: Type mismatches in fields like 'message', 'type', 'createdAt', 'updatedAt' (string vs Date).
    // For now, just cast to VacationRequest as per spec.
    const vacationRequest = vacationRequestById;

    return {
      statusCode: 200,
      body: JSON.stringify(vacationRequest)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve vacation request",
        details: error.message
      })
    }
  }
}

export const main = middyfy(findVacationRequestHandler);