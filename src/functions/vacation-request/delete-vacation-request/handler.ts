import type { APIGatewayProxyEvent, APIGatewayProxyHandler} from "aws-lambda";
import { vacationRequestService } from "src/database/services";
import { middyfy } from "src/libs/lambda";

/**
 * Lambda for deleting a vacation request entry from DynamoDB.
 * 
 * @param event event
 */

const deleteVacationRequestHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    /*APIGatewayHandler (aka Handler<APIEvent, APIResult>) will take API event and result as params
    Received API Event, Return API Result */

    const { id } = event.pathParameters || {};

    try {
        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Missing or invalid path parameter: id",
                }),
            };
        }

        const findVacationRequestById = await vacationRequestService.findVacationRequest(id);
        if (!findVacationRequestById) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: "Request ${id} not found.",
                }),
            };
        };

        await vacationRequestService.deleteVacationRequest(id);

        return {
            statusCode: 204,
            body: JSON.stringify(""),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to delete request.",
                details: error.message,
            }),
        };
    }
}

export const main = middyfy(deleteVacationRequestHandler);

/* middy helps to integrate multiple middlewares
in lambda withoud cluttering the handler logic */