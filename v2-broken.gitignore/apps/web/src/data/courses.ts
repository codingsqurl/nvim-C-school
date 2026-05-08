// ===== COURSE CATALOG =====

import type { Course, TopicKey } from '@/types/schema.ts';

export const COURSE_CATALOG: Record<TopicKey, Course> = {
  arduino: {
    name: 'Arduino & Embedded',
    icon: '🤖',
    tag: 'ARDUINO',
    description: 'Microcontrollers, sensors, motors — program the physical world.',
    lessons: [
      { id: 1, title: 'Introduction To Embedded', file: 'SCHOOL/ARDUINO/001_Introduction_To_Embedded.md', level: 'intuition' },
      { id: 2, title: 'Digital IO And Sensors', file: 'SCHOOL/ARDUINO/002_Digital_IO_And_Sensors.md', level: 'intuition' },
      { id: 3, title: 'PWM And Motors', file: 'SCHOOL/ARDUINO/003_PWM_And_Motors.md', level: 'intuition' },
      { id: 4, title: 'Displays And Output', file: 'SCHOOL/ARDUINO/004_Displays_And_Output.md', level: 'intuition' },
      { id: 5, title: 'Communication Protocols', file: 'SCHOOL/ARDUINO/005_Communication_Protocols.md', level: 'intuition' },
      { id: 6, title: 'Advanced Projects', file: 'SCHOOL/ARDUINO/006_Advanced_Projects.md', level: 'intuition' },
    ],
  },
  core: {
    name: 'Core Engineering',
    icon: '🛠️',
    tag: 'CORE',
    description: 'Engineering fundamentals — mental models, problem solving, and systems thinking.',
    lessons: [
      { id: 1, title: 'Mental Models', file: 'SCHOOL/CORE/001_Mental_Models.md', level: 'intuition' },
    ],
  },
  cybersecurity: {
    name: 'Cybersecurity',
    icon: '🔒',
    tag: 'CYBERSECURITY',
    description: 'Offense and defense — threat modeling, crypto, auth.',
    lessons: [
      { id: 1, title: 'Threat Modeling', file: 'SCHOOL/CYBERSECURITY/001_Threat_Modeling.md', level: 'intuition' },
    ],
  },
  devops: {
    name: 'DevOps & CI/CD',
    icon: '⚙️',
    tag: 'DEVOPS',
    description: 'Containers, pipelines, and infrastructure as code.',
    lessons: [],
  },
  docker: {
    name: 'Docker & Containers',
    icon: '🐳',
    tag: 'DOCKER',
    description: 'From docker run to multi-service orchestration.',
    lessons: [
      { id: 1, title: 'Containers And Why', file: 'SCHOOL/DOCKER/001_Containers_And_Why.md', level: 'intuition' },
      { id: 2, title: 'Dockerfiles And Images', file: 'SCHOOL/DOCKER/002_Dockerfiles_And_Images.md', level: 'intuition' },
      { id: 3, title: 'Volumes And Networking', file: 'SCHOOL/DOCKER/003_Volumes_And_Networking.md', level: 'intuition' },
      { id: 4, title: 'Docker Compose Deep Dive', file: 'SCHOOL/DOCKER/004_Docker_Compose_Deep_Dive.md', level: 'intuition' },
      { id: 5, title: 'Orchestration Basics', file: 'SCHOOL/DOCKER/005_Orchestration_Basics.md', level: 'intuition' },
      { id: 6, title: 'CI CD With Docker', file: 'SCHOOL/DOCKER/006_CI_CD_With_Docker.md', level: 'intuition' },
    ],
  },
  'game-dev': {
    name: 'Game Development',
    icon: '🎮',
    tag: 'GAME-DEV',
    description: 'Game loops, 2D/3D graphics, collision detection.',
    lessons: [],
  },
  languages: {
    name: 'Programming Languages',
    icon: '🔤',
    tag: 'LANGUAGES',
    description: 'Paradigms, compilers, and language internals — understand the tools that build everything.',
    lessons: [
      { id: 1, title: 'Language Paradigms', file: 'SCHOOL/LANGUAGES/001_Language_Paradigms.md', level: 'intuition' },
      { id: 2, title: 'C Deep Dive', file: 'SCHOOL/LANGUAGES/002_C_Deep_Dive.md', level: 'intuition' },
      { id: 3, title: 'Rust Ownership', file: 'SCHOOL/LANGUAGES/003_Rust_Ownership.md', level: 'intuition' },
      { id: 4, title: 'Scripting Languages', file: 'SCHOOL/LANGUAGES/004_Scripting_Languages.md', level: 'intuition' },
    ],
  },
  linux: {
    name: 'Linux Fundamentals',
    icon: '🐧',
    tag: 'LINUX',
    description: 'Master the Linux operating system from the filesystem up.',
    lessons: [
      { id: 1, title: 'Filesystem', file: 'SCHOOL/LINUX/001_Filesystem.md', level: 'intuition' },
    ],
  },
  neovim: {
    name: 'Neovim Mastery',
    icon: '💻',
    tag: 'NEOVIM',
    description: 'Modal editing, LSP, plugins — turn your editor into an IDE.',
    lessons: [
      { id: 1, title: 'Vim Mastery', file: 'SCHOOL/NEOVIM/001_Vim_Mastery.md', level: 'intuition' },
      { id: 2, title: 'Configuration And Plugins', file: 'SCHOOL/NEOVIM/002_Configuration_And_Plugins.md', level: 'intuition' },
      { id: 3, title: 'LSP And Autocomplete', file: 'SCHOOL/NEOVIM/003_LSP_And_Autocomplete.md', level: 'intuition' },
      { id: 4, title: 'Plugin Development', file: 'SCHOOL/NEOVIM/004_Plugin_Development.md', level: 'intuition' },
    ],
  },
  networking: {
    name: 'Networking',
    icon: '🌐',
    tag: 'NETWORKING',
    description: 'TCP/IP, DNS, HTTP — how data flows across the internet.',
    lessons: [
      { id: 1, title: 'TCP IP', file: 'SCHOOL/NETWORKING/001_TCP_IP.md', level: 'intuition' },
    ],
  },
  python: {
    name: 'Python Programming',
    icon: '🐍',
    tag: 'PYTHON',
    description: 'Python from scripts to systems — syntax, OOP, async.',
    lessons: [
      { id: 1, title: 'Syntax Basics', file: 'SCHOOL/PYTHON/001_Syntax_Basics.md', level: 'intuition' },
    ],
  },
  wedev: {
    name: 'Web Development',
    icon: '🌍',
    tag: 'WEDEV',
    description: 'HTML, CSS, JS, React, Node — full-stack from browser to database.',
    lessons: [
      { id: 1, title: 'HTML Foundations', file: 'SCHOOL/WEDEV/001_HTML_Foundations.md', level: 'intuition' },
      { id: 2, title: 'CSS Mastery', file: 'SCHOOL/WEDEV/002_CSS_Mastery.md', level: 'intuition' },
      { id: 3, title: 'JavaScript Essentials', file: 'SCHOOL/WEDEV/003_JavaScript_Essentials.md', level: 'intuition' },
      { id: 4, title: 'React Fundamentals', file: 'SCHOOL/WEDEV/004_React_Fundamentals.md', level: 'intuition' },
      { id: 5, title: 'Backend With Node', file: 'SCHOOL/WEDEV/005_Backend_With_Node.md', level: 'intuition' },
      { id: 6, title: 'Full Stack Project', file: 'SCHOOL/WEDEV/006_Full_Stack_Project.md', level: 'intuition' },
    ],
  },
};

// Reverse lookup: file path → { topic, id }
export const LESSON_INDEX: Record<string, { topic: TopicKey; id: number }> = {};
for (const [topic, course] of Object.entries(COURSE_CATALOG)) {
  for (const lesson of course.lessons) {
    LESSON_INDEX[lesson.file] = { topic, id: lesson.id };
    LESSON_INDEX[lesson.file.replace('SCHOOL/', '')] = { topic, id: lesson.id };
  }
}
