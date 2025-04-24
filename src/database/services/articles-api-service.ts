import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ArticleMetadataModel, ArticleModel } from "../models/article";

const TABLE_NAME = "Articles";
const gsiPath = "GSI_Path";

/**
 * Database service for article entries
 */
class ArticlesApiService {
  /**
   * Constructor
   * @param docClient DynamoDB client
   */
  constructor(private readonly docClient: DocumentClient) {}

  /**
   * Lists all article entries
   *
   * @returns list of article entries (excluding content)
   */
  public listArticles = async(draft: string = "false", path?: string): Promise<ArticleMetadataModel[]> => {
    const params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: TABLE_NAME,
      ExpressionAttributeNames: {
        "#path": "path",
      },
      ProjectionExpression: "id, title, description, #path, coverImage, createdBy, createdAt, lastUpdatedBy, lastUpdatedAt, tags, readBy, lastReadAt, draft",
      FilterExpression: "draft = :draft",
      ExpressionAttributeValues: { ":draft": draft === "true" ? true : false}
    };

    if (path) {
      params.FilterExpression = params.FilterExpression + " AND begins_with(#path, :path)";
      params.ExpressionAttributeValues[":path"] = path;
    }

    const articles = await this.docClient.scan(params).promise();
    return articles.Items as ArticleMetadataModel[];
  };

  /**
   * Finds a single article entry by path
   * 
   * @param path unique article path
   * @returns article entry or null if not found
   */
  public findArticleByPath = async(path: string): Promise<ArticleModel | null> => {
    const params = {
      TableName: TABLE_NAME,
      IndexName: gsiPath,
      KeyConditionExpression: "#path = :path",
      ExpressionAttributeNames: { "#path": "path" },
      ExpressionAttributeValues: { ":path": path }
    };

    const result = await this.docClient.query(params).promise();
    const articleRecord = result.Items.length !== 0 ? result.Items[0] : undefined;

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
    const articles = await this.docClient
      .get({
        TableName: TABLE_NAME,
        Key: { id: id },
      }).promise();

    return articles.Item as ArticleModel;
  };

  /**
   * Creates an article entry
   * 
   * @param article article entry
   * @returns created article entry
   */
  public createArticle = async(article: ArticleModel): Promise<ArticleModel> => {
    await this.docClient
      .put({
        TableName: TABLE_NAME,
        Item: article
      }).promise();

    return article;
  };

  /**
   * Deletes an article entry
   *
   * @param id article id
   */
  public deleteArticle = async(id: string) => {
    return this.docClient
      .delete({
        TableName: TABLE_NAME,
        Key: { id: id },
      }).promise();
  };

  /**
   * Updates an article entry
   *
   * @param article article entry to be updated
   * @returns updated article entry
   */
  public updateArticle = async(article: ArticleModel) => {
    await this.docClient
      .put({
        TableName: TABLE_NAME,
        Item: article
      }).promise();
  };

  /**
   * Updates the readBy and related read date attributes of an article entry 
   *
   * @param id id of article to be updated
   * @param userId user id to include in the read list
   */
  public updateArticleReadBy = async(id: string, userId: string) => {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: id },
      UpdateExpression: "ADD readBy :userId SET lastReadAt=:newDate, lastUpdatedAt = :newDate",
      ExpressionAttributeValues: {
        ":userId": this.docClient.createSet([userId]),
        ":newDate": new Date().toISOString()
      }
    };

    await this.docClient.update(params).promise();
  };
}

export default ArticlesApiService;