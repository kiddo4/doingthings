# doingthings — a small myth about making

An interactive short film for a product studio. Twelve scenes carry a fictional
story from the gods of making to the next project: an awakening, five gifts, the
fracture, the handover, doingthings, and the visitor's own next scene.

## Run

```sh
npm ci
npm run dev
npm run build
npm run lint
```

`dist/` is the static production output. No live deployment has been performed.

## Film architecture

- `src/App.tsx`: entrance, native scroll timeline, screenplay, automatic playback,
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

The visitor chooses sound or silence before entering. Audio starts only after a
user gesture. Playback follows natural scrolling; wheel, touch, and navigation keys
stop autoplay. A scene menu allows direct navigation without chapter numbering.
Audio is suspended and autoplay stops when the page is hidden. The 3D renderer stops
when hidden or offscreen, caps pixel density and its render rate, and disposes GPU
resources on unmount. Reduced-motion users receive static 3D compositions and native
manual scene navigation. A motion control remains available throughout the film.

The sculpture is original procedural 3D inspired by the silver artwork; the source
image has not been converted into a scanned 3D model. The five spirits are fictional
storytelling characters, not claims about historical mythology or client projects.

The brief prepares a mailto draft; the visitor reviews and sends it in their own
email app. There is no backend submission, booking provider, or delivery claim.
Contact remains `smith@doingthings.xyz`. KidoBuild projects are intentionally deferred.

Fonts load from Google Fonts with local system fallbacks. No analytics provider is
installed. Retention and conversion improvements have not been measured.
