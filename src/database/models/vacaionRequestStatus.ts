/**
 * DynamoDB model for Vacation request status
 */
interface VacationRequestStatusModel {
    id: string;
    vacationRequestId: string;
    status: VacationRequestStatuses;
    message: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

enum VacationRequestStatuses {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "DECLINED"
}

export default VacationRequestStatusModel;
