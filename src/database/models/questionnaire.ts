/**
 * DynamoDB model for Questionnaire
 */
interface QuestionnaireModel {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  tags?: string[];
  passedUsers?: string[];
  passScore: number;
}

/**
 * DynamoDB model for Question
 */
interface Question {
  id: string;
  questionText: string;
  answerOptions: AnswerOption[];
}

/**
 * DynamoDB model for Option
 */
interface AnswerOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export default QuestionnaireModel;
