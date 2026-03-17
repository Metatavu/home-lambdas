/**
 * Interface for ResourceAllocationModel.
 */
interface ResourceAllocationModel {
  severaResourceAllocationId: string;
  allocationHours: number;
  calculatedAllocationHours: number;
  phase?: ResourceAllocationPhaseModel;
  user: ResourceAllocationUserModel;
  project?: ResourceAllocationProjectModel;
}

/**
 * Interface for ResourceAllocationPhaseModel.
 */
interface ResourceAllocationPhaseModel {
  severaPhaseId: string;
  name: string;
}

/**
 * Interface for ResourceAllocationUserModel.
 */
interface ResourceAllocationUserModel {
  severaUserId: string;
  name: string;
}

/**
 * Interface for ResourceAllocationProjectModel.
 */
interface ResourceAllocationProjectModel {
  severaProjectId: string;
  name: string;
  isInternal: boolean;
}

export default ResourceAllocationModel;