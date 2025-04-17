import { CreateSeveraApiService } from "src/services/severa-api-service";
import { middyfy } from "src/libs/lambda";
export const getFlextimeHandler = async (event) => {
    const severaUserId = event.pathParameters?.severaUserId;
    try {
        const api = CreateSeveraApiService();
        if (!severaUserId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "SeveraUserId is required" }),
            };
        }
        const flexTimeBySeveraId = await api.getFlextimeBySeveraUserId(severaUserId);
        return {
            statusCode: 200,
            body: JSON.stringify(flexTimeBySeveraId),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
export const main = middyfy(getFlextimeHandler);
//# sourceMappingURL=handler.js.map