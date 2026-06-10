import {
  DeleteCommand,
  type DeleteCommandInput,
  type DynamoDBDocumentClient,
  GetCommand,
  type GetCommandInput,
  PutCommand,
  type PutCommandInput,
  ScanCommand,
  type ScanCommandInput
} from "@aws-sdk/lib-dynamodb";
import type VacationRequestModel from "@database/models/vacationRequest";

const TABLE_NAME = "VacationRequests";

/**
 * Database service for vacation requests
 */
class VacationRequestService {
  /**
   * Constructor
   * @param docClient DynamoDBDocumentClient
   */
  constructor(private readonly docClient: DynamoDBDocumentClient) {}

  /**
   * Creates a vacation request
   *
   * @param vacationRequest vacation request
   * @returns created vacationRequest
   */
  public createVacationRequest = async (
    vacationRequest: VacationRequestModel
  ): Promise<VacationRequestModel> => {
    const params: PutCommandInput = {
      TableName: TABLE_NAME,
      Item: vacationRequest
    };
    await this.docClient.send(new PutCommand(params));
    return vacationRequest;
  };

  /**
   * Finds a single vacation request
   *
   * @param id vacation request id
   * @returns vacation request or null if not found
   */
  public findVacationRequest = async (id: string): Promise<VacationRequestModel | null> => {
    const params: GetCommandInput = {
      TableName: TABLE_NAME,
      Key: { id: id }
    };
    const result = await this.docClient.send(new GetCommand(params));
    return result.Item as VacationRequestModel;
  };

  /**
   * Lists all vacation requests
   *
   * @returns list of vacation requests
   */
  public listVacationRequests = async (
    userId?: string,
    startDate?: string
  ): Promise<VacationRequestModel[]> => {
    const params: ScanCommandInput = {
      TableName: TABLE_NAME
    };
    const filterExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};

    if (userId) {
      filterExpressions.push("userId = :userId");
      expressionAttributeValues[":userId"] = userId;
    }

    if (startDate) {
      filterExpressions.push("startDate = :startDate");
      expressionAttributeValues[":startDate"] = startDate;
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(" AND ");
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    const result = await this.docClient.send(new ScanCommand(params));
    return result.Items as VacationRequestModel[];
  };

  /**
   * Updates a vacation request
   *
   * @param vacationRequest vacation request to be updated
   * @returns updated vacation request
   */
  public updateVacationRequest = async (
    vacationRequest: VacationRequestModel
  ): Promise<VacationRequestModel> => {
    const params: PutCommandInput = {
      TableName: TABLE_NAME,
      Item: vacationRequest
    };
    await this.docClient.send(new PutCommand(params));
    return vacationRequest;
  };

  /**
   * Deletes a vacation request
   *
   * @param id vacation request id
   */
  public deleteVacationRequest = async (id: string) => {
    const params: DeleteCommandInput = {
      TableName: TABLE_NAME,
      Key: { id: id }
    };
    return this.docClient.send(new DeleteCommand(params));
  };
}

export default VacationRequestService;
