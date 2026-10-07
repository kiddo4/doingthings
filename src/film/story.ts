export const story = [
  { name: 'the beginning', lead: 'Before the screens. Before the noise.', title: 'There was', italic: 'a feeling.', line: 'The urge to make something that matters.', layout: 'opening' },
  { name: 'the awakening', lead: 'A small myth about making', title: 'Once, the world belonged', italic: 'to the makers.', line: 'Five restless spirits. Five ways of turning nothing into something.', layout: 'center' },
  { name: 'Techne', lead: 'The gift of technology', title: 'Techne', italic: 'made the impossible, possible.', line: 'Fire became light. Light became thought. And thought could move the world.', craft: 'We build the technology that makes an idea real.', layout: 'god' },
  { name: 'Melos', lead: 'The gift of music', title: 'Melos', italic: 'gave silence a heartbeat.', line: 'A rhythm to find each other. A feeling that needed no translation.', craft: 'Sound, identity, and experiences you can feel.', layout: 'god' },
  { name: 'Kallos', lead: 'The gift of beauty', title: 'Kallos', italic: 'taught the world to pause.', line: 'Not everything beautiful asks for attention. Some things simply hold it.', craft: 'Brands and interfaces worth looking at twice.', layout: 'god' },
  { name: 'Poiesis', lead: 'The gift of art', title: 'Poiesis', italic: 'dreamed beyond the edges.', line: 'Where everyone saw what was, one spirit saw what could be.', craft: 'Art direction, motion, and worlds of possibility.', layout: 'god' },
  { name: 'Ergon', lead: 'The gift of making', title: 'Ergon', italic: 'put dreams into our hands.', line: 'Because an idea only changes a life when it leaves the imagination.', craft: 'Products, from the first what-if to the real thing.', layout: 'god' },
  { name: 'the distance', lead: 'Then, somewhere along the way…', title: 'Things got louder.', italic: 'We felt less.', line: 'More screens. More noise. Less of the thing it was all supposed to be for.', layout: 'center fall' },
  { name: 'the gift', lead: 'But the story wasn’t over.', title: 'The gods left us', italic: 'their fire.', line: 'Not to worship. To do something with.', layout: 'center handover' },
  { name: 'the makers', lead: 'To the curious. The restless. The beautifully unreasonable.', title: 'And so, we started', italic: 'doingthings.', line: 'Technology. Music. Beauty. Art. Products. One instinct: make people feel something.', layout: 'center makers' },
  { name: 'the feeling', lead: 'This is what the fire is for.', title: 'doing things', italic: 'that touch lives.', line: 'A product studio for people who believe there’s a better way.', layout: 'center belief' },
  { name: 'your scene', lead: 'Every story needs its next possibility.', title: 'This part', italic: 'could be yours.', line: 'That idea you can’t stop thinking about? Let’s give it a life.', layout: 'center invitation' },
];
export const STORY_END = story.length - 0.001;
export type FilmState = { progress: number; pointerX: number; pointerY: number; motion: boolean; entered: boolean; pulse: number };
export const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
