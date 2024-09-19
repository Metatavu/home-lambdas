import type { QuestionnaireModel } from "src/database/schemas/questionnaire/questionnaire";

const mockQuestionnaire: QuestionnaireModel = {
  id: 1,
  title: "General Knowledge Quiz",
  description: "Test your general knowledge with this short quiz.",
  options: [
    {
      question: "What is the capital of France?",
      options: [
        { label: "Paris", 	value: true },
        { label: "Berlin", 	value: false },
        { label: "Madrid", 	value: false },
      ],
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: [
        { label: "Earth", 	value: false },
        { label: "Mars", 		value: true },
        { label: "Jupiter", value: false },
      ],
    },
    {
      question: "Who wrote 'Hamlet'?",
      options: [
        { label: "Charles Dickens", 		value: false },
        { label: "William Shakespeare", value: true },
        { label: "Mark Twain", 					value: false },
      ],
    },
  ],
  tags: ["developer", "designer", "manager", "tester", "devops", "whole team"],
  passedUsers: [101, 102, 103],
  passScore: 2,
};

export default mockQuestionnaire;