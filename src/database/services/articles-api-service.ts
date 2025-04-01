import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ArticleMetadataModel, ArticleModel } from "../models/article";

const TABLE_NAME = "Articles";
const gsiPath = "GSI_Path";
const gsiSorting = "GSI_Sorting";

interface FilterOption {
  readBy?: string;
  path?: string;
  tags?: string;
  title?: string;
}

class ArticlesApiService {
  constructor(private readonly docClient: DocumentClient) {}

  public listArticles = async(option: FilterOption): Promise<ArticleMetadataModel[]> => {
    const params: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: TABLE_NAME,
      IndexName: gsiSorting,
      KeyConditionExpression: "#group = :group",
      ExpressionAttributeNames: { "#group": "group" },
      ExpressionAttributeValues: { ":group": "article" },
      ScanIndexForward: false
    };

    if (option.readBy) {
      params.FilterExpression = "contains(readBy, :readBy)";
      params.ExpressionAttributeValues = { ...params.ExpressionAttributeValues, ":readBy": option.readBy };
    }

    if (option.path) {
      params.FilterExpression = params.FilterExpression 
        ? params.FilterExpression + " AND " + "begins_with(#path, :path)"
        : "begins_with(#path, :path)";
      params.ExpressionAttributeValues = { ...params.ExpressionAttributeValues, ":path": option.path };
      params.ExpressionAttributeNames = { ...params.ExpressionAttributeNames, "#path": "path" };
    }

    if (option.title) {
      params.FilterExpression = params.FilterExpression 
        ? params.FilterExpression + " AND " + "contains(title, :title)"
        : "contains(title, :title)";
      params.ExpressionAttributeValues = { ...params.ExpressionAttributeValues, ":title": option.title };
    }

    if (option.tags) {
      const tags = option.tags.split(";");

      tags.map((tag, index) => {
        params.FilterExpression = params.FilterExpression 
          ? params.FilterExpression + " AND " + `contains(tags, :tag${index})`
          : `contains(tags, :tag${index})`;
        params.ExpressionAttributeValues = { ...params.ExpressionAttributeValues, [`:tag${index}`]: tag };
      })
    }

    const articles = await this.docClient.query(params).promise();
    return articles.Items as ArticleMetadataModel[];
  };

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
      UpdateExpression: "ADD readBy :userId SET lastReadAt=:newDate SET lastUpdatedAt=:newDate",
      ExpressionAttributeValues: {
        ":userId": this.docClient.createSet([userId]),
        ":newDate": new Date().toISOString()
      }
    };

    await this.docClient.update(params).promise();
  };
}

export default ArticlesApiService;