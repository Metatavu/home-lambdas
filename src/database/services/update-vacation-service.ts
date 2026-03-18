import { entityToDto } from "src/database/dtos/vacationDtos";
import { vacationRequestService } from "src/database/services";
import {
  deductVacationDaysForApproval,
  returnVacationDaysForRejection,
  validateVacationApproval
} from "src/libs/vacation-utils";

/**
 * Handles the approval of a vacation request.
 */

export const handleApproval = async (
  userId: string,
  startDate: string,
  endDate: string,
  contractedWeek: number[],
  vacationRequestUpdates: any,
  sendNotifications: () => Promise<void>
) => {
  const validationError = await validateVacationApproval(
    userId,
    startDate,
    endDate,
    contractedWeek
  );
  if (validationError) return validationError;

  await deductVacationDaysForApproval(userId, startDate, endDate, contractedWeek);

  try {
    const updatedVacationRequest =
      await vacationRequestService.updateVacationRequest(vacationRequestUpdates);
    await sendNotifications();

    return {
      statusCode: 200,
      body: JSON.stringify(entityToDto(updatedVacationRequest))
    };
  } catch (dbError) {
    console.error("Database update failed, rolling back vacation day deduction", dbError);
    await returnVacationDaysForRejection(userId, startDate, endDate, contractedWeek);
    throw dbError;
  }
};

/**
 * Handles vacation request rejection.
 */

export const handleRejection = async (
  userId: string,
  existingStartDate: string,
  existingEndDate: string,
  contractedWeek: number[],
  vacationRequestUpdates: any,
  sendNotifications: () => Promise<void>
) => {
  const updatedVacationRequest =
    await vacationRequestService.updateVacationRequest(vacationRequestUpdates);

  try {
    await returnVacationDaysForRejection(
      userId,
      existingStartDate,
      existingEndDate,
      contractedWeek
    );
    await sendNotifications();

    return {
      statusCode: 200,
      body: JSON.stringify(entityToDto(updatedVacationRequest))
    };
  } catch (error) {
    console.error("Failed to return vacation days after status change.", error);

    return {
      statusCode: 200,
      body: JSON.stringify(entityToDto(updatedVacationRequest))
    };
  }
};
