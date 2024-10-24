import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { SoftwareModel, Status } from "../models/software";

const tableName = "SoftwareRegistry";

/**
 * Database service for software entries
 */
class SoftwareService {

  /**
   * Constructor
   * @param docClient DynamoDB client
   */
  constructor(private readonly docClient: DocumentClient) {}

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
      await this.docClient.put({
        TableName: tableName,
        Item: newSoftware,
      }).promise();
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
    const result = await this.docClient.get({
      TableName: tableName,
      Key: { id },
    }).promise();

    return result.Item as SoftwareModel;
  }

  /**
   * Lists all software entries
   *
   * @returns list of software entries
   */
  public async listSoftware(): Promise<SoftwareModel[]> {
    const result = await this.docClient.scan({ TableName: tableName }).promise();
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

    const params = {
      TableName: tableName,
      Key: { id },
      UpdateExpression: `set ${updateExpression.join(', ')}, #lastUpdatedAt = :lastUpdatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    const result = await this.docClient.update(params).promise();
    return result.Attributes as SoftwareModel;
  }

  /**
   * Deletes a software entry
   *
   * @param id software id
   */
  public async deleteSoftware(id: string): Promise<void> {
    await this.docClient.delete({
      TableName: tableName,
      Key: { id },
    }).promise();
  }
}

export default SoftwareService;
