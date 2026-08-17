import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SpaceScene from './SpaceScene.jsx';
import StoryScene from './StoryScene.jsx';
import LandingScene from './LandingScene.jsx';
import { destinationById, destinations, profile } from './content.js';
import './styles.css';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function App() {
  const [booted, setBooted] = useState(false);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState(null);
  const [journey, setJourney] = useState(null);
  const [landed, setLanded] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quality, setQuality] = useState(() => localStorage.getItem('promptverse-quality') || 'medium');
  const [fallback, setFallback] = useState(false);
  const [formState, setFormState] = useState('idle');
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const touchStart = useRef(null);
  useEffect(() => { const timer = setTimeout(() => setBooted(true), reducedMotion ? 100 : 1800); return () => clearTimeout(timer); }, [reducedMotion]);
  useEffect(() => localStorage.setItem('promptverse-quality', quality), [quality]);
  useEffect(() => {
    const id = location.pathname.split('/').filter(Boolean)[0];
    if (destinationById[id]) { setBooted(true); setStarted(true); setSelected(id); setLanded(true); setProgress(destinations.findIndex((item) => item.id === id) / (destinations.length - 1)); }
  }, []);

  const beginJourney = useCallback((id) => {
    if (!destinationById[id]) return;
    setStarted(true); setMapOpen(false); setMenuOpen(false); setLanded(false); setSelected(id); setJourney({ id, key: Date.now() });
    history.pushState({}, '', `/${id}`);
  }, []);

  const finishJourney = useCallback(() => { setLanded(true); setJourney(null); }, []);
  const returnToSpace = useCallback(() => { setJourney(null); setLanded(false); setSelected(null); history.pushState({}, '', '/'); }, []);

  // Warp dock: jump straight between planets without flying back through space.
  const warpTo = useCallback((id) => {
    if (!destinationById[id]) return;
    setJourney(null); setLanded(true); setSelected(id); setMapOpen(false); setMenuOpen(false);
    setProgress(destinations.findIndex((item) => item.id === id) / (destinations.length - 1));
    history.pushState({}, '', `/${id}`);
  }, []);

  useEffect(() => {
    const onWheel = (event) => {
      if (!started || journey || landed || fallback) return;
      setProgress((value) => clamp(value + event.deltaY * 0.00055, 0, 1));
    };
    const onKey = (event) => {
      if (event.key === 'Escape') { setMapOpen(false); setMenuOpen(false); }
      if (!journey && !landed && ['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setStarted(true); setProgress((value) => clamp(value + (event.key === 'ArrowDown' ? .055 : -.055), 0, 1)); }
    };
    window.addEventListener('wheel', onWheel, { passive: true }); window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey); };
  }, [started, journey, landed, fallback]);

  const nearestMatch = destinations.reduce((best, item, index) => Math.abs(progress - index / (destinations.length - 1)) < best.distance ? { item, distance: Math.abs(progress - index / (destinations.length - 1)) } : best, { item: destinations[0], distance: Infinity });
  const nearest = nearestMatch.item;
  const nearbyPlanet = nearestMatch.distance <= .065 ? nearestMatch.item : null;
  const indicatedPlanet = hovered || nearbyPlanet;

  const submitContact = (event) => {
    event.preventDefault(); setFormState('loading');
    setTimeout(() => setFormState('success'), 1200);
  };

  if (!booted) return <LoadingScreen />;

  return (
    <main className={`promptverse ${started ? 'is-started' : ''} ${landed ? 'is-landed' : ''}`} onTouchStart={(e) => { touchStart.current = e.touches[0].clientY; }} onTouchEnd={(e) => { if (!started || landed || journey || mapOpen || menuOpen || fallback) return; const delta = (touchStart.current || 0) - e.changedTouches[0].clientY; setProgress((value) => clamp(value + delta * .0018, 0, 1)); }}>
      {!fallback && <SpaceScene progress={progress} selected={selected} journey={journey} quality={quality} reducedMotion={reducedMotion} focusedPlanetId={indicatedPlanet?.id} onPlanetClick={beginJourney} onPlanetHover={setHovered} onJourneyDone={finishJourney} />}
      <div className="space-noise" />

      <header className="hud-top">
        <button className="brand" onClick={returnToSpace}><span>PN</span><div><strong>{profile.name}</strong><small>PROMPTVERSE</small></div></button>
        <div className="sector"><i /> CURRENT SECTOR <strong>{selected ? destinationById[selected].name : nearest.name}</strong></div>
        <nav aria-label="Portfolio controls">
          <button onClick={() => setMapOpen((v) => !v)}>Mission Map</button>
          <button className="icon-button" onClick={() => setMenuOpen((v) => !v)} aria-label="Open settings">⚙</button>
        </nav>
      </header>

      {!started && <Intro onStart={() => setStarted(true)} onQuickView={() => setFallback(true)} />}

      {started && !landed && !journey && <div className="flight-guide"><span>SCROLL TO FLY</span><div className="flight-direction"><b>↑</b><b>↓</b></div><p>UP: BACK <em>•</em> DOWN: FORWARD</p></div>}
      {started && indicatedPlanet && !journey && !landed && <div className={`planet-tooltip ${hovered ? 'is-hovered' : 'is-nearby'}`}><small>{hovered ? 'TARGET ACQUIRED' : 'ENTERING PLANET RANGE'}</small><strong>{indicatedPlanet.name}</strong><p><b>{indicatedPlanet.section}</b> — {indicatedPlanet.tagline}</p><span>Click or tap to initiate landing</span></div>}

      {(mapOpen || menuOpen) && <button className="scrim" onClick={() => { setMapOpen(false); setMenuOpen(false); }} aria-label="Close panel" />}
      <MissionMap open={mapOpen} selected={selected} onSelect={landed ? warpTo : beginJourney} onClose={() => setMapOpen(false)} />
      <Settings open={menuOpen} quality={quality} setQuality={setQuality} fallback={fallback} setFallback={setFallback} onClose={() => setMenuOpen(false)} />

      {journey && <div className="journey-status"><small>AUTOPILOT ENGAGED</small><strong>Approaching {destinationById[selected].name}</strong><div className="journey-line"><i /></div><button onClick={finishJourney}>Skip journey</button></div>}
      {landed && <SectionOverlay key={selected} section={destinationById[selected]} initialProjectSlug={selected === 'projects' ? location.pathname.split('/').filter(Boolean)[1] : null} onBack={returnToSpace} onWarp={warpTo} quality={quality} reducedMotion={reducedMotion} formState={formState} onSubmit={submitContact} />}
      {fallback && <FallbackView onExplore={beginJourney} onClose={() => setFallback(false)} />}

      <footer className="hud-bottom"><span>SYS // ONLINE</span><div className="journey-progress"><i style={{ width: `${progress * 100}%` }} /></div><span>{Math.round(progress * 100).toString().padStart(2, '0')}% JOURNEY</span></footer>
    </main>
  );
}

function LoadingScreen() { return <div className="loading-screen"><div className="loader-orbit"><i /><span>AI</span></div><p>INITIALIZING AI NAVIGATION SYSTEM</p><h1>MISSION: EXPLORE THE PROMPTVERSE</h1><div className="loading-bar"><i /></div></div>; }

function Intro({ onStart, onQuickView }) { return <section className="intro-panel"><div className="eyebrow"><i /> TRANSMISSION RECEIVED // 001</div><p className="hello">Hi, I’m</p><h1>{profile.name}</h1><h2>{profile.role}</h2><p className="intro-text">{profile.intro}</p><div className="intro-actions"><button className="primary" onClick={onStart}>Begin exploration <span>→</span></button><button onClick={onQuickView}>Quick 2D view</button></div><small className="instruction">Scroll to navigate <b>•</b> Click a planet to explore</small></section>; }

function MissionMap({ open, selected, onSelect, onClose }) { return <aside className={`mission-map ${open ? 'open' : ''}`} aria-hidden={!open}><button className="panel-close" onClick={onClose} aria-label="Close mission map">×</button><header><small>DIRECT NAVIGATION</small><h2>Mission Map</h2><p>Choose a destination. All journeys are skippable.</p></header><div className="map-orbit">{destinations.map((item, index) => <button key={item.id} className={selected === item.id ? 'active' : ''} onClick={() => onSelect(item.id)}><span style={{ '--planet': item.color }}>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.name}</strong><small>{item.section}</small></div><b>↗</b></button>)}</div></aside>; }

function Settings({ open, quality, setQuality, fallback, setFallback, onClose }) { return <aside className={`settings-panel ${open ? 'open' : ''}`} aria-hidden={!open}><button className="panel-close" onClick={onClose} aria-label="Close settings">×</button><small>SYSTEM SETTINGS</small><h2>Experience</h2><label>Graphics quality<select value={quality} onChange={(e) => setQuality(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label className="switch-row">Use accessible 2D mode<input type="checkbox" checked={fallback} onChange={(e) => setFallback(e.target.checked)} /></label><p>Motion preferences from your device are respected automatically.</p></aside>; }

/* ------------------------------------------------------------------ *
 *  Sub-page experience: cinematic scroll story
 * ------------------------------------------------------------------ */

const shortCompany = (title) => (title.includes('—') ? title.split('—')[1].trim() : title);

const SKILL_GROUP_META = {
  'Front-end': { name: 'Front-end', icon: '🎨', blurb: 'Interfaces people enjoy using — responsive, accessible, and quick.' },
  'Back-end and mobile': { name: 'Back-end & Mobile', icon: '🛠️', blurb: 'The engine room — servers, databases, APIs, and mobile apps.' },
  'Platforms and operations': { name: 'Platforms & Tools', icon: '🚀', blurb: 'CMS platforms, SEO tooling, and automation that keep things running.' },
};

const CHANNEL_ICON = { Email: '📧', Phone: '📞', Location: '📍' };

// Turn a section's real content into a sequence of full-screen story panels.
function buildPanels(section, ctx) {
  const hero = {
    key: 'hero', variant: 'is-hero', dot: 'Intro',
    content: (
      <>
        <span className="story-eyebrow">{section.eyebrow}</span>
        <h1 className="story-title">{section.id === 'about' ? `Hi, I'm ${profile.name}` : section.friendlyTitle}</h1>
        <p className="story-lead">{section.id === 'about' ? profile.role : section.heading}</p>
        <p className="story-sub">{section.tagline}</p>
        <span className="scroll-cue">Use the console to fly through <b>►</b></span>
      </>
    ),
  };

  switch (section.id) {
    case 'about': {
      const story = { key: 'story', dot: 'My story', content: (
        <><span className="panel-kicker">My story</span><h2 className="panel-big">Full-stack developer, focused on real people.</h2><p className="panel-para">{section.body}</p></>
      ) };
      const strengths = { key: 'strengths', variant: 'is-wide', dot: 'Strengths', content: (
        <>
          <span className="panel-kicker">What I&rsquo;m great at</span>
          <div className="strength-grid">
            {section.facts.map((fact, i) => (
              <div className="strength-card" key={fact.title}>
                <h3>{fact.title}</h3>
                <p>{fact.text}</p>
                {section.stats[i] && <div className="bar"><span style={{ width: `${section.stats[i].value}%` }} /></div>}
              </div>
            ))}
          </div>
        </>
      ) };
      const cta = { key: 'cta', variant: 'is-cta', dot: 'Next', content: (
        <>
          <span className="panel-kicker">Like what you see?</span>
          <h2 className="panel-big">Let&rsquo;s build something together.</h2>
          <div className="cta-row">
            <button className="btn primary" onClick={() => ctx.onWarp('projects')}>See my work →</button>
            <button className="btn" onClick={() => ctx.onWarp('contact')}>Get in touch</button>
          </div>
        </>
      ) };
      return [hero, story, strengths, cta];
    }
    case 'skills': {
      const total = Object.keys(section.groups).length;
      const groups = Object.entries(section.groups).map(([name, list], i) => {
        const meta = SKILL_GROUP_META[name] || { name, icon: '✨', blurb: '' };
        return { key: `g${i}`, dot: meta.name, content: (
          <>
            <span className="panel-icon" aria-hidden="true">{meta.icon}</span>
            <span className="panel-kicker">Skill set {i + 1} of {total}</span>
            <h2 className="panel-big">{meta.name}</h2>
            <p className="panel-text">{meta.blurb}</p>
            <div className="chips">{list.map((skill) => <span key={skill}>{skill}</span>)}</div>
          </>
        ) };
      });
      return [hero, ...groups];
    }
    case 'projects': {
      const projects = section.cards.map((card, i) => ({ key: card.slug, variant: 'is-project', dot: card.title, content: (
        <div className="project-showcase">
          <div className="project-copy">
            <span className="panel-kicker">Project {String(i + 1).padStart(2, '0')} / {String(section.cards.length).padStart(2, '0')}</span>
            <h2 className="panel-big">{card.title}</h2>
            <p className="project-meta">{card.meta}</p>
            <p className="panel-text">{card.text}</p>
            <div className="chips small">{card.tags.slice(0, 6).map((tag) => <span key={tag}>{tag}</span>)}</div>
            <button className="btn primary" onClick={() => ctx.showProject(card)}>See full details →</button>
          </div>
          <div className="project-frame" aria-hidden="true">
            <div className="frame-bar"><i /><i /><i /></div>
            <div className="frame-screen"><span>{card.title}</span><b>{card.meta}</b></div>
          </div>
        </div>
      ) }));
      return [hero, ...projects];
    }
    case 'services': {
      const services = section.cards.map((card, i) => ({ key: `s${i}`, dot: card.title, content: (
        <>
          <span className="panel-icon" aria-hidden="true">{card.icon}</span>
          <span className="panel-kicker">{card.meta}</span>
          <h2 className="panel-big">{card.title}</h2>
          <p className="panel-text">{card.text}</p>
        </>
      ) }));
      const cta = { key: 'cta', variant: 'is-cta', dot: 'Start', content: (
        <>
          <span className="panel-kicker">Have a project in mind?</span>
          <h2 className="panel-big">Let&rsquo;s scope it together.</h2>
          <div className="cta-row"><button className="btn primary" onClick={() => ctx.onWarp('contact')}>Start a conversation →</button></div>
        </>
      ) };
      return [hero, ...services, cta];
    }
    case 'experience': {
      const steps = section.timeline.map((entry, i) => ({ key: `e${i}`, dot: shortCompany(entry.title), content: (
        <>
          <span className="panel-kicker">Step {i + 1} of {section.timeline.length} <em>· {entry.date}</em></span>
          <h2 className="panel-big">{entry.title}</h2>
          <p className="panel-text">{entry.text}</p>
        </>
      ) }));
      return [hero, ...steps];
    }
    case 'contact': {
      const reach = { key: 'reach', variant: 'is-wide', dot: 'Reach me', content: (
        <>
          <span className="panel-kicker">Reach me directly</span>
          <div className="channel-grid">
            {section.channels.map((channel) => {
              const inner = (<><span className="channel-icon" aria-hidden="true">{CHANNEL_ICON[channel.title] || '🛰️'}</span><b>{channel.title}</b><span className="channel-value">{channel.text}</span></>);
              return channel.href
                ? <a className="channel" key={channel.title} href={channel.href}>{inner}</a>
                : <div className="channel" key={channel.title}>{inner}</div>;
            })}
          </div>
        </>
      ) };
      const form = { key: 'form', variant: 'is-form', dot: 'Message', content: (
        <>
          <span className="panel-kicker">Send a message</span>
          <h2 className="panel-big">Tell me about your idea.</h2>
          <ContactForm state={ctx.formState} onSubmit={ctx.onSubmit} />
        </>
      ) };
      return [hero, reach, form];
    }
    default:
      return [hero];
  }
}

// A draggable throttle lever, like a flight-sim quadrant: grab the handle and
// slide it through the gear detents (click the track or use arrow keys too).
function ThrottleLever({ gear, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const setFromY = (clientY) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = clamp((rect.bottom - clientY) / rect.height, 0, 1);
    const next = 1 + Math.round(ratio * 3);
    if (next !== gear) onChange(next);
  };
  const onDown = (event) => { setDragging(true); try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* capture is best-effort */ } setFromY(event.clientY); };
  const onMove = (event) => { if (dragging) setFromY(event.clientY); };
  const stop = () => setDragging(false);
  const pos = ((gear - 1) / 3) * 100;
  return (
    <div
      className={`throttle-lever ${dragging ? 'is-dragging' : ''}`}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={stop} onPointerCancel={stop}
      role="slider" aria-label="Throttle gear" aria-valuemin={1} aria-valuemax={4} aria-valuenow={gear}
      aria-valuetext={`Gear ${gear}`} tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); onChange(Math.min(4, gear + 1)); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') { event.preventDefault(); event.stopPropagation(); onChange(Math.max(1, gear - 1)); }
      }}
    >
      <div className="tl-track" ref={trackRef}>
        <i className="tl-fill" style={{ height: `${pos}%` }} />
        {[0, 1, 2, 3].map((notch) => <i key={notch} className="tl-notch" style={{ bottom: `${(notch / 3) * 100}%` }} />)}
        <div className="tl-handle" style={{ bottom: `${pos}%` }}><i /><i /><i /></div>
      </div>
      <div className="tl-ticks">{[4, 3, 2, 1].map((g) => <span key={g} className={g <= gear ? 'lit' : ''}>{g}</span>)}</div>
      <b>GEAR</b>
    </div>
  );
}

// A rotary knob: drag up/down (or arrow keys) to turn it through 270°.
function Knob({ value, onChange, label }) {
  const dragRef = useRef(null);
  const onDown = (event) => { dragRef.current = { y: event.clientY, v: value }; try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* best effort */ } };
  const onMove = (event) => { if (dragRef.current) onChange(clamp(dragRef.current.v + (dragRef.current.y - event.clientY) / 110, 0, 1)); };
  const stop = () => { dragRef.current = null; };
  return (
    <div
      className="knob" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={stop} onPointerCancel={stop}
      role="slider" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} tabIndex={0}
      onKeyDown={(event) => {
        if (['ArrowUp', 'ArrowRight'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); onChange(Math.min(1, value + 0.1)); }
        if (['ArrowDown', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); onChange(Math.max(0, value - 0.1)); }
      }}
    >
      <div className="knob-face" style={{ transform: `rotate(${-135 + value * 270}deg)` }}><i /></div>
      <b>{label}</b>
    </div>
  );
}

// A Thrustmaster-style flight stick: drag anywhere on the pad to tilt the
// grip through its full 360° gimbal — the ship pitches, yaws and banks with
// it — and it snaps back to center when released, like the real hardware.
function FlightStick({ onMove }) {
  const padRef = useRef(null);
  const [vec, setVec] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const set = (x, y) => { setVec({ x, y }); onMove(x, y); };
  const fromEvent = (event) => {
    const rect = padRef.current.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const len = Math.hypot(dx, dy);
    const scale = len > 1 ? 1 / len : 1; // clamp to the gimbal circle
    set(clamp(dx * scale, -1, 1), clamp(dy * scale, -1, 1));
  };
  const onDown = (event) => { setDragging(true); try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* best effort */ } fromEvent(event); };
  const onDrag = (event) => { if (dragging) fromEvent(event); };
  const release = () => { setDragging(false); set(0, 0); };
  return (
    <div className="stick-bay">
      <div
        className={`stick-pad ${dragging ? 'is-dragging' : ''}`} ref={padRef}
        onPointerDown={onDown} onPointerMove={onDrag} onPointerUp={release} onPointerCancel={release}
        role="application" aria-label="Flight stick — drag to steer the ship in any direction"
      >
        <i className="stick2-slot-y" aria-hidden="true" />
        <i className="stick2-slot-x" aria-hidden="true" />
        <div className="stick2" style={{ transform: `rotate(${vec.x * 20}deg) translateY(${vec.y * 7}px) scaleY(${(1 - Math.abs(vec.y) * 0.1).toFixed(3)})` }} aria-hidden="true">
          <div className="stick2-handle"><em className="stick2-btn" /><i /><i /><i /><span className="stick2-led" /></div>
          <div className="stick2-shaft" />
        </div>
        <div className="stick2-boot" aria-hidden="true"><i /><i /><i /></div>
      </div>
      <div className="stick-base-keys" aria-hidden="true"><i /><i /><i /><i /></div>
      <b>FLIGHT STICK</b>
    </div>
  );
}

// A bank of little system keys, each with its own indicator colour.
const KEYPAD = [
  { id: 'STB', color: '#5dffc2' }, { id: 'DMP', color: '#ffcf4b' }, { id: 'NAV', color: '#61e7ff' },
  { id: 'SCN', color: '#ff78d1' }, { id: 'AGC', color: '#b8ffe6' }, { id: 'HYD', color: '#ff9b63' },
];

function SectionOverlay({ section, initialProjectSlug, onBack, onWarp, quality, reducedMotion, formState, onSubmit }) {
  const progressRef = useRef(0);
  const lockRef = useRef(false);
  const touchRef = useRef(null);
  const [openProject, setOpenProject] = useState(() =>
    (section.id === 'projects' && initialProjectSlug ? section.cards.find((card) => card.slug === initialProjectSlug) || null : null));

  const showProject = useCallback((project) => { setOpenProject(project); history.pushState({}, '', `/projects/${project.slug}`); }, []);
  const closeProject = useCallback(() => { setOpenProject(null); history.pushState({}, '', '/projects'); }, []);

  const panels = buildPanels(section, { showProject, onWarp, formState, onSubmit });
  const last = panels.length - 1;

  const [block, setBlock] = useState(0);
  const [dir, setDir] = useState('next');
  const [sys, setSys] = useState({ cam: false, grid: true, map: true, log: false, auto: false });
  const [fuel, setFuel] = useState(92);
  const [lights, setLights] = useState(0.8);
  const [keys, setKeys] = useState({ STB: true, NAV: true });
  const [armed, setArmed] = useState(false);
  const flip = (kkey) => setSys((state) => ({ ...state, [kkey]: !state[kkey] }));

  // Flight systems: GEAR sets cruise speed, BOOST fires a burst — both are
  // read live by the 3D scene each frame.
  const [gear, setGear] = useState(2);
  const flightRef = useRef({ gear: 2, boost: 0, cam: false, lights: 0.8, stick: { x: 0, y: 0 } });
  useEffect(() => { flightRef.current.gear = gear; }, [gear]);
  useEffect(() => { flightRef.current.cam = sys.cam; }, [sys.cam]);
  useEffect(() => { flightRef.current.lights = lights; }, [lights]);

  // Mission flight log — records what the pilot does.
  const missionStart = useRef(Date.now());
  const [logs, setLogs] = useState([]);
  const addLog = useCallback((line) => {
    const stamp = `T+${String(Math.round((Date.now() - missionStart.current) / 1000)).padStart(3, '0')}s`;
    setLogs((list) => [...list.slice(-6), `${stamp}  ${line}`]);
  }, []);
  const fireBoost = () => { flightRef.current.boost = 1; setFuel((level) => Math.max(8, level - 6)); addLog('BOOST FIRED — engines at maximum'); };

  const go = useCallback((target) => {
    setBlock((current) => {
      const clamped = clamp(target, 0, last);
      if (clamped !== current) setDir(clamped > current ? 'next' : 'prev');
      progressRef.current = last > 0 ? clamped / last : 0;
      return clamped;
    });
  }, [last]);

  // Pilot the console with the wheel, arrow keys, and space — one block per gesture.
  useEffect(() => {
    const step = (delta) => {
      if (lockRef.current) return;
      lockRef.current = true;
      setTimeout(() => { lockRef.current = false; }, 520);
      setBlock((current) => {
        const clamped = clamp(current + delta, 0, last);
        if (clamped !== current) { setDir(delta > 0 ? 'next' : 'prev'); progressRef.current = last > 0 ? clamped / last : 0; }
        return clamped;
      });
    };
    const onWheel = (event) => { if (openProject || Math.abs(event.deltaY) < 12) return; step(event.deltaY > 0 ? 1 : -1); };
    const onKey = (event) => {
      if (event.key === 'Escape') { if (openProject) closeProject(); else onBack(); return; }
      if (openProject) return;
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); step(1); }
      if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); step(-1); }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey); };
  }, [openProject, last, closeProject, onBack]);

  const panel = panels[Math.min(block, last)];
  const throttle = last > 0 ? Math.round((block / last) * 100) : 0;

  // Live altitude readout so it's always clear how close the planet is.
  const approach = last > 0 ? block / last : 1;
  const kmTarget = Math.round(12400 - approach * (12400 - 6));
  const kmRef = useRef(kmTarget);
  const [km, setKm] = useState(kmTarget);
  useEffect(() => {
    let raf;
    const tick = () => {
      kmRef.current += (kmTarget - kmRef.current) * 0.07;
      if (Math.abs(kmRef.current - kmTarget) < 2) { kmRef.current = kmTarget; setKm(kmTarget); return; }
      setKm(Math.round(kmRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [kmTarget]);
  const flightPhase = approach >= 1 ? 'TOUCHDOWN' : approach >= 0.66 ? 'DESCENT' : approach >= 0.33 ? 'ORBIT' : 'APPROACH';

  // Log every course change.
  useEffect(() => { addLog(`NAV → BLOCK ${String(block + 1).padStart(2, '0')} · ${panels[Math.min(block, last)].dot}`); }, [block]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autopilot: tours the blocks on its own until switched off.
  useEffect(() => {
    if (!sys.auto) return undefined;
    const id = setInterval(() => {
      setBlock((current) => {
        const nextBlock = (current + 1) % (last + 1);
        setDir('next');
        progressRef.current = last > 0 ? nextBlock / last : 0;
        return nextBlock;
      });
    }, 6000);
    return () => clearInterval(id);
  }, [sys.auto, last]);

  // Touch: swipe left/right to move between blocks (buttons still work too).
  const onTouchStart = (event) => { const point = event.touches[0]; touchRef.current = { x: point.clientX, y: point.clientY }; };
  const onTouchEnd = (event) => {
    if (openProject || !touchRef.current) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touchRef.current.x;
    const dy = point.clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? block + 1 : block - 1);
  };

  return (
    <section className={`cockpit section-${section.id}`} style={{ '--planet': section.color, '--accent': section.accent }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <StoryScene section={section} quality={quality} reducedMotion={reducedMotion} scrollRef={progressRef} flightRef={flightRef} />
      <div className="cockpit-glass" />

      <div className="cockpit-frame">
        <span className="strut strut-l" aria-hidden="true" />
        <span className="strut strut-r" aria-hidden="true" />

        <header className="cockpit-hud">
          <button className="hud-exit" onClick={onBack}><b>◄</b> Exit to space</button>
          <div className="hud-title"><small>{section.name}</small><strong>{section.friendlyTitle}</strong></div>
          <div className="hud-sys" aria-hidden="true"><i className="led on" /><i className="led on" /><i className="led warn" /><span>SYS OK</span></div>
        </header>

        <div className="viewscreen">
          <div className={`viewscreen-frame ${sys.grid ? '' : 'no-grid'}`}>
            <i className="vs-corner tl" /><i className="vs-corner tr" /><i className="vs-corner bl" /><i className="vs-corner br" />
            <div className={`viewscreen-scroll ${panel.variant || ''}`} key={block} data-dir={dir}>
              {panel.content}
            </div>
            <div className="vs-scanlines" aria-hidden="true" />
          </div>
        </div>

        <div className="console">
          <div className="console-side left">
            <div className="led-stack" aria-hidden="true">
              <div className="led-row"><i className="led on" /><b>PWR</b></div>
              <div className="led-row"><i className="led on" /><b>ENG</b></div>
              <div className="led-row"><i className="led warn" /><b>O2</b></div>
            </div>
            <div className="switch-row">
              <button type="button" className={`toggle ${sys.cam ? 'on' : ''}`} onClick={() => { flip('cam'); addLog(sys.cam ? 'CAMERA — standard view' : 'CAMERA — wide view'); }} aria-pressed={sys.cam} title="Wide camera"><i /><b>CAM</b></button>
              <button type="button" className={`toggle ${sys.grid ? 'on' : ''}`} onClick={() => flip('grid')} aria-pressed={sys.grid} title="Screen grid"><i /><b>GRID</b></button>
            </div>
            <div className="switch-row">
              <button type="button" className={`toggle ${sys.auto ? 'on' : ''}`} onClick={() => { flip('auto'); addLog(sys.auto ? 'AUTOPILOT disengaged' : 'AUTOPILOT engaged — touring blocks'); }} aria-pressed={sys.auto} title="Autopilot tour"><i /><b>AUTO</b></button>
              <button type="button" className="boost" onClick={fireBoost} title="Fire boost"><b>BOOST</b></button>
            </div>
          </div>

          <div className="console-eng">
            <b>ENGINE TRACE</b>
            <div className="eng-row">
              <div className="eq" aria-hidden="true" style={{ '--eq': `${(1.5 / gear).toFixed(2)}s` }}>
                <i /><i /><i /><i /><i /><i /><i />
              </div>
              <Knob value={lights} onChange={setLights} label="LIGHTS" />
            </div>
            <small>{['IDLE', 'NOMINAL', 'HIGH OUTPUT', 'REDLINE'][gear - 1]}</small>
          </div>

          <div className="console-mid">
            <div className="console-screen"><small>BLOCK {String(block + 1).padStart(2, '0')} / {String(panels.length).padStart(2, '0')}</small><strong>{panel.dot}</strong><em className="alt-readout">{flightPhase} · {km.toLocaleString('en-US')} KM</em></div>
            <div className="navrow">
              <button className="arrow-btn" onClick={() => go(block - 1)} disabled={block === 0} aria-label="Previous block">◄</button>
              <div className="block-switches">
                {panels.map((item, index) => (
                  <button key={item.key} className={index === block ? 'active' : ''} onClick={() => go(index)} title={item.dot} aria-label={item.dot} aria-current={index === block}>
                    <i /><span>{String(index + 1).padStart(2, '0')}</span>
                  </button>
                ))}
              </div>
              <button className="arrow-btn" onClick={() => go(block + 1)} disabled={block === last} aria-label="Next block">►</button>
            </div>
            <div className="throttle" aria-hidden="true"><span style={{ width: `${throttle}%` }} /></div>
          </div>

          <FlightStick onMove={(x, y) => { flightRef.current.stick = { x, y }; }} />

          <div className="console-data">
            <b>FLIGHT DATA</b>
            <div className="data-row"><span>VEL</span><em>{[12, 28, 54, 90][gear - 1]} KM/S</em></div>
            <div className="data-row"><span>ALT</span><em>{km.toLocaleString('en-US')} KM</em></div>
            <div className="data-row fuel"><span>FUEL</span><i><u style={{ width: `${fuel}%` }} /></i><em>{fuel}%</em></div>
            <div className="keypad" role="group" aria-label="Ship systems">
              {KEYPAD.map(({ id, color }) => (
                <button key={id} className={keys[id] ? 'lit' : ''} style={{ '--key': color }} onClick={() => { setKeys((state) => ({ ...state, [id]: !state[id] })); addLog(`${id} ${keys[id] ? 'offline' : 'online'}`); }} aria-pressed={!!keys[id]}>
                  <i />{id}
                </button>
              ))}
            </div>
          </div>

          <div className="console-side right">
            <div className="right-top">
              <div className="gauge" style={{ '--v': throttle }} aria-hidden="true"><b>THR</b></div>
              <ThrottleLever gear={gear} onChange={(g) => { setGear(g); addLog(`GEAR ${g} engaged — ${['slow cruise', 'standard', 'fast', 'overdrive'][g - 1]}`); }} />
            </div>
            <div className="switch-row">
              <button type="button" className={`toggle ${sys.map ? 'on' : ''}`} onClick={() => flip('map')} aria-pressed={sys.map} title="Star map"><i /><b>MAP</b></button>
              <button type="button" className={`toggle ${sys.log ? 'on' : ''}`} onClick={() => flip('log')} aria-pressed={sys.log} title="Flight log"><i /><b>LOG</b></button>
            </div>
            <div className={`guard ${armed ? 'is-open' : ''}`}>
              <button type="button" className="guard-cover" onClick={() => setArmed((a) => !a)} aria-label={armed ? 'Close abort guard' : 'Open abort guard'} aria-expanded={armed} />
              <button type="button" className="abort" disabled={!armed} onClick={() => { addLog('ABORT — returning to space'); onBack(); }}>ABORT</button>
            </div>
          </div>
        </div>

        {sys.map && (
          <div className="radar" role="group" aria-label="Star map — click a planet to fly there">
            <i className="radar-sweep" aria-hidden="true" />
            <i className="radar-ring r1" aria-hidden="true" /><i className="radar-ring r2" aria-hidden="true" />
            {destinations.map((item, index) => {
              const angle = (index / destinations.length) * Math.PI * 2 - Math.PI / 2;
              return (
                <button
                  key={item.id}
                  className={item.id === section.id ? 'me' : ''}
                  style={{ '--planet': item.color, left: `${50 + Math.cos(angle) * 36}%`, top: `${50 + Math.sin(angle) * 36}%` }}
                  title={item.friendlyTitle}
                  onClick={() => item.id !== section.id && onWarp(item.id)}
                />
              );
            })}
            <span>STAR MAP</span>
          </div>
        )}

        {sys.log && (
          <div className="flight-log" aria-label="Flight log">
            <b>◉ FLIGHT LOG</b>
            {logs.map((line, index) => <span key={index}>{line}</span>)}
          </div>
        )}
      </div>

      {openProject && <ProjectDetail project={openProject} color={section.color} accent={section.accent} quality={quality} reducedMotion={reducedMotion} onClose={closeProject} />}
    </section>
  );
}

function ProjectDetail({ project, color, accent, quality, reducedMotion, onClose }) {
  const scrollRef = useRef(0);
  const onScroll = (event) => {
    const el = event.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    scrollRef.current = max > 0 ? el.scrollTop / max : 0;
  };
  return (
    <article className="pd" style={{ '--planet': color, '--accent': accent }} aria-label={`${project.title} project details`}>
      <LandingScene color={color} accent={accent} quality={quality} reducedMotion={reducedMotion} scrollRef={scrollRef} />
      <div className="pd-atmos" />
      <button className="pd-back" onClick={onClose}><b>◄</b> Back to My Projects</button>

      <div className="pd-scroll" onScroll={onScroll}>
        <section className="pd-hero">
          <div className="pd-hero-cap">
            <small>{project.meta}</small>
            <h1>{project.title}</h1>
            <p>{project.text}</p>
            <span className="pd-cue">Scroll to explore <b>↓</b></span>
          </div>
        </section>

        <div className="pd-body">
          <div className="pd-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <section className="pd-card"><small>01 / The challenge</small><h2>What needed to be solved</h2><p>{project.challenge}</p></section>
          <section className="pd-card"><small>02 / The solution</small><h2>How I approached it</h2><p>{project.solution}</p></section>
          <section className="pd-card"><small>03 / My role</small><h2>What I did</h2><p>{project.contribution}</p></section>
          <section className="pd-card"><small>04 / The outcome</small><h2>The result</h2><p>{project.outcome}</p></section>
          <section className="pd-card pd-features"><small>Key features</small><h2>What it does</h2><ul>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></section>
          <button className="btn primary pd-return" onClick={onClose}>◄ Back to My Projects</button>
        </div>
      </div>

      <div className="crt-off" aria-hidden="true" />
    </article>
  );
}

function ContactForm({ state, onSubmit }) { if (state === 'success') return <div className="transmission-success"><span>↗</span><h3>Transmission sent successfully.</h3><p>I’ll respond when your signal reaches my station.</p></div>; return <form className="contact-form" onSubmit={onSubmit}><label>Name<input required name="name" placeholder="Your name" /></label><label>Email<input required type="email" name="email" placeholder="you@company.com" /></label><label>Project type<select name="type"><option>AI assistant</option><option>Prompt system</option><option>Workflow automation</option><option>Other mission</option></select></label><label>Mission brief<textarea required name="message" placeholder="What are you trying to build?" /></label><button disabled={state === 'loading'}>{state === 'loading' ? 'Launching transmission…' : 'Send transmission ↗'}</button></form>; }

function FallbackView({ onExplore, onClose }) { return <section className="fallback-view"><header><div><small>ACCESSIBLE NAVIGATION</small><h1>Explore the Promptverse</h1></div><button onClick={onClose}>Return to 3D</button></header><p>{profile.intro}</p><div className="fallback-grid">{destinations.map((item) => <article key={item.id} style={{ '--planet': item.color }}><small>{item.name}</small><h2>{item.section}</h2><p>{item.tagline}</p><button onClick={() => onExplore(item.id)}>Open section →</button></article>)}</div></section>; }

createRoot(document.getElementById('root')).render(<App />);
