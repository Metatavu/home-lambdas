/**
 * Interface for PhaseModel
 */
interface PhaseModel {
  severaPhaseId: string;
  name: string;
  isCompleted: boolean;
  workHoursEstimate: number;
  startDate: Date;
  deadline: Date;
  project: PhaseProjectModel;
}

/**
 * Interface for PhaseProjectModel
 */
interface PhaseProjectModel{
  severaProjectId: string;
  name: string;
  isClosed: boolean;
}

export default PhaseModel;