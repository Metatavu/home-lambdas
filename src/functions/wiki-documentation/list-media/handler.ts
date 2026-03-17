import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { middyfy } from "@libs/lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import Config from "src/app/config";

const config = Config.get();
const { name: HOME_BUCKET_NAME, region: HOME_BUCKET_REGION } = config.homeBucket;

/**
 * Handler for listing media files from S3 bucket.
 *
 * @param event - API Gateway event.
 * @returns Response object with status code and list of files.
 */
const listMediaHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const s3Client = new S3Client({ region: HOME_BUCKET_REGION });
    const path = event.queryStringParameters?.path || "";

    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: HOME_BUCKET_NAME,
      Prefix: path
    });

    const { Contents } = await s3Client.send(listObjectsCommand);

    const files = Contents ? Contents.map((obj) => obj.Key) : [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        error: false,
        data: files
      })
    };
  } catch (error) {
    return {
      statusCode: error.statusCode ?? 500,
      body: JSON.stringify({
        code: error.statusCode ?? 500,
        message: `Failed to list media files: ${error.message}`
      })
    };
  }
};

export const main = middyfy(listMediaHandler);
