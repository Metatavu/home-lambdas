import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ArticleModel } from "../models/article";

const TABLE_NAME = "Articles";
const GSI = "type-index";

class ArticlesApiService {
  constructor(private readonly docClient: DocumentClient) {}

  public listArticles = async(idAttribute?: string): Promise<ArticleModel[]> => {
    if (!idAttribute) {
      const params = {
        TableName: TABLE_NAME,
        IndexName: GSI,
        KeyConditionExpression: "#type = :articleType",
        ExpressionAttributeNames: {
          "#type": "type"
        },
        ExpressionAttributeValues: {
          ":articleType": "article"
        },
        ScanIndexForward: false
      };
      const result = await this.docClient.query(params).promise();
      const articles = result.Items;
      return articles as ArticleModel[];
    }

    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "#id = :idValue",
      ExpressionAttributeNames: {
        "#id": "id"
      },
      ExpressionAttributeValues: {
        ":idValue": idAttribute
      },
      ScanIndexForward: false
    };

    const result = await this.docClient.query(params).promise();
    const articleIds = result.Items.flatMap(item => (item.sk!=="tag" ? [{id: item.articleId, articleCreatedAt: item.articleCreatedAt}] : []));

    const batchParams = {
      RequestItems: {
        [TABLE_NAME]: {
          Keys: articleIds.map(item => ({ id: item.id, sk: item.articleCreatedAt }))
        }
      }
    };

    const batchResult = await this.docClient.batchGet(batchParams).promise();
    const articles = batchResult.Responses[TABLE_NAME];
    return articles as ArticleModel[];
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
}

export default ArticlesApiService;