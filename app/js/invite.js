/* The original inward-opening doors and floating monogram lead into the invitation.
   Measured phone geometry keeps the handoff aligned; overlapping text groups keep the reading fluid. */
(() => {
  'use strict';
  const root = document.documentElement;
  if (!root.classList.contains('js')) return;          // the head failsafe already fell back to the static page
  window.INVITE_BOOTED = true;
  root.classList.add('booted');                       // the tap hint shows only once a tap will be answered
  // the stele's faces are asked for now, not when its words first show: on a weak line that is seconds later
  const fontReady = document.fonts && document.fonts.load
    ? Promise.allSettled(['40px "Great Vibes"', '16px "EB Garamond"', 'italic 16px "EB Garamond"', '17px "DM Serif Display"'].map(f => document.fonts.load(f)))
    : Promise.resolve();

  const CFG = window.INVITE_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const DEMO = params.get('demo') === '1';
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE = matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  if (MOBILE) root.classList.add('mobile-intro');
  const MUSLIM = !!CFG.muslim;

  const stage = $('stage'), hero = $('hero'), seal = $('seal'), sealShadow = $('sealShadow');
  const audio = $('nasheed'), muteBtn = $('mute');
  const courtImg = document.querySelector('.court-bg img');
  const joint = $('joint');

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  /* ------------------------------------------------------------------ personalisation (?to=) */
  (() => {
    let to = params.get('to') || '';
    const hash = /^#to-([\w.~-]+)$/.exec(location.hash);
    if (!to && hash) to = hash[1].replace(/[-_]+/g, ' ');
    to = to.replace(/\s+/g, ' ').trim();
    if (!to) return;
    if (to.length > 40) to = to.slice(0, 39).trimEnd() + '…';
    const el = $('for');
    el.textContent = 'For ' + to;
    el.hidden = false;
    stage.classList.add('has-for');
    stage.setAttribute('aria-label', 'Invitation for ' + to + '. Open the invitation');
    $('greetName').textContent = 'Dear ' + to + ',';
    $('greet').hidden = false;
  })();

  /* ------------------------------------------------------------------ rose petals and gold leaf: one canvas that exists
     only while something is falling. Sprites are drawn once (in idle time), each petal is one drawImage per frame. */
  const petals = (() => {
    const TONES = [['#F7D8D2', '#E2A3A0'], ['#EBA2A5', '#B64F5E'], ['#CF6573', '#8C2E41'], ['#FCEBE3', '#EDBFB6']];
    const GOLD = [['#FCEAB6', '#C4933F'], ['#F2D38A', '#A87526']];
    let cv = null, cx = null, dpr = 1, W = 0, H = 0, parts = [], raf = 0, last = 0, sprites = null;
    function sprite(a, b, gold) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      g.translate(32, 32);
      if (gold === 'mogra') {   // a jasmine flower: five pointed petals round a green-gold eye
        g.fillStyle = '#FFFDF6';
        for (let i = 0; i < 5; i++) {
          g.save(); g.rotate((i * Math.PI * 2) / 5);
          g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-9, -8, -6, -22, 0, -25); g.bezierCurveTo(6, -22, 9, -8, 0, 0); g.fill();
          g.strokeStyle = 'rgba(190,170,130,.5)'; g.lineWidth = 1; g.stroke(); g.restore();
        }
        g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fillStyle = '#C9B45A'; g.fill();
        return c;
      }
      const grad = g.createRadialGradient(-5, -9, 2, 0, 0, 30);
      grad.addColorStop(0, a); grad.addColorStop(1, b);
      g.fillStyle = grad;
      g.beginPath();
      if (gold) {        // a torn flake of leaf
        g.moveTo(-18, -9); g.lineTo(-5, -19); g.lineTo(13, -15); g.lineTo(19, 1); g.lineTo(9, 17); g.lineTo(-11, 15); g.lineTo(-20, 5);
      } else {           // a rose petal: broad and softly notched at the lip, narrowing to the base
        g.moveTo(0, 26); g.bezierCurveTo(-26, 12, -28, -18, -8, -24); g.quadraticCurveTo(0, -18, 8, -24); g.bezierCurveTo(28, -18, 26, 12, 0, 26);
      }
      g.closePath(); g.fill();
      if (!gold) { g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 22); g.quadraticCurveTo(-3, 2, 0, -15); g.stroke(); }
      return c;
    }
    function prep() {                          // sprites and the (empty) canvas are made before the tap, not during the doors
      if (REDUCED) return;
      if (!sprites) sprites = { petal: TONES.map(([a, b]) => sprite(a, b)), gold: GOLD.map(([a, b]) => sprite(a, b, true)), mogra: sprite('', '', 'mogra') };
      if (!cv) {
        cv = document.createElement('canvas');
        cv.className = 'petals';
        cv.setAttribute('aria-hidden', 'true');
        document.body.appendChild(cv);
        cx = cv.getContext('2d');
        size();
      }
    }
    function size() {
      if (!cv) return;
      dpr = Math.min(1.5, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    addEventListener('resize', size);
    function add(n, from) {
      if (REDUCED) return;
      if (parts.length > 220) n = Math.min(n, 4);          // however many taps, the sky never fills
      prep();
      for (let i = 0; i < n; i++) {
        const roll = Math.random(), gold = roll < 0.18, mogra = !gold && roll < 0.4, z = 0.55 + Math.random() * 0.75;   // z: nearer is larger, faster
        const p = {
          img: gold ? sprites.gold[i % 2] : mogra ? sprites.mogra : sprites.petal[Math.floor(Math.random() * 4)], gold, z,
          size: (gold ? 11 : 17) * z, x: 0, y: 0, vx: 0, vy: 0, fall: (85 + Math.random() * 75) * z,
          life: from && from.life ? from.life[0] + Math.random() * from.life[1] : from && from.pop ? 2.2 + Math.random() * 1.3 : 6 + Math.random() * 2.5,
          sway: 14 + Math.random() * 26, sf: 0.6 + Math.random() * 1.1, sp: Math.random() * 6.28,
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 2.4, flip: Math.random() * 6.28, vf: 1.5 + Math.random() * 3.2, t: 0, delay: 0,
        };
        if (from && from.x !== undefined) {      // thrown out of a point, then settling into the fall
          const a = Math.random() * Math.PI * 2, v = (from.pop ? 150 : 90) + Math.random() * 260;   // a tap's pop is brisker and brief
          p.x = from.x + (Math.random() - 0.5) * (from.w || 0); p.y = from.y + (Math.random() - 0.5) * (from.h || 0);
          p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v * 0.8 - 120; p.delay = Math.random() * (from.spread || 0);
        } else {         // drifting down from above
          p.x = Math.random() * W; p.y = -30 - Math.random() * 60; p.vy = p.fall; p.delay = Math.random() * (from && from.spread !== undefined ? from.spread : 2200);
        }
        parts.push(p);
      }
      parts.sort((a, b) => a.z - b.z);
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, cv.width, cv.height);
      let alive = 0;
      for (const p of parts) {
        if (p.delay > 0) { p.delay -= dt * 1000; alive++; continue; }
        if (p.y > H + 40 || p.t > p.life) continue;           // nothing lingers over the words
        alive++;
        p.t += dt;
        const drag = Math.min(1, dt * 1.8);
        p.vx -= p.vx * drag;
        p.vy += (p.fall - p.vy) * drag;
        p.x += (p.vx + Math.sin(p.t * p.sf * 2 + p.sp) * p.sway) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt; p.flip += p.vf * dt;
        const sx = Math.max(0.16, Math.abs(Math.cos(p.flip))), c = Math.cos(p.rot), s = Math.sin(p.rot), k = (p.size / 32) * dpr;
        cx.globalAlpha = (p.gold ? 0.5 + 0.5 * sx : 0.8 + 0.2 * sx) * Math.min(1, (p.life - p.t) / 1.2);   // gold leaf flashes as it turns
        cx.setTransform(c * k * sx, s * k * sx, -s * k, c * k, p.x * dpr, p.y * dpr);
        cx.drawImage(p.img, -32, -32);
      }
      if (!alive) { parts = []; raf = 0; cv.remove(); cv = cx = null; return; }
      raf = requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (parts.length && !raf && cx) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    return { prep, rain: (n, o) => add(n, o), burst: (x, y, n, o) => add(n, Object.assign({ x, y }, o)) };
  })();

  /* ------------------------------------------------------------------ music: a plain <audio> element
     (plays with the iPhone silent switch on; Web Audio would be muted by it). Started only inside the tap. */
  let muted = false, wasPlaying = false, rampRaf = 0;
  const canVolume = (() => { try { const a = document.createElement('audio'); a.volume = 0.5; return a.volume === 0.5; } catch (e) { return false; } })();
  const play = () => { try { const p = audio.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
  function ramp(to, ms, done) {
    cancelAnimationFrame(rampRaf);
    if (!canVolume) { if (done) done(); return; }
    const from = audio.volume, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) rampRaf = requestAnimationFrame(step); else if (done) done();
    };
    rampRaf = requestAnimationFrame(step);
  }
  function startAudio() {
    audio.loop = true;
    if (canVolume) audio.volume = 0;       // iOS ignores volume; the file carries its own 1.2 s fade-in
    play();
    ramp(0.85, 2600);
  }
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', muted ? 'Play music' : 'Mute music');
    if (muted) ramp(0, 350, () => { if (muted) audio.pause(); });
    else { play(); ramp(0.85, 900); }
  });

  /* ------------------------------------------------------------------ animation plumbing */
  let opened = false, settled = false, primed = false;
  let t0 = 0, idleTimer = 0, introPausedAt = null;
  const running = [];
  const plan = [];
  const E = {
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    door: 'cubic-bezier(0.58, 0.02, 0.24, 1)',
    push: 'cubic-bezier(0.55, 0, 0.8, 0.35)',
    flight: 'cubic-bezier(0.45, 0, 0.18, 1)',
  };
  function anim(el, frames, opts) {
    if (!el) return;
    plan.push({ el, frames, opts: Object.assign({ fill: 'both', easing: 'linear', delay: 0 }, opts) });
  }
  function create(p) {
    if (settled) return;
    const o = Object.assign({}, p.opts);
    // A late frame must seek to the right point, rather than restart an earlier animation.
    o.delay -= performance.now() - t0;
    if (!p.el.style.willChange) p.el.style.willChange = 'transform, opacity';
    const a = p.el.animate(p.frames, o);
    running.push({ el: p.el, a });
    if (document.hidden) a.pause();
  }
  // the first ~0.7 s is created inside the tap; the rest over the next frames, so the tap itself stays cheap
  function launch() {
    const now = plan.filter((p) => p.opts.delay < 700);
    const later = plan.filter((p) => p.opts.delay >= 700).sort((a, b) => a.opts.delay - b.opts.delay);
    plan.length = 0;
    now.forEach(create);
    const batch = () => {
      later.splice(0, 6).forEach(create);
      if (later.length && !settled) requestAnimationFrame(batch);
    };
    requestAnimationFrame(batch);
  }
  const unit = () => stage.querySelector('.box').getBoundingClientRect().width / 390;
  const fadeIn = (el, delay, dur = 800) => anim(el, [{ opacity: 0 }, { opacity: 1 }], { delay, duration: dur, easing: 'ease-out' });
  const sweep = (band, delay, dur, from = '-120%', to = '300%') => anim(band, [{ transform: `translateX(${from})` }, { transform: `translateX(${to})` }], { delay, duration: dur, easing: E.inOut, fill: 'none' });

  /* ------------------------------------------------------------------ before the tap */
  // Lay out the courtyard under the opaque doorway and promote what will move, in idle time,
  // so none of that work lands on the tap. Text gets a layer only while its own fade runs.
  const MOVERS = '#leafL, #leafR, #portal, #seal, #sealShadow, #wall, #glowCore, #bloom, #spill, #hint, #for, #hero, #lattice, .court-bg img';
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 250));
  function prime() {
    if (primed) return;
    primed = true;
    root.classList.add('primed');
    for (const id of ['meaning', 'heroLines']) flowWords($(id));
  }
  const onLoad = (f) => (document.readyState === 'complete' ? setTimeout(f, 0) : window.addEventListener('load', f));
  onLoad(() => {
    idle(() => {
      if (opened) return;
      prime();
      idle(() => {
        if (!opened && !REDUCED && !MOBILE) document.querySelectorAll(MOVERS).forEach((el) => { el.style.willChange = 'transform, opacity'; });
        idle(() => { if (!opened) petals.prep(); }, { timeout: 1500 });
      }, { timeout: 1200 });
    }, { timeout: 900 });
  });
  function idleSheen() {
    if (opened) return;
    seal.querySelector('.sheen i').animate([{ transform: 'translateX(-120%)' }, { transform: 'translateX(300%)' }], { duration: 1500, easing: E.inOut });
    idleTimer = setTimeout(idleSheen, 6500);
  }
  if (!REDUCED) idleTimer = setTimeout(idleSheen, 1400);

  /* ------------------------------------------------------------------ the opening */
  const LAND = 3150;
  function cinematic() {
    const u = unit();
    const source = seal.getBoundingClientRect(), target = $('with').getBoundingClientRect();
    const dx = target.left + target.width / 2 - source.left - source.width / 2;
    const dy = target.top + target.height / 2 - source.top - source.height / 2;
    const k = Math.max(0.25, Math.min(0.85, target.width / source.width));
    // 0. the hint yields; the inlaid seal catches the light and lifts off the doors (it is never split)
    anim($('hint'), [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: E.out });
    anim($('for'), [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: E.out });
    sweep(seal.querySelector('.sheen i'), 0, 760);
    anim(seal, [
      { transform: 'none', offset: 0 },
      { transform: 'none', offset: 150 / LAND, easing: E.out },
      { transform: `translateY(${-6 * u}px) scale(1.12)`, offset: 650 / LAND, easing: E.inOut },
      { transform: `translateY(${-9 * u}px) scale(1.15)`, offset: 1300 / LAND, easing: E.flight },
      { transform: `translate(${dx}px, ${dy}px) scale(${k})`, offset: 1 },
    ], { duration: LAND });
    // The seal remains intact until it reaches the joining word, then they crossfade in place.
    anim(seal, [{ opacity: 1 }, { opacity: 1, offset: 0.87 }, { opacity: 0 }], { duration: LAND + 170 });
    anim(sealShadow, [
      { opacity: 0, transform: 'none', offset: 0 },
      { opacity: 0, transform: 'none', offset: 150 / 2800 },
      { opacity: 0.9, transform: `translate(${(3 * u).toFixed(1)}px, ${(10 * u).toFixed(1)}px) scale(1.07)`, offset: 900 / 2800, easing: 'ease-in-out' },
      { opacity: 0.7, transform: `translate(${(4 * u).toFixed(1)}px, ${(14 * u).toFixed(1)}px) scale(1.12)`, offset: 2000 / 2800 },
      { opacity: 0, transform: `translate(${(5 * u).toFixed(1)}px, ${(18 * u).toFixed(1)}px) scale(1.16)`, offset: 1 },
    ], { duration: 2100 });

    // 1. the jali doors swing inward; the sun blooms in the far arch; the mirror inlays catch it once
    anim($('leafL'), [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(84deg)' }], { delay: 250, duration: 1500, easing: E.door });
    anim($('leafR'), [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-84deg)' }], { delay: 250, duration: 1500, easing: E.door });
    anim($('glowCore'), [{ opacity: 0.82 }, { opacity: 0 }], { delay: 250, duration: 1150, easing: E.inOut });
    anim($('bloom'), [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)' }], { delay: 500, duration: 1450, easing: E.out });
    anim($('spill'), [{ opacity: 0 }, { opacity: 1 }], { delay: 650, duration: 1200, easing: E.out });
    const gl = Array.from(document.querySelectorAll('#glints i')).map((g) => {
      const x = parseFloat(g.style.getPropertyValue('--x')), y = parseFloat(g.style.getPropertyValue('--y'));
      return { g, d: Math.hypot(x - 195, (y - 330) * 1.4) };
    });
    const dmin = Math.min(...gl.map((o) => o.d)), dmax = Math.max(...gl.map((o) => o.d));
    gl.forEach(({ g, d }, i) => {
      const delay = 850 + ((d - dmin) / (dmax - dmin || 1)) * 540 + ((i * 97) % 7) * 14;
      anim(g, [
        { opacity: 0, transform: 'scale(.3) rotate(0deg)' },
        { opacity: 1, transform: 'scale(1.15) rotate(18deg)', offset: 0.32 },
        { opacity: 0, transform: 'scale(.55) rotate(30deg)' },
      ], { delay, duration: 820, easing: 'ease-out', fill: 'none' });
    });

    // 2. we step through the doorway; the courtyard comes forward and settles, softly out of focus
    anim($('portal'), [
      { transform: 'scale(1)', opacity: 1, offset: 0 },
      { transform: 'scale(1.75)', opacity: 1, offset: 0.55 },
      { transform: 'scale(2.5)', opacity: 0, offset: 1 },
    ], { delay: 1400, duration: 1000, easing: E.push });
    anim($('wall'), [{ opacity: 1 }, { opacity: 0 }], { delay: 1750, duration: 650, easing: E.out });
    anim(courtImg, [{ opacity: 0 }, { opacity: 1 }], { delay: 1650, duration: 750, easing: E.out });
    anim(courtImg, [{ transform: 'scale(.9)' }, { transform: 'none' }], { delay: 1650, duration: 1100, easing: E.out });
    anim(hero, [{ opacity: 0 }, { opacity: 1 }], { delay: 1750, duration: 650, easing: E.out });
    anim(hero, [{ transform: 'scale(.88)' }, { transform: 'none' }], { delay: 1750, duration: 1000, easing: E.out });
    anim($('lattice'), [
      { transform: 'translate(30%, -26%)', opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.35 },
      { transform: 'translate(0, 0)', opacity: 0.62, offset: 1 },
    ], { delay: 1850, duration: 1600, easing: E.out });

  }

  function gentle() {
    anim(seal, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-out' });
    anim(stage, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-out' });
    fadeIn(hero, 150, 200);
    fadeIn(courtImg, 150, 200);
  }

  function fitNames() {
    for (const id of ['bride', 'groom']) {
      const el = $(id), text = el.querySelector('.con');
      el.style.fontSize = '';
      const range = document.createRange();
      range.selectNodeContents(text);
      const width = range.getBoundingClientRect().width;
      const available = el.getBoundingClientRect().width * 0.94;
      if (width > available) el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * available / width}px`;
    }
  }
  let nameResize = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(nameResize);
    nameResize = requestAnimationFrame(fitNames);
  });

  function flowWords(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const part of node.textContent.match(/\s+|\S+/g)) {
        if (/^\s+$/.test(part)) fragment.append(document.createTextNode(part));
        else { const word = document.createElement('span'); word.className = 'flow-word'; word.textContent = part; fragment.append(word); }
      }
      node.replaceWith(fragment);
    }
  }

  function revealOpening() {
    const group = (id, delay, duration = 500, words = false) => {
      const el = $(id);
      if (!el || (el.matches('.parent') && !el.textContent.trim())) return;
      const y = REDUCED || id === 'joint' ? 0 : 5;
      anim(el, [{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: 'none' }], { delay, duration, easing: E.out });
      if (words) [...el.querySelectorAll('.flow-word')].forEach((word, i) => {
        anim(word, [{ opacity: 0, transform: `translateY(${REDUCED ? 0 : 3}px)` }, { opacity: 1, transform: 'none' }],
          { delay: delay + i * (REDUCED ? 0 : 14), duration: REDUCED ? 180 : 360, easing: E.out });
      });
    };
    const at = time => REDUCED ? 350 + (time - 1950) * 0.18 : time;
    const dur = time => REDUCED ? 180 : time;
    group('bism', at(1950), dur(550));
    group('meaning', at(2070), dur(450), true);
    group('heroLines', at(2350), dur(450), true);
    group('bride', at(2560), dur(500));
    group('brideP', at(2700), dur(420));
    group('joint', at(3020), dur(400));
    group('groom', at(3220), dur(500));
    group('groomP', at(3370), dur(450));
    // All event details arrive as one readable block, rather than a series of extra waits.
    for (const id of ['dateText', 'hijri', 'times', 'venueLine', 'dateHint']) group(id, at(3540), dur(500));
    group('cueText', at(3800), dur(300));
    const done = document.body.animate([{ opacity: 1 }, { opacity: 1 }], { delay: REDUCED ? 900 : 4200, duration: 1 });
    running.push({ el: document.body, a: done });
    if (document.hidden) done.pause();
    done.finished.then(settle).catch(() => {});
  }

  async function open(e) {
    if (opened) return;
    opened = true;
    clearTimeout(idleTimer);
    startAudio();                              // synchronously inside the gesture
    prime();
    stageHadFocus = document.activeElement === stage;
    // Warm assets before measuring the handoff, so a late font cannot move its destination.
    await Promise.all([
      Promise.race([fontReady, new Promise(resolve => setTimeout(resolve, 1200))]),
      ...[$('bism').querySelector('img'), $('stele')].map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve()),
    ]);
    if (document.fonts && !document.fonts.check('40px "Great Vibes"')) $('names').style.setProperty('--script', 'var(--display)');
    fitNames();
    root.classList.add('opened');
    stage.setAttribute('aria-hidden', 'true');
    t0 = performance.now();
    if (document.hidden) introPausedAt = t0;
    try { if (navigator.vibrate) navigator.vibrate([12, 60, 18]); } catch (err) {}
    REDUCED ? gentle() : cinematic();
    revealOpening();
    launch();
    if (!REDUCED) {
      const s = seal.getBoundingClientRect(), b = stage.querySelector('.box').getBoundingClientRect();
      const k = Math.min(1.6, innerWidth / 390);
      setTimeout(() => {
        // they come through with the light and are gone by the time the names are written (4.6 s), so nothing
        // else draws while the names appear: the petal canvas repaints the whole screen every frame it is busy
        const density = MOBILE ? 0.45 : 1;
        petals.burst(s.left + s.width / 2, s.top + s.height / 2, Math.round(30 * k * density), { w: b.width * 0.4, h: b.height * 0.5, spread: 500, life: [1.8, 0.7] });
        petals.rain(Math.round(44 * k * density), { spread: 650, life: [1.8, 0.7] });
      }, 700);
    }
  }
  let stageHadFocus = false;

  function settle() {
    if (settled) return;
    settled = true;
    plan.length = 0;
    // the doorway's own animations end with it; the stele's finished ones hold their last frame (fill: both), so
    // they are ended, and their layers released, a few at a time in idle moments: no long freeze as the date shows
    const done = running.filter((r) => !stage.contains(r.el));
    for (const r of running) if (stage.contains(r.el)) { try { r.a.cancel(); } catch (e) {} }
    running.length = 0;
    stage.remove();                            // the doorway and its decoded layers are gone for good
    const loose = [...document.querySelectorAll('[style*="will-change"]')];
    const tidy = (deadline) => {
      // a few every pass however busy the page is (the hall's gentle animations leave little idle time), more when idle
      for (let n = 0; (done.length || loose.length) && (n < 6 || (deadline && deadline.timeRemaining() > 4)); n++) {
        if (done.length) { const r = done.pop(); try { r.a.cancel(); } catch (e) {} }
        else loose.pop().style.willChange = '';
      }
      if (done.length || loose.length) idle(tidy, { timeout: 200 });
    };
    idle(tidy, { timeout: 600 });
    root.classList.add('settled');
    $('cue').classList.add('run');
    if (stageHadFocus) { const h = $('names'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    initMute();
    if (DEMO) setTimeout(demoScroll, 800);
  }

  // once the invitation is open, a tap anywhere lets a little shower of petals loose where the finger lands
  // ("with" gives a fuller one); typing, the calendar sheet and the music button stay calm
  let lastPop = 0;
  document.addEventListener('click', (e) => {
    if (!settled || REDUCED) return;
    const t = e.target;
    if (!(t instanceof Element) || t.closest('input[type="text"], input[type="tel"], textarea, select, .sheet, .mute')) return;
    const now = performance.now();
    if (now - lastPop < 150) return;
    lastPop = now;
    let x = e.clientX, y = e.clientY;
    if (!e.detail) { const r = t.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }   // keyboard: from the control
    const onWith = joint.contains(t);
    petals.burst(x, y, onWith ? 24 : 14, { w: 18, h: 18, pop: true });
    try { if (navigator.vibrate) navigator.vibrate(onWith ? 8 : 5); } catch (err) {}
  });

  stage.addEventListener('click', open);
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  if (window.INVITE_TAPPED) setTimeout(open, 0);   // tapped while the script was still on its way (weak wifi); after init

  /* ------------------------------------------------------------------ the music control keeps to a free corner:
     it shows only while nothing is underneath it (and hides while you scroll down to read) */
  function initMute() {
    muteBtn.hidden = false;
    const busy = new Set();
    let slotFree = true, down = false, lastY = scrollY, idleT = 0, io = null;
    const update = () => muteBtn.classList.toggle('show', slotFree && !down);
    const targets = document.querySelectorAll('.hbox .bism, .hbox .meaning, .hbox .opening, .hbox .names, .hbox .date, .hbox .hijri, ' +
      '.rest > section > *:not(.cards), .cards > .scroll, .closing > *, .credits');
    function observe() {
      if (io) io.disconnect();
      busy.clear();
      const r = muteBtn.getBoundingClientRect(), pad = 8;
      const top = Math.max(0, r.top - pad), bottom = Math.max(0, innerHeight - r.bottom - pad);
      const left = Math.max(0, r.left - pad), right = Math.max(0, innerWidth - r.right - pad);
      io = new IntersectionObserver((entries) => {
        for (const en of entries) en.isIntersecting ? busy.add(en.target) : busy.delete(en.target);
        slotFree = busy.size === 0;
        update();
      }, { rootMargin: `${-top}px ${-right}px ${-bottom}px ${-left}px`, threshold: 0 });
      targets.forEach((t) => io.observe(t));
    }
    observe();
    let rq = 0;
    addEventListener('resize', () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(observe); });
    addEventListener('scroll', () => {
      const y = scrollY;
      if (y > lastY + 2 && y > 24) down = true; else if (y < lastY - 2) down = false;
      lastY = y;
      if (y > 40) root.classList.add('scrolled');
      update();
      clearTimeout(idleT);
      idleT = setTimeout(() => { down = false; update(); }, 900);
    }, { passive: true });
    requestAnimationFrame(update);
  }

  /* ------------------------------------------------------------------ the hall: its jhoomar lights as you walk in, the browser
     chrome turns maroon inside, and the hall moves only while it is on screen */
  const hall = $('hall'), hallTop = $('hallTop'), themeMeta = document.querySelector('meta[name="theme-color"]');
  let inHall = false, hq = 0;
  function hallCheck() {
    hq = 0;
    const n = hallTop.getBoundingClientRect().top < -40;
    if (n === inHall) return;
    inHall = n;
    if (themeMeta) themeMeta.setAttribute('content', n ? '#4A0F1D' : '#D5CCC1');
  }
  addEventListener('scroll', () => { if (!hq) hq = requestAnimationFrame(hallCheck); }, { passive: true });

  // depth: the mirror wall (and the jhoomar's shadow on it) moves slower than the page; the jhoomar, hung behind the
  // arch, follows its place on a spring, so a quick scroll leaves it swinging a moment behind and it settles with weight
  const hwall = $('hwall'), jhoomar = $('jhoomar');
  let hallOn = false, dq = 0, jy = 0, jv = 0;
  function depth() {
    dq = 0;
    const p = Math.max(-900, Math.min(600, hallTop.getBoundingClientRect().top - innerHeight / 2));
    hwall.style.transform = `translate3d(0,${(-p * 0.22).toFixed(1)}px,0)`;
    const target = Math.max(0, -p * 0.1);      // it only ever sinks back, never rises out of the arch
    jv = (jv + (target - jy) * 0.07) * 0.84;
    jy += jv;
    jhoomar.style.transform = `translate3d(0,${jy.toFixed(2)}px,0)`;
    if (hallOn && (Math.abs(target - jy) > 0.05 || Math.abs(jv) > 0.02)) dq = requestAnimationFrame(depth);
  }
  if (!REDUCED) addEventListener('scroll', () => { if (hallOn && !dq) dq = requestAnimationFrame(depth); }, { passive: true });

  const IO = 'IntersectionObserver' in window;
  if (IO) {
    new IntersectionObserver((en) => {
      hallOn = en[0].isIntersecting;
      hall.classList.toggle('awake', hallOn);
      if (hallOn && !REDUCED && !dq) { jy = Math.max(0, -Math.max(-900, Math.min(600, hallTop.getBoundingClientRect().top - innerHeight / 2)) * 0.1); dq = requestAnimationFrame(depth); }
    }, { rootMargin: '200px 0px' }).observe(hall);
    new IntersectionObserver((en, o) => {
      if (!en[0].isIntersecting) return;
      hall.classList.add('lit');
      try { if (navigator.vibrate) navigator.vibrate(6); } catch (err) {}
      o.disconnect();
    }, { threshold: 0.4 }).observe(hallTop);
    new IntersectionObserver((en) => { root.classList.toggle('hero-off', !en[0].isIntersecting); }).observe($('hero'));
  } else hall.classList.add('awake', 'lit');

  /* ------------------------------------------------------------------ the letter arrives as you read: each block rises into place
     once, mehndi dividers draw themselves, cards catch a band of light, and the close ends in a shower of petals */
  if (IO && !REDUCED) {
    const groups = ['.sprig', '.verse blockquote > *', '.invitation > p', '.events-day', '.cards > .scroll', '.venue-label, .venue-name, .venue-addr, .actions',
      '.cd-row, .cd-until', '.dua > *', '.closing > *:not(.mono-end)'];
    const seen = new Set();
    groups.forEach((sel) => document.querySelectorAll(sel).forEach((el, i) => { if (!seen.has(el)) { seen.add(el); el.classList.add('rv'); el.style.setProperty('--rv', String(i)); } }));
    root.classList.add('rv-on');
    const io = new IntersectionObserver((en) => {
      for (const e of en) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
        if (e.target.id === 'monoEnd') setTimeout(() => petals.rain(Math.round(46 * Math.min(1.6, innerWidth / 390))), 500);
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    seen.forEach((el) => io.observe(el));
    document.querySelectorAll('.mehndi, #monoEnd, .closing-sig').forEach((el) => io.observe(el));
    // the last lines can never rise past the trigger band; at the foot of the page, show whatever is still waiting
    let flushed = false;
    addEventListener('scroll', () => {
      if (flushed || innerHeight + scrollY < document.documentElement.scrollHeight - 40) return;
      flushed = true;
      document.querySelectorAll('.rv:not(.in), .mehndi:not(.in), .closing-sig:not(.in)').forEach((el) => { el.classList.add('in'); io.unobserve(el); });
    }, { passive: true });
  } else document.querySelectorAll('.mehndi, #monoEnd').forEach((el) => el.classList.add('in'));

  /* ------------------------------------------------------------------ recording mode: one smooth glide */
  function demoScroll() {
    const dur = +(params.get('scroll') || 19000), start = performance.now();
    const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2;
    const step = (now) => {
      const k = Math.min(1, (now - start) / dur);
      const max = document.documentElement.scrollHeight - innerHeight;   // sections render lazily; re-measure
      scrollTo(0, Math.round(max * ease(k)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------ pause everything while the tab is hidden */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      root.classList.add('paused');
      if (opened && !settled) introPausedAt = performance.now();
      running.forEach((r) => { try { if (r.a.playState === 'running') r.a.pause(); } catch (e) {} });
      wasPlaying = !audio.paused;
      if (wasPlaying) audio.pause();
    } else {
      root.classList.remove('paused');
      if (introPausedAt !== null) { t0 += performance.now() - introPausedAt; introPausedAt = null; }
      running.forEach((r) => { try { if (r.a.playState === 'paused') r.a.play(); } catch (e) {} });
      if (wasPlaying && !muted) play();
      tick();
    }
  });

  /* ------------------------------------------------------------------ countdown (days / hours / minutes / seconds) */
  const target = Date.parse(CFG.countdownTarget || '');
  let tickT = 0;
  const cd = { D: $('cdD'), H: $('cdH'), M: $('cdM'), S: $('cdS'), DL: $('cdDL'), HL: $('cdHL'), ML: $('cdML'), SL: $('cdSL') };
  const set = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  // a changed number rolls into its niche (the text changes once a second; one short transform per changed unit)
  const roll = (el, s) => {
    if (!el || el.textContent === s) return;
    const first = el.textContent === '–';
    el.textContent = s;
    if (!first && !REDUCED && el.animate) el.animate([{ transform: 'translateY(-38%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)' });
  };
  function tick() {
    clearTimeout(tickT);
    if (!target || !cd.D) return;
    const ms = target - Date.now();
    const box = $('countdown');
    if (ms <= 0) {
      if (!box.classList.contains('done')) {
        box.classList.add('done');
        const [a, b] = CFG.countdownDone || ['', ''];
        const p1 = document.createElement('p'); p1.className = 'cd-done'; p1.textContent = a; box.appendChild(p1);
        if (b) { const p2 = document.createElement('p'); p2.className = 'cd-done-sub'; p2.textContent = b; box.appendChild(p2); }
      }
      return;
    }
    const secs = Math.floor(ms / 1000), mins = Math.floor(secs / 60);
    const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60, sec = secs % 60;
    roll(cd.D, String(d)); roll(cd.H, String(h).padStart(2, '0')); roll(cd.M, String(m).padStart(2, '0')); roll(cd.S, String(sec).padStart(2, '0'));
    set(cd.DL, d === 1 ? 'day' : 'days'); set(cd.HL, h === 1 ? 'hour' : 'hours'); set(cd.ML, m === 1 ? 'minute' : 'minutes'); set(cd.SL, sec === 1 ? 'second' : 'seconds');
    set($('cdText'), `${d} ${d === 1 ? 'day' : 'days'}, ${h} ${h === 1 ? 'hour' : 'hours'} and ${m} ${m === 1 ? 'minute' : 'minutes'} ${$('cd-until').textContent}`);
    tickT = setTimeout(tick, (ms % 1000) + 30);
  }
  tick();

  /* ------------------------------------------------------------------ directions and calendar */
  const UA = navigator.userAgent;
  const IOS = /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const ANDROID = /Android/i.test(UA);
  if (IOS) $('altMaps').hidden = false;
  function downloadIcs() {
    if (IOS && CFG.icsStatic !== false) { location.href = CFG.icsName; return; }   // served as text/calendar: Safari offers "Add to Calendar"
    const url = URL.createObjectURL(new Blob([CFG.ics], { type: 'text/calendar;charset=utf-8' }));
    if (IOS) { location.href = url; setTimeout(() => URL.revokeObjectURL(url), 60000); return; }   // Safari shows the event sheet
    const a = document.createElement('a');
    a.href = url; a.download = CFG.icsName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  // "Save the date": a sheet from the bottom, opened by tapping the date on the first screen or "Add to calendar".
  // The phone's own calendar comes first (iPhone opens its event sheet; Android opens the calendar file), then Google.
  const sheet = $('calSheet'), sheetIcs = $('sheetIcs');
  let sheetFrom = null, sheetT = 0;
  function openSheet(from) {
    sheetFrom = from || null;
    if (sheet.parentNode !== document.body) document.body.appendChild(sheet);   // above everything, the music control too
    clearTimeout(sheetT);
    sheet.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
    sheetIcs.focus({ preventScroll: true });
  }
  function closeSheet() {
    sheet.classList.remove('open');
    sheetT = setTimeout(() => { sheet.hidden = true; }, 450);
    if (sheetFrom) sheetFrom.focus({ preventScroll: true });
  }
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
  sheetIcs.addEventListener('click', downloadIcs);
  const calBtn = $('calendar'), dateEl = $('date');
  calBtn.addEventListener('click', () => openSheet(calBtn));
  dateEl.addEventListener('click', () => { if (settled) openSheet(dateEl); });
  dateEl.addEventListener('keydown', (e) => { if (settled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openSheet(dateEl); } });
})();
