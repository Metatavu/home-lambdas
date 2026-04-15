import { Type } from "@sinclair/typebox";

/**
 * Schema for the individual skill of a user
 */
const userSkillSchema = Type.Object({
  name: Type.String(),
  months: Type.Number(),
  category: Type.String()
});

/**
 * Schema for the users skills table
 */
const usersSkillsSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  skills: Type.Array(userSkillSchema),
});

export default usersSkillsSchema;
