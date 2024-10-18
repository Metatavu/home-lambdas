import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { CreateForecastApiService, ForecastApiService } from "src/database/services/forecast-api-service";
import { Task } from "src/types/forecast/task";
import { Workflow } from "src/types/forecast/workflow";

/**
 * Parameters for lambda
 */
interface ListTasksParameters {
  projectId?: number,
  personId?: number
}

/**
 * Response schema for lambda
 */
interface Response {
  id: string,
  title: string,
  description: string,
  projectId: number,
  remaining: number,
  estimate: number,
  startDate: string,
  endDate: string,
  highPriority: boolean,
  assignedPersons: number[],
  status: string,
  statusCategory: string
}

/**
 * Gets tasks for a project
 * 
 * @param api Instance of ForecastApiService
 * @param parameters Parameters
 * @returns Array of tasks
 */
const listTasks = async (api: ForecastApiService, parameters: ListTasksParameters): Promise<Response[]> => {
  let filteredTasks: Task[];
  let workflowStatuses: Workflow[];
  if (parameters.projectId) {
    const tasks = await api.getTasksByProject(parameters.projectId);
    workflowStatuses = await api.getWorkflowStatusByProject(parameters.projectId);
    filteredTasks = tasks;
    if (parameters.personId) filteredTasks = filteredTasks.filter((task => task.assigned_persons.includes(parameters.personId)));
  } else {
    filteredTasks = await api.getAllTasks();
    if (parameters.personId) filteredTasks = filteredTasks.filter((task => task.assigned_persons.includes(parameters.personId)));
  }

  return filteredTasks.map(task => {
    let status: Workflow;
    if (workflowStatuses && workflowStatuses.length>0) status = workflowStatuses.find((status)=>{return status.id === task.workflow_column});
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      projectId: task.project_id,
      remaining: task.remaining,
      estimate: task.estimate,
      startDate: task.start_date,
      endDate: task.end_date,
      highPriority: task.high_priority,
      assignedPersons: task.assigned_persons,
      status: status?.name || "",
      statusCategory: status?.category || ""
    }
  });
}

/**
 * Lambda for listing Forecast tasks
 * 
 * @param event event
 */
const listTasksHandler: ValidatedEventAPIGatewayProxyEvent<any> = async event => {
  const api = CreateForecastApiService();
  const { queryStringParameters } = event;

  const tasks = await listTasks(api, {
    projectId: queryStringParameters && parseInt(queryStringParameters.projectId),
    personId: queryStringParameters && parseInt(queryStringParameters.personId)
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify(tasks)
  };
};

export const main = middyfy(listTasksHandler);