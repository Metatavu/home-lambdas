import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ArticleMetadataModel, ArticleModel } from "../models/article";

const TABLE_NAME = "Articles";
const GSI = "GSI_Path";

class ArticlesApiService {
  constructor(private readonly docClient: DocumentClient) {}

  public listArticles = async(path?: string): Promise<ArticleMetadataModel[]> => {
    const params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: TABLE_NAME,
      ExpressionAttributeNames: {
        "#path": "path",
      },
      ProjectionExpression: "id, title, description, #path, coverImage, createdBy, createdAt, lastUpdatedBy, lastUpdatedAt, tags, readBy, lastReadAt"
    };

    if (path) {
      params.FilterExpression = "begins_with(#path, :path)";
      params.ExpressionAttributeValues = { ":path": path };
    }

    const articles = await this.docClient.scan(params).promise();
    return articles.Items as ArticleMetadataModel[];
  };

  public findArticleByPath = async(path: string): Promise<ArticleModel | null> => {
    const params = {
      TableName: TABLE_NAME,
      IndexName: GSI,
      KeyConditionExpression: "#path = :path",
      ExpressionAttributeNames: { "#path": "path" },
      ExpressionAttributeValues: { ":path": path }
    };

    const result = await this.docClient.query(params).promise();
    const articleRecord = result.Items.length !== 0 ? result.Items[0] : undefined;

    if (articleRecord?.id) {
      const article = await this.findArticleById(articleRecord.id);
      return article as ArticleModel;
    }
  };

  public findArticleById = async(id: string): Promise<ArticleModel | null> => {
    const articles = await this.docClient
      .get({
        TableName: TABLE_NAME,
        Key: { id: id },
      }).promise();

    return articles.Item as ArticleModel;
  };

  public createArticle = async(article: ArticleModel): Promise<ArticleModel> => {
    await this.docClient
      .put({
        TableName: TABLE_NAME,
        Item: article
      }).promise();

    return article;
  };

  public deleteArticle = async(id: string) => {
    return this.docClient
      .delete({
        TableName: TABLE_NAME,
        Key: { id: id },
      }).promise();
  };

  public updateArticle = async(article: ArticleModel) => {
    await this.docClient
      .put({
        TableName: TABLE_NAME,
        Item: article
      }).promise();
  };

  public updateArticleReadBy = async(id: string, userId: string) => {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: id },
      UpdateExpression: "ADD readBy :userId SET lastReadAt=:newDate",
      ExpressionAttributeValues: {
        ":userId": this.docClient.createSet([userId]),
        ":newDate": new Date().toISOString()
      }
    };

    await this.docClient.update(params).promise();
  };
}

export default ArticlesApiService;