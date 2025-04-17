import { middyfy } from "@libs/lambda";
import { vacationRequestService } from "src/database/services";
const updateVacationRequestHandler = async (event) => {
    const { pathParameters, body } = event;
    const { createdAt, createdBy, days, draft, endDate, startDate, status, type, updatedAt, userId } = body;
    const id = pathParameters?.id;
    if (!id) {
        return {
            statusCode: 400,
            body: "Bad request, missing id"
        };
    }
    if (!userId ||
        !startDate ||
        !endDate ||
        !days ||
        !type ||
        !status ||
        !createdBy ||
        !createdAt ||
        !updatedAt) {
        return {
            statusCode: 400,
            body: "Invalid request body. Some data is missing."
        };
    }
    const existingVacationRequest = await vacationRequestService.findVacationRequest(id);
    if (!existingVacationRequest) {
        return {
            statusCode: 404,
            body: `Vacation request ${id} not found`
        };
    }
    const vacationRequestUpdates = {
        id: existingVacationRequest.id,
        userId: existingVacationRequest.userId,
        draft: draft ? draft : false,
        startDate: startDate,
        endDate: endDate,
        days: days,
        type: type,
        status: status,
        createdBy: existingVacationRequest.createdBy,
        createdAt: existingVacationRequest.createdAt,
        updatedAt: updatedAt
    };
    try {
        const updatedVacationRequest = await vacationRequestService.updateVacationRequest(vacationRequestUpdates);
        return {
            statusCode: 200,
            body: JSON.stringify(updatedVacationRequest)
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: `Error updating vacation request record with id ${id}, ${error}`
        };
    }
};
export const main = middyfy(updateVacationRequestHandler);
//# sourceMappingURL=handler.js.map