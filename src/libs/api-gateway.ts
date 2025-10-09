import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda";
import type { FromSchema } from "json-schema-to-ts";
import type schema from "src/types/meta-assistant/index";
import type { DailyMessageResult, WeeklyMessageResult } from "src/types/meta-assistant/index";

export const formatJSONResponse = (response: Record<string, unknown>) => {
  return {
    statusCode: 200,
    body: JSON.stringify(response)
  };
};

/**
 * ValidatedAPIGatewayProxyEvent<S> data type for serverless lambda function
 */
export type ValidatedAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, "body"> & {
  body: FromSchema<S>;
};

/**
 * ValidatedEventAPIGatewayProxyEvent<S> data type for serverless lambda function
 */
export type ValidatedEventAPIGatewayProxyEvent<S> = Handler<
  ValidatedAPIGatewayProxyEvent<S>,
  APIGatewayProxyResult
>;

/**
 * Type for DailyHandlerResponse
 */
export type DailyHandlerResponse = {
  message: string;
  data?: DailyMessageResult[];
  event?: ValidatedAPIGatewayProxyEvent<typeof schema>;
};

/**
 * Type for WeeklyHandlerResponse
 */
export type WeeklyHandlerResponse = {
  message: string;
  data?: WeeklyMessageResult[];
  event?: ValidatedAPIGatewayProxyEvent<typeof schema>;
};
