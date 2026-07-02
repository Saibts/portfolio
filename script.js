(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     PAGE LOADER
     ============================================================ */
  function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    const dismiss = () => loader.classList.add('hidden');
    if (reducedMotion) { dismiss(); return; }
    window.addEventListener('load', () => setTimeout(dismiss, 450));
    // Safety net in case load event is delayed
    setTimeout(dismiss, 2000);
  }

  /* ============================================================
     SCROLL PROGRESS BAR
     ============================================================ */
  function initScrollProgress() {
    const bar = document.getElementById('progressBar');
    if (!bar) return;
    let ticking = false;
    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ============================================================
     TRACE RAIL FILL (signature scroll element next to content)
     ============================================================ */
  function initTraceRail() {
    const fill = document.getElementById('traceFill');
    const content = document.querySelector('.content');
    if (!fill || !content) return;
    let ticking = false;
    function update() {
      const rect = content.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      fill.style.height = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ============================================================
     SCROLL REVEAL ANIMATIONS
     ============================================================ */
  function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(el => observer.observe(el));
  }

  /* ============================================================
     ACTIVE NAVIGATION HIGHLIGHTING
     ============================================================ */
  function initActiveNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('main.content > section[id]');
    if (!navItems.length || !sections.length) return;

    const map = new Map();
    navItems.forEach(item => {
      const id = item.getAttribute('href').substring(1);
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(item);
    });

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const links = map.get(entry.target.id);
        if (!links) return;
        if (entry.isIntersecting) {
          navItems.forEach(n => n.classList.remove('active'));
          links.forEach(link => link.classList.add('active'));
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

    sections.forEach(sec => observer.observe(sec));
  }

  /* ============================================================
     SMOOTH SCROLL FOR NAV LINKS (with sticky-header offset)
     ============================================================ */
  function initSmoothScroll() {
    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
        if (window.innerWidth <= 1023) {
          navItemsSetActive(link);
        }
      });
    });
  }
  function navItemsSetActive(link) {
    const targetId = link.getAttribute('href').substring(1);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`.nav-item[href="#${targetId}"]`).forEach(n => n.classList.add('active'));
  }

  /* ============================================================
     BACK TO TOP BUTTON
     ============================================================ */
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    let ticking = false;
    function update() {
      btn.classList.toggle('visible', window.scrollY > 600);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
    update();
  }

  /* ============================================================
     PROJECT FILTER SWITCHER (with sliding pill indicator)
     ============================================================ */
  function initProjectFilter() {
    const buttons = document.querySelectorAll('.filter-btn');
    const groups = document.querySelectorAll('.branch-group');
    const indicator = document.querySelector('.filter-indicator');
    if (!buttons.length) return;

    function moveIndicator(btn) {
      if (!indicator) return;
      indicator.style.width = btn.offsetWidth + 'px';
      indicator.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
    }

    function setBranch(branch, focusTarget) {
      buttons.forEach(b => {
        const isActive = b.dataset.branch === branch;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', String(isActive));
        if (isActive) moveIndicator(b);
      });
      groups.forEach(g => g.classList.toggle('active', g.dataset.branchGroup === branch));
    }

    buttons.forEach(btn => btn.addEventListener('click', () => setBranch(btn.dataset.branch)));
    window.addEventListener('resize', () => {
      const active = document.querySelector('.filter-btn.active');
      if (active) moveIndicator(active);
    });

    // Initialize on the currently-marked-active button (defaults to software)
    const initial = document.querySelector('.filter-btn.active') || buttons[0];
    requestAnimationFrame(() => setBranch(initial.dataset.branch));
  }

  /* ============================================================
     RESUME MODAL
     ============================================================ */
  window.handleResumeClick = function () {
    const modal = document.getElementById('resume-viewer');
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('no-scroll');
    const closeBtn = modal.querySelector('.back-text-btn');
    if (closeBtn) closeBtn.focus();
  };

  window.closeResume = function () {
    const modal = document.getElementById('resume-viewer');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  };

  function initResumeModalKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') window.closeResume();
    });
  }

  /* ============================================================
     TERMINAL CLI
     ============================================================ */
  function initTerminal() {
    const input = document.getElementById('terminal-in');
    const output = document.getElementById('terminal-out');
    if (!input || !output) return;

    function printLine(html, type) {
      const line = document.createElement('div');
      line.className = ('terminal-line ' + (type || '')).trim();
      line.innerHTML = html;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    const commands = {
      help: "Available protocols:<br> &gt; <strong>about</strong>: Dump profile data<br> &gt; <strong>skills</strong>: Scan tech stack<br> &gt; <strong>projects</strong>: List repositories<br> &gt; <strong>contact</strong>: Open comm channels<br> &gt; <strong>theme green/cyan</strong>: Configure UI accent color<br> &gt; <strong>diagnostic</strong>: System integrity check<br> &gt; <strong>clear</strong>: Purge terminal",
      about: "<strong>Sailakshmi B T</strong> — Robotics &amp; Automation Undergrad (MIT, Anna University).<br>CGPA: 8.99 | HSC: 94.16% | SSLC: 95.2%<br>Primary Directives: Embedded Hardware, Control Systems &amp; Autonomous AI.",
      skills: "TECH_STACK_SCAN:<br> [Design]: SolidWorks, KiCAD<br> [Logic]: Python, Embedded C, MATLAB<br> [Hardware]: 8051, Arduino Uno/Nano, Sensors<br> [Control]: PID loops, Motion Control<br> [Neural]: Google ADK, Local LLMs, FastAPI",
      projects: "ACTIVE_BUILDS:<br> &gt; Masters and Academic Tracker (React)<br> &gt; Orion Local AI Assistant (FastAPI, Llama 3.2)<br> &gt; Student Life Concierge AI Agent (Google ADK)<br> &gt; Hand Gesture Volume Controller (OpenCV)<br> &gt; Mechanical Rotary Device (SolidWorks)",
      contact: "COMM_LINKS:<br> Email: <a href=\"mailto:sailakshmibt2006@gmail.com\">sailakshmibt2006@gmail.com</a><br> GitHub: <a href=\"https://github.com/Saibts\" target=\"_blank\" rel=\"noopener\">github.com/Saibts</a><br> LinkedIn: <a href=\"https://linkedin.com/in/sailakshmi-65a696327\" target=\"_blank\" rel=\"noopener\">linkedin.com/in/sailakshmi-65a696327</a>",
      diagnostic: "<span class=\"success\">[PASS]</span> EMBEDDED MEMORY TIMERS: ACTIVE<br><span class=\"success\">[PASS]</span> KINEMATICS RESOLVER: STABLE<br><span class=\"success\">[PASS]</span> LOCAL LLM: OLLAMA ONLINE<br><strong>[SYSTEM STATUS] SAIL_CORE ACTIVE &amp; NOMINAL.</strong>"
    };

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const val = input.value.trim();
      const cmd = val.toLowerCase();

      printLine(`root@sail-core:~$ ${escapeHtml(val)}`, 'cmd');

      if (cmd === 'clear') {
        output.innerHTML = '';
      } else if (cmd === 'theme green') {
        document.documentElement.style.setProperty('--signal', '#39ff14');
        document.documentElement.style.setProperty('--signal-dim', 'rgba(57, 255, 20, 0.12)');
        printLine('&gt;&gt; ACCENT COLOR CONFIGURED TO NEON_GREEN.', 'success');
      } else if (cmd === 'theme cyan') {
        document.documentElement.style.setProperty('--signal', '#6EE7D9');
        document.documentElement.style.setProperty('--signal-dim', 'rgba(110, 231, 217, 0.12)');
        printLine('&gt;&gt; ACCENT COLOR CONFIGURED TO NEON_CYAN.', 'success');
      } else if (commands[cmd]) {
        printLine(commands[cmd]);
      } else if (cmd) {
        printLine(`error: protocol '${escapeHtml(val)}' not recognized. Try 'help'.`, 'error');
      }

      input.value = '';
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ============================================================
     CARD TILT (subtle, GPU-friendly, disabled on touch/reduced-motion)
     ============================================================ */
  function initCardTilt() {
    if (reducedMotion || matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((y - rect.height / 2) / rect.height) * -2.5;
        const rotateY = ((x - rect.width / 2) / rect.width) * 2.5;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initScrollProgress();
    initTraceRail();
    initScrollReveal();
    initActiveNav();
    initSmoothScroll();
    initBackToTop();
    initProjectFilter();
    initResumeModalKeys();
    initTerminal();
    initCardTilt();
  });
})();
