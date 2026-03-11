import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { isAdminUser } from "src/libs/auth-utils";

/**
 * Parameters for creating a presigned URL with S3 client
 * @region AWS region where the S3 bucket is located
 * @bucket Name of the S3 bucket
 * @key S3 object key (path) where the file will be stored
 * @contentType MIME type of the file to be uploaded
 */
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
 * Lambda function that returns a presigned URL for a PUT request to upload a file to the specified Amazon S3 bucket
 */
const uploadFileHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { HOME_BUCKET_NAME, HOME_BUCKET_REGION } = process.env;
  const { body } = event;

  const responseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
  };
  let path: string | undefined;
  let contentType: string | undefined;
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    path = parsed?.path;
    contentType = parsed?.contentType;
  } catch (error) {
    console.error("JSON parsing failed:", error);
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

  const isPdf = contentType === "application/pdf";
  const isImage = contentType?.startsWith("image/");

  // PDFs are admin-only — they feed the document import pipeline.
  // Images are available to all authenticated wiki users.
  if (!isImage && !isPdf) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        code: 400,
        message: "Only image files and PDFs are supported."
      })
    };
  }

  if (isPdf && !isAdminUser(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        code: 403,
        message: "PDF uploads require admin privileges."
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
      headers: responseHeaders,
      body: JSON.stringify({
        error: false,
        data: presignedUrl
      })
    };
  } catch (error) {
    return {
      statusCode: error.statusCode ?? 500,
      headers: responseHeaders,
      body: JSON.stringify({
        error: true,
        message: error.message
      })
    };
  }
};

export const main = middyfy(uploadFileHandler);
