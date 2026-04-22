import { type DeleteCommandInput, type GetCommandInput, type PutCommandInput, type ScanCommandInput,
    type DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type UsersSkillsModel from "@database/models/usersSkills";

const TABLE_NAME = "UsersSkills";

/**
 * Database service for users skills
 */
class UsersSkillsService {
  /**
   * Constructor
   * @param docClient DynamoDBDocumentClient
   */
  constructor(private readonly docClient: DynamoDBDocumentClient) {}

  /**
   * Creates a users skills entry
   *
   * @param usersSkills users skills
   * @returns created users skills
   */
  public createUsersSkills = async (usersSkills: UsersSkillsModel): Promise<UsersSkillsModel> => {
    const params: PutCommandInput = {
      TableName: TABLE_NAME,
      Item: usersSkills
    };
    await this.docClient.send(new PutCommand(params));
    return usersSkills;
  };

  /**
   * Finds a single users skills entry
   *
   * @param id user skills id
   * @returns user skills or null if not found
   */
  public findUsersSkills = async (id: string): Promise<UsersSkillsModel | null> => {
    const params: GetCommandInput = {
      TableName: TABLE_NAME,
      Key: { id: id }
    };
    const result = await this.docClient.send(new GetCommand(params));
    return result.Item as UsersSkillsModel;
  };

  /**
   * Lists all users skills
   *
   * @returns list of users skills
   */
  public listUsersSkills = async (): Promise<UsersSkillsModel[]> => {
    const params: ScanCommandInput = {
      TableName: TABLE_NAME
    };

    const result = await this.docClient.send(new ScanCommand(params));
    return result.Items as UsersSkillsModel[];
  };

  /**
   * Updates a users skills entry
   *
   * @param usersSkills users skills entry to be updated
   * @returns updated usersSkills
   */
  public updateUsersSkills = async (usersSkills: UsersSkillsModel): Promise<UsersSkillsModel> => {
    const params: PutCommandInput = {
      TableName: TABLE_NAME,
      Item: usersSkills
    };
    await this.docClient.send(new PutCommand(params));
    return usersSkills;
  };

  /**
   * Deletes a users skills entry
   *
   * @param id users skills entry id
   */
  public deleteUsersSkills = async (id: string) => {
    const params: DeleteCommandInput = {
      TableName: TABLE_NAME,
      Key: { id: id }
    };
    return this.docClient.send(new DeleteCommand(params));
  };
}

export default UsersSkillsService;
