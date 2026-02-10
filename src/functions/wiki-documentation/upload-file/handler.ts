import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";

type CreatePresignedUrlWithClientParams = {
  region: string;
  bucket: string;
  key: string;
  contentType: string;
};

/**
 * Create a presigned URL for a PUT request to upload a file to the specified Amazon S3 bucket
 *
 * @param params {CreatePresignedUrlWithClientParams}
 * @returns A promise that resolves to the presigned URL
 */
const createPresignedUrlWithClient = ({
  region,
  bucket,
  key,
  contentType
}: CreatePresignedUrlWithClientParams) => {
  const client = new S3Client({ region: region });
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
};

/**
 * We need to respond with adequate CORS headers.
 */
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true
};

/**
 * Lambda function that returns a presigned URL for a PUT request to upload a file to the specified Amazon S3 bucket
 */
const uploadFileHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { HOME_BUCKET_NAME, HOME_BUCKET_REGION } = process.env;
  const { body } = event;
  let path: string | undefined;
  let contentType: string | undefined;
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    path = parsed?.path;
    contentType = parsed?.contentType;
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

  /**NOTE: LIMITED TO ONLY IMAGES FOR NOW. FUTURE TASK CAN BE IMPORT PLAYBOOK,PDFS IN WIKI AND BREAK THEM DOWN TO
   * TEXT/MARKDOWN WHERE POSSIBLE LIKE OTHER ARTICLES.
   */
  if (!contentType || !contentType.startsWith("image/")) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Invalid file type."
      })
    };
  }

  if (!HOME_BUCKET_NAME || !HOME_BUCKET_REGION) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 500,
        message: "Invalid lambda environment variables"
      })
    };
  }
  try {
    const presignedUrl = await createPresignedUrlWithClient({
      region: HOME_BUCKET_REGION,
      bucket: HOME_BUCKET_NAME,
      key: path,
      contentType: contentType
    });

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        error: false,
        data: presignedUrl
      })
    };
  } catch (error) {
    return {
      statusCode: error.statusCode ?? 500,
      headers: headers,
      body: JSON.stringify({
        error: true,
        message: error.message
      })
    };
  }
};

export const main = middyfy(uploadFileHandler);
