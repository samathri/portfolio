import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SpaceScene from './SpaceScene.jsx';
import PlanetExplorer from './PlanetExplorer.jsx';
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
  const [sound, setSound] = useState(() => localStorage.getItem('promptverse-sound') === 'on');
  const [fallback, setFallback] = useState(false);
  const [formState, setFormState] = useState('idle');
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const touchStart = useRef(null);

  useEffect(() => { const timer = setTimeout(() => setBooted(true), reducedMotion ? 100 : 1800); return () => clearTimeout(timer); }, [reducedMotion]);
  useEffect(() => localStorage.setItem('promptverse-quality', quality), [quality]);
  useEffect(() => localStorage.setItem('promptverse-sound', sound ? 'on' : 'off'), [sound]);
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

  useEffect(() => {
    const onWheel = (event) => {
      if (!started || journey || landed || fallback) return;
      setProgress((value) => clamp(value + event.deltaY * 0.00055, 0, 1));
    };
    const onKey = (event) => {
      if (event.key === 'Escape') { if (landed) returnToSpace(); else { setMapOpen(false); setMenuOpen(false); } }
      if (!journey && !landed && ['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setStarted(true); setProgress((value) => clamp(value + (event.key === 'ArrowDown' ? .055 : -.055), 0, 1)); }
    };
    window.addEventListener('wheel', onWheel, { passive: true }); window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey); };
  }, [started, journey, landed, fallback, returnToSpace]);

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
      {!fallback && <SpaceScene progress={progress} selected={selected} journey={journey} quality={quality} reducedMotion={reducedMotion} onPlanetClick={beginJourney} onPlanetHover={setHovered} onJourneyDone={finishJourney} />}
      <div className="space-noise" />

      <header className="hud-top">
        <button className="brand" onClick={returnToSpace}><span>PN</span><div><strong>{profile.name}</strong><small>PROMPTVERSE</small></div></button>
        <div className="sector"><i /> CURRENT SECTOR <strong>{selected ? destinationById[selected].name : nearest.name}</strong></div>
        <nav aria-label="Portfolio controls">
          <button onClick={() => setMapOpen((v) => !v)}>Mission Map</button>
          <button className="icon-button" onClick={() => setSound((v) => !v)} aria-label={`${sound ? 'Mute' : 'Enable'} sound`}>{sound ? '◉' : '○'}</button>
          <button className="icon-button" onClick={() => setMenuOpen((v) => !v)} aria-label="Open settings">⚙</button>
        </nav>
      </header>

      {!started && <Intro onStart={() => setStarted(true)} onQuickView={() => setFallback(true)} />}

      {started && !landed && !journey && <div className="flight-guide"><span>SCROLL TO FLY</span><div className="flight-direction"><b>↑</b><b>↓</b></div><p>UP: BACK <em>•</em> DOWN: FORWARD</p></div>}
      {started && indicatedPlanet && !journey && !landed && <div className={`planet-tooltip ${hovered ? 'is-hovered' : 'is-nearby'}`}><small>{hovered ? 'TARGET ACQUIRED' : 'ENTERING PLANET RANGE'}</small><strong>{indicatedPlanet.name}</strong><p><b>{indicatedPlanet.section}</b> — {indicatedPlanet.tagline}</p><span>Click or tap to initiate landing</span></div>}

      {(mapOpen || menuOpen) && <button className="scrim" onClick={() => { setMapOpen(false); setMenuOpen(false); }} aria-label="Close panel" />}
      <MissionMap open={mapOpen} selected={selected} onSelect={beginJourney} onClose={() => setMapOpen(false)} />
      <Settings open={menuOpen} quality={quality} setQuality={setQuality} fallback={fallback} setFallback={setFallback} onClose={() => setMenuOpen(false)} />

      {journey && <div className="journey-status"><small>AUTOPILOT ENGAGED</small><strong>Approaching {destinationById[selected].name}</strong><div className="journey-line"><i /></div><button onClick={finishJourney}>Skip journey</button></div>}
      {landed && <SectionOverlay section={destinationById[selected]} onBack={returnToSpace} formState={formState} onSubmit={submitContact} />}
      {fallback && <FallbackView onExplore={beginJourney} onClose={() => setFallback(false)} />}

      <footer className="hud-bottom"><span>SYS // ONLINE</span><div className="journey-progress"><i style={{ width: `${progress * 100}%` }} /></div><span>{Math.round(progress * 100).toString().padStart(2, '0')}% JOURNEY</span></footer>
    </main>
  );
}

function LoadingScreen() { return <div className="loading-screen"><div className="loader-orbit"><i /><span>AI</span></div><p>INITIALIZING AI NAVIGATION SYSTEM</p><h1>MISSION: EXPLORE THE PROMPTVERSE</h1><div className="loading-bar"><i /></div></div>; }

function Intro({ onStart, onQuickView }) { return <section className="intro-panel"><div className="eyebrow"><i /> TRANSMISSION RECEIVED // 001</div><p className="hello">Hi, I’m</p><h1>{profile.name}</h1><h2>{profile.role}</h2><p className="intro-text">{profile.intro}</p><div className="intro-actions"><button className="primary" onClick={onStart}>Begin exploration <span>→</span></button><button onClick={onQuickView}>Quick 2D view</button></div><small className="instruction">Scroll to navigate <b>•</b> Click a planet to explore</small></section>; }

function MissionMap({ open, selected, onSelect, onClose }) { return <aside className={`mission-map ${open ? 'open' : ''}`} aria-hidden={!open}><button className="panel-close" onClick={onClose} aria-label="Close mission map">×</button><header><small>DIRECT NAVIGATION</small><h2>Mission Map</h2><p>Choose a destination. All journeys are skippable.</p></header><div className="map-orbit">{destinations.map((item, index) => <button key={item.id} className={selected === item.id ? 'active' : ''} onClick={() => onSelect(item.id)}><span style={{ '--planet': item.color }}>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.name}</strong><small>{item.section}</small></div><b>↗</b></button>)}</div></aside>; }

function Settings({ open, quality, setQuality, fallback, setFallback, onClose }) { return <aside className={`settings-panel ${open ? 'open' : ''}`} aria-hidden={!open}><button className="panel-close" onClick={onClose} aria-label="Close settings">×</button><small>SYSTEM SETTINGS</small><h2>Experience</h2><label>Graphics quality<select value={quality} onChange={(e) => setQuality(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label className="switch-row">Use accessible 2D mode<input type="checkbox" checked={fallback} onChange={(e) => setFallback(e.target.checked)} /></label><p>Motion preferences from your device are respected automatically.</p></aside>; }

function SectionOverlay({ section, onBack, formState, onSubmit }) {
  const [walk, setWalk] = useState(0);
  const [moving, setMoving] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [active, setActive] = useState(null);
  const stopTimer = useRef(null);
  const surfaceTouchStart = useRef(null);
  const discoveryRef = useRef(null);
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const discoveries = useMemo(() => {
    if (section.cards) return section.cards.map((item) => ({ title: item.title, label: item.meta, text: item.text, tags: item.tags }));
    if (section.groups) return Object.entries(section.groups).map(([title, values]) => ({ title, label: 'SKILL CONSTELLATION', text: values.join(' • '), tags: values }));
    if (section.timeline) return section.timeline.map((item) => ({ title: item.title, label: item.date, text: item.text }));
    if (section.facts) return section.facts.map((item, index) => ({ title: item, label: `ORIGIN RECORD 0${index + 1}`, text: index === 0 ? section.body : section.tagline }));
    return [{ title: 'Communication Uplink', label: 'SIGNAL STATION', text: section.body, contact: true }];
  }, [section]);

  const move = useCallback((delta) => {
    // Keep the astronaut pace deliberate on an endless forward route.
    setWalk((value) => Math.max(0, value + delta * .00022));
    if (Math.abs(delta) > 2) setHasMoved(true);
    setMoving(true); clearTimeout(stopTimer.current); stopTimer.current = setTimeout(() => setMoving(false), 170);
  }, []);

  useEffect(() => {
    const wheel = (event) => move(event.deltaY);
    const key = (event) => { if (event.key === 'ArrowDown') move(85); if (event.key === 'ArrowUp') move(-85); };
    window.addEventListener('wheel', wheel, { passive: true }); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('wheel', wheel); window.removeEventListener('keydown', key); clearTimeout(stopTimer.current); };
  }, [move]);

  const reached = Math.floor(walk * discoveries.length + .05) % discoveries.length;
  useEffect(() => {
    if (section.id !== 'projects') return;
    const card = discoveryRef.current?.children?.[reached];
    card?.scrollIntoView?.({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
  }, [reached, reducedMotion, section.id]);
  return <section className={`planet-surface section-${section.id} ${hasMoved ? 'has-explored' : ''}`} style={{ '--planet': section.color, '--accent': section.accent }} onTouchStart={(event) => { surfaceTouchStart.current = event.touches[0].clientY; }} onTouchEnd={(event) => { if (active !== null) return; const delta = (surfaceTouchStart.current || 0) - event.changedTouches[0].clientY; if (Math.abs(delta) > 12) move(delta * 3.2); }}>
    <PlanetExplorer color={section.color} accent={section.accent} progress={walk} moving={moving} reducedMotion={reducedMotion} sectionId={section.id} items={section.cards} />
    <header className="surface-hud"><button onClick={onBack}>← Launch to space</button><div><small>PLANETARY EXPEDITION // {section.name}</small><strong>{section.section}</strong></div><span>{Math.round(walk * 100)}M TRAVELED</span></header>
    <aside className="surface-brief"><small>MISSION OBJECTIVE</small><h2>{section.heading}</h2><p>{section.tagline}</p><div><i /> Scroll to run • Move pointer up for a higher view</div></aside>
    <div className="surface-scroll-cue" role="note" aria-label="Scroll up to move backward. Scroll down to move forward."><small>SCROLL / SWIPE</small><span className="cue-back"><i>↑</i><b>BACK</b></span><span className="cue-forward"><i>↓</i><b>FORWARD</b></span></div>
    <div ref={discoveryRef} className={`discovery-stack ${section.id === 'about' ? 'story-carousel' : ''}`}>{discoveries.map((item, index) => {
      const threshold = (index + .22) / discoveries.length; const visible = section.id === 'about' || walk >= threshold - .12;
      const relative = (index - reached + discoveries.length) % discoveries.length;
      const storyClass = section.id === 'about' ? (relative === 0 ? 'story-current' : relative === discoveries.length - 1 ? 'story-previous' : 'story-next') : '';
      return <button key={item.title} className={`${visible ? 'visible' : ''} ${reached === index ? 'nearby' : ''} ${storyClass}`} onClick={() => visible && setActive(index)}><span>{String(index + 1).padStart(2, '0')}</span><div><small>{item.label}</small><strong>{item.title}</strong></div><b>{visible ? 'OPEN +' : 'LOCKED'}</b></button>;
    })}</div>
    <div className="walk-meter"><span>LANDING SITE</span><i><b style={{ width: `${(walk % 1) * 100}%` }} /></i><span>FORWARD ∞</span></div>
    {active !== null && <div className="hologram-panel"><button className="hologram-close" onClick={() => setActive(null)}>×</button><small>{discoveries[active].label}</small><h2>{discoveries[active].title}</h2><p>{discoveries[active].text}</p>{discoveries[active].tags && <div className="hologram-tags">{discoveries[active].tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}{discoveries[active].contact ? <ContactForm state={formState} onSubmit={onSubmit} /> : <button className="hologram-action">Open full mission record ↗</button>}</div>}
  </section>;
}

function ContactForm({ state, onSubmit }) { if (state === 'success') return <div className="transmission-success"><span>↗</span><h3>Transmission sent successfully.</h3><p>I’ll respond when your signal reaches my station.</p></div>; return <form className="contact-form" onSubmit={onSubmit}><label>Name<input required name="name" placeholder="Your name" /></label><label>Email<input required type="email" name="email" placeholder="you@company.com" /></label><label>Project type<select name="type"><option>AI assistant</option><option>Prompt system</option><option>Workflow automation</option><option>Other mission</option></select></label><label>Mission brief<textarea required name="message" placeholder="What are you trying to build?" /></label><button disabled={state === 'loading'}>{state === 'loading' ? 'Launching transmission…' : 'Send transmission ↗'}</button></form>; }

function FallbackView({ onExplore, onClose }) { return <section className="fallback-view"><header><div><small>ACCESSIBLE NAVIGATION</small><h1>Explore the Promptverse</h1></div><button onClick={onClose}>Return to 3D</button></header><p>{profile.intro}</p><div className="fallback-grid">{destinations.map((item) => <article key={item.id} style={{ '--planet': item.color }}><small>{item.name}</small><h2>{item.section}</h2><p>{item.tagline}</p><button onClick={() => onExplore(item.id)}>Open section →</button></article>)}</div></section>; }

createRoot(document.getElementById('root')).render(<App />);
