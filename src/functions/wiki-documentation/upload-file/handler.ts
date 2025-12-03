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
  console.log("=== uploadFileHandler invoked ===");
  console.log("Raw event:", JSON.stringify(event, null, 2));
  console.log("Raw body:", event.body);

  const { body } = event;
  let path: string | undefined;
  let contentType: string | undefined;
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    path = parsed?.path;
    contentType = parsed?.contentType;
    console.log("Parsed body:", parsed);
    console.log("path:", path);
    console.log("contentType:", contentType);
  } catch (Error_) {
    console.error("JSON parsing failed:", Error_);
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Invalid JSON body."
      })
    };
  }

  if (!path) {
    console.warn("Missing path");
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Invalid request body."
      })
    };
  }

  if (!contentType?.startsWith("image/")) {
    console.warn("Invalid contentType:", contentType);
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Invalid file type."
      })
    };
  }

  try {
    console.log("Calling generatePreSignedUrl:", { path, method: "put", contentType });
    const presignedUrl = await generatePreSignedUrl(path, "put", contentType);
    console.log("Presigned URL generated:", presignedUrl);

    return {
      statusCode: 200,
      body: JSON.stringify({ data: presignedUrl })
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
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
