import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { filterByDate, filterByPerson, filterByProject } from "@libs/filter-utils";
// import { parseBearerAuth } from '@libs/auth-utils';
import { middyfy } from "@libs/lambda";
import { CreateForecastApiService, ForecastApiService } from "src/apis/forecast-api-service";

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
async function listAllocationsFunction(api: ForecastApiService, currentDate: Date, parameters: ListAllocationsParameters): Promise<Response[]> {
  const allocations = await api.getAllocations();

  const filteredAllocations = allocations.filter(allocation => {
    if (filterByDate(allocation, currentDate, parameters)
     && filterByProject(allocation, parameters)
     && filterByPerson(allocation, parameters)) {
      return true;
    }

    return false;
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
const listAllocations: ValidatedEventAPIGatewayProxyEvent<any> = async event => {
  // const { headers: { authorization, Authorization } } = event;

  // TODO: parseBearerAuth not working yet
  // const auth = parseBearerAuth(authorization || Authorization);
  // if (!auth) {
  //   return {
  //     statusCode: 401,
  //     body: "Unauthorized"
  //   };
  // }
  
  const api = CreateForecastApiService();

  const allocations = await listAllocationsFunction(api, new Date(), {
    startDate: new Date(event.queryStringParameters.start_date),
    endDate: new Date(event.queryStringParameters.endDate),
    personId: event.queryStringParameters.personId,
    projectId: event.queryStringParameters.projectId,
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify(allocations)
  };
};

export const main = middyfy(listAllocations);