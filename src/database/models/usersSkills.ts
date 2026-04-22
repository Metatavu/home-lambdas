import type { Skill } from "src/generated/homeLambdasModels/model/skill";

/**
 * DynamoDB model for users skills
 */
interface UsersSkillsModel {
  id: string;
  name: string;
  skills: Skill[];
}

export default UsersSkillsModel;
