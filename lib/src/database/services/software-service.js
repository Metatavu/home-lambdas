import { v4 as uuidv4 } from "uuid";
import { Status } from "../models/software";
const tableName = "SoftwareRegistry";
class SoftwareService {
    constructor(docClient) {
        this.docClient = docClient;
    }
    async createSoftware(software) {
        const newSoftware = {
            ...software,
            id: uuidv4(),
            status: Status.PENDING,
            createdAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
        };
        try {
            await this.docClient.put({
                TableName: tableName,
                Item: newSoftware,
            }).promise();
            return newSoftware;
        }
        catch (error) {
            console.error('Error in createSoftware:', error);
            throw new Error(`Unable to create software entry: ${error.message}`);
        }
    }
    async findSoftware(id) {
        const result = await this.docClient.get({
            TableName: tableName,
            Key: { id },
        }).promise();
        return result.Item;
    }
    async listSoftware() {
        const result = await this.docClient.scan({ TableName: tableName }).promise();
        return result.Items;
    }
    async updateSoftware(id, updatedFields) {
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        Object.keys(updatedFields).forEach((key) => {
            if (updatedFields[key] !== undefined) {
                updateExpression.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = updatedFields[key];
            }
        });
        expressionAttributeNames['#lastUpdatedAt'] = 'lastUpdatedAt';
        expressionAttributeValues[':lastUpdatedAt'] = new Date().toISOString();
        const params = {
            TableName: tableName,
            Key: { id },
            UpdateExpression: `set ${updateExpression.join(', ')}, #lastUpdatedAt = :lastUpdatedAt`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        };
        const result = await this.docClient.update(params).promise();
        return result.Attributes;
    }
    async deleteSoftware(id) {
        await this.docClient.delete({
            TableName: tableName,
            Key: { id },
        }).promise();
    }
}
export default SoftwareService;
//# sourceMappingURL=software-service.js.map