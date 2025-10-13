import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import type { ArticleModel } from "src/database/models/article";
import { middyfy } from "src/libs/lambda";
import { v4 as uuidv4 } from "uuid";
import { articlesApiService } from "src/database/services";
import type { Article } from "src/generated/homeLambdasModels/model/article";

/**
 * Handler for creating a new article entry in DynamoDB.
 *
 * @param event - API Gateway event containing the request body.
 * @returns Response object with status code
 *
 */
export const createArticleHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Request body is required."
      })
    };
  }

  const { path, title, content, createdBy, description, coverImage, tags, draft } =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;

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
    const articleExistsWithPath = await articlesApiService.findArticleByPath(path);
    if (articleExistsWithPath) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          code: 500,
          message: `Article with the path ${path} already exists.`
        })
      };
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
      draft: draft
    };

    const articleCreated = await articlesApiService.createArticle(newArticle);
    return {
      statusCode: 200,
      body: JSON.stringify(articleCreated)
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 500,
        error: "Failed to create new article."
      })
    };
  }
};

export const main = middyfy(createArticleHandler);
