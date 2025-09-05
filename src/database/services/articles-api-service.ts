import { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ScanCommandInput, QueryCommandInput, GetCommandInput, PutCommandInput, DeleteCommandInput, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { ArticleMetadataModel, ArticleModel } from "../models/article";

const TABLE_NAME = "Articles";
const gsiPath = "GSI_Path";

/**
 * Database service for article entries
 */
class ArticlesApiService {
  /**
   * Constructor
   * @param docClient DynamoDBDocumentClient
   */
  constructor(private readonly docClient: DynamoDBDocumentClient) {}

  /**
   * Lists all article entries
   *
   * @returns list of article entries (excluding content)
   */
  public listArticles = async(draft: string = "false", pathPrefix?: string): Promise<ArticleMetadataModel[]> => {
    const params: ScanCommandInput = {
      TableName: TABLE_NAME,
      ExpressionAttributeNames: {
        "#path": "path",
      },
      ProjectionExpression: "id, title, description, #path, coverImage, createdBy, createdAt, lastUpdatedBy, lastUpdatedAt, tags, readBy, lastReadAt, draft",
      FilterExpression: "draft = :draft",
      ExpressionAttributeValues: { ":draft": draft === "true" ? true : false}
    };

    if (pathPrefix) {
      params.FilterExpression = params.FilterExpression + " AND begins_with(#path, :path)";
      params.ExpressionAttributeValues[":path"] = pathPrefix;
    }

    const articles = await this.docClient.send(new ScanCommand(params));
    return articles.Items as ArticleMetadataModel[];
  };

  /**
   * Finds a single article entry by path
   * 
   * @param path unique article path
   * @returns article entry or null if not found
   */
  public findArticleByPath = async(path: string): Promise<ArticleModel | null> => {
    const params: QueryCommandInput = {
      TableName: TABLE_NAME,
      IndexName: gsiPath,
      KeyConditionExpression: "#path = :path",
      ExpressionAttributeNames: { "#path": "path" },
      ExpressionAttributeValues: { ":path": path }
    };

    const result = await this.docClient.send(new QueryCommand(params));
    const articleRecord = result.Items && result.Items.length !== 0 ? result.Items[0] : undefined;

    if (articleRecord?.id) {
      const article = await this.findArticleById(articleRecord.id);
      return article;
    }
  };

  /**
   * Finds a single article entry by ID
   * 
   * @param id article id
   * @returns article entry or null if not found
   */
  public findArticleById = async(id: string): Promise<ArticleModel | null> => {
    const params: GetCommandInput = {
      TableName: TABLE_NAME,
      Key: { id: id },
    };
    const articles = await this.docClient.send(new GetCommand(params));
    return articles.Item as ArticleModel;
  };

  /**
   * Creates an article entry
   * 
   * @param article article entry
   * @returns created article entry
   */
  public createArticle = async(article: ArticleModel): Promise<ArticleModel> => {
    const params: PutCommandInput = {
      TableName: TABLE_NAME,
      Item: article
    };
    await this.docClient.send(new PutCommand(params));
    return article;
  };

  /**
   * Deletes an article entry
   *
   * @param id article id
   */
  public deleteArticle = async(id: string) => {
    const params: DeleteCommandInput = {
      TableName: TABLE_NAME,
      Key: { id: id },
    };
    return this.docClient.send(new DeleteCommand(params));
  };

  /**
   * Updates an article entry
   *
   * @param article article entry to be updated
   * @returns updated article entry
   */
  public updateArticle = async(article: ArticleModel) => {
    const params: PutCommandInput = {
      TableName: TABLE_NAME,
      Item: article
    };
    await this.docClient.send(new PutCommand(params));
  };

  /**
   * Updates the readBy and related read date attributes of an article entry 
   *
   * @param id id of article to be updated
   * @param userId user id to include in the read list
   */
  public updateArticleReadBy = async(id: string, users: string[]) => {
    const newDate = new Date().toISOString();
    const params: UpdateCommandInput = {
      TableName: TABLE_NAME,
      Key: { id: id },
      UpdateExpression: "SET readBy = :users, lastReadAt = :newDate, lastUpdatedAt = :newDate",
      ExpressionAttributeValues: {
        ":users": users,
        ":newDate": newDate
      }
    };
    await this.docClient.send(new UpdateCommand(params));
  };
}

export default ArticlesApiService;