import { Allocation } from "./schemas/forecast/allocation";
import { Project } from "./schemas/forecast/project";
import { Task } from "./schemas/forecast/task";
import { Workflow } from "./schemas/forecast/workflow";
import fetch from "node-fetch";

export interface ForecastApiService {
	getAllocations: () => Promise<Allocation[]>;
  getAllocation: (allocationId: string) => Promise<Allocation>;
	getProjects: () => Promise<Project[]>;
	getProject: (projectId: string) => Promise<Project>;
	getTasksByProject: (projectId: number) => Promise<Task[]>;
	getAllTasks: () => Promise<Task[]>;
  getTask: (taskId: string) => Promise<Task>;
	getWorkflowStatusByProject: (projectId: number) => Promise<Workflow[]>
	getProjectSprints: (projectId: number) => Promise<Sprint[]>;
	getTimeEntriesByProject: (projectId: number) => Promise<TimeEntry[]>;
}

/**
 * Creates ForecastApiService
 */
export function CreateForecastApiService(): ForecastApiService {
	const apiKey: string = process.env.FORECAST_API_KEY;

	return {
		/**
		 * Gets all allocations from the api
		 *
		 * @returns List of allocations
		 */
		async getAllocations(): Promise<Allocation[]> {
			const response = await fetch("https://api.forecast.it/api/v1/allocations", { headers: { "X-FORECAST-API-KEY": apiKey } });

			return response.json();
		},

    /**
		 * Gets single allocation by id from the api
		 *
		 * @returns allocation
		 */
		async getAllocation(allocationId: string): Promise<Allocation> {
			const response = await fetch(`https://api.forecast.it/api/v1/allocations/${allocationId}`, { headers: { "X-FORECAST-API-KEY": apiKey } });

			return response.json();
		},

		/**
		 * Gets all projects from the api
		 *
		 * @returns List of projects
		 */
		async getProjects(): Promise<Project[]> {
			const response = await fetch("https://api.forecast.it/api/v1/projects", { headers: { "X-FORECAST-API-KEY": apiKey } });

			return response.json();
		},

		/**
		 * Gets single project by id from the api
		 *
		 * @returns project by id
		 */
		async getProject(projectId: string): Promise<Project> {
			const response = await fetch(`https://api.forecast.it/api/v1/projects/${projectId}`, { headers: { "X-FORECAST-API-KEY": apiKey } });

			return response.json();
		},

		/**
		 * Gets all tasks from the api filtered by project id
		 *
		 * @param projectId Id of project
		 * @returns List of tasks
		 */
		async getTasksByProject(projectId: number): Promise<Task[]> {
			const response = await fetch(`https://api.forecast.it/api/v3/projects/${projectId}/tasks`, { headers: { "X-FORECAST-API-KEY": apiKey } });

			return response.json();
		},

		/**
		 * Gets all tasks from the api
		 *
		 * @returns List of tasks
		 */
		async getAllTasks(): Promise<Task[]> {
			const response = await fetch("https://api.forecast.it/api/v3/tasks", { headers: { "X-FORECAST-API-KEY": apiKey } });

			return response.json();
		},

    /**
		 * Gets single task by id from the api
		 *
		 * @returns task
		 */
		async getTask(taskId: string): Promise<Task> {
			const response = await fetch(`https://api.forecast.it/api/v3/tasks/${taskId}`, { headers: { "X-FORECAST-API-KEY": apiKey } });

			return response.json();
		},

		/**
		 * Gets all workflow columns from the api filtered by project id
		 *
		 * @param projectId Id of project
		 * @returns List of workflow columns
		 */
		async getWorkflowStatusByProject(projectId: number): Promise<Workflow[]> {
			const response = await fetch(`https://api.forecast.it/api/v1/projects/${projectId}/workflow_columns`, { headers: { "X-FORECAST-API-KEY": apiKey } });

			return response.json();
		},

		/**
		 * Gets all sprints in a project
		 *
		 * @param projectId Id of project
		 * @returns List of sprints
		 */
		async getProjectSprints(projectId: number): Promise<Sprint[]> {
			const response = await fetch(`https://api.forecast.it/api/v1/projects/${projectId}/sprints`, { headers: { "X-FORECAST-API-KEY": apiKey } });

			return response.json();
		},

		/**
		 * Gets all time entries in a project
		 *
		 * @param projectId Id of project
		 * @returns List of time entries
		 */
		async getTimeEntriesByProject(projectId: number): Promise<TimeEntry[]> {
			const response = await fetch(`https://api.forecast.it/api/v3/projects/${projectId}/time_registrations`, { headers: { "X-FORECAST-API-KEY": apiKey } });

			return response.json();
		}
	}
}