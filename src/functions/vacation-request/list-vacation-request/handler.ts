import type { APIGatewayProxyHandler } from "aws-lambda";
import type VacationRequestModel from "src/database/models/vacationRequest";
import { vacationRequestService } from "src/database/services";
//import { VacationRequest } from "src/generated/homeLambdasModels/model/vacationRequest";
import { middyfy } from "src/libs/lambda";

/**
 * Labmda for listing all vacation requests from DynamoDB.
 * Type mismatches between VacationRequestModel and VacationRequest:
 * - 'createdAt', 'updatedAt', 'startDate', 'endDate' are 'string' here, but VacationRequest expects 'Date'.
 */
const listVacationRequestHandler: APIGatewayProxyHandler = async (event) => {
  const userId = event.queryStringParameters?.userId;
  try {
    if (userId) {
      // NOTE: For now, we return VacationRequestModel as is, see OpenAPI spec for expected attributes.
      const filteredVacationRequests: VacationRequestModel[] =
        await vacationRequestService.listVacationRequests(userId);

      return {
        statusCode: 200,
        body: JSON.stringify(filteredVacationRequests)
      };
    }
    const allVacationRequests: VacationRequestModel[] =
      await vacationRequestService.listVacationRequests();

    return {
      statusCode: 200,
      body: JSON.stringify(allVacationRequests)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve vacation requests.",
        details: error.message
      })
    };
  }
};

export const main = middyfy(listVacationRequestHandler);
