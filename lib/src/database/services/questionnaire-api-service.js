const TABLE_NAME = "Questionnaires";
class QuestionnaireService {
    constructor(docClient) {
        this.docClient = docClient;
        this.createQuestionnaire = async (questionnaire) => {
            await this.docClient
                .put({
                TableName: TABLE_NAME,
                Item: questionnaire
            })
                .promise();
            return questionnaire;
        };
        this.findQuestionnaire = async (id) => {
            const result = await this.docClient
                .get({
                TableName: TABLE_NAME,
                Key: {
                    id: id
                },
            })
                .promise();
            return result.Item;
        };
        this.listQuestionnaires = async () => {
            const result = await this.docClient
                .scan({
                TableName: TABLE_NAME
            })
                .promise();
            return result.Items;
        };
        this.updateQuestionnaire = async (questionnaire) => {
            await this.docClient
                .put({
                TableName: TABLE_NAME,
                Item: questionnaire
            })
                .promise();
            return questionnaire;
        };
        this.deleteQuestionnaire = async (id) => {
            return this.docClient
                .delete({
                TableName: TABLE_NAME,
                Key: {
                    id: id
                },
            })
                .promise();
        };
    }
}
export default QuestionnaireService;
//# sourceMappingURL=questionnaire-api-service.js.map