import { vacationRequestService } from "src/database/services";
import { middyfy } from "src/libs/lambda";
const listVacationRequestHandler = async (event) => {
    const userId = event.queryStringParameters?.userId;
    try {
        if (userId) {
            const filteredVacationRequests = await vacationRequestService.listVacationRequests(userId);
            return {
                statusCode: 200,
                body: JSON.stringify(filteredVacationRequests)
            };
        }
        const allVacationRequests = await vacationRequestService.listVacationRequests();
        return {
            statusCode: 200,
            body: JSON.stringify(allVacationRequests)
        };
    }
    catch (error) {
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
//# sourceMappingURL=handler.js.map