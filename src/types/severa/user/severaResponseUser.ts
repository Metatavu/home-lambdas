/**
 * Interface for Severa response for users.
 */
interface SeveraResponseUser {
  guid: string;
  name: string;
  firstName: string;
  lastName: string;
  workContract: {
    dailyHours: number;
  }
}

export default SeveraResponseUser;