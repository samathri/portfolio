import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SpaceScene from './SpaceScene.jsx';
import PlanetRoom from './PlanetRoom.jsx';
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
 *  Sub-page experience: explorable 3D planet room
 * ------------------------------------------------------------------ */

const shortCompany = (title) => (title.includes('—') ? title.split('—')[1].trim() : title);

const truncate = (value, max = 58) => (value.length > max ? `${value.slice(0, max).trim()}…` : value);

// `sub` is a short at-a-glance preview shown in the Signal Index so the
// content is legible without opening every panel.
function buildHotspots(section) {
  switch (section.id) {
    case 'about':
      return [
        { kind: 'dossier', short: 'Dossier', title: profile.name, role: profile.role, label: 'CREW DOSSIER', sub: profile.role, text: section.body, stats: section.stats },
        ...section.facts.map((fact, index) => ({ kind: 'text', short: fact.title, title: fact.title, label: `ORIGIN RECORD 0${index + 1}`, sub: truncate(fact.text), text: fact.text })),
      ];
    case 'skills':
      return Object.entries(section.groups).map(([name, list]) => ({ kind: 'skills', short: name, title: name, label: 'SKILL CLUSTER', sub: `${list.slice(0, 3).join(' · ')} +${list.length - 3}`, text: `${list.length} core capabilities in this cluster.`, tags: list }));
    case 'projects':
      return section.cards.map((card) => ({ kind: 'project', short: card.title, title: card.title, label: card.meta, sub: card.meta, text: card.text, ...card }));
    case 'services':
      return section.cards.map((card) => ({ kind: 'service', short: card.title, title: card.title, label: card.meta, sub: card.meta, text: card.text }));
    case 'experience':
      return section.timeline.map((entry) => ({ kind: 'timeline', short: shortCompany(entry.title), title: entry.title, label: entry.date, sub: entry.date, text: entry.text }));
    case 'contact':
      return [
        ...section.channels.map((channel) => ({ kind: 'channel', short: channel.title, title: channel.title, label: channel.meta, sub: channel.text, text: channel.text, href: channel.href })),
        { kind: 'contact', short: 'Transmit', title: 'Open a channel', label: 'TRANSMISSION UPLINK', sub: 'Send me a message', text: section.body },
      ];
    default:
      return [];
  }
}

function SectionOverlay({ section, initialProjectSlug, onBack, onWarp, quality, reducedMotion, formState, onSubmit }) {
  const hotspots = useMemo(() => buildHotspots(section), [section]);
  const [active, setActive] = useState(() => {
    if (section.id !== 'projects' || !initialProjectSlug) return null;
    const index = hotspots.findIndex((item) => item.slug === initialProjectSlug);
    return index >= 0 ? index : null;
  });
  const [hintDim, setHintDim] = useState(false);
  const [hovered, setHovered] = useState(null);

  const open = useCallback((index) => {
    setActive(index); setHintDim(true);
    if (section.id === 'projects') history.pushState({}, '', `/projects/${hotspots[index].slug}`);
  }, [section.id, hotspots]);
  const close = useCallback(() => {
    setActive(null);
    if (section.id === 'projects') history.pushState({}, '', '/projects');
  }, [section.id]);

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') { if (active !== null) close(); else onBack(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, close, onBack]);

  const activeItem = active !== null ? hotspots[active] : null;
  const showProjectDetail = section.id === 'projects' && activeItem;
  const focusedIndex = activeItem && !showProjectDetail ? active : null;

  return (
    <section className={`planet-room section-${section.id}`} style={{ '--planet': section.color, '--accent': section.accent }}>
      <PlanetRoom section={section} hotspots={hotspots} quality={quality} reducedMotion={reducedMotion} focusedIndex={focusedIndex} highlightIndex={hovered} onHotspotHover={setHovered} onHotspotClick={open} />
      <div className="room-vignette" />

      <header className="room-hud">
        <button className="room-back" onClick={onBack}><b>◄</b> Return to galaxy</button>
        <div className="room-title"><small>PLANETARY SYSTEM // {section.name}</small><strong>{section.section}</strong></div>
        <span className="room-count">{hotspots.length} SIGNALS</span>
      </header>

      <aside className={`room-brief ${hintDim ? 'is-dim' : ''}`}>
        <small>MISSION BRIEF</small>
        <h2>{section.heading}</h2>
        <p>{section.tagline}</p>
        <div className="room-controls"><i /> Drag to look around <em>·</em> Click a glowing marker</div>
      </aside>

      {!activeItem && (
        <nav className="room-index" aria-label={`${section.section} signals`}>
          <small>SIGNAL INDEX <em>— hover to locate · click to open</em></small>
          {hotspots.map((item, index) => (
            <button
              key={index}
              className={hovered === index ? 'is-hot' : ''}
              onClick={() => open(index)}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered((current) => (current === index ? null : current))}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered((current) => (current === index ? null : current))}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><b>{item.short}</b><small>{item.sub}</small></div>
              <em>{item.kind === 'project' ? 'OPEN ↗' : 'VIEW +'}</em>
            </button>
          ))}
        </nav>
      )}

      {activeItem && !showProjectDetail && (
        <HotspotPanel
          item={activeItem} index={active} total={hotspots.length}
          onClose={close}
          onPrev={() => open((active - 1 + hotspots.length) % hotspots.length)}
          onNext={() => open((active + 1) % hotspots.length)}
          formState={formState} onSubmit={onSubmit}
        />
      )}

      {showProjectDetail && <ProjectDetail project={activeItem} color={section.color} accent={section.accent} onClose={close} />}

      <WarpDock current={section.id} onWarp={onWarp} />
    </section>
  );
}

function HotspotPanel({ item, index, total, onClose, onPrev, onNext, formState, onSubmit }) {
  return (
    <div className="hotspot-scrim" onClick={onClose}>
      <article className={`hotspot-panel kind-${item.kind}`} onClick={(event) => event.stopPropagation()} role="dialog" aria-label={item.title}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <button className="hotspot-close" onClick={onClose} aria-label="Close">×</button>
        <header>
          <small>{item.label}</small>
          <span className="panel-index">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        </header>
        <h2>{item.title}</h2>
        {item.role && <p className="panel-role">{item.role}</p>}
        {item.text && <p className="panel-text">{item.text}</p>}
        {item.stats && (
          <div className="stat-bars">
            {item.stats.map((stat) => (
              <div key={stat.label}><b>{stat.label}</b><i><span style={{ width: `${stat.value}%` }} /></i><em>{stat.value}</em></div>
            ))}
          </div>
        )}
        {item.tags && <div className="panel-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        {item.href && <a className="panel-link" href={item.href}>Open channel <b>↗</b></a>}
        {item.kind === 'contact' && <ContactForm state={formState} onSubmit={onSubmit} />}
        <footer className="panel-nav">
          <button onClick={onPrev} aria-label="Previous signal">← Prev</button>
          <span>{item.short}</span>
          <button onClick={onNext} aria-label="Next signal">Next →</button>
        </footer>
      </article>
    </div>
  );
}

function WarpDock({ current, onWarp }) {
  return (
    <nav className="warp-dock" aria-label="Warp to another planet">
      <span className="warp-label">WARP<br />DOCK</span>
      <div className="warp-planets">
        {destinations.map((item) => (
          <button
            key={item.id}
            className={item.id === current ? 'active' : ''}
            style={{ '--planet': item.color, '--accent': item.accent }}
            onClick={() => item.id !== current && onWarp(item.id)}
            title={`${item.name} — ${item.section}`}
            aria-current={item.id === current}
          >
            <i /><b>{item.section}</b>
          </button>
        ))}
      </div>
    </nav>
  );
}

function ProjectDetail({ project, color, accent, onClose }) {
  return <article className="project-detail" aria-label={`${project.title} project details`} style={{ '--planet': color, '--accent': accent }}>
    <header><button onClick={onClose}>← Back to Projects Planet</button><small>PROJECT MISSION RECORD</small><span>{project.meta}</span></header>
    <section className="project-landing-hero">
      <div className="hero-stars" />
      <div className="hero-planet" />
      <div className="landing-caption"><small>CREW DISEMBARKED // SITE SECURE</small><h1>{project.title}</h1><p>Scroll to explore the complete project mission.</p><span>↓</span></div>
    </section>
    <div className="project-detail-body">
      <section className="project-detail-hero"><small>MISSION OVERVIEW</small><h1>{project.title}</h1><p>{project.text}</p><div className="hologram-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></section>
      <div className="project-detail-grid">
        <section><small>01 / CHALLENGE</small><h2>What needed to be solved</h2><p>{project.challenge}</p></section>
        <section><small>02 / SOLUTION</small><h2>How it was approached</h2><p>{project.solution}</p></section>
        <section><small>03 / CONTRIBUTION</small><h2>My role</h2><p>{project.contribution}</p></section>
        <section><small>04 / OUTCOME</small><h2>Project result</h2><p>{project.outcome}</p></section>
      </div>
      <section className="project-features"><small>SYSTEM CAPABILITIES</small><h2>Key features</h2><ul>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></section>
    </div>
  </article>;
}

function ContactForm({ state, onSubmit }) { if (state === 'success') return <div className="transmission-success"><span>↗</span><h3>Transmission sent successfully.</h3><p>I’ll respond when your signal reaches my station.</p></div>; return <form className="contact-form" onSubmit={onSubmit}><label>Name<input required name="name" placeholder="Your name" /></label><label>Email<input required type="email" name="email" placeholder="you@company.com" /></label><label>Project type<select name="type"><option>AI assistant</option><option>Prompt system</option><option>Workflow automation</option><option>Other mission</option></select></label><label>Mission brief<textarea required name="message" placeholder="What are you trying to build?" /></label><button disabled={state === 'loading'}>{state === 'loading' ? 'Launching transmission…' : 'Send transmission ↗'}</button></form>; }

function FallbackView({ onExplore, onClose }) { return <section className="fallback-view"><header><div><small>ACCESSIBLE NAVIGATION</small><h1>Explore the Promptverse</h1></div><button onClick={onClose}>Return to 3D</button></header><p>{profile.intro}</p><div className="fallback-grid">{destinations.map((item) => <article key={item.id} style={{ '--planet': item.color }}><small>{item.name}</small><h2>{item.section}</h2><p>{item.tagline}</p><button onClick={() => onExplore(item.id)}>Open section →</button></article>)}</div></section>; }

createRoot(document.getElementById('root')).render(<App />);
