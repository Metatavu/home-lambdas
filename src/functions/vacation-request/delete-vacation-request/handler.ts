import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { vacationRequestService } from "src/database/services";
import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";
import { notifyAdminsVacationDeletedAll } from "src/notifications/vacation-notifications";

/**
 * Lambda for deleting a vacation request entry from DynamoDB.
 *
 * @param event event
 */
const deleteVacationRequestHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const { id } = event.pathParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing or invalid path parameter: id"
      })
    };
  }

  try {
    const foundVacationRequestById = await vacationRequestService.findVacationRequest(id);
    if (!foundVacationRequestById) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Vacation request with id: ${id} not found.`
        })
      };
    }

    await vacationRequestService.deleteVacationRequest(id);
    const api = CreateKeycloakApiService();
    const userDetails = await api.findUser(foundVacationRequestById.userId);
    if (foundVacationRequestById.draft === false) {
      await notifyAdminsVacationDeletedAll({
        id: foundVacationRequestById.id,
        user: userDetails.firstName,
        startDate: foundVacationRequestById.startDate,
        endDate: foundVacationRequestById.endDate,
        type: foundVacationRequestById.type
      });
    }
    return {
      statusCode: 204,
      body: JSON.stringify("")
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to delete vacation request.",
        details: error.message
      })
    };
  }
};

export const main = middyfy(deleteVacationRequestHandler);
