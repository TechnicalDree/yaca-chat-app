/*
  Extend the question types with a new type of question: MultipleChoiceQuestion.
  A MultipleChoiceQuestion has has a single correct answer, and the user can only 
  choose one option in the answer (the answer is a string instead of an array of
  strings).
*/

/* 
1. Define a new type called Answer that represents the possible types of answers to 
   a question. It can be either a string for a MultipleChoiceQuestion or an array 
   of strings for a MultipleAnswerQuestion. 
*/

type Answer = string | string[]; // fix this as appropriate

/*
2. Modify the IQuestion interface to change the type of the property answer so that
   it can accommodate both a a MultipleChoiceQuestion and a MultipleAnswerQuestion.
*/

interface IQuestion {
  question: string,
  options: string[],
  answer: Answer
} // fix this as appropriate

/* 
3. Define a new abstract superclass Question that represents a generic Question,
   implements IQuestion and has an abstract method grade that will be implemented 
   by concrete subclasses.The constructor should accommodate both a 
   MultipleChoiceQuestion and a MultipleAnswerQuestion.
*/

abstract class Question implements IQuestion {
  question: string;
  options: string[];
  answer: Answer;

  constructor(question: string, options: string[], answer: Answer) {
    this.question = question;
    this.options = options;
    this.answer = answer;
  }

  abstract grade(answer: Answer, points: number): number;
} // fix this as appropriate

/* 
4. Now define a concrete subclass of Question to represent MultipleChoiceQuestion.
   - The constructor should be tailerod to a MultipleChoiceQuestion that accepts a
   single answer. 
   - The class should implement the grade method such that the method returns the 
     specified number of points if the provided answer is correct, and 0 otherwise.
   - The method should throw an error if the provided answer is not included in the  
     question's options, with the error message: "Invalid answer: " + answer.
*/

class MultipleChoiceQuestion extends Question {
  answer: string;

  constructor(question: string, options: string[], answer: string) {
    super(question, options, answer);
    this.answer = answer;
  }

  grade(answer: Answer, points: number): number {
    if (typeof answer !== 'string') {
      throw new Error("Invalid answer type for multiple choice question");
    }

    if (!this.options.includes(answer)) {
      throw new Error("Invalid answer: " + answer);
    }

    return answer === this.answer ? points : 0;
  }
} // fix this as appropriate

/* 
5. Modify the abstract class MultipleAnswerQuestion to inherit from Question.
  - Change the grade method so that it throws an error if the provided answer
    includes any invalid values not included in the options, with the 
    error message: "Invalid answer: " + invalidValue.
*/

abstract class MultipleAnswerQuestion extends Question {
  answer: string[];

  constructor(question: string, options: string[], answer: string[]) {
    super(question, options, answer);
    this.answer = answer;
  }

  grade(answer: Answer, points: number): number {
    if (!Array.isArray(answer)) {
      throw new Error("Invalid answer type for multiple answer question");
    }

    for (const option of answer) {
      if (!this.options.includes(option)) {
        throw new Error("Invalid answer: " + option);
      }
    }

    return this.gradeSpecific(answer, points);
  }

  abstract gradeSpecific(answer: string[], points: number): number;
} // fix this as appropriate

class MAQuestionWPenalty extends MultipleAnswerQuestion {
  // hopefully, no change needed: you be the judge
  gradeSpecific(answer: string[], points: number): number {
    const pointsPerCorrectOption = points / this.answer.length;
    const penaltyPerIncorrectOption = pointsPerCorrectOption;

    let score = 0;

    for (const option of answer) {
      if (this.answer.includes(option)) {
        score += pointsPerCorrectOption;
      } else {
        score -= penaltyPerIncorrectOption;
      }
    }

    return Math.max(0, score);
  }
}

class MAQuestionWoPenalty extends MultipleAnswerQuestion {
  // hopefully, no change needed: you be the judge
  gradeSpecific(answer: string[], points: number): number {
    const pointsPerOption = points / this.options.length;
    let score = 0;

    for (const option of this.options) {
      const inCorrectAnswer = this.answer.includes(option);
      const inProvidedAnswer = answer.includes(option);

      if (inCorrectAnswer === inProvidedAnswer) {
        score += pointsPerOption;
      }
    }

    return score;
  }
}

/* 
6. Modify the Quiz class as appropriate. 
   - The constructor should accept an array of questions: questions of any grading 
     type can be included in the array (multiple answer with or without penalty, or 
     multiple choice).
   - The grade method of the Quiz class should now be an asyncronous function. It
     should return a Promise that resolves to the grand total of the number of points
     earned by the user. 
*/

class Quiz {
  questions: Question[];

  constructor(questions: Question[]) {
    this.questions = questions;
  }

  async grade(answers: Answer[], points: number): Promise<number> {
    let grandTotal = 0;

    for (let i = 0; i < this.questions.length; i++) {
      const questionGrade = this.questions[i].grade(answers[i], points);
      console.log(`Question ${i + 1} grade: ${questionGrade}`);
      grandTotal += questionGrade;
    }

    console.log(`Grand total grade: ${grandTotal}`);
    return grandTotal;
  }
} // fix this as appropriate

/* 
7. Test your implementation using your quiz from Part 1 and by defining a new second 
   quiz on advanced TypeScript. The second quiz should have two multipe-choice questions, 
   one multiple-answer question with penalty, one multiple-answer question without penalty, 
   one question with an invalid answer.
    - The second quiz should mix correct, incorrect, and partially correct answers.
    - Call the grade method of both quizzes asynconously, without blocking the execution
      (you should use the .then and .catch methods).
*/

// Original quiz
const maQp = new MAQuestionWPenalty(
  'Which statements are true for TypeScript?',
  ['functional', 'object-oriented', 'untyped', 'interpreted'],
  ['functional', 'object-oriented']
);

const maQnp = new MAQuestionWoPenalty(
  'Which statements are true for TypeScript?',
  ['functional', 'object-oriented', 'untyped', 'interpreted'],
  ['functional', 'object-oriented']
);

// New quiz
const mcQ1 = new MultipleChoiceQuestion(
  'What is 2 + 2?',
  ['3', '4', '5', '6'],
  '4'
);

const mcQ2 = new MultipleChoiceQuestion(
  'What color is the sun?',
  ['Blue', 'Yellow', 'Green', 'Red'],
  'Yellow'
);

const maQpSimple = new MAQuestionWPenalty(
  'Which are fruits?',
  ['Apple', 'Carrot', 'Banana', 'Potato'],
  ['Apple', 'Banana']
);

const maQnpSimple = new MAQuestionWoPenalty(
  'Which are animals?',
  ['Dog', 'Car', 'Cat', 'Tree'],
  ['Dog', 'Cat']
);


const originalQuiz = new Quiz([maQp, maQnp]);

const advancedQuiz = new Quiz([mcQ1, mcQ2, maQpSimple, maQnpSimple]);


console.log('Testing original quiz');
originalQuiz.grade([['Red'], ['1', '2']], 10)
  .then(total => console.log(`Original quiz: ${total} points`))
  .catch(error => console.log(`Error: ${error.message}`));

console.log('\n=== Testing new quiz ===');
advancedQuiz.grade(['4', 'Yellow', ['Apple', 'Banana'], ['Dog', 'Cat']], 10)
  .then(total => console.log(`All correct: ${total} points`))
  .catch(error => console.log(`Error: ${error.message}`));

advancedQuiz.grade(['3', 'Yellow', ['Apple'], ['Dog', 'Car']], 10)
  .then(total => console.log(`Mixed answers: ${total} points`))
  .catch(error => console.log(`Error: ${error.message}`));

advancedQuiz.grade(['4', 'Yellow', ['Apple', 'Banana'], ['Dog', 'Invalid']], 10)
  .then(total => console.log(`Should not print: ${total}`))
  .catch(error => console.log(`Expected error: ${error.message}`));

/* 
8. Test your implementation by running the provided automated tests as follows. If all tests 
   pass, then your implmentation is probably correct and you can submit your solution.

   % npm run test:exP2
*/

export {
  Question,
  Quiz,
  MultipleChoiceQuestion,
  MAQuestionWoPenalty,
  MAQuestionWPenalty
};

export type { IQuestion, Answer };
