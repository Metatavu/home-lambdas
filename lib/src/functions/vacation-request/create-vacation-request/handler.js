import { middyfy } from "src/libs/lambda";
import { vacationRequestService } from "src/database/services";
import { v4 as uuidv4 } from "uuid";
export const createVacationRequestHandler = async (event) => {
    const { body } = event;
    if (!body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Request body is required." })
        };
    }
    const { createdAt, createdBy, days, draft, endDate, startDate, status, type, updatedAt, userId } = body;
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
            body: JSON.stringify({ error: "Invalid request body. Some data is missing." })
        };
    }
    const newVacationRequestId = uuidv4();
    try {
        const createdVacationRequest = await vacationRequestService.createVacationRequest({
            id: newVacationRequestId,
            userId: userId,
            draft: draft,
            startDate: startDate,
            endDate: endDate,
            days: days,
            type: type,
            status: status,
            createdBy: createdBy,
            createdAt: createdAt,
            updatedAt: updatedAt
        });
        return {
            statusCode: 201,
            body: JSON.stringify(createdVacationRequest)
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: `Failed to create vacation request entry ${error}`
        };
    }
};
export const main = middyfy(createVacationRequestHandler);
//# sourceMappingURL=handler.js.map