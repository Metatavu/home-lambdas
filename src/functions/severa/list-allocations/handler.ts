import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreateSeveraApiService, SeveraApiService } from "src/apis/severa-api-service";

/**
 * Parameters for lambda
 */
interface ListAllocationsParameters {
  startDate?: Date,
  endDate?: Date,
  userGuids?: string,
  projectGuids?: string,
}

/**
 * TODO this TYPE what we want from allocations
 */
interface Response {
  id: number,
  project: number,
  person: number,
  startDate: string,
  endDate: string,
}

/**
 * Gets and filters allocations
 *
 * @param api Instance of ForecastApiService
 * @param currentDate Current date
 * @param parameters Parameters
 * @returns Array of allocations
 */

//TODO return type
const listAllocations = async (api: SeveraApiService, currentDate: Date, parameters: ListAllocationsParameters) => {
  const allocations = await api.getAllocations(parameters);
  console.log(allocations)
  return allocations
}

/**
 * Lambda for listing Forecast allocations
 *
 * @param event event
 */
const listAllocationsHandler: ValidatedEventAPIGatewayProxyEvent<ListAllocationsParameters> = async event => {

  const api = CreateSeveraApiService();

  // Ensure TypeScript knows the expected structure
  const { queryStringParameters } = event;
  const allocations = await listAllocations(api, new Date(), {
    startDate: queryStringParameters && new Date(queryStringParameters.startDate),
    endDate: queryStringParameters && new Date(queryStringParameters.endDate),
    userGuids: queryStringParameters?.userGuids,
    projectGuids: queryStringParameters?.projectGuids,
  });

  console.log(allocations)

  return {
    statusCode: 200,
    body: JSON.stringify(allocations)
  };
};

export const main = middyfy(listAllocationsHandler);