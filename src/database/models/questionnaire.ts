/**
 * DynamoDB model for Questionnaire
 */
interface QuestionnaireModel {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  tags?: string[];
  passedUsers?: number[];
  passScore: number;
}

/**
 * DynamoDB model for Question
 */
interface Question {
  questionText: string;
  answerOptions: AnswerOption[];
}

/**
 * DynamoDB model for Option
 */
interface AnswerOption {
  label: string;
  isCorrect: boolean;
}

export default QuestionnaireModel;