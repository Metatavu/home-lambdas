/**
 * Interface for Severa Response Phases.
 */
interface SeveraResponsePhases {
  guid: string;
  name: string;
  isCompleted: boolean;
  workHoursEstimate: number;
  startDate: Date;
  deadline: Date;
  project: {
    guid: string;
    name: string;
    isClosed: boolean;
  };
}

export default SeveraResponsePhases;
