# Film direction

## The studio, immediately

The website opens directly into an automatically playing story. The first frame
identifies doingthings as a software product studio and explains the offer in plain
language. No entrance dialog or sound/silence decision stands in the way.

The fictional gods are a narrative device for how ideas become technology. Five
gifts now represent research, ideation, product design, engineering, and iteration.
Music, beauty, and fine art are not studio service categories. The story follows a
possibility, the five gifts, their separation, their reunion, the studio, and the
visitor's next project. There are no numbered chapters.

## Experience and conversion

Twelve beats run for roughly 78 seconds, with longer holds for the opening and the
invitation. Native scrolling takes over on wheel, touch, and navigation keys. The
chapter menu pauses playback. Reduced-motion users start with manual navigation and
static compositions. Opening the brief, moving to services, or hiding the page
stops automatic playback. A persistent project action and a direct services link
make it possible to understand the studio and enquire without watching everything.

The services section explains research and strategy, ideation and prototyping,
product design, and software development. The brief offers these same categories
plus an end-to-end build. It prepares a local email draft, not a server submission.
No conversion or retention improvement is claimed without measurement.

## Art and motion

The original black, ivory, and silver direction is retained. Actual Three.js
geometry supplies perspective, reflections, parallax, orbital motion, fragments,
and a camera movement through the central relic. The five objects are a faceted
core, layered possibility rings, an exploded interface, connected engineering
modules, and an assembled stack. Design and engineering replace the earlier flower
and art knot. Existing generated artwork is retained; no new raster art is needed.

The WebGL scene is lazy loaded; the original artwork appears while it loads and
serves as an error fallback. Pixel density and frame rate are capped. Rendering
stops when hidden or outside the viewport, and GPU resources are disposed.

## Sound

The original Web Audio score uses synthesized notes, a harmonic bed, reverb, and
chapter transitions. The application attempts audio immediately. Browser-blocked
audio retries on pointer-up or key input, without a modal. The control shows sound
on only after the AudioContext is running. Explicit mute cancels pending enable
attempts and stops subsequent automatic retries. Browser autoplay policy cannot be
overridden by site code.

Research: [MDN autoplay and Web Audio](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
Visual reference: [Lusion](https://lusion.co/) informed spatial presence and the
relationship between sound, motion, and narrative. The studio's own silver visual
language and product focus determine the final implementation.

## Verification

Build and lint checks plus browser review cover direct entry, automatic progression,
gesture-enabled audio, explicit mute persistence, mobile layout, services navigation,
updated inquiry options, scene navigation, and motion controls. Audio activation is
verified through playback state; the score has not been independently auditioned.
