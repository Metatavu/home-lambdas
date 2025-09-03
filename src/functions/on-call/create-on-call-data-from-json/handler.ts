import { DynamoDB } from "aws-sdk";
import { middyfy } from "@libs/lambda";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";

/**
 */
export const onCallImportFromJsonHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
	const { year, data } = event.body || {};

	if (!year || year < 2020 || year > new Date().getFullYear()) {
		return {
			statusCode: 400,
			body: "Invalid or missing year"
		};
	}
	if (!Array.isArray(data)) {
		return {
			statusCode: 400,
			body: "Data must be an array"
		};
	}

	const dynamoDb = new DynamoDB.DocumentClient();
	let imported = 0;
	let errors: any[] = [];

	for (const entry of data) {
		if (
			typeof entry.Week !== "number" ||
			typeof entry.Username !== "string" ||
			entry.Week < 1 || entry.Week > 52
		) {
			errors.push({ entry, error: "Invalid entry" });
			continue;
		}
		try {
			await dynamoDb.put({
				TableName: "OnCallSchedule",
				Item: {
					Year: year,
					Week: entry.Week,
					Username: entry.Username,
					Paid: false
				}
			}).promise();
			imported++;
		} catch (err) {
			errors.push({ entry, error: err });
		}
	}

	return {
		statusCode: errors.length ? 207 : 200,
		body: JSON.stringify({ imported, errors })
	};
};

export const main = middyfy(onCallImportFromJsonHandler);
