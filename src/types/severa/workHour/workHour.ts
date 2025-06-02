/**
 * Interface for WorkHoursModel
 */
interface WorkHoursModel {
  severaWorkHoursId: string;
  user: WorkHoursUserModel;
  project: WorkHoursProjectModel;
  phase: WorkHoursPhaseModel;
  description: string;
  eventDate: string;
  quantity: number;
  startTime?: string;
  endTime?: string;
}

/**
 * Interface for WorkHoursUserModel
 */
interface WorkHoursUserModel {
  severaUserId: string;
  name: string;
}

/**
 * Interface for WorkHoursProjectModel
 */
interface WorkHoursProjectModel {
  severaProjectId: string;
  name: string;
  isClosed: boolean;
}

/**
 * Interface for WorkHoursPhaseModel
 */
interface WorkHoursPhaseModel {
  severaPhaseId: string;
  name: string;
}

export default WorkHoursModel;