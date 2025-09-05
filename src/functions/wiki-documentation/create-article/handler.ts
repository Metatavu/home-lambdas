import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ArticleModel } from "src/database/models/article";
import { middyfy } from "src/libs/lambda";
import { v4 as uuidv4 } from "uuid";
import ArticlesApiService from "src/database/services/articles-api-service";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const articleService = new ArticlesApiService(docClient);

/**
 * Handler for creating a new article entry in DynamoDB.
 *
 * @param event - API Gateway event containing the request body.
 * @returns Response object with status code
 */
export const createArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
          code: 400,
          message: 'Request body is required.'
        }
      ),
    };
  }

  const {
    path,
    title,
    content,
    createdBy,
    description,
    coverImage,
    tags,
    draft
  } = (typeof event.body === "string" ? JSON.parse(event.body) : event.body);

  if (!path || !title || !content || !createdBy) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        code: 400,
        message: "Some required data is missing." 
      })
    };
  }

  try {
    const articleExistsWithPath = await articleService.findArticleByPath(path);
    if (articleExistsWithPath) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          code: 500,
          message: `Article with the path ${path} already exists.`
        })
      }
    }

    const createdAt = new Date().toISOString();
    const newArticle: ArticleModel = {
      id: uuidv4(),
      path: path,
      title: title,
      description: description,
      content: content,
      coverImage: coverImage,
      createdBy: createdBy,
      createdAt: createdAt,
      lastUpdatedBy: createdBy,
      lastUpdatedAt: createdAt,
      lastReadAt: createdAt,
      readBy: [createdBy],
      tags: tags || [],
      draft: draft,
    };

    const articleCreated = await articleService.createArticle(newArticle);
    return {
      statusCode: 200,
      body: JSON.stringify(articleCreated),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        code: 500,
        error: "Failed to create new article.", 
      })
    };
  }
};

export const main = middyfy(createArticleHandler);