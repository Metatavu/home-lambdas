import type VacationRequestModel from "@database/models/vacationRequest";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { PutCommandInput, GetCommandInput, ScanCommandInput, DeleteCommandInput } from "@aws-sdk/lib-dynamodb";

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
  public listVacationRequests = async (userId?: string): Promise<VacationRequestModel[]> => {
    const params: ScanCommandInput = {
      TableName: TABLE_NAME
    };
    if (userId) {
      params.FilterExpression = "userId = :userId";
      params.ExpressionAttributeValues = {
        ":userId": userId
      };
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
