import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { generatePreSignedUrl } from "src/services/s3-file-service";

/**
 * Handler for creating a presigned URL for file uploads.
 */
const uploadFileHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  console.log("Received event:", JSON.stringify(event));

  let parsedBody: any;
  try {
    parsedBody = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    console.log("Parsed body:", parsedBody);
  } catch (err) {
    console.error("Failed to parse JSON body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Invalid JSON body."
      })
    };
  }

  const { path, contentType } = parsedBody || {};
  console.log("Extracted path and contentType:", { path, contentType });

  if (!path) {
    console.warn("Missing path in request body");
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Invalid request body: missing path."
      })
    };
  }

  if (!contentType || !contentType.startsWith("image/")) {
    console.warn("Invalid or missing contentType:", contentType);
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Invalid or missing file type."
      })
    };
  }

  try {
    console.log("Generating presigned URL for:", { path, contentType });
    const presignedUrl = await generatePreSignedUrl(path, "put", contentType);
    console.log("Presigned URL generated:", presignedUrl);

    return {
      statusCode: 200,
      body: JSON.stringify({ data: presignedUrl })
    };
  } catch (error: any) {
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
