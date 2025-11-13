import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { generatePreSignedUrl } from "src/services/s3-file-service";

/**
 * Handler for creating a presigned url for the following file upload.
 *
 * @param event - API Gateway event.
 * @returns Response object with status code.
 */
const uploadFileHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { body } = event;
  const { path, contentType } = typeof body === "string" ? JSON.parse(body) : body;

  if (!path)
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Invalid request body."
      })
    };

  if (!contentType.startsWith("image/"))
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Invalid file type."
      })
    };

  try {
    const presignedUrl = await generatePreSignedUrl(path, contentType);
    return {
      statusCode: 200,
      body: JSON.stringify({ data: presignedUrl })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 500,
        message: `Error uploading file: ${error.message}`
      })
    };
  }
};

export const main = middyfy(uploadFileHandler);
