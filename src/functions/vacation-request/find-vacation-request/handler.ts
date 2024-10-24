import { middyfy } from "src/libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { vacationRequestService } from "src/database/services";

/**
 * Lambda for finding a vacation request entry from DynamoDB.
 * 
 * @param event event
 * @returns vacation request information as object 
 * 
 */

const findVacationRequestHandler: APIGatewayProxyHandler = async(event: APIGatewayProxyEvent) => {
    const {id} = event.pathParameters || {};

    try {
        if (!id){
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Missing or invalid path parameter: id",
                })
            }
        }

        const vacationRequestById = await vacationRequestService.findVacationRequest(id);

        if (!vacationRequestById){
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: "Vacation Request not found",
                })
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(vacationRequestById)
        }
    } catch (error) {
        return {
            statusCode: 500,
            body:JSON.stringify({
                error: "Failed to retrieve vacation requests",
                details: error.message
            })
        }
    }
}
export const main = middyfy(findVacationRequestHandler);