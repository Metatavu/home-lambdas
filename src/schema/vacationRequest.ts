import { Type } from "@sinclair/typebox";
import { VacationRequestStatuses } from "@generated/client/model/vacationRequestStatuses";

/**
 * Schema for each individual status entry in a vacation request
 */
const vacationRequestStatusSchema = Type.Object({
  status: Type.Enum(VacationRequestStatuses),
  createdBy: Type.String(),
  updatedAt: Type.String()
});

/**
 * Schema for the vacation request table
 */
const vacationRequestSchema = Type.Object({
  userId: Type.String(),
  days: Type.Number(),
  startDate: Type.String(),
  endDate: Type.String(),
  type: Type.String(),
  status: Type.Array(vacationRequestStatusSchema),
  draft: Type.Optional(Type.Boolean()),
  createdBy: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String()
});

export default vacationRequestSchema;
