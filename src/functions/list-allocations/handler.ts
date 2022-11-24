import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { isTokenValid } from "@libs/auth-utils";
import { FilterUtilities } from "@libs/filter-utils";
import { middyfy } from "@libs/lambda";
import { CreateForecastApiService, ForecastApiService } from "src/apis/forecast-api-service";
import { AccessToken } from "src/types";

/**
 * Parameters for lambda
 */
export interface ListAllocationsParameters {
  startDate?: Date,
  endDate?: Date,
  personId?: string,
  projectId?: string,
}

/**
 * Response schema for lambda
 */
export interface Response {
  id: number,
  project: number,
  person: number,
  startDate: string,
  endDate: string,
  monday: number,
  tuesday: number,
  wednesday: number,
  thursday: number,
  friday: number,
  notes: string,
}

/**
 * Gets and filters allocations
 * 
 * @param api Instance of ForecastApiService
 * @param currentDate Current date
 * @param parameters Parameters
 * @returns Array of allocations
 */
const listAllocations = async (api: ForecastApiService, currentDate: Date, parameters: ListAllocationsParameters): Promise<Response[]> => {
  const allocations = await api.getAllocations();

  const filteredAllocations = allocations.filter(allocation => {
    return FilterUtilities.filterByDate(allocation, currentDate, parameters) 
        && FilterUtilities.filterByProject(allocation.project, parameters.projectId) 
        && FilterUtilities.filterByPerson(allocation.person, parameters.personId);
  });

  return filteredAllocations.map(allocation => {
    return {
      id: allocation.id,
      project: allocation.project,
      person: allocation.person,
      startDate: allocation.start_date,
      endDate: allocation.end_date,
      monday: allocation.monday,
      tuesday: allocation.tuesday,
      wednesday: allocation.wednesday,
      thursday: allocation.thursday,
      friday: allocation.friday,
      notes: allocation.notes,
    }
  });
}

/**
 * Lambda for listing Forecast allocations
 * 
 * @param event event
 */
const listAllocationsHandler: ValidatedEventAPIGatewayProxyEvent<any> = async event => {
  const { headers: { accessToken } } = event;

  const castToken = accessToken;
  const auth = isTokenValid(JSON.parse(JSON.stringify(castToken)));
  if (!auth) {
    return {
      statusCode: 401,
      body: "Unauthorized"
    };
  }

  const api = CreateForecastApiService();

  const allocations = await listAllocations(api, new Date(), {
    startDate: new Date(event.queryStringParameters.startDate),
    endDate: new Date(event.queryStringParameters.endDate),
    personId: event.queryStringParameters.personId,
    projectId: event.queryStringParameters.projectId,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(allocations)
  };
};

export const main = middyfy(listAllocationsHandler);