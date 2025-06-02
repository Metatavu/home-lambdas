/**
 * Interface for Severa Response Previous Work Hours.
 */
interface SeveraResponsePreviousWorkHours {
  guid: string;
  user: {
    guid: string;
    name: string;
    firstName: string;
    lastName: string;
  }
  project: {
    guid: string;
  }
  phase: {
    guid: string;
    name: string;
  }
  isBillable: boolean;
  eventDate: string;
  quantity: number;
}

export default SeveraResponsePreviousWorkHours;