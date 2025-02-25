import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const { HOME_BUCKET_NAME, HOME_BUCKET_REGION } = process.env;
const s3Client = new S3Client({ region: HOME_BUCKET_REGION });

export const generatePreSignedUrl = async(path: string, operation: "get"|"put" = "get", contentType?: string) => {
  const command = operation === "get" ? 
  new GetObjectCommand({
    Bucket: HOME_BUCKET_NAME,
    Key: path
  })
  : new PutObjectCommand({
    Bucket: HOME_BUCKET_NAME,
    Key: path,
    ContentType: contentType
  })

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}