/**
 * Interface for Severa Response Resource Allocation.
 */
interface SeveraResponseResourceAllocation {
  guid: string;
  allocationHours: number;
  calculatedAllocationHours: number;
  phase?: {
    guid: string;
    name: string;
  }
  user: {
    guid: string;
    name: string;
  }
  project?: {
    guid: string;
    name: string;
    isInternal: boolean;
  }
}

export default SeveraResponseResourceAllocation;