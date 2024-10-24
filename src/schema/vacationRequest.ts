import { Type } from "@sinclair/typebox";

/**
 * Schema for the Questionnaire table
 */

const vacationRequestSchema = Type.Object({
    draft: Type.Boolean(),
    startDate: Type.String(),
    endDate: Type.String(),
    days: Type.Number(),
    type: Type.String(),
    message: Type.String(),
    createdBy: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
});

export default vacationRequestSchema;
