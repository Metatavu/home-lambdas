import type { VacationRequestStatus } from "src/generated/homeLambdasModels/model/vacationRequestStatus";
import type { VacationType } from "src/generated/homeLambdasModels/model/vacationType";

/**
 * DynamoDB model for vacation request
 */
interface VacationRequestModel {
  id: string;
  userId: string;
  draft: boolean;
  startDate: string;
  endDate: string;
  days: number;
  type: VacationType;
  message: string;
  status: VacationRequestStatus[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default VacationRequestModel;
