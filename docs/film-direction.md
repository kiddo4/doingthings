# Film direction

## The studio, immediately

The website opens directly into an automatically playing story. The first frame
identifies doingthings as a software product studio and explains the offer in plain
language. No entrance dialog or sound/silence decision stands in the way.

The narrative follows an idea that will not leave the visitor alone. “One day”
becomes its recurring phrase: first a postponed thought, then something worth
researching, prototyping, designing, and building. AI and agents give people time
back. A setback introduces uncertainty before the idea becomes someone's everyday.
The brand reveal resolves the thread: “From ‘one day’ to doingthings.” The invitation
returns to the idea the visitor brought with them.

The capabilities support that narrative through short, concrete moments rather than
standalone service slogans. No deities, religious origin story, numbered chapters,
or invented client testimonials appear. The established tagline remains intact.

## Experience and conversion

Twelve beats run for roughly 85 seconds, with longer holds for the opening and the
invitation. Native scrolling takes over on wheel, touch, and navigation keys. The
chapter menu pauses playback. Reduced-motion users start with manual navigation and
static compositions. Opening the brief, moving to services, or hiding the page
stops automatic playback. A persistent project action and a direct services link
make it possible to understand the studio and enquire without watching everything.

The services section explains research and strategy, ideation and prototyping,
product design, software development, and AI products and agents. The brief includes
AI-powered products, AI agents and automation, and an end-to-end build. It prepares a local email draft, not a server submission.
No conversion or retention improvement is claimed without measurement.

## Art and motion

The original black, ivory, and silver direction is retained. Actual Three.js
geometry supplies perspective, reflections, parallax, orbital motion, fragments,
and a camera movement through the central relic. The five objects are a faceted
core, layered possibility rings, an exploded interface, connected engineering
modules, and an assembled compute stack for AI and agents. Design and engineering replace the earlier flower
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
