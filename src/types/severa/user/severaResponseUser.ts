/**
 * Interface for Severa response for users.
 */
interface SeveraResponseUser {
  email: string;
  guid: string;
  name: string;
  firstName: string;
  lastName: string;
  workContract: {
    dailyHours: number;
  };
  keywords?: { value: string }[];
}

export default SeveraResponseUser;