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
    layout: 'orbit',
    // Facts orbit the planet as data satellites — click each to read the record.
    facts: [
      { title: 'Full-stack development', text: 'End-to-end web builds — front-end interfaces, PHP/MySQL back-ends, APIs, and the glue in between. I ship features that work across browsers and devices.' },
      { title: 'Accessible UI/UX', text: 'WCAG-minded interfaces translated from Figma into responsive, keyboard-friendly, screen-reader-aware experiences that everyone can use.' },
      { title: 'Performance & SEO', text: 'Fast, discoverable sites — Core Web Vitals, technical SEO, structured content, and audits with SEMrush and Screaming Frog.' },
      { title: 'Automation & CMS workflows', text: 'Google Apps Script automations, WordPress/Shopify/Galaxy CMS pipelines, and prompt-driven tooling that removes repetitive manual work.' },
    ],
    stats: [
      { label: 'Full-stack', value: 90 },
      { label: 'UI / UX & A11y', value: 88 },
      { label: 'Performance & SEO', value: 85 },
      { label: 'Automation & AI', value: 82 },
    ],
    cta: 'Download résumé',
  },
  {
    id: 'skills', name: 'Neural Planet', section: 'Skills', color: '#5f7cff', accent: '#61e7ff', size: 1.35,
    position: [-2.2, 1.3, -12], tagline: 'Methods, models, and intelligent workflows.',
    heading: 'A practical toolkit for dependable AI behavior.',
    body: 'My work spans prompt architecture, evaluation, retrieval, automation, and multimodal interaction. Every technique is selected for the product problem—not for novelty.',
    layout: 'constellation',
    groups: {
      'Front-end': ['HTML5', 'CSS3', 'JavaScript', 'jQuery', 'Responsive UI', 'Accessibility'],
      'Back-end and mobile': ['PHP', 'MySQL', 'Java', 'Kotlin', 'Android Studio', 'API integrations'],
      'Platforms and operations': ['WordPress', 'Shopify', 'Galaxy CMS', 'SEMrush', 'Screaming Frog', 'Google Apps Script'],
    },
  },
  {
    id: 'projects', name: 'Creation Planet', section: 'Projects', color: '#b56cff', accent: '#ff78d1', size: 1.55,
    position: [3.5, -0.2, -20], tagline: 'Selected systems, experiments, and outcomes.',
    heading: 'Web projects designed around real user needs.',
    body: 'Explore five selected development projects from my portfolio.',
    layout: 'ring',
    cards: [
      { slug: 'medi-o', title: 'Medi-O', meta: 'Secure Online Pharmacy System', text: 'A web-based pharmacy platform with QR-based prescription verification, secure medicine browsing, order placement, and administration panels.', challenge: 'Make online prescription handling more trustworthy while protecting user privacy and keeping medicine ordering accessible.', solution: 'A secure pharmacy workflow that verifies prescriptions through QR codes before supporting medicine discovery and order placement.', features: ['QR-based prescription verification', 'Secure medicine browsing', 'Order placement workflow', 'Administration panels', 'Responsive and accessible interface'], contribution: 'Full-stack design and development with emphasis on privacy, accessibility, and performance.', outcome: 'A complete pharmacy system centered on prescription authenticity and secure ordering.', tags: ['PHP', 'MySQL', 'AJAX', 'jQuery', 'JavaScript', 'CSS', 'HTML'] },
      { slug: 'munasinghe-international', title: 'Munasinghe International', meta: 'Business Website', text: 'A professional export-business website built with a customized WordPress presentation and SEO enhancements.', challenge: 'Present the export business professionally while making its content discoverable and straightforward to maintain.', solution: 'A customized WordPress business site using Elementor, tailored styling, and search-engine optimization enhancements.', features: ['Professional company presentation', 'Responsive page layouts', 'CMS-managed content', 'SEO enhancements', 'Customized visual styling'], contribution: 'WordPress implementation, Elementor page building, custom CSS, responsive refinement, and SEO improvements.', outcome: 'A maintainable business website with a stronger professional and search-friendly presence.', tags: ['WordPress', 'Elementor Page Builder', 'Custom CSS', 'SEO'] },
      { slug: 'hour-markers', title: 'Hour Markers', meta: 'Watch Website', text: 'A watch-selling website that showcases products and allows customers to place orders online.', challenge: 'Turn a watch catalogue into a clear, responsive browsing and ordering experience.', solution: 'A custom product showcase with structured watch listings and an online customer ordering flow.', features: ['Watch product showcase', 'Product browsing', 'Customer ordering', 'Responsive layouts', 'Custom front-end interface'], contribution: 'Developed the website interface and ordering experience using PHP and front-end web technologies.', outcome: 'A functional online presence that helps customers discover watches and submit orders.', tags: ['PHP', 'JavaScript', 'CSS', 'HTML'] },
      { slug: 'ma-cheri', title: 'Ma Cheri', meta: 'Jewelry E-commerce Website', text: 'A fully functional e-commerce website tailored for a jewelry brand, with product listings, secure checkout, and responsive design.', challenge: 'Create an elegant shopping experience that presents jewelry clearly and supports secure online purchasing.', solution: 'A responsive e-commerce experience combining product discovery with a secure checkout journey.', features: ['Jewelry product listings', 'Responsive storefront', 'Secure checkout', 'Product detail experience', 'Mobile-friendly shopping'], contribution: 'Developed the storefront, responsive product experience, and e-commerce flow.', outcome: 'A complete branded online shop supporting product presentation and purchasing.', tags: ['PHP', 'JavaScript', 'CSS', 'HTML'] },
      { slug: 'serandi', title: 'Serandi', meta: 'Jewelry Website', text: 'A fully responsive online jewelry store with an administration panel and category-based product filters.', challenge: 'Make a growing jewelry catalogue easy for customers to browse and simple for administrators to manage.', solution: 'A responsive online store with categorized discovery, filtering, and back-office administration.', features: ['Responsive online store', 'Administration panel', 'Category filters', 'Product catalogue', 'Mobile-friendly interface'], contribution: 'Built the customer-facing store and administration capabilities using PHP and front-end technologies.', outcome: 'A manageable jewelry storefront with faster product discovery through category filtering.', tags: ['PHP', 'JavaScript', 'CSS', 'HTML'] },
    ],
  },
  {
    id: 'services', name: 'Solutions Planet', section: 'Services', color: '#23c69b', accent: '#7dffd5', size: 1.2,
    position: [6.5, 1.1, -29], tagline: 'Practical AI missions for teams and products.',
    heading: 'From unclear AI ambition to a working system.',
    body: 'Engagements are scoped around the business problem, measurable behavior, and a maintainable handoff.',
    layout: 'pylons',
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
    layout: 'trail',
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
    layout: 'dish',
    channels: [
      { title: 'Email', text: profile.email, href: `mailto:${profile.email}`, meta: 'PRIMARY UPLINK' },
      { title: 'Phone', text: profile.phone, href: `tel:${profile.phone.replace(/\s/g, '')}`, meta: 'DIRECT LINE' },
      { title: 'Location', text: profile.location, meta: 'HOME BASE' },
    ],
  },
];

export const destinationById = Object.fromEntries(destinations.map((item) => [item.id, item]));
