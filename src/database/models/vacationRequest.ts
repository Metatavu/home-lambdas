/**
 * DynamoDB model for vacation request
 */
interface VacationRequestModel {
    id: string;
    personId: string;
    draft: boolean;
    startDate: string;
    endDate: string;
    days: number;
    type: VacationType;
    message: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
}

/**
 * DynamoDB model for vacation type
 */

enum VacationType {
    VACATION = "VACATION",
    UNPAID_TIME_OFF = "UNPAID_TIME_OFF",
    SICKNESS = "SICKNESS",
    PERSONAL_DAYS = "PERSONAL_DAYS",
    MATERNITY_PATERNITY = "MATERNITY_PATERNITY",
    CHILD_SICKNESS = "CHILD_SICKNESS"
}

export default VacationRequestModel;
  