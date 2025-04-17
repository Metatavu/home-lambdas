import { middyfy } from "src/libs/lambda";
import { vacationRequestService } from "src/database/services";
const findVacationRequestHandler = async (event) => {
    const { id } = event.pathParameters || {};
    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "Missing or invalid path parameter: id",
            })
        };
    }
    try {
        const vacationRequestById = await vacationRequestService.findVacationRequest(id);
        if (!vacationRequestById) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: "Vacation Request not found",
                })
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(vacationRequestById)
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to retrieve vacation request",
                details: error.message
            })
        };
    }
};
export const main = middyfy(findVacationRequestHandler);
//# sourceMappingURL=handler.js.map