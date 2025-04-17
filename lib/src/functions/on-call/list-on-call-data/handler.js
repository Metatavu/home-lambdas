import { S3 } from "aws-sdk";
import S3Utils from "@libs/s3-utils";
import { middyfy } from "@libs/lambda";
import Config from "../../../app/config";
export const listOnCallDataHandler = async (event) => {
    const { queryStringParameters } = event;
    if (!queryStringParameters || !queryStringParameters.year) {
        return {
            statusCode: 400,
            body: "Missing parameters"
        };
    }
    const year = parseInt(queryStringParameters.year);
    if (!year || year < 2020 || year > new Date().getFullYear()) {
        return {
            statusCode: 400,
            body: "Invalid year"
        };
    }
    const s3 = new S3();
    const nameMapFile = "name-map.json";
    const yearFile = `${year}.json`;
    const paidFile = "paid.json";
    const bucket = Config.get().onCall.bucketName;
    const nameMap = await S3Utils.loadJson(s3, bucket, nameMapFile) || {};
    const data = await S3Utils.loadJson(s3, bucket, yearFile);
    const paidData = await S3Utils.loadJson(s3, bucket, paidFile) || {};
    if (!data || !nameMap || !paidData) {
        return {
            statusCode: 204,
            body: "No content"
        };
    }
    return {
        statusCode: 200,
        body: JSON.stringify(data.map((entry) => {
            return {
                ...entry,
                Person: nameMap[entry.Person] || entry.Person,
                Paid: paidData[year] && paidData[year][entry.Week] || false
            };
        }))
    };
};
export const main = middyfy(listOnCallDataHandler);
//# sourceMappingURL=handler.js.map