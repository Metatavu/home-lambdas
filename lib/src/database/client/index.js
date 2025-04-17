import * as AWS from "aws-sdk";
const createDynamoDBClient = () => {
    if (process.env.IS_OFFLINE) {
        return new AWS.DynamoDB.DocumentClient({
            region: "localhost",
            endpoint: "http://localhost:8000",
        });
    }
    return new AWS.DynamoDB.DocumentClient();
};
export default createDynamoDBClient;
//# sourceMappingURL=index.js.map