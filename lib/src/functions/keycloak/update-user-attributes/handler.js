import { CreateKeycloakApiService } from "src/database/services/keycloak-api-service";
import { middyfy } from "src/libs/lambda";
import { optInSeveraUser } from "src/utils/severa";
const updateUserAttributeHandler = async (event) => {
    try {
        if (!event.body) {
            throw new Error("Request body is missing.");
        }
        const body = JSON.parse(JSON.stringify(event.body));
        const { id, attributes } = body;
        const email = attributes?.email;
        const allowedKeys = ["isSeveraOptIn"];
        if (!id || !attributes || typeof attributes !== "object") {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing or invalid parameters: 'id' or 'attribute'." })
            };
        }
        const keys = Object.keys(attributes);
        if (!keys.every((key) => allowedKeys.includes(key))) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Attributes contain invalid keys." })
            };
        }
        const api = CreateKeycloakApiService();
        const severaUser = await optInSeveraUser(email, attributes);
        if (!severaUser?.email || !severaUser?.guid) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Severa user not found." })
            };
        }
        if (!attributes.isActive) {
            attributes.isActive = ["Active"];
        }
        attributes["severa-user-id"] = [severaUser.guid];
        const updateResponse = await api.updateUserAttribute(id, attributes);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Severa user and Keycloak attributes updated",
                severaUser: severaUser,
                updatedAttributes: attributes,
                keycloakResponse: updateResponse
            })
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: error.message, stack: error.stack })
        };
    }
};
export const main = middyfy(updateUserAttributeHandler);
//# sourceMappingURL=handler.js.map