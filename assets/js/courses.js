// ===== COURSE CATALOG =====
// 12 Departments — every .md lesson file (excluding MOC) listed with
// id, title (parsed from first # heading), level (parsed from ## Level N), and file path.

const COURSE_CATALOG = {
  arduino: {
    name: "Arduino & Embedded",
    icon: "🤖",
    tag: "ARDUINO",
    description: "Microcontrollers, sensors, motors — program the physical world.",
    lessons: [
      { id: 1, title: "Introduction To Embedded", file: "SCHOOL/ARDUINO/001_Introduction_To_Embedded.md", level: "intuition" },
      { id: 2, title: "Digital IO And Sensors", file: "SCHOOL/ARDUINO/002_Digital_IO_And_Sensors.md", level: "intuition" },
      { id: 3, title: "PWM And Motors", file: "SCHOOL/ARDUINO/003_PWM_And_Motors.md", level: "intuition" },
      { id: 4, title: "Displays And Output", file: "SCHOOL/ARDUINO/004_Displays_And_Output.md", level: "intuition" },
      { id: 5, title: "Communication Protocols", file: "SCHOOL/ARDUINO/005_Communication_Protocols.md", level: "intuition" },
      { id: 6, title: "Advanced Projects", file: "SCHOOL/ARDUINO/006_Advanced_Projects.md", level: "intuition" }
    ]
  },
  core: {
    name: "Core Engineering",
    icon: "🛠️",
    tag: "CORE",
    description: "Engineering fundamentals — mental models, problem solving, and systems thinking.",
    lessons: [
      { id: 1, title: "Mental Models", file: "SCHOOL/CORE/001_Mental_Models.md", level: "intuition" }
    ]
  },
  cybersecurity: {
    name: "Cybersecurity",
    icon: "🔒",
    tag: "CYBERSECURITY",
    description: "Offense and defense — threat modeling, crypto, auth.",
    lessons: [
      { id: 1, title: "Threat Modeling", file: "SCHOOL/CYBERSECURITY/001_Threat_Modeling.md", level: "intuition" }
    ]
  },
  devops: {
    name: "DevOps & CI/CD",
    icon: "⚙️",
    tag: "DEVOPS",
    description: "Containers, pipelines, and infrastructure as code.",
    lessons: []
  },
  docker: {
    name: "Docker & Containers",
    icon: "🐳",
    tag: "DOCKER",
    description: "From docker run to multi-service orchestration.",
    lessons: [
      { id: 1, title: "Containers And Why", file: "SCHOOL/DOCKER/001_Containers_And_Why.md", level: "intuition" },
      { id: 2, title: "Dockerfiles And Images", file: "SCHOOL/DOCKER/002_Dockerfiles_And_Images.md", level: "intuition" },
      { id: 3, title: "Volumes And Networking", file: "SCHOOL/DOCKER/003_Volumes_And_Networking.md", level: "intuition" },
      { id: 4, title: "Docker Compose Deep Dive", file: "SCHOOL/DOCKER/004_Docker_Compose_Deep_Dive.md", level: "intuition" },
      { id: 5, title: "Orchestration Basics", file: "SCHOOL/DOCKER/005_Orchestration_Basics.md", level: "intuition" },
      { id: 6, title: "CI CD With Docker", file: "SCHOOL/DOCKER/006_CI_CD_With_Docker.md", level: "intuition" }
    ]
  },
  "game-dev": {
    name: "Game Development",
    icon: "🎮",
    tag: "GAME-DEV",
    description: "Game loops, 2D/3D graphics, collision detection.",
    lessons: []
  },
  languages: {
    name: "Programming Languages",
    icon: "🔤",
    tag: "LANGUAGES",
    description: "Paradigms, compilers, and language internals — understand the tools that build everything.",
    lessons: [
      { id: 1, title: "Language Paradigms", file: "SCHOOL/LANGUAGES/001_Language_Paradigms.md", level: "intuition" },
      { id: 2, title: "C Deep Dive", file: "SCHOOL/LANGUAGES/002_C_Deep_Dive.md", level: "intuition" },
      { id: 3, title: "Rust Ownership", file: "SCHOOL/LANGUAGES/003_Rust_Ownership.md", level: "intuition" },
      { id: 4, title: "Scripting Languages", file: "SCHOOL/LANGUAGES/004_Scripting_Languages.md", level: "intuition" }
    ]
  },
  linux: {
    name: "Linux Fundamentals",
    icon: "🐧",
    tag: "LINUX",
    description: "Master the Linux operating system from the filesystem up.",
    lessons: [
      { id: 1, title: "Filesystem", file: "SCHOOL/LINUX/001_Filesystem.md", level: "intuition" }
    ]
  },
  neovim: {
    name: "Neovim Mastery",
    icon: "💻",
    tag: "NEOVIM",
    description: "Modal editing, LSP, plugins — turn your editor into an IDE.",
    lessons: [
      { id: 1, title: "Vim Mastery", file: "SCHOOL/NEOVIM/001_Vim_Mastery.md", level: "intuition" },
      { id: 2, title: "Configuration And Plugins", file: "SCHOOL/NEOVIM/002_Configuration_And_Plugins.md", level: "intuition" },
      { id: 3, title: "LSP And Autocomplete", file: "SCHOOL/NEOVIM/003_LSP_And_Autocomplete.md", level: "intuition" },
      { id: 4, title: "Plugin Development", file: "SCHOOL/NEOVIM/004_Plugin_Development.md", level: "intuition" }
    ]
  },
  networking: {
    name: "Networking",
    icon: "🌐",
    tag: "NETWORKING",
    description: "TCP/IP, DNS, HTTP — how data flows across the internet.",
    lessons: [
      { id: 1, title: "TCP IP", file: "SCHOOL/NETWORKING/001_TCP_IP.md", level: "intuition" }
    ]
  },
  python: {
    name: "Python Programming",
    icon: "🐍",
    tag: "PYTHON",
    description: "Python from scripts to systems — syntax, OOP, async.",
    lessons: [
      { id: 1, title: "Syntax Basics", file: "SCHOOL/PYTHON/001_Syntax_Basics.md", level: "intuition" }
    ]
  },
  wedev: {
    name: "Web Development",
    icon: "🌍",
    tag: "WEDEV",
    description: "HTML, CSS, JS, React, Node — full-stack from browser to database.",
    lessons: [
      { id: 1, title: "HTML Foundations", file: "SCHOOL/WEDEV/001_HTML_Foundations.md", level: "intuition" },
      { id: 2, title: "CSS Mastery", file: "SCHOOL/WEDEV/002_CSS_Mastery.md", level: "intuition" },
      { id: 3, title: "JavaScript Essentials", file: "SCHOOL/WEDEV/003_JavaScript_Essentials.md", level: "intuition" },
      { id: 4, title: "React Fundamentals", file: "SCHOOL/WEDEV/004_React_Fundamentals.md", level: "intuition" },
      { id: 5, title: "Backend With Node", file: "SCHOOL/WEDEV/005_Backend_With_Node.md", level: "intuition" },
      { id: 6, title: "Full Stack Project", file: "SCHOOL/WEDEV/006_Full_Stack_Project.md", level: "intuition" }
    ]
  }
};

// ===== 4-SCHOOL MILESTONE SYSTEM =====
// Four parallel schools — choose your path through the curriculum.
// Each milestone contains 8 tasks (Expert milestones have 4).

const SCHOOLS = {
  foundations_academy: {
    name: "Foundations Academy",
    tone: "Academic",
    focus: "CS theory, rigorous proofs",
    bestFor: "Future researchers, systems programmers",
    milestones: [
      {
        id: "FA-B",
        name: "Beginner — Computer Scientist's Toolkit",
        tasks: [
          { number: 1, task: "Write a formal proof of algorithm correctness", department: "CORE" },
          { number: 2, task: "Implement a linked list, stack, queue from scratch", department: "CORE" },
          { number: 3, task: "Compare static vs dynamic typing across 3 languages", department: "LANGUAGES" },
          { number: 4, task: "Trace system calls with strace and explain each one", department: "LINUX" },
          { number: 5, task: "Write a recursive-descent parser for a small grammar", department: "LANGUAGES" },
          { number: 6, task: "Derive Big-O complexity for 5 sorting algorithms", department: "CORE" },
          { number: 7, task: "Implement a finite state machine for a protocol parser", department: "CORE" },
          { number: 8, task: "Explain the OSI model layer by layer with packet traces", department: "NETWORKING" }
        ]
      },
      {
        id: "FA-I",
        name: "Intermediate — Systems Thinker",
        tasks: [
          { number: 1, task: "Write a small bytecode interpreter", department: "LANGUAGES" },
          { number: 2, task: "Implement a memory allocator (malloc/free)", department: "LINUX" },
          { number: 3, task: "Design a type system and implement type checking", department: "LANGUAGES" },
          { number: 4, task: "Write a toy operating system kernel module", department: "LINUX" },
          { number: 5, task: "Implement AES encryption from the spec document", department: "CYBERSECURITY" },
          { number: 6, task: "Write a concurrent data structure with formal correctness arguments", department: "LANGUAGES" },
          { number: 7, task: "Build a DNS resolver from scratch (RFC 1035)", department: "NETWORKING" },
          { number: 8, task: "Implement copy-on-write fork in a userspace program", department: "LINUX" }
        ]
      },
      {
        id: "FA-A",
        name: "Advanced — Language Architect",
        tasks: [
          { number: 1, task: "Write a compiler targeting LLVM IR", department: "LANGUAGES" },
          { number: 2, task: "Implement a garbage collector (mark-and-sweep or generational)", department: "LANGUAGES" },
          { number: 3, task: "Design and implement an embedded DSL", department: "LANGUAGES" },
          { number: 4, task: "Write a verified protocol implementation using TLA+ or Coq", department: "CYBERSECURITY" },
          { number: 5, task: "Implement a JIT compiler for a subset of a language", department: "LANGUAGES" },
          { number: 6, task: "Contribute a significant patch to an open-source compiler", department: "LANGUAGES" },
          { number: 7, task: "Write a formal semantics for a language feature", department: "LANGUAGES" },
          { number: 8, task: "Publish a paper on a language design topic (blog or journal)", department: "LANGUAGES" }
        ]
      },
      {
        id: "FA-E",
        name: "Expert — Research Contributor",
        tasks: [
          { number: 1, task: "Design a new programming language with a novel feature", department: "LANGUAGES" },
          { number: 2, task: "Implement a verified microkernel", department: "LINUX" },
          { number: 3, task: "Write a peer-reviewed paper accepted to a PL/SE venue", department: "LANGUAGES" },
          { number: 4, task: "Author an open-source tool adopted by the community (1k+ stars)", department: "CORE" }
        ]
      }
    ]
  },
  builders_workshop: {
    name: "Builders Workshop",
    tone: "Practical",
    focus: "Project-based, hands-on",
    bestFor: "Self-taught devs, job seekers",
    milestones: [
      {
        id: "BW-B",
        name: "Beginner — Apprentice Builder",
        tasks: [
          { number: 1, task: "Build a personal website with HTML/CSS/JS", department: "WEDEV" },
          { number: 2, task: "Write a CLI tool that automates a daily task", department: "PYTHON" },
          { number: 3, task: "Containerize any application with a Dockerfile", department: "DOCKER" },
          { number: 4, task: "Set up Neovim with basic plugins and LSP", department: "NEOVIM" },
          { number: 5, task: "Build a responsive landing page with CSS Grid/Flexbox", department: "WEDEV" },
          { number: 6, task: "Write shell scripts to automate file management", department: "LINUX" },
          { number: 7, task: "Blink an LED and read a sensor with Arduino", department: "ARDUINO" },
          { number: 8, task: "Deploy a static site to GitHub Pages or Netlify", department: "WEDEV" }
        ]
      },
      {
        id: "BW-I",
        name: "Intermediate — Journeyman Builder",
        tasks: [
          { number: 1, task: "Build a full-stack CRUD app (React + Express + SQLite)", department: "WEDEV" },
          { number: 2, task: "Create a CI/CD pipeline with GitHub Actions", department: "DEVOPS" },
          { number: 3, task: "Deploy a multi-service app with Docker Compose", department: "DOCKER" },
          { number: 4, task: "Build a 2D game with collision detection", department: "GAME-DEV" },
          { number: 5, task: "Write unit and integration tests for a web app", department: "WEDEV" },
          { number: 6, task: "Set up monitoring and alerting for a deployed service", department: "DEVOPS" },
          { number: 7, task: "Build a weather station with I2C sensors + Arduino", department: "ARDUINO" },
          { number: 8, task: "Configure Nginx as a reverse proxy with SSL", department: "LINUX" }
        ]
      },
      {
        id: "BW-A",
        name: "Advanced — Master Builder",
        tasks: [
          { number: 1, task: "Build and deploy a real-time collaborative app (WebSockets)", department: "WEDEV" },
          { number: 2, task: "Implement a microservices architecture with Docker Swarm/k8s", department: "DOCKER" },
          { number: 3, task: "Write a custom Neovim plugin in Lua", department: "NEOVIM" },
          { number: 4, task: "Build a home automation system with Arduino + MQTT", department: "ARDUINO" },
          { number: 5, task: "Implement OAuth2 social login in a web app", department: "WEDEV" },
          { number: 6, task: "Set up a Kubernetes cluster with Helm charts", department: "DEVOPS" },
          { number: 7, task: "Build a cross-platform mobile app (React Native or Flutter)", department: "WEDEV" },
          { number: 8, task: "Implement a blue/green deployment strategy", department: "DEVOPS" }
        ]
      },
      {
        id: "BW-E",
        name: "Expert — Product Engineer",
        tasks: [
          { number: 1, task: "Launch a SaaS product with paying users", department: "WEDEV" },
          { number: 2, task: "Build a plugin or tool used by 100+ developers", department: "NEOVIM" },
          { number: 3, task: "Deliver a conference talk with live coding", department: "CORE" },
          { number: 4, task: "Mentor 3 junior developers through the Builders Workshop path", department: "CORE" }
        ]
      }
    ]
  },
  systems_lab: {
    name: "Systems Lab",
    tone: "Technical",
    focus: "Deep dives, architecture",
    bestFor: "Infrastructure engineers, tool builders",
    milestones: [
      {
        id: "SL-B",
        name: "Beginner — Operator",
        tasks: [
          { number: 1, task: "Install Arch Linux or Gentoo from scratch", department: "LINUX" },
          { number: 2, task: "Write init scripts and configure systemd services", department: "LINUX" },
          { number: 3, task: "Set up a local DNS resolver (bind9 or unbound)", department: "NETWORKING" },
          { number: 4, task: "Configure iptables/nftables firewall rules", department: "NETWORKING" },
          { number: 5, task: "Build a custom kernel and boot it", department: "LINUX" },
          { number: 6, task: "Set up Docker with custom bridge networks", department: "DOCKER" },
          { number: 7, task: "Profile a process with perf, strace, and ltrace", department: "LINUX" },
          { number: 8, task: "Write a systemd timer as a cron replacement", department: "LINUX" }
        ]
      },
      {
        id: "SL-I",
        name: "Intermediate — Architect",
        tasks: [
          { number: 1, task: "Set up a multi-node Docker Swarm or k3s cluster", department: "DOCKER" },
          { number: 2, task: "Implement a distributed key-value store with Raft consensus", department: "DEVOPS" },
          { number: 3, task: "Configure a VPN with WireGuard and split tunneling", department: "NETWORKING" },
          { number: 4, task: "Set up centralized logging with ELK stack", department: "DEVOPS" },
          { number: 5, task: "Implement a load balancer with health checks in Go", department: "NETWORKING" },
          { number: 6, task: "Write an eBPF program and attach it to a kernel hook", department: "LINUX" },
          { number: 7, task: "Set up Prometheus + Grafana with custom metrics", department: "DEVOPS" },
          { number: 8, task: "Implement a container runtime using Linux namespaces", department: "DOCKER" }
        ]
      },
      {
        id: "SL-A",
        name: "Advanced — Infrastructure Engineer",
        tasks: [
          { number: 1, task: "Build a service mesh with sidecar proxies", department: "DOCKER" },
          { number: 2, task: "Implement a custom Kubernetes operator", department: "DEVOPS" },
          { number: 3, task: "Write a network packet analyzer (like tcpdump)", department: "NETWORKING" },
          { number: 4, task: "Implement a distributed tracing system", department: "DEVOPS" },
          { number: 5, task: "Set up a multi-region, highly-available deployment", department: "DEVOPS" },
          { number: 6, task: "Implement a zero-downtime migration strategy", department: "DEVOPS" },
          { number: 7, task: "Write a kernel module for a custom device driver", department: "LINUX" },
          { number: 8, task: "Implement a Chaotic Engineering test suite", department: "DEVOPS" }
        ]
      },
      {
        id: "SL-E",
        name: "Expert — Systems Visionary",
        tasks: [
          { number: 1, task: "Design and implement a new distributed system protocol", department: "NETWORKING" },
          { number: 2, task: "Author a widely-used infrastructure tool (open source)", department: "DEVOPS" },
          { number: 3, task: "Present a systems architecture at KubeCon, SREcon, or similar", department: "DEVOPS" },
          { number: 4, task: "Design infrastructure for a service serving 1M+ requests/sec", department: "DEVOPS" }
        ]
      }
    ]
  },
  creators_studio: {
    name: "Creators Studio",
    tone: "Creative",
    focus: "Entrepreneurial, products",
    bestFor: "Indie hackers, startup founders",
    milestones: [
      {
        id: "CS-B",
        name: "Beginner — Tinkerer",
        tasks: [
          { number: 1, task: "Build an interactive art piece with Arduino + LEDs/servos", department: "ARDUINO" },
          { number: 2, task: "Create a personal portfolio site with animations", department: "WEDEV" },
          { number: 3, task: "Build a text-based adventure or interactive fiction game", department: "GAME-DEV" },
          { number: 4, task: "Design a custom Neovim colorscheme", department: "NEOVIM" },
          { number: 5, task: "Build a web scraper that generates a creative dataset", department: "PYTHON" },
          { number: 6, task: "Create a generative art script (SVG or canvas)", department: "WEDEV" },
          { number: 7, task: "Build a MIDI controller with Arduino", department: "ARDUINO" },
          { number: 8, task: "Deploy a static blog with a custom theme", department: "WEDEV" }
        ]
      },
      {
        id: "CS-I",
        name: "Intermediate — Maker",
        tasks: [
          { number: 1, task: "Build a 2D platformer game with level editor", department: "GAME-DEV" },
          { number: 2, task: "Create a real-time collaborative whiteboard app", department: "WEDEV" },
          { number: 3, task: "Build an IoT art installation (Arduino + web dashboard)", department: "ARDUINO" },
          { number: 4, task: "Develop a Neovim plugin that solves a creative workflow problem", department: "NEOVIM" },
          { number: 5, task: "Build a WebGL/Three.js interactive 3D experience", department: "WEDEV" },
          { number: 6, task: "Create a data visualization dashboard with live data", department: "WEDEV" },
          { number: 7, task: "Build a language-learning flashcard app with spaced repetition", department: "WEDEV" },
          { number: 8, task: "Containerize and deploy a personal project to production", department: "DOCKER" }
        ]
      },
      {
        id: "CS-A",
        name: "Advanced — Creator",
        tasks: [
          { number: 1, task: "Build and ship a mobile game to an app store", department: "GAME-DEV" },
          { number: 2, task: "Launch a SaaS product with Stripe integration", department: "WEDEV" },
          { number: 3, task: "Build a custom embedded hardware product (PCB + firmware)", department: "ARDUINO" },
          { number: 4, task: "Create a programming tool or editor plugin adopted by others", department: "NEOVIM" },
          { number: 5, task: "Build an AI-augmented creative tool (LLM + web interface)", department: "WEDEV" },
          { number: 6, task: "Ship a multiplayer game with server-authoritative logic", department: "GAME-DEV" },
          { number: 7, task: "Build a robotic arm or drone controlled by Arduino", department: "ARDUINO" },
          { number: 8, task: "Give a demo day presentation of a product you built", department: "CORE" }
        ]
      },
      {
        id: "CS-E",
        name: "Expert — Studio Head",
        tasks: [
          { number: 1, task: "Launch a product with 1,000+ active users", department: "WEDEV" },
          { number: 2, task: "Ship a commercial game on Steam or console", department: "GAME-DEV" },
          { number: 3, task: "Run a successful Kickstarter for a hardware product", department: "ARDUINO" },
          { number: 4, task: "Build and sell a course or book on a creative technical topic", department: "CORE" }
        ]
      }
    ]
  }
};

// Reverse lookup: file path → { topic, lessonId }
const LESSON_INDEX = {};
(function buildLessonIndex() {
  for (const [topic, course] of Object.entries(COURSE_CATALOG)) {
    for (const lesson of course.lessons) {
      LESSON_INDEX[lesson.file] = { topic, id: lesson.id };
      LESSON_INDEX[lesson.file.replace('SCHOOL/', '')] = { topic, id: lesson.id };
    }
  }
})();

// ===== COURSE LOADER =====

async function loadCourseContent(topic, lessonId) {
  const course = COURSE_CATALOG[topic];
  if (!course) return { error: `Unknown topic: ${topic}` };

  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) return { error: `Lesson ${lessonId} not found in ${topic}` };

  try {
    const resp = await fetch('/' + lesson.file);
    if (!resp.ok) {
      return { error: `Failed to load ${lesson.file}: ${resp.status} ${resp.statusText}` };
    }
    const rawMd = await resp.text();
    const html = renderMarkdown(rawMd);
    return {
      topic,
      lessonId,
      title: lesson.title,
      file: lesson.file,
      level: lesson.level,
      courseName: course.name,
      courseIcon: course.icon,
      html
    };
  } catch (err) {
    return { error: `Network error loading ${lesson.file}: ${err.message}` };
  }
}

// ===== MARKDOWN RENDERER =====

function renderMarkdown(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderInline(text) {
    // Process [[wikilinks]] first
    text = text.replace(/\[\[([^\]|]+)\]\]/g, (_m, target) => {
      const parts = target.split('|');
      const label = parts.length > 1 ? parts[1] : parts[0];
      const linkTarget = parts[0];
      return `<span class="wikilink" data-target="${escapeHtml(linkTarget)}">${escapeHtml(label)}</span>`;
    });
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    return text;
  }

  while (i < lines.length) {
    let line = lines[i];
    const trimmed = line.trim();

    // Code blocks ``` ... ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // skip closing ```
      out.push(`<pre class="code-block"${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}><code>${codeLines.join('\n')}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      out.push('<hr>');
      i++;
      continue;
    }

    // Headers
    if (trimmed.startsWith('#### ')) {
      out.push(`<h4>${renderInline(trimmed.slice(5))}</h4>`);
    } else if (trimmed.startsWith('### ')) {
      out.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      out.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      out.push(`<h1>${renderInline(trimmed.slice(2))}</h1>`);
    }
    // Blockquote
    else if (trimmed.startsWith('> ')) {
      out.push(`<blockquote>${renderInline(trimmed.slice(2))}</blockquote>`);
    }
    // Unordered list
    else if (/^[-*]\s/.test(trimmed)) {
      const listItems = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        listItems.push(`<li>${renderInline(lines[i].trim().slice(2))}</li>`);
        i++;
      }
      out.push(`<ul>${listItems.join('')}</ul>`);
      continue;
    }
    // Table (pipe-separated)
    else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows = [trimmed];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableRows.push(lines[i].trim());
        i++;
      }

      const renderRow = (row, tag) => {
        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        const cellHtml = cells.map(c => {
          if (/^[-:]+$/.test(c)) return null; // alignment row
          return `<${tag}>${renderInline(c)}</${tag}>`;
        }).filter(Boolean).join('');
        return `<tr>${cellHtml}</tr>`;
      };

      const headerRow = renderRow(tableRows[0], 'th');
      const bodyRows = tableRows.slice(2).map(r => renderRow(r, 'td')).join('');

      out.push(`<table class="md-table"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`);
      continue;
    }
    // Empty line
    else if (trimmed === '') {
      out.push('<br>');
    }
    // Paragraph
    else {
      out.push(`<p>${renderInline(line)}</p>`);
    }
    i++;
  }

  return out.join('\n');
}

// ===== COURSE SEARCH =====

function searchCourses(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();

  const results = [];

  for (const [topic, course] of Object.entries(COURSE_CATALOG)) {
    // Match course name
    const courseNameMatch = course.name.toLowerCase().includes(q);
    const courseDescMatch = course.description.toLowerCase().includes(q);

    for (const lesson of course.lessons) {
      const titleMatch = lesson.title.toLowerCase().includes(q);
      const levelMatch = lesson.level.toLowerCase() === q;

      if (courseNameMatch || courseDescMatch || titleMatch || levelMatch) {
        results.push({
          topic,
          courseName: course.name,
          courseIcon: course.icon,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          level: lesson.level,
          file: lesson.file,
          score: (titleMatch ? 3 : 0) +
                 (courseNameMatch ? 2 : 0) +
                 (courseDescMatch ? 1 : 0) +
                 (levelMatch ? 2 : 0)
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// ===== PROGRESS TRACKING =====

function markLessonComplete(topic, lessonId) {
  if (typeof getUserProfile !== 'function' || typeof saveUserProfile !== 'function') {
    console.warn('courses.js: getUserProfile/saveUserProfile not available. Ensure index.html loads first.');
    return false;
  }

  const profile = getUserProfile();
  const lessonKey = `${topic}:${lessonId}`;

  if (!profile.stats.topics_completed.includes(lessonKey)) {
    profile.stats.topics_completed.push(lessonKey);
    saveUserProfile(profile);
    return true;
  }
  return false;
}

function isLessonComplete(topic, lessonId) {
  if (typeof getUserProfile !== 'function') return false;
  const profile = getUserProfile();
  return profile.stats.topics_completed.includes(`${topic}:${lessonId}`);
}

function getCompletedCount(topic) {
  if (typeof getUserProfile !== 'function') return 0;
  const profile = getUserProfile();
  const prefix = `${topic}:`;
  return profile.stats.topics_completed.filter(k => k.startsWith(prefix)).length;
}

function getCourseProgress(topic) {
  const course = COURSE_CATALOG[topic];
  if (!course) return { completed: 0, total: 0, percent: 0 };
  const completed = getCompletedCount(topic);
  const total = course.lessons.length;
  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0
  };
}
