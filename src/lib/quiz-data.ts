export type QuizOption = {
  label: string;
  value: string;
  score: number;
  disqualify?: boolean;
};

export type QuizQuestion = {
  id: string;
  type: 'intro' | 'radio' | 'text' | 'slider' | 'result';
  number?: string;
  question?: string;
  options?: QuizOption[];
  helperText?: string;
  placeholder?: string;
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'intro',
    type: 'intro',
  },
  {
    id: 'income',
    number: '3',
    question: 'What is your current monthly income (after expenses)?',
    type: 'radio',
    options: [
      { label: '₦0-₦49,999', value: 'A', score: 1 },
      { label: '₦50,000-₦99,999', value: 'B', score: 2 },
      { label: '₦100,000-₦299,999', value: 'C', score: 3 },
      { label: '₦300,000+', value: 'D', score: 4 },
    ],
    helperText: 'Choose one option',
  },
  {
    id: 'timeCommitment',
    number: '4',
    question: 'How many hours per week can you dedicate to learning and taking action?',
    type: 'radio',
    options: [
      { label: '0-4hours', value: 'A', score: 0, disqualify: true },
      { label: '5-7hours', value: 'B', score: 2 },
      { label: '8-12hours', value: 'C', score: 3 },
      { label: '13hours+', value: 'D', score: 4 },
    ],
  },
  {
    id: 'internetAccess',
    number: '5',
    question: 'ZTHA Academy is 100% online. (1hr Pre-recorded Classes - Mondays to Fridays and Live classes on Sundays)... Do you/will you have reliable internet access all through the program?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'A', score: 2 },
      { label: 'No', value: 'B', score: 0, disqualify: true },
    ],
  },
  {
    id: 'adAccount',
    number: '6',
    question: 'Do you have a working ad account (Meta (Facebook)/Google/TikTok) OR can you afford ₦15k-₦30k to get one for yourself?',
    type: 'radio',
    options: [
      { label: 'I have a working ad account', value: 'A', score: 3 },
      { label: 'I can provide ₦15k-₦30k to get a new one', value: 'B', score: 2 },
      { label: 'I don\'t have one and can\'t afford it', value: 'C', score: 0, disqualify: true },
    ],
  },
  {
    id: 'marketingExperience',
    number: '7',
    question: 'Rate your current marketing experience',
    type: 'radio',
    options: [
      { label: '0-3 (Beginner) - Struggling with sales', value: 'A', score: 3 },
      { label: '4-7 (Intermediate) - Looking to Scale', value: 'B', score: 2 },
      { label: '8-10 (Advanced) - Already at scale', value: 'C', score: 0, disqualify: true },
    ],
  },
  {
    id: 'whyApplying',
    number: '8',
    question: 'In one sentence, why are you applying to join ZTHA Academy?',
    type: 'text',
    placeholder: 'Type your answer here',
  },
  {
    id: 'eightWeekCommitment',
    number: '9',
    question: 'This is not a learn-at-your-pace program. Will you commit to completing all 8 weeks?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'A', score: 3 },
      { label: 'No', value: 'B', score: 0, disqualify: true },
    ],
  },
  {
    id: 'paymentReadiness',
    number: '10',
    question: 'Are you comfortable investing ₦72,500 (or ₦36,250 × 2 in installments) today?',
    type: 'radio',
    options: [
      { label: 'Yes, I\'ll pay in full', value: 'A', score: 4 },
      { label: 'Yes, I can pay in two installments', value: 'B', score: 3 },
      { label: 'No I can\'t afford it', value: 'C', score: 0, disqualify: true },
    ],
  },
  {
    id: 'importanceSlider',
    number: '11',
    question: 'On a scale of 1-10, how IMPORTANT is learning affiliate-marketing skills to you right now?',
    type: 'slider',
  },
  {
    id: 'termsAcceptance',
    number: '12',
    question: 'I agree to the payment terms, refund policy, and that results are not guaranteed but depend on your effort',
    type: 'radio',
    options: [
      { label: 'I accept', value: 'A', score: 2 },
      { label: 'I don\'t accept', value: 'B', score: 0, disqualify: true },
    ],
  },
  {
    id: 'result',
    type: 'result',
  }
];

export const calculateScore = (answers: Record<string, any>) => {
  let score = 0;
  let disqualified = false;

  QUIZ_QUESTIONS.forEach((q) => {
    const answer = answers[q.id];
    if (answer === undefined || answer === null || answer === '') return;

    if (q.type === 'radio') {
      const option = q.options?.find((o) => o.value === answer);
      if (option) {
        score += option.score;
        if (option.disqualify) {
          disqualified = true;
        }
      }
    } else if (q.type === 'text') {
      if (answer.trim().length > 0) {
        score += 2;
      }
    } else if (q.type === 'slider') {
      const val = Number(answer);
      if (val >= 0 && val <= 5) {
        disqualified = true;
      } else if (val >= 6 && val <= 7) {
        score += 2;
      } else if (val >= 8 && val <= 10) {
        score += 4;
      }
    }
  });

  return { score, disqualified };
};
