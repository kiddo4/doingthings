import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { FilmScore } from './film/score';
import { clamp, smooth, story, services, STORY_END, type FilmState } from './film/story';
import ProjectBrief from './film/ProjectBrief';
import WorldBoundary from './film/WorldBoundary';
import Icon from './film/Icon';
import './App.css';
const World = lazy(() => import('./film/World'));

export default function App() {
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(false);
  const [soundError, setSoundError] = useState(false);
  const [motion, setMotion] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [progress, setProgress] = useState(0);
  const [menu, setMenu] = useState(false);
  const [brief, setBrief] = useState(false);
  const film = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const autoSound = useRef(true);
  const score = useRef<FilmScore | null>(null);
  const state = useRef<FilmState>({ progress: 0, pointerX: 0, pointerY: 0, motion, pulse: 0 });
  const sceneIndex = Math.min(story.length - 1, Math.floor(progress));
  const hasEnded = progress >= STORY_END - 0.04;
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const soundtrack = new FilmScore(setSound);
    score.current = soundtrack;
    let live = true;
    const start = () => {
      if (!autoSound.current || soundtrack.enabled || document.hidden) return;
      void soundtrack.enable().then(enabled => {
        if (live && enabled) { soundtrack.scene(Math.floor(state.current.progress)); setSound(true); setSoundError(false); }
      }).catch(() => { /* A gesture or the sound control can retry browser-blocked audio. */ });
    };
    const gesture = (event: Event) => {
      if ((event.target as HTMLElement).closest?.('.sound-button')) return;
      start();
    };
    start();
    // Touch scrolling can cancel pointerup; touchend covers mobile WebKit too.
    const gestures = ['pointerup', 'touchend', 'click', 'keydown'] as const;
    gestures.forEach(event => window.addEventListener(event, gesture, { passive: true }));
    return () => {
      live = false; gestures.forEach(event => window.removeEventListener(event, gesture));
      soundtrack.dispose(); score.current = null;
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    state.current.motion = motion;
    window.dispatchEvent(new Event('film-state-change'));
  }, [motion]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setMotion(!media.matches); if (media.matches) setPlaying(false); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    document.body.style.overflow = brief ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [brief]);
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
    if (!playing || !motion || brief || menu) return;
    let frame = 0, previous = 0;
    const step = (now: number) => {
      const elapsed = previous ? Math.min(now - previous, 80) : 0; previous = now;
      const height = screen.current?.clientHeight || innerHeight;
      const p = state.current.progress;
      if (p >= STORY_END - 0.04) { setPlaying(false); return; }
      // Give each beat its own pace while keeping the scroll position native.
      const duration = story[Math.min(story.length - 1, Math.floor(p))].duration;
      window.scrollBy({ top: elapsed * height / duration, behavior: 'instant' });
      frame = requestAnimationFrame(step);
    };
    const interrupt = () => setPlaying(false);
    const touch = (event: TouchEvent) => {
      // Let controls handle their own tap; pausing here would reverse a pause tap.
      if (!(event.target instanceof Element) || !event.target.closest('button,a,input,select,textarea,dialog')) interrupt();
    };
    const key = (event: KeyboardEvent) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Tab'].includes(event.key)) interrupt(); };
    window.addEventListener('wheel', interrupt, { passive: true }); window.addEventListener('touchstart', touch, { passive: true }); window.addEventListener('keydown', key);
    if (ready) frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('wheel', interrupt); window.removeEventListener('touchstart', touch); window.removeEventListener('keydown', key); };
  }, [playing, ready, motion, brief, menu]);

  const toggleSound = async (enable = !sound) => {
    autoSound.current = enable;
    if (!score.current) score.current = new FilmScore(setSound);
    if (enable) {
      try { const enabled = await score.current.enable(); if (enabled) { score.current.scene(sceneIndex); setSound(true); setSoundError(false); } }
      catch { setSound(false); setSoundError(true); }
    } else { score.current.mute(); setSound(false); }
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

  return <div className="cinema">
    <a className="skip-link" href="#after-film" onClick={() => setPlaying(false)}>Skip the film</a>
    <header className="film-header">
      <button className="wordmark" onClick={() => go(0)} aria-label="doingthings, back to the beginning">doing<span>things</span><i /></button>
      <span className="header-title">software product studio</span><a className="services-link" href="#services" onClick={() => setPlaying(false)}>what we do</a>
      <button className="header-cta" onClick={openBrief}>start a project <span aria-hidden="true"><Icon name="arrow" /></span></button>
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
          <div className="screenplay">
            {story.map((scene, index) => {
              const opacity = sceneOpacity(index);
              return <article key={scene.name} className={`shot ${scene.layout}`} aria-hidden={opacity < 0.1} inert={opacity < 0.1} style={{ opacity, visibility: opacity > 0 ? 'visible' : 'hidden', transform: motion ? `translateY(${(1 - opacity) * 20}px)` : undefined }}>
                <p className="shot-lead">{scene.lead}</p>
                {index === 0 ? <h1>{scene.title}<br /><em>{scene.italic}</em></h1> : <h2>{scene.title}<br /><em>{scene.italic}</em></h2>}
                <p className="shot-line">{scene.line}</p>
                {'craft' in scene && <p className="shot-craft">{scene.craft}</p>}
                {index === 0 && <button className="begin-scroll" onClick={() => go(1)}><span aria-hidden="true"><Icon name="down" /></span>see where it could go</button>}
                {index === story.length - 1 && <button className="join-scene" onClick={openBrief}>let’s make it real <span aria-hidden="true"><Icon name="arrow" /></span></button>}
              </article>;
            })}
          </div>
          <span className="touch-note" aria-hidden="true" style={{ opacity: progress < 0.8 ? 0.6 : 0 }}>move a little. the world moves with you.</span>
        </div>
      </section>
      <section className="after-film" id="after-film">
        <div className="after-image"><img src="/art/together.webp" alt="Two hands passing a silver thread, a connection made" loading="lazy" /></div>
        <div className="after-copy"><span className="whisper">a software product studio. from idea to impact.</span><h2>You bring the what-if.<br /><em>We make it work.</em></h2><p>We’re doingthings. We help founders and teams turn ambitious ideas into software, AI-powered products, and useful agents.</p><p>From understanding the problem to designing the experience, building the product, and connecting the tools behind it. One team, thinking and building with you.</p><button className="underlined" onClick={openBrief}>bring us your what-if <span aria-hidden="true"><Icon name="arrow" /></span></button></div>
      </section>
      <section className="services" id="services" aria-labelledby="services-title">
        <div className="services-intro"><span className="whisper">what we can do together</span><h2 id="services-title">A thought. A prototype.<br /><em>A product in the world.</em></h2><p>Come with a question or a brief. Start with one part, or build the whole thing with us.</p></div>
        <div className="service-list">{services.map(service => <button key={service.name} onClick={openBrief} className="service-item"><span className="service-name">{service.name}<span aria-hidden="true"><Icon name="arrow" /></span></span><span className="service-detail">{service.detail}</span><span className="service-deliverables">{service.deliverables}</span></button>)}</div>
      </section>
      <section className="finale" aria-labelledby="finale-title"><span className="whisper">one day can start here.</span><h2 id="finale-title"><button onClick={openBrief}>Write the<br /><em>next scene.</em><span className="finale-arrow" aria-hidden="true"><Icon name="arrow" /></span></button></h2><div className="finale-bottom"><p>No perfect brief needed.<br />Just something you believe in.</p><a href="mailto:smith@doingthings.xyz">smith@doingthings.xyz <Icon name="arrow" /></a></div></section>
    </main>
    <footer className="credits"><button onClick={() => go(0)}>watch again <Icon name="replay" /></button><span>doingthings · everywhere it matters</span><span>© {new Date().getFullYear()}</span></footer>
    <div className="film-controls">
      <div className="chapter-control" onKeyDown={event => { if (event.key === 'Escape') { setMenu(false); event.currentTarget.querySelector('button')?.focus(); } }}><button className="current-scene" aria-expanded={menu} aria-controls="scene-menu" onClick={() => { setMenu(!menu); setPlaying(false); }}><span className="scene-dot" />{story[sceneIndex].name}<span aria-hidden="true">{menu ? '−' : '+'}</span></button>
        {menu && <nav className="scene-menu" id="scene-menu" aria-label="Jump to a scene"><span className="whisper">find your scene</span>{story.map((scene, index) => <button key={scene.name} aria-current={sceneIndex === index ? 'step' : undefined} onClick={() => go(index)}>{scene.name}<span aria-hidden="true"><Icon name="arrow" /></span></button>)}</nav>}
      </div>
      <div className="film-track" aria-hidden="true"><span style={{ transform: `scaleX(${progress / STORY_END})` }} /></div>
      <span className="scroll-prompt">{playing ? 'the story is playing · scroll to take over' : hasEnded ? 'the next scene is yours' : 'scroll to unfold'}</span>
      <div className="playback-controls"><button className="play-button" onClick={playFilm} disabled={!motion} aria-label={playing ? 'Pause film' : 'Play film automatically'} aria-pressed={playing}><span aria-hidden="true"><Icon name={playing ? 'pause' : 'play'} /></span><span>{playing ? 'pause' : 'play film'}</span></button><button className={`sound-button ${sound ? 'sound-on' : ''}`} onClick={() => void toggleSound()} aria-label={sound ? 'Mute sound' : 'Enable sound'} aria-pressed={sound}><span className="sound-bars" aria-hidden="true"><i /><i /><i /><i /></span><span>{sound ? 'sound on' : 'tap for sound'}</span></button><button className="motion-button" aria-label={motion ? 'Reduce motion' : 'Enable motion'} aria-pressed={motion} onClick={() => { setMotion(!motion); setPlaying(false); }}>{motion ? '◉' : '○'}</button></div>
    </div>
    {soundError && <p className="audio-notice" role="status">Sound couldn’t start. You can still explore the film in silence.</p>}
    <ProjectBrief open={brief} onClose={() => setBrief(false)} />
  </div>;
}
