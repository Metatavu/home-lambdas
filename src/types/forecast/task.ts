export interface Task {
	id: string,
	title: string,
	description: string,
	project_id: number,
	remaining: number,
	estimate: number,
	start_date: string,
	end_date: string,
	high_priority: boolean,
	assigned_persons: number[],
	workflow_column: number
}