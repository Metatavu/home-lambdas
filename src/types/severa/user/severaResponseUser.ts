/**
 * Interface for Severa response for users.
 */
interface SeveraResponseUser {
  guid: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  workContract: {
    dailyHours: number;
  }
}

export default SeveraResponseUser;