import { S3 } from "aws-sdk"
import { PaidData, UpdatePaidRequestBody } from "../../../types/on-call"
import S3Utils from "@libs/s3-utils";
import Config from "src/app/config";
import { middyfy } from "@libs/lambda";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";

/**
 * Lambda method for updating paid data
 * 
 * @param event event
 */
export const updatePaidHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const { year, week, paid } = event.body as UpdatePaidRequestBody;

  if (!year || year < 2020 || year > new Date().getFullYear()) {
    throw new Error("Invalid year");
  }

  if (!week || week < 1 || week > 53) {
    throw new Error("Invalid week");
  }

  if (paid === undefined) {
    throw new Error("Invalid paid status");
  }

  const s3 = new S3();
  const bucket = Config.get().onCall.bucketName;
  const paidFile = "paid.json";

  const paidData = await S3Utils.loadJson<PaidData>(s3, bucket, paidFile) || {};
  if (!paidData[year]) paidData[year] = {}
  paidData[year][week] = paid;
  await S3Utils.saveJson(s3, bucket, paidFile, paidData);

  return {
    statusCode: 200,
    body: "Paid status updated"
  };

};
export const main = middyfy(updatePaidHandler);