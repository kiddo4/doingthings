export const story = [
  { name: 'the possibility', lead: 'doingthings · a software product studio', title: 'What if became', italic: 'what’s next.', line: 'We research, design, and build software that turns a possibility into something people use.', layout: 'opening', duration: 8500 },
  { name: 'the first question', lead: 'Every invention begins somewhere.', title: 'Even the gods', italic: 'started with “what if?”', line: 'In our story, they left us five gifts. Together, they could turn an idea into a new reality.', layout: 'center', duration: 6500 },
  { name: 'research', lead: 'The gift of curiosity · research', title: 'Listen.', italic: 'Find the real question.', line: 'Before building a solution, understand the people who need it.', craft: 'User research · discovery · product strategy', layout: 'god', duration: 6000 },
  { name: 'ideation', lead: 'The gift of possibility · ideation', title: 'Imagine.', italic: 'See what isn’t here. Yet.', line: 'A problem becomes a possibility. A possibility becomes a direction worth testing.', craft: 'Product concepts · workshops · rapid prototypes', layout: 'god', duration: 6000 },
  { name: 'product design', lead: 'The gift of clarity · design', title: 'Shape.', italic: 'Make the complex feel simple.', line: 'An idea takes form. Every screen, every interaction, a little closer to second nature.', craft: 'UX & UI design · interaction design · design systems', layout: 'god', duration: 6500 },
  { name: 'engineering', lead: 'The gift of invention · engineering', title: 'Build.', italic: 'Give possibility a pulse.', line: 'Thought becomes working software. Something you can open, use, and depend on.', craft: 'Web & mobile apps · platforms · software engineering', layout: 'god', duration: 6500 },
  { name: 'launch & learn', lead: 'The gift of progress · iteration', title: 'Release.', italic: 'Let the real world in.', line: 'A launch is a beginning. We learn from use, improve what matters, and keep moving.', craft: 'MVPs · product launches · ongoing improvement', layout: 'god', duration: 6000 },
  { name: 'the missing piece', lead: 'But a gift on its own was never enough.', title: 'An idea without a way.', italic: 'A product without a why.', line: 'Separated, even the greatest gifts could leave something unfinished.', layout: 'center fall', duration: 5500 },
  { name: 'the connection', lead: 'So the gods passed the fire on.', title: 'Not to be admired.', italic: 'To be made useful.', line: 'Curiosity. Imagination. Design. Engineering. Progress. Finally, working as one.', layout: 'center handover', duration: 6500 },
  { name: 'doingthings', lead: 'That’s where we come in.', title: 'One product team.', italic: 'doingthings.', line: 'From the first question to working software. We connect the thinking, the design, and the build.', layout: 'center makers', duration: 6500 },
  { name: 'the reason', lead: 'The technology is only the beginning.', title: 'doing things', italic: 'that touch lives.', line: 'A task made easier. A business moving forward. A product someone is glad exists.', layout: 'center belief', duration: 6000 },
  { name: 'your next chapter', lead: 'Now, about that idea of yours.', title: 'Let’s build', italic: 'what happens next.', line: 'A new product, a better experience, or a challenge you haven’t solved yet. Bring it here.', layout: 'center invitation', duration: 7000 },
];
export const services = [
  { name: 'Research & strategy', detail: 'Understand the people, the problem, and what’s worth building.', deliverables: 'Discovery · user research · product direction' },
  { name: 'Ideation & prototyping', detail: 'Explore possibilities and test the idea before the full build.', deliverables: 'Concepts · workshops · interactive prototypes' },
  { name: 'Product design', detail: 'Turn complex journeys into clear, considered experiences.', deliverables: 'UX/UI · interaction design · design systems' },
  { name: 'Software development', detail: 'Build and launch the product, then keep making it better.', deliverables: 'Web & mobile apps · platforms · MVPs · iteration' },
];
export const STORY_END = story.length - 0.001;
export type FilmState = { progress: number; pointerX: number; pointerY: number; motion: boolean; pulse: number };
export const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
