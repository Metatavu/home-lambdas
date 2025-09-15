import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { PutCommandInput, GetCommandInput, ScanCommandInput, UpdateCommandInput, DeleteCommandInput } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { SoftwareModel, Status } from "../models/software";

const tableName = "SoftwareRegistry";

/**
 * Database service for software entries
 */
class SoftwareService {
  /**
   * Constructor
   * @param docClient DynamoDBDocumentClient
   */
  constructor(private readonly docClient: DynamoDBDocumentClient) {}

  /**
   * Creates a software entry
   * 
   * @param software software entry
   * @returns created software entry
   */
  public async createSoftware(software: SoftwareModel): Promise<SoftwareModel> {
    const newSoftware: SoftwareModel = {
      ...software,
      id: uuidv4(),
      status: Status.PENDING,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
    try {
      const params: PutCommandInput = {
        TableName: tableName,
        Item: newSoftware,
      };
      await this.docClient.send(new PutCommand(params));
      return newSoftware;
    } catch (error) {
      console.error('Error in createSoftware:', error);
      throw new Error(`Unable to create software entry: ${error.message}`);
    }
  }

  /**
   * Finds a single software entry
   * 
   * @param id software id
   * @returns software entry or null if not found
   */
  public async findSoftware(id: string): Promise<SoftwareModel | null> {
    const params: GetCommandInput = {
      TableName: tableName,
      Key: { id },
    };
    const result = await this.docClient.send(new GetCommand(params));
    return result.Item as SoftwareModel;
  }

  /**
   * Lists all software entries
   *
   * @returns list of software entries
   */
  public async listSoftware(): Promise<SoftwareModel[]> {
    const params: ScanCommandInput = { TableName: tableName };
    const result = await this.docClient.send(new ScanCommand(params));
    return result.Items as SoftwareModel[];
  }

  /**
   * Updates a software entry
   *
   * @param software software entry to be updated
   * @returns updated software entry
   */
  public async updateSoftware(id: string, updatedFields: SoftwareModel): Promise<SoftwareModel | null> {
    const updateExpression = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: { [key: string]: any } = {};

    Object.keys(updatedFields).forEach((key) => {
      if (updatedFields[key] !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updatedFields[key];
      }
    });

    expressionAttributeNames['#lastUpdatedAt'] = 'lastUpdatedAt';
    expressionAttributeValues[':lastUpdatedAt'] = new Date().toISOString();

    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: { id },
      UpdateExpression: `set ${updateExpression.join(', ')}, #lastUpdatedAt = :lastUpdatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    const result = await this.docClient.send(new UpdateCommand(params));
    return result.Attributes as SoftwareModel;
  }

  /**
   * Deletes a software entry
   *
   * @param id software id
   */
  public async deleteSoftware(id: string): Promise<void> {
    const params: DeleteCommandInput = {
      TableName: tableName,
      Key: { id },
    };
    await this.docClient.send(new DeleteCommand(params));
  }
}

export default SoftwareService;
