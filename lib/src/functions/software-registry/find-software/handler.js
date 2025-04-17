import { DocumentClient } from "aws-sdk/clients/dynamodb";
import SoftwareService from "src/database/services/software-service";
import { middyfy } from "src/libs/lambda";
const dynamoDb = new DocumentClient();
const softwareService = new SoftwareService(dynamoDb);
export const findSoftwareHandler = async (event) => {
    console.log('Received event:', JSON.stringify(event));
    const { id } = event.pathParameters || {};
    console.log('Path parameter (id):', id);
    if (!id) {
        console.log("Missing or invalid path parameter: id");
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing or invalid path parameter: id' }),
        };
    }
    try {
        console.log('Finding software with id:', id);
        const software = await softwareService.findSoftware(id);
        if (software) {
            console.log('Software found:', software);
            return {
                statusCode: 200,
                body: JSON.stringify(software),
            };
        }
        else {
            console.error("Software not found for id:", id);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Software not found' }),
            };
        }
    }
    catch (error) {
        console.error('DynamoDB error finding software:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to retrieve software.', details: error.message }),
        };
    }
};
export const main = middyfy(findSoftwareHandler);
//# sourceMappingURL=handler.js.map