// ===== 4-SCHOOL MILESTONE SYSTEM =====

import type { SchoolId } from '@/types/schema.ts';

export interface MilestoneTask {
  number: number;
  task: string;
  department: string;
}

export interface Milestone {
  id: string;
  name: string;
  tasks: MilestoneTask[];
}

export interface School {
  name: string;
  tone: string;
  focus: string;
  bestFor: string;
  milestones: Milestone[];
}

export const SCHOOLS: Record<SchoolId, School> = {
  foundations_academy: {
    name: 'Foundations Academy',
    tone: 'Academic',
    focus: 'CS theory, rigorous proofs',
    bestFor: 'Future researchers, systems programmers',
    milestones: [
      {
        id: 'FA-B',
        name: "Beginner — Computer Scientist's Toolkit",
        tasks: [
          { number: 1, task: 'Write a formal proof of algorithm correctness', department: 'CORE' },
          { number: 2, task: 'Implement a linked list, stack, queue from scratch', department: 'CORE' },
          { number: 3, task: 'Compare static vs dynamic typing across 3 languages', department: 'LANGUAGES' },
          { number: 4, task: 'Trace system calls with strace and explain each one', department: 'LINUX' },
          { number: 5, task: 'Write a recursive-descent parser for a small grammar', department: 'LANGUAGES' },
          { number: 6, task: 'Derive Big-O complexity for 5 sorting algorithms', department: 'CORE' },
          { number: 7, task: 'Implement a finite state machine for a protocol parser', department: 'CORE' },
          { number: 8, task: 'Explain the OSI model layer by layer with packet traces', department: 'NETWORKING' },
        ],
      },
      {
        id: 'FA-I',
        name: 'Intermediate — Systems Thinker',
        tasks: [
          { number: 1, task: 'Write a small bytecode interpreter', department: 'LANGUAGES' },
          { number: 2, task: 'Implement a memory allocator (malloc/free)', department: 'LINUX' },
          { number: 3, task: 'Design a type system and implement type checking', department: 'LANGUAGES' },
          { number: 4, task: 'Write a toy operating system kernel module', department: 'LINUX' },
          { number: 5, task: 'Implement AES encryption from the spec document', department: 'CYBERSECURITY' },
          { number: 6, task: 'Write a concurrent data structure with formal correctness arguments', department: 'LANGUAGES' },
          { number: 7, task: 'Build a DNS resolver from scratch (RFC 1035)', department: 'NETWORKING' },
          { number: 8, task: 'Implement copy-on-write fork in a userspace program', department: 'LINUX' },
        ],
      },
      {
        id: 'FA-A',
        name: 'Advanced — Language Architect',
        tasks: [
          { number: 1, task: 'Write a compiler targeting LLVM IR', department: 'LANGUAGES' },
          { number: 2, task: 'Implement a garbage collector (mark-and-sweep or generational)', department: 'LANGUAGES' },
          { number: 3, task: 'Design and implement an embedded DSL', department: 'LANGUAGES' },
          { number: 4, task: 'Write a verified protocol implementation using TLA+ or Coq', department: 'CYBERSECURITY' },
          { number: 5, task: 'Implement a JIT compiler for a subset of a language', department: 'LANGUAGES' },
          { number: 6, task: 'Contribute a significant patch to an open-source compiler', department: 'LANGUAGES' },
          { number: 7, task: 'Write a formal semantics for a language feature', department: 'LANGUAGES' },
          { number: 8, task: 'Publish a paper on a language design topic (blog or journal)', department: 'LANGUAGES' },
        ],
      },
      {
        id: 'FA-E',
        name: 'Expert — Research Contributor',
        tasks: [
          { number: 1, task: 'Design a new programming language with a novel feature', department: 'LANGUAGES' },
          { number: 2, task: 'Implement a verified microkernel', department: 'LINUX' },
          { number: 3, task: 'Write a peer-reviewed paper accepted to a PL/SE venue', department: 'LANGUAGES' },
          { number: 4, task: 'Author an open-source tool adopted by the community (1k+ stars)', department: 'CORE' },
        ],
      },
    ],
  },
  builders_workshop: {
    name: 'Builders Workshop',
    tone: 'Practical',
    focus: 'Project-based, hands-on',
    bestFor: 'Self-taught devs, job seekers',
    milestones: [
      {
        id: 'BW-B',
        name: 'Beginner — Apprentice Builder',
        tasks: [
          { number: 1, task: 'Build a personal website with HTML/CSS/JS', department: 'WEDEV' },
          { number: 2, task: 'Write a CLI tool that automates a daily task', department: 'PYTHON' },
          { number: 3, task: 'Containerize any application with a Dockerfile', department: 'DOCKER' },
          { number: 4, task: 'Set up Neovim with basic plugins and LSP', department: 'NEOVIM' },
          { number: 5, task: 'Build a responsive landing page with CSS Grid/Flexbox', department: 'WEDEV' },
          { number: 6, task: 'Write shell scripts to automate file management', department: 'LINUX' },
          { number: 7, task: 'Blink an LED and read a sensor with Arduino', department: 'ARDUINO' },
          { number: 8, task: 'Deploy a static site to GitHub Pages or Netlify', department: 'WEDEV' },
        ],
      },
      {
        id: 'BW-I',
        name: 'Intermediate — Journeyman Builder',
        tasks: [
          { number: 1, task: 'Build a full-stack CRUD app (React + Express + SQLite)', department: 'WEDEV' },
          { number: 2, task: 'Create a CI/CD pipeline with GitHub Actions', department: 'DEVOPS' },
          { number: 3, task: 'Deploy a multi-service app with Docker Compose', department: 'DOCKER' },
          { number: 4, task: 'Build a 2D game with collision detection', department: 'GAME-DEV' },
          { number: 5, task: 'Write unit and integration tests for a web app', department: 'WEDEV' },
          { number: 6, task: 'Set up monitoring and alerting for a deployed service', department: 'DEVOPS' },
          { number: 7, task: 'Build a weather station with I2C sensors + Arduino', department: 'ARDUINO' },
          { number: 8, task: 'Configure Nginx as a reverse proxy with SSL', department: 'LINUX' },
        ],
      },
      {
        id: 'BW-A',
        name: 'Advanced — Master Builder',
        tasks: [
          { number: 1, task: 'Build and deploy a real-time collaborative app (WebSockets)', department: 'WEDEV' },
          { number: 2, task: 'Implement a microservices architecture with Docker Swarm/k8s', department: 'DOCKER' },
          { number: 3, task: 'Write a custom Neovim plugin in Lua', department: 'NEOVIM' },
          { number: 4, task: 'Build a home automation system with Arduino + MQTT', department: 'ARDUINO' },
          { number: 5, task: 'Implement OAuth2 social login in a web app', department: 'WEDEV' },
          { number: 6, task: 'Set up a Kubernetes cluster with Helm charts', department: 'DEVOPS' },
          { number: 7, task: 'Build a cross-platform mobile app (React Native or Flutter)', department: 'WEDEV' },
          { number: 8, task: 'Implement a blue/green deployment strategy', department: 'DEVOPS' },
        ],
      },
      {
        id: 'BW-E',
        name: 'Expert — Product Engineer',
        tasks: [
          { number: 1, task: 'Launch a SaaS product with paying users', department: 'WEDEV' },
          { number: 2, task: 'Build a plugin or tool used by 100+ developers', department: 'NEOVIM' },
          { number: 3, task: 'Deliver a conference talk with live coding', department: 'CORE' },
          { number: 4, task: 'Mentor 3 junior developers through the Builders Workshop path', department: 'CORE' },
        ],
      },
    ],
  },
  systems_lab: {
    name: 'Systems Lab',
    tone: 'Technical',
    focus: 'Deep dives, architecture',
    bestFor: 'Infrastructure engineers, tool builders',
    milestones: [
      {
        id: 'SL-B',
        name: 'Beginner — Operator',
        tasks: [
          { number: 1, task: 'Install Arch Linux or Gentoo from scratch', department: 'LINUX' },
          { number: 2, task: 'Write init scripts and configure systemd services', department: 'LINUX' },
          { number: 3, task: 'Set up a local DNS resolver (bind9 or unbound)', department: 'NETWORKING' },
          { number: 4, task: 'Configure iptables/nftables firewall rules', department: 'NETWORKING' },
          { number: 5, task: 'Build a custom kernel and boot it', department: 'LINUX' },
          { number: 6, task: 'Set up Docker with custom bridge networks', department: 'DOCKER' },
          { number: 7, task: 'Profile a process with perf, strace, and ltrace', department: 'LINUX' },
          { number: 8, task: 'Write a systemd timer as a cron replacement', department: 'LINUX' },
        ],
      },
      {
        id: 'SL-I',
        name: 'Intermediate — Architect',
        tasks: [
          { number: 1, task: 'Set up a multi-node Docker Swarm or k3s cluster', department: 'DOCKER' },
          { number: 2, task: 'Implement a distributed key-value store with Raft consensus', department: 'DEVOPS' },
          { number: 3, task: 'Configure a VPN with WireGuard and split tunneling', department: 'NETWORKING' },
          { number: 4, task: 'Set up centralized logging with ELK stack', department: 'DEVOPS' },
          { number: 5, task: 'Implement a load balancer with health checks in Go', department: 'NETWORKING' },
          { number: 6, task: 'Write an eBPF program and attach it to a kernel hook', department: 'LINUX' },
          { number: 7, task: 'Set up Prometheus + Grafana with custom metrics', department: 'DEVOPS' },
          { number: 8, task: 'Implement a container runtime using Linux namespaces', department: 'DOCKER' },
        ],
      },
      {
        id: 'SL-A',
        name: 'Advanced — Infrastructure Engineer',
        tasks: [
          { number: 1, task: 'Build a service mesh with sidecar proxies', department: 'DOCKER' },
          { number: 2, task: 'Implement a custom Kubernetes operator', department: 'DEVOPS' },
          { number: 3, task: 'Write a network packet analyzer (like tcpdump)', department: 'NETWORKING' },
          { number: 4, task: 'Implement a distributed tracing system', department: 'DEVOPS' },
          { number: 5, task: 'Set up a multi-region, highly-available deployment', department: 'DEVOPS' },
          { number: 6, task: 'Implement a zero-downtime migration strategy', department: 'DEVOPS' },
          { number: 7, task: 'Write a kernel module for a custom device driver', department: 'LINUX' },
          { number: 8, task: 'Implement a Chaotic Engineering test suite', department: 'DEVOPS' },
        ],
      },
      {
        id: 'SL-E',
        name: 'Expert — Systems Visionary',
        tasks: [
          { number: 1, task: 'Design and implement a new distributed system protocol', department: 'NETWORKING' },
          { number: 2, task: 'Author a widely-used infrastructure tool (open source)', department: 'DEVOPS' },
          { number: 3, task: 'Present a systems architecture at KubeCon, SREcon, or similar', department: 'DEVOPS' },
          { number: 4, task: 'Design infrastructure for a service serving 1M+ requests/sec', department: 'DEVOPS' },
        ],
      },
    ],
  },
  creators_studio: {
    name: 'Creators Studio',
    tone: 'Creative',
    focus: 'Entrepreneurial, products',
    bestFor: 'Indie hackers, startup founders',
    milestones: [
      {
        id: 'CS-B',
        name: 'Beginner — Tinkerer',
        tasks: [
          { number: 1, task: 'Build an interactive art piece with Arduino + LEDs/servos', department: 'ARDUINO' },
          { number: 2, task: 'Create a personal portfolio site with animations', department: 'WEDEV' },
          { number: 3, task: 'Build a text-based adventure or interactive fiction game', department: 'GAME-DEV' },
          { number: 4, task: 'Design a custom Neovim colorscheme', department: 'NEOVIM' },
          { number: 5, task: 'Build a web scraper that generates a creative dataset', department: 'PYTHON' },
          { number: 6, task: 'Create a generative art script (SVG or canvas)', department: 'WEDEV' },
          { number: 7, task: 'Build a MIDI controller with Arduino', department: 'ARDUINO' },
          { number: 8, task: 'Deploy a static blog with a custom theme', department: 'WEDEV' },
        ],
      },
      {
        id: 'CS-I',
        name: 'Intermediate — Maker',
        tasks: [
          { number: 1, task: 'Build a 2D platformer game with level editor', department: 'GAME-DEV' },
          { number: 2, task: 'Create a real-time collaborative whiteboard app', department: 'WEDEV' },
          { number: 3, task: 'Build an IoT art installation (Arduino + web dashboard)', department: 'ARDUINO' },
          { number: 4, task: 'Develop a Neovim plugin that solves a creative workflow problem', department: 'NEOVIM' },
          { number: 5, task: 'Build a WebGL/Three.js interactive 3D experience', department: 'WEDEV' },
          { number: 6, task: 'Create a data visualization dashboard with live data', department: 'WEDEV' },
          { number: 7, task: 'Build a language-learning flashcard app with spaced repetition', department: 'WEDEV' },
          { number: 8, task: 'Containerize and deploy a personal project to production', department: 'DOCKER' },
        ],
      },
      {
        id: 'CS-A',
        name: 'Advanced — Creator',
        tasks: [
          { number: 1, task: 'Build and ship a mobile game to an app store', department: 'GAME-DEV' },
          { number: 2, task: 'Launch a SaaS product with Stripe integration', department: 'WEDEV' },
          { number: 3, task: 'Build a custom embedded hardware product (PCB + firmware)', department: 'ARDUINO' },
          { number: 4, task: 'Create a programming tool or editor plugin adopted by others', department: 'NEOVIM' },
          { number: 5, task: 'Build an AI-augmented creative tool (LLM + web interface)', department: 'WEDEV' },
          { number: 6, task: 'Ship a multiplayer game with server-authoritative logic', department: 'GAME-DEV' },
          { number: 7, task: 'Build a robotic arm or drone controlled by Arduino', department: 'ARDUINO' },
          { number: 8, task: 'Give a demo day presentation of a product you built', department: 'CORE' },
        ],
      },
      {
        id: 'CS-E',
        name: 'Expert — Studio Head',
        tasks: [
          { number: 1, task: 'Launch a product with 1,000+ active users', department: 'WEDEV' },
          { number: 2, task: 'Ship a commercial game on Steam or console', department: 'GAME-DEV' },
          { number: 3, task: 'Run a successful Kickstarter for a hardware product', department: 'ARDUINO' },
          { number: 4, task: 'Build and sell a course or book on a creative technical topic', department: 'CORE' },
        ],
      },
    ],
  },
};
