import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { PutCommandInput, GetCommandInput, ScanCommandInput, DeleteCommandInput } from "@aws-sdk/lib-dynamodb";
import type QuestionnaireModel from "../models/questionnaire";

const TABLE_NAME = "Questionnaires";

/**
 * Database service for questionnaires
 */
class QuestionnaireService {
  /**
   * Constructor
   * @param docClient DynamoDBDocumentClient
   */
  constructor(private readonly docClient: DynamoDBDocumentClient) {}

  /**
   * Creates a questionnaire
   *
   * @param questionnaire questionnaire
   * @returns created questionnaire
   */
  public createQuestionnaire = async (questionnaire: QuestionnaireModel): Promise<QuestionnaireModel> => {
    const params: PutCommandInput = {
      TableName: TABLE_NAME,
      Item: questionnaire
    };
    await this.docClient.send(new PutCommand(params));
    return questionnaire;
  }

  /**
   * Finds a single questionnaire
   *
   * @param id questionnaire id
   * @returns questionnaire or null if not found
   */
  public findQuestionnaire = async (id: string): Promise<QuestionnaireModel | null> => {
    const params: GetCommandInput = {
      TableName: TABLE_NAME,
      Key: { id: id }
    };
    const result = await this.docClient.send(new GetCommand(params));
    return result.Item as QuestionnaireModel;
  }

  /**
   * Lists all questionnaires
   *
   * @returns list of questionnaires
   */
  public listQuestionnaires = async (): Promise<QuestionnaireModel[]> => {
    const params: ScanCommandInput = {
      TableName: TABLE_NAME
    };
    const result = await this.docClient.send(new ScanCommand(params));
    return result.Items as QuestionnaireModel[];
  }
  /**
   * Updates a questionnaire
   *
   * @param questionnaire questionnaire to be updated
   * @returns updated questionnaire
   */
  public updateQuestionnaire = async (questionnaire: QuestionnaireModel): Promise<QuestionnaireModel> => {
    const params: PutCommandInput = {
      TableName: TABLE_NAME,
      Item: questionnaire
    };
    await this.docClient.send(new PutCommand(params));
    return questionnaire;
  }

  /**
   * Deletes a questionnaire
   *
   * @param id questionnaire id
   */
  public deleteQuestionnaire = async (id: string) => {
    const params: DeleteCommandInput = {
      TableName: TABLE_NAME,
      Key: { id: id }
    };
    return this.docClient.send(new DeleteCommand(params));
  }

}

export default QuestionnaireService;