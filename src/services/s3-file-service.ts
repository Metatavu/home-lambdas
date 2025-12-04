import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const HOME_BUCKET_NAME = process.env.HOME_BUCKET_NAME;
const HOME_BUCKET_REGION = process.env.HOME_BUCKET_REGION;

if (!HOME_BUCKET_NAME) {
  throw new Error("HOME_BUCKET_NAME is not defined in environment variables");
}

if (!HOME_BUCKET_REGION) {
  throw new Error("HOME_BUCKET_REGION is not defined in environment variables");
}

const s3Client = new S3Client({ region: HOME_BUCKET_REGION });

/**
 * Function generates presigned url
 *
 * @param path  path to file in S3
 * @param operation put or get
 * @param contentType contentType of the file
 * @returns Signed URL string
 */
export const generatePreSignedUrl = async (
  path: string,
  operation: "get" | "put" = "get",
  contentType?: string
) => {
  // Remove leading slashes from the path
  const cleanPath = path.replace(/^\/+/, "");

  const command =
    operation === "get"
      ? new GetObjectCommand({
          Bucket: HOME_BUCKET_NAME,
          Key: cleanPath
        })
      : new PutObjectCommand({
          Bucket: HOME_BUCKET_NAME,
          Key: cleanPath,
          ContentType: contentType
        });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
