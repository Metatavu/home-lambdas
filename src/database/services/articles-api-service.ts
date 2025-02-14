import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ArticleModel } from "../models/article";

const TABLE_NAME = "Articles";
const GSI = "GSI_Path";

class ArticlesApiService {
  constructor(private readonly docClient: DocumentClient) {}

  public listArticles = async(path?: string): Promise<ArticleModel[]> => {
    const params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: TABLE_NAME,
      ExpressionAttributeNames: {
        "#path": "path",
      },
      ProjectionExpression: "id, title, description, #path, coverImage, createdBy, createdAt, lastUpdatedBy, lastUpdatedAt, tags, readBy"
    };

    if (path) {
      params.FilterExpression = "begins_with(#path, :path)";
      params.ExpressionAttributeValues = { ":path": path };
    }

    const articles = await this.docClient.scan(params).promise();
    return articles.Items as ArticleModel[];
  };

  public createArticle = async(article: ArticleModel): Promise<ArticleModel> => {
    await this.docClient
      .put({
        TableName: TABLE_NAME,
        Item: article
      })
      .promise();

    return article;
  }

  public deleteArticle = async(id: string) => {
    return this.docClient
      .delete({
        TableName: TABLE_NAME,
        Key: {
          id: id
        },
      })
      .promise();
  }

  public findArticle = async(path: string) => {
    const params = {
      TableName: TABLE_NAME,
      IndexName: GSI,
      KeyConditionExpression: "#path = :path",
      ExpressionAttributeNames: {
        "#path": "path"
      },
      ExpressionAttributeValues: {
        ":path": path
      }
    };

    const result = await this.docClient.query(params).promise();
    const article = result.Items.length !== 0 ? result.Items[0] : undefined;
    return article;
  }
}

export default ArticlesApiService;