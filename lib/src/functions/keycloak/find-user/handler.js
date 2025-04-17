import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";
const findUserHandler = async (event) => {
    try {
        const { queryStringParameters } = event;
        const api = CreateKeycloakApiService();
        if (!queryStringParameters || !queryStringParameters.id) {
            throw new Error("Missing or invalid path parameter: id");
        }
        const userById = await api.findUser(queryStringParameters.id);
        if (!userById) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "User not found" }),
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(userById),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
export const main = middyfy(findUserHandler);
//# sourceMappingURL=handler.js.map