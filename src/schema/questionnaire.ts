import { Type } from "@sinclair/typebox";

/**
 * Schema for the Questionnaire table
 */
const questionnaireSchema = Type.Object({
  title: Type.String(),
  description: Type.String(),
  questions: Type.Array(
    Type.Object({
      questionText: Type.String(),
      answerOptions: Type.Array(
        Type.Object({
          label: Type.String(),
          isCorrect: Type.Boolean(),
        }),
      ),
    }),
  ),
  tags: Type.Optional(Type.Array(Type.String())),
  passedUsers: Type.Optional(Type.Array(Type.String())),
  passScore: Type.Number(),
});

export default questionnaireSchema;
