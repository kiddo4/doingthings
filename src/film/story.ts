export const story = [
  { name: 'the idea', lead: 'doingthings · a software product studio', title: 'Some ideas', italic: 'stay with you.', line: 'We turn them into software, AI products, and agents. From the first what-if to something people use.', layout: 'opening', duration: 8500 },
  { name: 'one day', lead: 'A note in your phone. A conversation that runs late.', title: 'You call it', italic: '“one day.”', line: 'But it keeps coming back. On the way home. In the middle of something else. That feeling that this could be better.', layout: 'center', duration: 7500 },
  { name: 'research', lead: 'So we start with the people who would use it.', title: 'Listen.', italic: 'It isn’t just you.', line: 'Someone else has found a workaround. Someone else has given up. Your instinct becomes a problem worth solving.', craft: 'User research · discovery · product strategy', layout: 'craft', duration: 7000 },
  { name: 'ideation', lead: 'The conversation becomes a sketch.', title: 'Imagine.', italic: 'Now you can almost see it.', line: 'We try a direction. Then another. A rough prototype makes the idea tangible enough to question, test, and improve.', craft: 'Product concepts · workshops · rapid prototypes', layout: 'craft', duration: 6500 },
  { name: 'product design', lead: 'A hundred small decisions later…', title: 'Shape.', italic: 'It starts to feel right.', line: 'The confusing step disappears. The next move feels obvious. What was complicated becomes something you simply know how to use.', craft: 'UX & UI design · interaction design · design systems', layout: 'craft', duration: 6500 },
  { name: 'engineering', lead: 'And then, for the first time…', title: 'Build.', italic: 'It actually works.', line: 'You tap. Something happens. The idea leaves the presentation and becomes software you can put into someone’s hands.', craft: 'Web & mobile apps · platforms · software engineering', layout: 'craft', duration: 6500 },
  { name: 'AI & agents', lead: 'What else could we take off someone’s plate?', title: 'Breathe.', italic: 'Give people their time back.', line: 'AI helps find the answer. An agent picks up a repeating task. Tools start working together. There’s room to think again.', craft: 'AI products · AI agents · workflow automation', layout: 'craft', duration: 7500 },
  { name: 'not yet', lead: 'Making something real is rarely a straight line.', title: 'Not quite.', italic: 'Not yet.', line: 'A test breaks. Someone gets stuck. We go back, ask better questions, and make it better. This is part of the work.', layout: 'center fall', duration: 6500 },
  { name: 'the everyday', lead: 'Then a small, extraordinary thing happens.', title: 'Your one day becomes', italic: 'someone’s everyday.', line: 'They use it, get something done, and get on with their life. The thing you couldn’t stop thinking about finally belongs in the world.', layout: 'center handover', duration: 7500 },
  { name: 'doingthings', lead: 'For the ideas that deserve to leave your head.', title: 'From “one day” to', italic: 'doingthings.', line: 'Your idea. Our sleeves rolled up. Research, design, software, and AI, brought together to make it real.', layout: 'center makers', duration: 7000 },
  { name: 'the reason', lead: 'That’s what we’re here for.', title: 'doing things', italic: 'that touch lives.', line: 'Sometimes it changes a business. Sometimes it gives someone an hour back. Both are worth making.', layout: 'center belief', duration: 6500 },
  { name: 'your idea', lead: 'You’ve had something in mind this whole time, haven’t you?', title: 'Still thinking', italic: 'about that idea?', line: 'Tell us the part you can’t stop thinking about. We’ll help you work out what comes next.', layout: 'center invitation', duration: 7500 },
];
export const services = [
  { name: 'Research & strategy', detail: 'Understand the people, the problem, and what’s worth building.', deliverables: 'Discovery · user research · product direction' },
  { name: 'Ideation & prototyping', detail: 'Explore possibilities and test the idea before the full build.', deliverables: 'Concepts · workshops · interactive prototypes' },
  { name: 'Product design', detail: 'Turn complex journeys into clear, considered experiences.', deliverables: 'UX/UI · interaction design · design systems' },
  { name: 'Software development', detail: 'Build and launch the product, then keep making it better.', deliverables: 'Web & mobile apps · platforms · MVPs · iteration' },
  { name: 'AI products & agents', detail: 'Make knowledge easier to use and connect the tools your team works with.', deliverables: 'AI-powered products · custom agents · workflow automation' },
];
export const STORY_END = story.length - 0.001;
export type FilmState = { progress: number; pointerX: number; pointerY: number; motion: boolean; pulse: number };
export const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
