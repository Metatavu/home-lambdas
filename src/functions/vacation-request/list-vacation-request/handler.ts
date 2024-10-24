import type { APIGatewayProxyHandler } from "aws-lambda";
import type VacationRequestModel from "src/database/models/vacationRequest";
import { vacationRequestService } from "src/database/services";
import { middyfy } from "src/libs/lambda";

/**
 * Labmda for listing all questions from DynamoDB.
 */
const listVacationRequestHandler: APIGatewayProxyHandler = async () => {
  try {
    const allVacationRequests: VacationRequestModel[] =
      await vacationRequestService.listVacationRequests();

    return {
      statusCode: 200,
      body: JSON.stringify(allVacationRequests),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to retrieve vacation requests.",
        details: error.message,
      }),
    };
  }
};

export const main = middyfy(listVacationRequestHandler);
