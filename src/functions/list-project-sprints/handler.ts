import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreateForecastApiService, ForecastApiService } from "src/apis/forecast-api-service";

/**
 * Parameters for lambda
 */
export interface ListProjectSprintsParameters {
  projectId: number,
}

/**
 * Response schema for lambda
 */
export interface Response {
  id: number,
  name: string,
  startDate: string,
  endDate: string,
}

/**
 * Gets sprints for a project
 * 
 * @param api Instance of ForecastApiService
 * @param parameters Parameters
 * @returns Array of sprints
 */
const listProjectSprints = async (api: ForecastApiService, parameters: ListProjectSprintsParameters): Promise<Response[]> => {
  const sprints = await api.getProjectSprints(parameters.projectId);

  const filteredSprints = sprints.filter(sprint => sprint.id === parameters.projectId);

  return filteredSprints.map(sprint => {
    return {
      id: sprint.id,
      name: sprint.name,
      startDate: sprint.start_date,
      endDate: sprint.end_date,
    };
  });
}

/**
 * Lambda for listing Forecast project sprints
 * 
 * @param event event
 */
const listProjectSprintsHandler: ValidatedEventAPIGatewayProxyEvent<any> = async event => {
  if (!event.queryStringParameters.projectId) {
    return {
      statusCode: 400,
      body: "Invalid parameters"
    };
  }

  const api = CreateForecastApiService();

  const projectSprints = await listProjectSprints(api, {
    projectId: parseInt(event.queryStringParameters.projectId)
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify(projectSprints)
  };
}

export const main = middyfy(listProjectSprintsHandler);