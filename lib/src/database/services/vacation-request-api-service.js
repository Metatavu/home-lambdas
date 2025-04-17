const TABLE_NAME = "VacationRequests";
class VacationRequestService {
    constructor(docClient) {
        this.docClient = docClient;
        this.createVacationRequest = async (vacationRequest) => {
            await this.docClient
                .put({
                TableName: TABLE_NAME,
                Item: vacationRequest
            })
                .promise();
            return vacationRequest;
        };
        this.findVacationRequest = async (id) => {
            const result = await this.docClient
                .get({
                TableName: TABLE_NAME,
                Key: {
                    id: id
                }
            })
                .promise();
            return result.Item;
        };
        this.listVacationRequests = async (userId) => {
            const scanParams = {
                TableName: TABLE_NAME
            };
            if (userId) {
                scanParams.FilterExpression = "userId = :userId";
                scanParams.ExpressionAttributeValues = {
                    ":userId": userId
                };
            }
            const result = await this.docClient.scan(scanParams).promise();
            return result.Items;
        };
        this.updateVacationRequest = async (vacationRequest) => {
            await this.docClient
                .put({
                TableName: TABLE_NAME,
                Item: vacationRequest
            })
                .promise();
            return vacationRequest;
        };
        this.deleteVacationRequest = async (id) => {
            return this.docClient
                .delete({
                TableName: TABLE_NAME,
                Key: {
                    id: id
                }
            })
                .promise();
        };
    }
}
export default VacationRequestService;
//# sourceMappingURL=vacation-request-api-service.js.map