
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
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DynamoDB model for vacation type
 */
enum VacationType {
  VACATION = "VACATION"
}

export default VacationRequestModel;
