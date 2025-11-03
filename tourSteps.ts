import React from 'react';

export interface TourStep {
  selector?: string;
  title: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    type: 'click' | 'input';
  };
  scrollTo?: boolean;
}

export const tourSteps: TourStep[] = [
  {
    selector: '[data-tour-id="view-toggle"]',
    title: 'Pro vs. Lite Mode',
    content: "You have two modes. 'Lite' is for a super-fast plan. For this tour, we'll use the powerful 'Pro' mode, which is already selected.",
    placement: 'bottom',
  },
  {
    selector: '#lifterName',
    title: "Start with the Lifter",
    content: "First, let's enter the lifter's name. This will be used for all your exports.",
    placement: 'bottom',
    scrollTo: true,
  },
  {
    selector: '[data-tour-id="lift-tabs"]',
    title: 'The Three Lifts',
    content: 'You can plan each of your three competition lifts here. We have already selected the Squat for you.',
    placement: 'bottom',
    scrollTo: true,
  },
  {
    selector: '[data-tour-id="attempt-input-3"]',
    title: 'Plan Your Attempts',
    content: "The magic starts here. You only need to enter one number. Let's input your goal 3rd attempt for the Squat (e.g., 150). The tour will continue automatically.",
    placement: 'top',
    action: { type: 'input' },
  },
  {
    selector: '[data-tour-id="calculate-button"]',
    title: 'Calculate Your Plan',
    content: "Perfect. Now, click 'Calculate' to automatically generate your first and second attempts based on proven strategies.",
    placement: 'top',
    action: { type: 'click' },
  },
  {
    selector: '[data-tour-id="generate-warmups-button"]',
    title: 'Generate Your Warm-ups',
    content: "Great! With your opener set, you can now generate a complete warm-up plan with a single click.",
    placement: 'top',
    action: { type: 'click' },
  },
  {
    selector: '[data-tour-id="summary-sidebar"]',
    title: 'The Complete Picture',
    content: "And there you have it! This summary shows your full plan, including your predicted total. Fill in your Body Weight and Gender to see your IPF GL Score.",
    placement: 'left',
  },
  {
    selector: '[data-tour-id="export-and-gameday-section"]',
    title: "You're Ready!",
    content: "Your plan is complete! You can now export it as a PDF or CSV, or launch the simplified Game Day Mode when you're at the competition.",
    placement: 'top',
    scrollTo: true,
  },
  {
    title: "You're All Set!",
    content: "You've successfully created your first plan! You can restart this tour anytime from the settings menu (⚙️). Happy lifting!",
  }
];