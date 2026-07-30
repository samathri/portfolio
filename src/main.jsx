import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ThreeAvatar from './ThreeAvatar.jsx';
import './styles.css';

const profile = {
  name: 'Your Name',
  designation: 'AI Prompt Engineer',
  email: 'hello@example.com',
  phone: '+94 77 000 0000',
  location: 'Colombo, Sri Lanka',
  intro:
    'I build prompt systems, chatbot flows, and AI workflows that turn unclear user intent into useful AI output.',
  about:
    'I specialize in designing AI conversations, prompt libraries, automation flows, and evaluation methods for teams that want reliable AI outputs instead of random experiments.',
  skills: [
    'Prompt Architecture',
    'Chatbot Flow Design',
    'AI Automation',
    'RAG Prompt Planning',
    'LLM Evaluation',
    'System Prompt Design',
    'Content Workflows',
    'AI Tool Testing',
  ],
  works: [
    'Designed a chatbot prompt flow for customer support routing.',
    'Created reusable prompt templates for marketing and brand content.',
    'Built AI research workflows with summary checks and source awareness.',
  ],
  projects: [
    {
      title: 'Support Bot Brain',
      category: 'Chatbot AI',
      result: 'Designed intent routes, fallback replies, and tone rules for support conversations.',
      stack: ['Prompt map', 'Conversation UX', 'Testing'],
    },
    {
      title: 'Prompt Library OS',
      category: 'Prompt Ops',
      result: 'Created a reusable prompt library for content generation, editing, and quality control.',
      stack: ['Templates', 'Guidelines', 'Output checks'],
    },
    {
      title: 'Research Co-Pilot',
      category: 'AI Workflow',
      result: 'Built prompts for research summaries, source comparison, and final insight extraction.',
      stack: ['Research', 'Summaries', 'Review loop'],
    },
  ],
};

const directions = {
  top: {
    label: 'Skills',
    action: 'Run Up',
    title: 'Skill Control Room',
    subtitle: 'A compact map of the AI prompt engineering capabilities I use.',
  },
  right: {
    label: 'Projects',
    action: 'Run Right',
    title: 'Project Gallery',
    subtitle: 'The avatar reached the project side. Here are selected builds and case-study ideas.',
  },
  bottom: {
    label: 'Contact',
    action: 'Run Down',
    title: 'Contact Terminal',
    subtitle: 'The direct path for project inquiries, collaborations, and AI workflow work.',
  },
  left: {
    label: 'About',
    action: 'Run Left',
    title: 'About Signal',
    subtitle: 'A short profile of what I do and how I think about AI systems.',
  },
  center: {
    label: 'Works',
    action: 'Open Core',
    title: 'Work Log',
    subtitle: 'Recent practical work areas for AI product, content, and operations teams.',
  },
};

function App() {
  const [introDone, setIntroDone] = useState(false);
  const [view, setView] = useState('home');
  const [motion, setMotion] = useState(null);
  const [incomingDirection, setIncomingDirection] = useState('right');
  const [hideUi, setHideUi] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 900);
    return () => clearTimeout(timer);
  }, []);

  const goTo = (direction) => {
    if (motion) return;

    setHideUi(true);

    if (direction === 'center') {
      setMotion({ direction, phase: 'opening' });

      setTimeout(() => {
        setIncomingDirection(direction);
        setView(direction);
      }, 700);

      setTimeout(() => {
        setHideUi(false);
        setMotion(null);
      }, 1150);

      return;
    }

    setMotion({ direction, phase: 'turning' });

    setTimeout(() => {
      setMotion({ direction, phase: 'running' });
    }, 900);

    setTimeout(() => {
      setIncomingDirection(direction);
      setView(direction);
      setMotion({ direction, phase: 'entering' });
    }, 2700);

    setTimeout(() => {
      setHideUi(false);
      setMotion(null);
    }, 3150);
  };

  const goHome = () => {
    if (motion) return;

    setHideUi(true);
    setMotion({ direction: 'back', phase: 'entering' });

    setTimeout(() => {
      setView('home');
    }, 350);

    setTimeout(() => {
      setHideUi(false);
      setMotion(null);
    }, 850);
  };

  const motionClass = motion ? `${motion.phase} ${motion.phase}-${motion.direction}` : '';
  const showRunner = motion && ['turning', 'running', 'opening'].includes(motion.phase);

  return (
    <main className={`app ${introDone ? 'ready' : 'intro'} ${motionClass} ${hideUi ? 'hide-ui' : ''} from-${incomingDirection}`}>
      <div className="grid-floor" />
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <div className="viewport">
        {view === 'home' ? <HomeScreen goTo={goTo} /> : <DetailScreen view={view} goHome={goHome} />}
      </div>

      {showRunner && (
        <div className={`runner runner-${motion.phase} runner-${motion.direction}`}>
          <ThreeAvatar direction={motion.direction} running={motion.phase === 'running'} />
        </div>
      )}
    </main>
  );
}

function HomeScreen({ goTo }) {
  return (
    <section className="screen home-screen">
      <div className="intro-copy">
        <p>{profile.designation}</p>
        <h1>{profile.name}</h1>
        <span>{profile.intro}</span>
      </div>

      <div className="avatar-map">
        <div className="route route-x" />
        <div className="route route-y" />

        <DirectionButton direction="top" goTo={goTo} />
        <DirectionButton direction="right" goTo={goTo} />
        <DirectionButton direction="bottom" goTo={goTo} />
        <DirectionButton direction="left" goTo={goTo} />

        <button className="core-button" onClick={() => goTo('center')} aria-label="Open works">
          <ThreeAvatar direction="front" running={false} />
        </button>
      </div>

      <div className="command-card">
        <p>Avatar navigation</p>
        <h2>Click a direction. The 3D avatar turns, runs, then opens that portfolio section.</h2>
        <div className="mini-actions">
          <button onClick={() => goTo('right')}>Projects &gt;</button>
          <button onClick={() => goTo('top')}>Skills ^</button>
        </div>
      </div>
    </section>
  );
}

function DirectionButton({ direction, goTo }) {
  const item = directions[direction];

  return (
    <button className={`direction direction-${direction}`} onClick={() => goTo(direction)}>
      <span>{item.action}</span>
      {item.label}
    </button>
  );
}

function DetailScreen({ view, goHome }) {
  const section = directions[view];

  return (
    <section className={`screen detail-screen detail-${view}`}>
      <header className="detail-header">
        <button onClick={goHome}>Back to Avatar Hub</button>
        <div>
          <p>{section.action}</p>
          <h1>{section.title}</h1>
          <span>{section.subtitle}</span>
        </div>
      </header>

      <div className="detail-body">
        <SmallAvatar view={view} />
        <SectionContent view={view} />
      </div>
    </section>
  );
}

function SectionContent({ view }) {
  const content = useMemo(() => {
    if (view === 'right') {
      return (
        <div className="project-showcase">
          {profile.projects.map((project, index) => (
            <article className="project-tile" key={project.title}>
              <div className="project-number">0{index + 1}</div>
              <span>{project.category}</span>
              <h2>{project.title}</h2>
              <p>{project.result}</p>
              <div>
                {project.stack.map((item) => (
                  <small key={item}>{item}</small>
                ))}
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (view === 'top') {
      return (
        <div className="skill-board">
          {profile.skills.map((skill, index) => (
            <div key={skill}>
              <strong>{String(index + 1).padStart(2, '0')}</strong>
              <span>{skill}</span>
            </div>
          ))}
        </div>
      );
    }

    if (view === 'bottom') {
      return (
        <div className="contact-panel">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <a href={`tel:${profile.phone.replaceAll(' ', '')}`}>{profile.phone}</a>
          <span>{profile.location}</span>
        </div>
      );
    }

    if (view === 'left') {
      return (
        <div className="about-panel">
          <p>{profile.about}</p>
          <div>
            <span>Focus</span>
            <strong>Prompt systems, chatbot UX, AI workflows, and output quality.</strong>
          </div>
        </div>
      );
    }

    return (
      <div className="work-console">
        {profile.works.map((work, index) => (
          <article key={work}>
            <span>LOG 0{index + 1}</span>
            <p>{work}</p>
          </article>
        ))}
      </div>
    );
  }, [view]);

  return <div className="content-stage">{content}</div>;
}

function SmallAvatar({ view }) {
  return (
    <div className={`small-avatar small-avatar-${view}`}>
      <ThreeAvatar direction={view} running={false} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
