# doingthings — an idea, becoming

An interactive short film for a software product studio. Twelve scenes follow a
human story: a small frustration, the question it raises, research, possibilities,
design, engineering, AI and agents, iteration, real use, and the visitor’s next project.

## Run

```sh
npm ci
npm run dev
npm run build
npm run lint
node --test tests/score.test.mjs
```

`dist/` is the static production output. No live deployment has been performed.

## Film architecture

- `src/App.tsx`: direct entry, native scroll timeline, screenplay, automatic playback,
  scene navigation, sound and motion controls, ending, and inquiry state.
- `src/film/story.ts`: all screenplay text and scene order.
- `src/film/World.tsx`: real Three.js WebGL geometry, studio reflections, five
  distinct artifacts, camera push, instanced fragments, starlight, and selective bloom.
- `src/film/WorldBoundary.tsx`: illustrated fallback when the 3D module fails.
- `src/film/score.ts`: original Web Audio harmonic bed, felt-like notes, reverb,
  stereo panning, and chapter-dependent transition washes. No external audio files.
- `src/film/ProjectBrief.tsx`: local form validation and a reviewable email draft.
- `public/art/`: the original generated artwork, preserved in this iteration.
- `docs/art-direction.md`: original image prompts and earlier research.
- `docs/film-direction.md`: the updated direction and implementation notes.

The story opens immediately and plays automatically in about 85 seconds. Research,
ideation, design, engineering, and AI connect the story to the studio’s services. A persistent services link and project action let visitors
take a direct route. Sound attempts autoplay and retries on the first click, tap, or
key press when the browser requires interaction. Native touch-end and click events
cover mobile gesture handling, including a cancelled pointer during scrolling. Explicit mute disables automatic
retries for that visit. Playback follows natural scrolling; wheel, touch, and
navigation keys stop autoplay. A scene menu allows direct navigation without chapter numbering.
Audio is suspended and autoplay stops when the page is hidden. The 3D renderer stops
when hidden or offscreen, caps pixel density and its render rate, and disposes GPU
resources on unmount. Reduced-motion users receive static 3D compositions and native
manual scene navigation. A motion control remains available throughout the film.

The sculpture is original procedural 3D inspired by the silver artwork; the source
image has not been converted into a scanned 3D model. The narrative is an illustrative product journey, not a client case study.

The brief prepares a mailto draft; the visitor reviews and sends it in their own
email app. There is no backend submission, booking provider, or delivery claim.
Contact remains `smith@doingthings.xyz`. KidoBuild projects are intentionally deferred.

Fonts load from Google Fonts with local system fallbacks. No analytics provider is
installed. Retention and conversion improvements have not been measured.

Arrow and playback controls use inline SVG so their appearance does not depend on
mobile fonts or emoji substitution. Sound state tracks the AudioContext, including
interruptions, and touch gestures on controls do not reverse the pause action.
The audio regression tests use a mocked context; physical iOS/Android autoplay
behavior remains governed by each browser. Audible playback without interaction
cannot be guaranteed on mobile.
