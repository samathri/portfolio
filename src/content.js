export const profile = {
  name: 'Samathri Abhayapala',
  role: 'AI Prompt Engineer & Fullstack Developer',
  intro: 'I combine full-stack engineering, accessible UI/UX, automation, and prompt-system thinking to turn ideas into dependable digital experiences.',
  email: 'samathri.15@gmail.com',
  phone: '+94 76 717 0438',
  location: 'Sri Lanka',
};

export const destinations = [
  {
    id: 'about', name: 'Origin Planet', section: 'About Me', color: '#ff9b63', accent: '#ffd2a8', size: 1.15,
    position: [-5.8, 0.5, -5], tagline: 'The human story behind the systems.',
    heading: 'I build useful digital systems around real human needs.',
    body: 'I am a passionate and adaptable full-stack developer with experience building responsive, cross-browser web applications. My work combines UI/UX, performance, databases, API integrations, CMS platforms, SEO, accessibility, and automation. I enjoy learning new technologies and applying them to practical problems.',
    facts: ['Full-stack development', 'Accessible UI/UX', 'Performance and SEO', 'Automation and CMS workflows'],
    cta: 'Download résumé',
  },
  {
    id: 'skills', name: 'Neural Planet', section: 'Skills', color: '#5f7cff', accent: '#61e7ff', size: 1.35,
    position: [-2.2, 1.3, -12], tagline: 'Methods, models, and intelligent workflows.',
    heading: 'A practical toolkit for dependable AI behavior.',
    body: 'My work spans prompt architecture, evaluation, retrieval, automation, and multimodal interaction. Every technique is selected for the product problem—not for novelty.',
    groups: {
      'Front-end': ['HTML5', 'CSS3', 'JavaScript', 'jQuery', 'Responsive UI', 'Accessibility'],
      'Back-end and mobile': ['PHP', 'MySQL', 'Java', 'Kotlin', 'Android Studio', 'API integrations'],
      'Platforms and operations': ['WordPress', 'Shopify', 'Galaxy CMS', 'SEMrush', 'Screaming Frog', 'Google Apps Script'],
    },
  },
  {
    id: 'projects', name: 'Creation Planet', section: 'Projects', color: '#b56cff', accent: '#ff78d1', size: 1.55,
    position: [3.5, -0.2, -20], tagline: 'Selected systems, experiments, and outcomes.',
    heading: 'AI projects designed around real outcomes.',
    body: 'Explore representative case studies. Replace these samples with your own screenshots, metrics, demos, and repositories.',
    cards: [
      { title: 'Medi-O', meta: 'Secure Online Pharmacy', text: 'A pharmacy platform with QR-based prescription verification, secure medicine browsing, ordering, and admin panels.', tags: ['PHP', 'MySQL', 'AJAX', 'jQuery'] },
      { title: 'Munasinghe International', meta: 'Business Website', text: 'A professional export-business website with a custom WordPress presentation and SEO enhancements.', tags: ['WordPress', 'Elementor', 'Custom CSS'] },
      { title: 'Hour Markers', meta: 'Watch Website', text: 'A responsive product showcase that allows customers to browse watches and place orders.', tags: ['PHP', 'JavaScript', 'CSS', 'HTML'] },
      { title: 'Ma Cheri', meta: 'Jewelry E-commerce', text: 'A complete jewelry e-commerce experience with product listings, responsive layouts, and secure checkout.', tags: ['PHP', 'JavaScript', 'CSS', 'HTML'] },
      { title: 'Serandi', meta: 'Jewelry Store', text: 'A responsive online store with an administration panel and category-based product filtering.', tags: ['PHP', 'JavaScript', 'CSS', 'HTML'] },
    ],
  },
  {
    id: 'services', name: 'Solutions Planet', section: 'Services', color: '#23c69b', accent: '#7dffd5', size: 1.2,
    position: [6.5, 1.1, -29], tagline: 'Practical AI missions for teams and products.',
    heading: 'From unclear AI ambition to a working system.',
    body: 'Engagements are scoped around the business problem, measurable behavior, and a maintainable handoff.',
    cards: [
      { title: 'Prompt Systems', meta: 'Design + optimization', text: 'Reusable architectures, prompt audits, output contracts, and systematic testing.' },
      { title: 'AI Assistants', meta: 'Conversation + knowledge', text: 'Purpose-built assistants with retrieval, tool use, safety boundaries, and human escalation.' },
      { title: 'Workflow Automation', meta: 'Connected operations', text: 'Reliable AI workflows connecting models, business rules, data, and review stages.' },
    ],
    cta: 'Start a mission',
  },
  {
    id: 'experience', name: 'Timeline Moon', section: 'Experience', color: '#b8c5d8', accent: '#ffffff', size: 0.9,
    position: [2.3, -1, -37], tagline: 'Mission records and milestones.',
    heading: 'Experience logged as missions, not job descriptions.',
    body: 'Use these beacons to describe the teams, tools, responsibilities, and measurable results behind your professional journey.',
    timeline: [
      { date: 'Sep 2025 — Present', title: 'Fullstack Developer — Trident Media Works', text: 'Builds full-stack applications, database and API integrations, responsive interfaces, SEO improvements, automation scripts, and secure web experiences.' },
      { date: 'Jan 2025 — Aug 2025', title: 'Web Developer — Alankarage Holdings', text: 'Developed responsive PHP websites, WordPress themes and plugins, migrations, SEO improvements, debugging, accessibility, and mobile optimization.' },
      { date: 'Oct 2024 — Dec 2024', title: 'Intern Web Developer — Alankarage Holdings', text: 'Translated Figma UI/UX into responsive interfaces and contributed to interface testing and optimization.' },
      { date: 'Oct 2021 — Apr 2024', title: 'Content Developer — eBEYONDS', text: 'Managed Galaxy CMS content, WCAG accessibility work, UI/UX testing, redirects, SEO configuration, documentation, and team training.' },
      { date: 'Sep 2019 — Sep 2021', title: 'Junior IT Executive — Mobisec', text: 'Maintained subscriber and revenue reports, monitored telco-app delivery, uploaded data, and developed HTML/CSS store pages.' },
    ],
  },
  {
    id: 'contact', name: 'Signal Station', section: 'Contact Me', color: '#ffcf4b', accent: '#fff0a3', size: 1.05,
    position: [-3.3, 0.4, -45], tagline: 'Open a channel for your next AI mission.',
    heading: 'Ready to build something intelligent?',
    body: 'Tell me what you are trying to achieve, where the current workflow breaks, and what a successful outcome looks like.',
  },
];

export const destinationById = Object.fromEntries(destinations.map((item) => [item.id, item]));
