import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { FilterUtilities } from "@libs/filter-utils";
import { middyfy } from "@libs/lambda";
import { CreateForecastApiService, ForecastApiService } from "src/apis/forecast-api-service";

/**
 * Parameters for lambda
 */
interface ListProjectsParameters {
  startDate?: Date,
  endDate?: Date,
  projectId?: string
}

/**
 * Response schema for lambda
 */
interface Response {
  id: number,
  name: string,
  startDate: string,
  endDate: string,
  status: string,
  stage: string,
  color: string
}

/**
 * Gets and filters projects
 * 
 * @param api Instance of ForecastApiService
 * @param currentDate Current date
 * @param parameters Parameters
 * @returns Array of projects
 */
const listProjects = async (api: ForecastApiService, currentDate: Date, parameters: ListProjectsParameters): Promise<Response[]> => {
  const projects = await api.getProjects();

  const filteredProjects = projects.filter(project => {
    return FilterUtilities.filterByDate(project, currentDate, parameters) && project.stage == "RUNNING";
  });

  return filteredProjects.map(project => {
    return {
      id: project.id,
      name: project.name,
      startDate: project.start_date,
      endDate: project.end_date,
      status: project.status,
      stage: project.stage,
      color: project.color
    }
  })
} 

/**
 * Gets project by id
 * 
 * @param api Instance of ForecastApiService
 * @param parameters Parameters
 * @returns A single project
 */
const listProject = async (api: ForecastApiService, parameters: ListProjectsParameters): Promise<Response> => {
  const project = await api.getProject(parameters.projectId);
  
  return {
    id: project.id,
    name: project.name,
    startDate: project.start_date,
    endDate: project.end_date,
    status: project.status,
    stage: project.stage,
    color: project.color
  }
}

/**
 * Lambda for listing Forecast projects
 * 
 * @param event event
 */
const listProjectsHandler: ValidatedEventAPIGatewayProxyEvent<any> = async event => {
  const api = CreateForecastApiService();
  const { queryStringParameters } = event;

  if (queryStringParameters && queryStringParameters.projectId){
    const project = await listProject(api, {projectId: event.queryStringParameters.projectId});
    if (!project.id) {
      return {
        statusCode: 204,
        body: "Invalid projectId"
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify([project])
    };
  }

  const filteredProjects = await listProjects(api, new Date(), {
    startDate: queryStringParameters && new Date(queryStringParameters.startDate),
    endDate: queryStringParameters && new Date(queryStringParameters.endDate)
  })
  
  return {
    statusCode: 200,
    body: JSON.stringify(filteredProjects)
  };
}

export const main = middyfy(listProjectsHandler);