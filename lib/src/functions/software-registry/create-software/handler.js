import { DocumentClient } from "aws-sdk/clients/dynamodb";
import SoftwareService from "src/database/services/software-service";
import { middyfy } from "src/libs/lambda";
import { getAuthDataFromToken } from "src/libs/auth-utils";
const dynamoDb = new DocumentClient();
const softwareService = new SoftwareService(dynamoDb);
export const createSoftwareHandler = async (event) => {
    console.log('Received event:', JSON.stringify(event));
    try {
        if (!event.body) {
            console.log('Request body is missing');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Request body is required.' }),
            };
        }
        let data;
        if (typeof event.body === 'string') {
            data = JSON.parse(event.body);
        }
        else {
            data = event.body;
        }
        console.log('Parsed request body:', data);
        if (!data.name || !data.url) {
            console.log('Missing required fields: name or url');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Name and URL are required fields.' }),
            };
        }
        const authData = getAuthDataFromToken(event);
        if (!authData || !authData.sub) {
            console.log('User is not authenticated');
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'User is not authenticated.' }),
            };
        }
        const loggedUserId = authData.sub;
        console.log('Logged User ID (sub claim):', loggedUserId);
        const newSoftware = {
            name: data.name,
            url: data.url,
            image: data.image,
            description: data.description,
            review: data.review,
            recommend: data.recommend,
            tags: data.tags,
            users: data.users,
            createdBy: loggedUserId,
            lastUpdatedBy: loggedUserId,
        };
        console.log('Creating new software with data:', newSoftware);
        const createdSoftware = await softwareService.createSoftware(newSoftware);
        console.log('Software created successfully:', createdSoftware);
        return {
            statusCode: 201,
            body: JSON.stringify(createdSoftware),
        };
    }
    catch (error) {
        console.error("Error creating software:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to create software entry.', details: error.message }),
        };
    }
};
export const main = middyfy(createSoftwareHandler);
//# sourceMappingURL=handler.js.map