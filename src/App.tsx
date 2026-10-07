import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { FilmScore } from './film/score';
import { clamp, smooth, story, STORY_END, type FilmState } from './film/story';
import ProjectBrief from './film/ProjectBrief';
import WorldBoundary from './film/WorldBoundary';
import './App.css';
const World = lazy(() => import('./film/World'));

export default function App() {
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(false);
  const [soundError, setSoundError] = useState(false);
  const [motion, setMotion] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menu, setMenu] = useState(false);
  const [brief, setBrief] = useState(false);
  const film = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const entrance = useRef<HTMLDialogElement>(null);
  const score = useRef<FilmScore | null>(null);
  const state = useRef<FilmState>({ progress: 0, pointerX: 0, pointerY: 0, entered: false, motion, pulse: 0 });
  const sceneIndex = Math.min(story.length - 1, Math.floor(progress));
  const hasEnded = progress >= STORY_END - 0.04;
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    entrance.current?.showModal();
    return () => { score.current?.dispose(); score.current = null; };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    state.current.motion = motion; state.current.entered = entered;
    window.dispatchEvent(new Event('film-state-change'));
  }, [motion, entered]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setMotion(!media.matches); if (media.matches) setPlaying(false); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    document.body.style.overflow = !entered || brief ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [entered, brief]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = screen.current?.clientHeight || innerHeight;
      const top = film.current?.getBoundingClientRect().top || 0;
      const p = clamp(-top / height, 0, STORY_END);
      state.current.progress = p;
      setProgress(p);
      score.current?.scene(Math.min(story.length - 1, Math.floor(p)));
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const visibility = () => {
      if (document.hidden) { score.current?.suspend(); setPlaying(false); }
      else score.current?.resume();
    };
    window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', scroll);
    document.addEventListener('visibilitychange', visibility); update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!playing || !entered || !motion || brief) return;
    let frame = 0, previous = 0;
    const step = (now: number) => {
      const elapsed = previous ? Math.min(now - previous, 80) : 0; previous = now;
      const height = screen.current?.clientHeight || innerHeight;
      const p = state.current.progress;
      if (p >= STORY_END - 0.04) { setPlaying(false); return; }
      // Each scene gets about nine seconds; browser scrolling remains native.
      window.scrollBy({ top: elapsed * height / 9000, behavior: 'instant' });
      frame = requestAnimationFrame(step);
    };
    const interrupt = () => setPlaying(false);
    const key = (event: KeyboardEvent) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) interrupt(); };
    window.addEventListener('wheel', interrupt, { passive: true }); window.addEventListener('touchstart', interrupt, { passive: true }); window.addEventListener('keydown', key);
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('wheel', interrupt); window.removeEventListener('touchstart', interrupt); window.removeEventListener('keydown', key); };
  }, [playing, entered, motion, brief]);

  const toggleSound = async (enable = !sound) => {
    if (!score.current) score.current = new FilmScore();
    if (enable) {
      try { await score.current.enable(); score.current.scene(sceneIndex); setSound(true); setSoundError(false); }
      catch { setSound(false); setSoundError(true); }
    } else { score.current.mute(); setSound(false); }
  };
  const enter = (audio: boolean) => {
    if (audio) void toggleSound(true);
    entrance.current?.close(); setEntered(true); window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const go = (index: number) => {
    setPlaying(false); setMenu(false);
    const height = screen.current?.clientHeight || innerHeight;
    window.scrollTo({ top: (film.current?.offsetTop || 0) + (index === 0 ? 0 : index + 0.24) * height, behavior: motion ? 'smooth' : 'instant' });
  };
  const openBrief = () => { setPlaying(false); setMenu(false); setBrief(true); };
  const playFilm = () => {
    if (playing) { setPlaying(false); return; }
    if (hasEnded) {
      window.scrollTo({ top: film.current?.offsetTop || 0, behavior: 'instant' });
      state.current.progress = 0;
      setProgress(0);
    }
    setPlaying(true);
  };
  const sceneOpacity = (index: number) => {
    const local = progress - index;
    if (local < 0 || local >= 1) return 0;
    const incoming = index === 0 ? 1 : smooth(local / 0.16);
    return incoming * (index === story.length - 1 ? 1 : 1 - smooth((local - 0.8) / 0.2));
  };
  const handover = smooth((progress - 7.9) * 2) * (1 - smooth((progress - 9) * 2));
  const still = smooth((progress - 9.95) * 3) * (1 - smooth((progress - 10.85) * 4));

  return <div className={`cinema ${entered ? 'has-entered' : ''}`}>
    <a className="skip-link" href="#after-film" onClick={() => { setPlaying(false); if (!entered) enter(false); }}>Skip the film</a>
    <header className="film-header" inert={!entered}>
      <button className="wordmark" onClick={() => go(0)} aria-label="doingthings, back to the beginning">doing<span>things</span><i /></button>
      <span className="header-title">a story about making people feel.</span>
      <button className="header-cta" onClick={openBrief}>start your story <span aria-hidden="true">↗</span></button>
    </header>
    <main>
      <section className="film-scroll" ref={film} id="top" style={{ height: `${(story.length + 1) * 100}svh` }} aria-label="The doingthings film">
        <div className={`film-screen scene-${sceneIndex}`} ref={screen} onPointerMove={event => {
          if (event.pointerType === 'touch') return;
          state.current.pointerX = event.clientX / innerWidth - 0.5;
          state.current.pointerY = event.clientY / innerHeight - 0.5;
        }} onPointerLeave={() => { state.current.pointerX = 0; state.current.pointerY = 0; }} onPointerDown={event => {
          if (!(event.target as HTMLElement).closest('a,button,input,dialog')) { state.current.pulse++; score.current?.spark(); window.dispatchEvent(new Event('film-state-change')); }
        }}>
          <div className="stage-still" style={{ opacity: still }}><img src="/art/becoming.webp" alt="" /></div>
          <div className="handover-art" style={{ opacity: handover * 0.72 }}><img src="/art/together.webp" alt="" /></div>
          <WorldBoundary onReady={onReady}><Suspense fallback={<div className="world-loading" />}><World state={state} onReady={onReady} /></Suspense></WorldBoundary>
          <div className={`cinema-shade ${sceneIndex >= 7 ? 'center-shade' : ''}`} />
          <div className="film-grain" aria-hidden="true" />
          <div className="letterbox top" aria-hidden="true" /><div className="letterbox bottom" aria-hidden="true" />
          <div className="screenplay" inert={!entered}>
            {story.map((scene, index) => {
              const opacity = sceneOpacity(index);
              return <article key={scene.name} className={`shot ${scene.layout}`} aria-hidden={opacity < 0.1} inert={opacity < 0.1} style={{ opacity: entered ? opacity : 0, visibility: opacity > 0 ? 'visible' : 'hidden', transform: motion ? `translateY(${(1 - opacity) * 20}px)` : undefined }}>
                <p className="shot-lead">{scene.lead}</p>
                {index === 0 ? <h1>{scene.title}<br /><em>{scene.italic}</em></h1> : <h2>{scene.title}<br /><em>{scene.italic}</em></h2>}
                <p className="shot-line">{scene.line}</p>
                {'craft' in scene && <p className="shot-craft">{scene.craft}</p>}
                {index === 0 && <button className="begin-scroll" onClick={() => go(1)}><span aria-hidden="true">↓</span>follow the feeling</button>}
                {index === story.length - 1 && <button className="join-scene" onClick={openBrief}>let’s make it real <span aria-hidden="true">↗</span></button>}
              </article>;
            })}
          </div>
          <span className="touch-note" aria-hidden="true" style={{ opacity: entered && progress < 0.8 ? 0.6 : 0 }}>move a little. the world moves with you.</span>
        </div>
      </section>
      <section className="after-film" id="after-film" inert={!entered}>
        <div className="after-image"><img src="/art/together.webp" alt="Two hands passing a silver thread, a connection made" loading="lazy" /></div>
        <div className="after-copy"><span className="whisper">the film ends. the possibilities don’t.</span><h2>A little belief.<br /><em>A world of possibility.</em></h2><p>We’re doingthings. A product studio bringing technology, music, beauty, art, and thoughtful products into the same room.</p><p>We research. We imagine. We build.<br />For people who deserve to feel something.</p><button className="underlined" onClick={openBrief}>bring us your what-if <span aria-hidden="true">↗</span></button></div>
      </section>
      <section className="finale" inert={!entered} aria-labelledby="finale-title"><span className="whisper">starring, perhaps, you.</span><h2 id="finale-title"><button onClick={openBrief}>Write the<br /><em>next scene.</em><span className="finale-arrow" aria-hidden="true">↗</span></button></h2><div className="finale-bottom"><p>No perfect brief needed.<br />Just something you believe in.</p><a href="mailto:smith@doingthings.xyz">smith@doingthings.xyz ↗</a></div></section>
    </main>
    <footer className="credits" inert={!entered}><button onClick={() => go(0)}>watch again ↺</button><span>doingthings · everywhere it matters</span><span>© {new Date().getFullYear()}</span></footer>
    <div className="film-controls" inert={!entered}>
      <div className="chapter-control" onKeyDown={event => { if (event.key === 'Escape') { setMenu(false); event.currentTarget.querySelector('button')?.focus(); } }}><button className="current-scene" aria-expanded={menu} aria-controls="scene-menu" onClick={() => setMenu(!menu)}><span className="scene-dot" />{story[sceneIndex].name}<span aria-hidden="true">{menu ? '−' : '+'}</span></button>
        {menu && <nav className="scene-menu" id="scene-menu" aria-label="Jump to a scene"><span className="whisper">find your scene</span>{story.map((scene, index) => <button key={scene.name} aria-current={sceneIndex === index ? 'step' : undefined} onClick={() => go(index)}>{scene.name}<span aria-hidden="true">↗</span></button>)}</nav>}
      </div>
      <div className="film-track" aria-hidden="true"><span style={{ transform: `scaleX(${progress / STORY_END})` }} /></div>
      <span className="scroll-prompt">{playing ? 'sit back. feel something.' : hasEnded ? 'the next scene is yours' : 'scroll to unfold'}</span>
      <div className="playback-controls"><button className="play-button" onClick={playFilm} disabled={!motion} aria-label={playing ? 'Pause film' : 'Play film automatically'} aria-pressed={playing}><span aria-hidden="true">{playing ? 'Ⅱ' : '▷'}</span><span>{playing ? 'pause' : 'play film'}</span></button><button className={`sound-button ${sound ? 'sound-on' : ''}`} onClick={() => void toggleSound()} aria-label={sound ? 'Mute sound' : 'Enable sound'} aria-pressed={sound}><span className="sound-bars" aria-hidden="true"><i /><i /><i /><i /></span><span>sound {sound ? 'on' : 'off'}</span></button><button className="motion-button" aria-label={motion ? 'Reduce motion' : 'Enable motion'} aria-pressed={motion} onClick={() => { setMotion(!motion); setPlaying(false); }}>{motion ? '◉' : '○'}</button></div>
    </div>
    {soundError && <p className="audio-notice" role="status">Sound couldn’t start. You can still explore the film in silence.</p>}
    <dialog ref={entrance} className="entrance" aria-labelledby="entrance-title" onCancel={event => { event.preventDefault(); enter(false); }}>
      <div className="entrance-brand">doingthings<span>presents</span></div>
      <div className="entrance-body"><p className="whisper">a small myth. an infinite possibility.</p><h2 id="entrance-title">Some things<br />are worth<br /><em>feeling.</em></h2><p className="entrance-line">A journey from the gods of making<br />to whatever comes next.</p><div className="entry-actions"><button className="enter-button" onClick={() => enter(true)}>enter with sound <span aria-hidden="true">↗</span></button><button className="enter-silent" onClick={() => enter(false)}>explore in silence</button></div></div>
      <div className="entrance-footer"><span>{ready ? 'headphones make it a little more magical.' : 'the world is waking up…'}</span><span>scroll to explore · or press play and drift</span></div>
    </dialog>
    <ProjectBrief open={brief} onClose={() => setBrief(false)} />
  </div>;
}
