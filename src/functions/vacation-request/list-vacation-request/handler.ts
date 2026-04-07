import type { APIGatewayProxyHandler } from "aws-lambda";
import { entityToDto } from "src/database/dtos/vacationDtos";
import { vacationRequestService } from "src/database/services";
import type { VacationRequest } from "src/generated/homeLambdasModels/model/vacationRequest";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda for listing all vacation requests from DynamoDB.
 */
const listVacationRequestHandler: APIGatewayProxyHandler = async (event) => {
  const userId = event.queryStringParameters?.userId;
  try {
    if (userId) {
      const filteredVacationRequests: VacationRequest[] = (
        await vacationRequestService.listVacationRequests(userId)
      ).map(entityToDto);

      return {
        statusCode: 200,
        body: JSON.stringify(filteredVacationRequests)
      };
    }
    const allVacationRequests: VacationRequest[] = (
      await vacationRequestService.listVacationRequests()
    ).map(entityToDto);

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
