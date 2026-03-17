/**
 * Interface for Severa Response Work Hour.
 */
interface SeveraResponseWorkHours {
  guid: string;
  user: {
    guid: string;
    name: string;
  }
  project: {
    guid: string;
    name: string;
    isClosed: boolean;
  }
  phase: {
    guid: string;
    name: string;
  }
  description: string;
  eventDate: string;
  quantity: number;
  startTime?: string;
  endTime?: string;
}

export default SeveraResponseWorkHours;