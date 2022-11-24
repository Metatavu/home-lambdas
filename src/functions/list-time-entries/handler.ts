import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreateForecastApiService, ForecastApiService } from "src/apis/forecast-api-service";

/**
 * Parameters for lambda
 */
export interface ListTimeEntriesParameters {
  projectId: number
}

/**
 * Response schema for lambda
 */
export interface Response {
  id: number,
  person: number,
  project: number,
  task: number,
  timeRegistered: number;
}

/**
 * Gets time entries for a project
 * 
 * @param api Instance of ForecastApiService
 * @param parameters Parameters
 * @returns Array of time entries
 */
const listTimeEntries = async (api: ForecastApiService, parameters: ListTimeEntriesParameters): Promise<Response[]> => {
  const timeEntries = await api.getTimeEntriesByProject(parameters.projectId);

  return timeEntries.map(timeEntry => {
    return {
      id: timeEntry.id,
      person: timeEntry.person,
      project: timeEntry.project,
      task: timeEntry.task,
      timeRegistered: timeEntry.time_registered,
    }
  });
}

/**
 * Lambda for listing Forecast time entries
 * 
 * @param event event
 */
const listTimeEntriesHandler: ValidatedEventAPIGatewayProxyEvent<any> = async event => {
  if (!event.queryStringParameters.projectId) {
    return {
      statusCode: 400,
      body: "Invalid parameters"
    };
  }

  const api = CreateForecastApiService();
  
  const timeEntries = await listTimeEntries(api, {
    projectId: parseInt(event.queryStringParameters.projectId),
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify(timeEntries)
  };
}

export const main = middyfy(listTimeEntriesHandler);