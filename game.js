// The ballpark game. Optional and self-contained: it only reads keys while the field has
// focus, never stores anything, and never talks to a server. Without this script the field
// is just the menu it always was.
(() => {
  const field = document.getElementById('field');
  const bar = document.querySelector('.game-bar');
  const dialog = document.getElementById('game-card');
  if (!field || !bar || !dialog || typeof dialog.showModal !== 'function') return;

  const NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);
  const col = field.closest('.field-col');
  const toggle = $('game-toggle');
  const help = $('game-help');
  const touch = $('game-touch');
  const live = $('game-live');
  const ball = $('ball');
  const shadow = $('ball-shadow');
  const batter = $('batter');
  const runnersLayer = $('runners');
  const aimLeft = $('aim-left');
  const aimRight = $('aim-right');
  const sign = $('sb-sign');
  const sbDefault = $('sb-default');
  const sbGame = $('sb-game');

  // Kept out of the HTML source so scrapers don't pick it up.
  const EMAIL = ['jeffrey.w.woodbury', 'gmail.com'].join('@');
  const LINKEDIN = 'https://www.linkedin.com/in/jeffrey-woodbury/';
  const GITHUB = 'https://github.com/jwwoody';

  const HELP_IDLE = "Hit one to a fielder and they'll tell you about me.";
  const HELP_PLAYING = window.matchMedia('(hover: none)').matches
    ? 'Tap PITCH, then tap a SWING button as the ball reaches the plate. The arrow picks the side of the field.'
    : 'SPACE pitch · hold ← or → to aim · ENTER swing · ESC quit';

  // Where each fielder stands (centre of the sprite), and what they tell you.
  const POS = {
    c: { x: 160, y: 223 }, p: { x: 160, y: 165 },
    '1b': { x: 235, y: 158 }, '2b': { x: 197, y: 140 }, ss: { x: 123, y: 140 }, '3b': { x: 85, y: 158 },
    lf: { x: 65, y: 120 }, cf: { x: 160, y: 105 }, rf: { x: 255, y: 120 },
  };
  const CARDS = {
    c: {
      label: 'C · ABOUT ME', title: 'STRIKE THREE',
      body: '<p>The catcher hangs on to it. While you\'re here: I build streaming video apps and the services behind them, for Roku, Apple TV, iPhone, iPad, Android and the web.</p>',
      link: ['#about', 'READ ABOUT ME'],
    },
    p: {
      label: 'P · CONTACT', title: 'BACK TO THE MOUND',
      body: '<p>The pitcher snags the comebacker. If you have a role in mind, pitch it to me.</p>',
      link: [`mailto:${EMAIL}`, 'EMAIL ME'],
    },
    '1b': {
      label: '1B · EXPERIENCE', title: 'OUT AT FIRST',
      body: '<p>Senior Full Stack Software Engineer at BYU Broadcasting (BYUtv) since 2022.</p>'
        + '<ul class="bullets"><li>Cut the Roku app\'s crash rate from 2.5% to 0.0%.</li>'
        + '<li>Own live and on-demand playback on five platforms.</li>'
        + '<li>Cut data use on idle Apple TVs by 95%.</li></ul>',
      link: ['#experience', 'SEE EXPERIENCE'],
    },
    '2b': {
      label: '2B · PROJECTS', title: 'GROUNDER TO SECOND',
      body: '<ul class="bullets"><li>HoopScoreboard tracks live basketball stats, especially plus-minus.</li>'
        + '<li>DAT Angle Ranking is practice for the Dental Admission Test.</li>'
        + '<li>Would You Rather pairs prompts with generated images on AWS Lambda.</li></ul>',
      link: ['#projects', 'SEE PROJECTS'],
    },
    ss: {
      label: 'SS · EDUCATION', title: 'SHORTSTOP HAS IT',
      body: '<ul class="bullets"><li>BYU, B.S. Computer Science, minor in Mathematics, 2020</li>'
        + '<li>AWS Certified Solutions Architect – Associate</li>'
        + '<li>AWS Certified Cloud Practitioner</li></ul>',
      link: ['#education', 'SEE EDUCATION'],
    },
    '3b': {
      label: '3B · SKILLS', title: 'GROUNDER TO THIRD',
      body: '<p>The third baseman reads the scouting report:</p>'
        + '<ul class="bullets"><li>Kotlin, Java, Swift, TypeScript, Python and BrightScript</li>'
        + '<li>Live and on-demand video players, Roku SceneGraph and closed captions</li>'
        + '<li>AWS, AWS CDK, Node.js and DynamoDB</li>'
        + '<li>XCTest, Rooibos, JUnit and Jest</li></ul>',
      link: ['#skills', 'SEE ALL SKILLS'],
    },
    lf: {
      label: 'LF · LINKEDIN', title: 'CAUGHT IN LEFT',
      body: '<p>The left fielder makes the catch. My full work history is on LinkedIn.</p>',
      link: [LINKEDIN, 'OPEN LINKEDIN'],
    },
    rf: {
      label: 'RF · EMAIL', title: 'CAUGHT IN RIGHT',
      body: '<p>The right fielder hauls it in. The quickest way to reach me is email.</p>',
      link: [`mailto:${EMAIL}`, 'EMAIL ME'],
    },
  };

  // Home runs rotate through these, shuffled, so nobody sees a repeat until they've seen them all.
  const HIGHLIGHTS = [
    {
      label: 'HIGHLIGHTS · RELIABILITY',
      items: ['Cut the Roku app\'s crash rate from 2.5% to 0.0%.',
        'Cut data use on idle Apple TVs by 95%.',
        'Keep live playback working for BYUtv\'s 24/7 channel, which peaks above 170,000 concurrent viewers.'],
    },
    {
      label: 'HIGHLIGHTS · BUG HUNTS',
      items: ['Fixed the bug behind 249 of 297 fatal Roku playback errors in one crash report.',
        'Found a Roku memory leak and cut memory after eight page visits from 88 MB to 37 MB.',
        'Turned a 10+ second black screen when leaving live playback into an instant transition.'],
    },
    {
      label: 'HIGHLIGHTS · SCALE',
      items: ['Work on a platform with 96 million video starts and 25 million hours watched a year.',
        'More than 18 million hours streamed on Roku in the past year.',
        'Our iPhone, iPad and Apple TV apps were downloaded nearly 250,000 times last year.'],
    },
    {
      label: 'HIGHLIGHTS · FEATURES',
      items: ['Built the client side of a server-driven UI, so editorial changes ship without an app-store release.',
        'Built passkey sign-in, QR-code TV sign-in from a phone, and magic-link sign-in.',
        'Built Roku caption settings that follow the preferences a viewer already set on the device.'],
    },
    {
      label: 'HIGHLIGHTS · TEAM',
      items: ['Manage 1–3 junior engineers. I hire them, review their code and write their training plan.',
        'Led five backend services off the Serverless Framework onto AWS CDK.',
        'Found nearly 800 people with access to our video management system and cut it to 350.'],
    },
    {
      label: 'HIGHLIGHTS · EVERY PLATFORM',
      items: ['Converted the Fire TV and Android apps to a WebView wrapper, cutting duplicate client work by 40%.',
        'Built custom analytics events on six platforms alongside Adobe Analytics.',
        'Built Alexa skills for BYUradio and Classical 89.'],
    },
  ];
  const HR_TITLES = ['HOME RUN!', 'GONE!', 'OUT OF THE PARK!', "TOUCH 'EM ALL!"];

  // Deals items in a shuffled order and reshuffles once every item has come up.
  const deck = (items) => {
    let queue = [];
    return () => {
      if (!queue.length) {
        queue = items.map((_, i) => i);
        for (let i = queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [queue[i], queue[j]] = [queue[j], queue[i]];
        }
      }
      return items[queue.pop()];
    };
  };
  const nextHighlight = deck(HIGHLIGHTS);

  // The center fielder brings back something from GitHub, a different project each time.
  const CF_TITLES = ['CAUGHT IN CENTER', 'RAN IT DOWN', 'WARNING-TRACK CATCH', 'DIVING CATCH!'];
  const CF_SHOWCASE = [
    {
      name: 'TERRA INCOGNITA',
      media: { gif: 'img/terra-incognita-demo.gif', still: 'img/terra-incognita.jpg', w: 480, h: 270,
        alt: 'Terra Incognita trailer: a ship sails west across a parchment chart, land is sighted, and the voyage ends with a report to the Crown.' },
      text: 'A browser game where you sail Columbus\'s route into the unknown and try to get home before the crew rebels. One HTML file of vanilla JavaScript, with real coastlines and wind belts.',
      link: [`${GITHUB}/columbus-discovery-game`, 'SEE IT ON GITHUB'],
    },
    {
      name: 'DAT ANGLE RANKING',
      media: { gif: 'img/datangleranking-demo.gif', still: 'img/datangleranking.jpg', w: 480, h: 495,
        alt: 'DAT Angle Ranking: four generated angles ranked from smallest to largest with dropdowns, marked Correct.' },
      text: 'Practice for the angle-ranking section of the Dental Admission Test, built with Python and Flask. About 1,000 visits a month.',
      link: [`${GITHUB}/DAT-Angle-Ranking`, 'SEE IT ON GITHUB'],
    },
    {
      name: 'WOULD YOU RATHER',
      text: '"Would you rather" prompts paired with generated images, built to wire an image-generation API into a serverless AWS backend with Vue and TypeScript.',
      link: [`${GITHUB}/would-you-rather`, 'SEE IT ON GITHUB'],
    },
    {
      name: 'THIS SITE',
      text: 'This whole site, ballpark and game included, is on GitHub. Plain HTML and CSS, plus one small script for the game you\'re playing.',
      link: [`${GITHUB}/jwwoody.github.io`, 'SEE IT ON GITHUB'],
    },
  ];
  const nextShowcase = deck(CF_SHOWCASE);
  const centerFieldCard = () => {
    const s = nextShowcase();
    const media = s.media
      ? `<picture class="game-card-media"><source media="(prefers-reduced-motion: reduce)" srcset="${s.media.still}">`
        + `<img src="${s.media.gif}" width="${s.media.w}" height="${s.media.h}" alt="${s.media.alt}"></picture>`
      : '';
    return {
      label: `CF · GITHUB · ${s.name}`,
      title: CF_TITLES[Math.floor(Math.random() * CF_TITLES.length)],
      body: `${media}<p>${s.text}</p>`,
      link: s.link,
    };
  };

  const homeRunCard = (aim) => {
    const h = nextHighlight();
    // Right field at this park ends at a brick warehouse.
    const title = aim > 0 ? 'OFF THE WAREHOUSE!' : HR_TITLES[Math.floor(Math.random() * HR_TITLES.length)];
    return {
      label: h.label, title,
      body: `<ul class="bullets">${h.items.map((t) => `<li>${t}</li>`).join('')}</ul>`,
      link: ['#experience', 'SEE EXPERIENCE'],
    };
  };
  const NAMES = {
    c: 'the catcher', p: 'the pitcher', '1b': 'first base', '2b': 'second base', ss: 'shortstop',
    '3b': 'third base', lf: 'left field', cf: 'center field', rf: 'right field',
  };

  const HOME = [160, 212];
  const BASES = [[226, 170], [160, 128], [94, 170]];

  // ---------- state ----------
  let state = 'off'; // off | ready | pitching | inplay | popup
  let strikes = 0;
  let outs = 0;
  let inning = 1;
  let runs = [0];
  let onBase = [null, null, null]; // runner <use> elements on 1B, 2B, 3B
  let pitchInfo = null;
  let token = 0; // bumped on quit so in-flight animations stop
  const held = { left: false, right: false };

  const say = (text) => { live.textContent = text; };
  const setSign = (text) => { sign.textContent = text; };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (options) => {
    let r = Math.random();
    for (const [value, weight] of options) { if ((r -= weight) <= 0) return value; }
    return options[options.length - 1][0];
  };

  const tween = (ms, step) => new Promise((resolve) => {
    const mine = token;
    const start = performance.now();
    const frame = (now) => {
      if (mine !== token) return resolve(false);
      const p = Math.min(1, (now - start) / ms);
      step(p);
      if (p < 1) requestAnimationFrame(frame); else resolve(true);
    };
    requestAnimationFrame(frame);
  });
  const pause = (ms) => tween(ms, () => {});

  const placeBall = (x, y, size = 2) => {
    ball.setAttribute('x', (x - size / 2).toFixed(1));
    ball.setAttribute('y', (y - size / 2).toFixed(1));
    ball.setAttribute('width', size);
    ball.setAttribute('height', size);
  };
  const hideBall = () => { ball.style.opacity = '0'; shadow.setAttribute('visibility', 'hidden'); };

  // ---------- scoreboard ----------
  const addText = (x, y, text, fill, attrs = {}) => {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    if (fill) t.setAttribute('fill', fill);
    for (const [k, v] of Object.entries(attrs)) t.setAttribute(k, v);
    t.textContent = text;
    sbGame.appendChild(t);
  };
  // Line-score digits sit under the header's own glyphs ("1 2 3 4 5 6 7 8 9  R"), measured
  // once the font has loaded so they line up whatever font the browser ended up using.
  const header = $('sb-header');
  const columnX = (charIndex) => {
    try { return header.getStartPositionOfChar(charIndex).x; } catch { return 100 + 6 * charIndex; }
  };
  const renderBoard = () => {
    sbGame.replaceChildren();
    addText(columnX(0), 27, `OUTS ${outs}`);
    addText(columnX(10), 27, `STRK ${strikes}`);
    // Each inning is centred under its number; a 10+ inning drops to a smaller size to fit its column.
    for (let i = 0; i < Math.min(inning, 9); i++) {
      const r = runs[i] || 0;
      addText(columnX(2 * i) + 3, 36, String(r), '#ffd23f', r > 9 ? { 'text-anchor': 'middle', 'font-size': '4.5' } : { 'text-anchor': 'middle' });
    }
    // The total is right-aligned to the R column, so 10+ grows leftward into the empty gap
    // instead of past the frame. Past 99 it shrinks a size.
    const total = runs.reduce((a, b) => a + b, 0);
    addText(columnX(19) + 6, 36, String(total), '#ffd23f', total > 99 ? { 'text-anchor': 'end', 'font-size': '4.5' } : { 'text-anchor': 'end' });
  };

  // ---------- aim ----------
  const aimFromKeys = () => (held.left && !held.right ? -1 : held.right && !held.left ? 1 : 0);
  let touchAim = null;
  const currentAim = () => (touchAim !== null ? touchAim : aimFromKeys());
  const showAim = () => {
    const aim = currentAim();
    aimLeft.setAttribute('visibility', state !== 'off' && aim === -1 ? 'visible' : 'hidden');
    aimRight.setAttribute('visibility', state !== 'off' && aim === 1 ? 'visible' : 'hidden');
  };

  // ---------- pitching and swinging ----------
  // Each pitch reaches the plate at p = 1 (ease(1) = 1), so swing timing is always measured
  // against the same moment. What changes is the speed, how that speed changes on the way in,
  // and the sideways break.
  const PITCHES = [
    { name: 'FASTBALL', weight: 0.35, mph: [92, 97], ms: [560, 680],
      ease: (p) => p, bend: () => 0, size: () => 2 },
    // Starts quick and dies late, so an early swing is the trap.
    { name: 'CHANGEUP', weight: 0.2, mph: [82, 86], ms: [800, 920],
      ease: (p) => p + 0.18 * Math.sin(Math.PI * p), bend: (p, side) => side * 2 * p * p, size: () => 2 },
    // Floats up and loops in, then speeds up at the end.
    { name: 'CURVEBALL', weight: 0.2, mph: [76, 80], ms: [860, 980],
      ease: (p) => p - 0.12 * Math.sin(Math.PI * p), bend: (p, side) => side * 9 * Math.sin(Math.PI * p),
      size: (p) => 2 + Math.sin(Math.PI * p) },
    // Looks like a fastball, then breaks late.
    { name: 'SLIDER', weight: 0.25, mph: [85, 89], ms: [660, 780],
      ease: (p) => p, bend: (p, side) => side * 6 * p * p * p, size: () => 2 },
  ];
  const pickPitch = () => pick(PITCHES.map((p) => [p, p.weight]));

  const pitch = () => {
    if (state !== 'ready') return;
    state = 'pitching';
    const type = pickPitch();
    const dur = rand(...type.ms);
    const side = Math.random() < 0.5 ? -1 : 1;
    const mph = Math.round(rand(...type.mph));
    // Past the plate the ball keeps the speed it arrived with, until it reaches the catcher.
    const endSlope = (type.ease(1) - type.ease(0.99)) / 0.01;
    const t0 = performance.now();
    pitchInfo = { t0, arrive: t0 + dur, swung: false, done: false };
    setSign(`${type.name} ${mph}`);
    ball.style.opacity = '1';
    say(`Here comes a ${type.name.toLowerCase()}, ${mph} miles an hour.`);
    const mine = token;
    const frame = (now) => {
      if (mine !== token || pitchInfo.done) return;
      const p = (now - t0) / dur;
      const travel = p <= 1 ? type.ease(p) : 1 + (p - 1) * endSlope;
      const y = 170 + 34 * travel;
      if (y >= 220) { pitchInfo.done = true; hideBall(); strike(pitchInfo.swung ? 'swinging' : 'looking'); return; }
      const q = Math.min(p, 1);
      placeBall(160 + type.bend(q, side), y, type.size(q));
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  const swingPose = () => {
    batter.setAttribute('href', '#batter-swing');
    batter.setAttribute('width', '18');
    setTimeout(() => { batter.setAttribute('href', '#batter'); batter.setAttribute('width', '12'); }, 260);
  };

  const swing = () => {
    if (state !== 'pitching' || pitchInfo.swung) return;
    pitchInfo.swung = true;
    swingPose();
    const miss = Math.abs(performance.now() - pitchInfo.arrive);
    // Timing windows in ms either side of the ball reaching the plate. About 7% tighter than
    // the first version; the pitch mix adds the rest of the challenge.
    if (miss > 196) return; // whiff: the ball carries on to the catcher
    pitchInfo.done = true;
    state = 'inplay';
    const aim = currentAim();
    if (miss <= 37) hit(4, aim);
    else if (miss <= 79) hit(Math.random() < 0.35 ? 2 : 1, aim);
    else if (miss <= 131) flyOut(aim);
    else groundOut(aim);
  };

  const strike = (kind) => {
    strikes += 1;
    if (strikes >= 3) {
      strikes = 0;
      outs += 1;
      renderBoard();
      setSign('STRIKE THREE');
      say(`Strike three ${kind}. ${outs} out.`);
      state = 'inplay';
      pause(700).then((ok) => ok && openCard('c'));
      return;
    }
    renderBoard();
    setSign(`STRIKE ${strikes}`);
    say(`Strike ${strikes}, ${kind}. Press Space for the next pitch.`);
    state = 'ready';
  };

  // ---------- balls in play ----------
  // Flight from the plate to (x, y). `height` > 0 makes it a fly ball with a shadow.
  const flight = async (x, y, ms, height) => {
    const [x0, y0] = [160, 204];
    if (height) shadow.setAttribute('visibility', 'visible');
    const ok = await tween(ms, (p) => {
      const gx = x0 + (x - x0) * p;
      const gy = y0 + (y - y0) * p;
      const lift = height * 4 * p * (1 - p);
      placeBall(gx, gy - lift, height ? 2 + 2 * (lift / height) : 2);
      if (height) { shadow.setAttribute('cx', gx.toFixed(1)); shadow.setAttribute('cy', gy.toFixed(1)); }
    });
    shadow.setAttribute('visibility', 'hidden');
    return ok;
  };

  const catchBy = (pos) => {
    const spot = field.querySelector(`.spot-${pos}`);
    if (!spot) return;
    spot.classList.add('catching');
    setTimeout(() => spot.classList.remove('catching'), 1200);
  };

  const recordOut = async (pos, how) => {
    catchBy(pos);
    outs += 1;
    strikes = 0;
    renderBoard();
    setSign('OUT!');
    say(`Out. ${how} ${NAMES[pos]}. ${outs} out.`);
    if (await pause(700)) { hideBall(); openCard(pos); }
  };

  const groundOut = async (aim) => {
    const pos = aim < 0 ? pick([['3b', 0.6], ['ss', 0.4]])
      : aim > 0 ? pick([['1b', 0.5], ['2b', 0.5]])
        : pick([['p', 0.5], ['ss', 0.25], ['2b', 0.25]]);
    if (await flight(POS[pos].x, POS[pos].y + 4, 550, 0)) recordOut(pos, 'Grounder to');
  };

  const flyOut = async (aim) => {
    const pos = aim < 0 ? 'lf' : aim > 0 ? 'rf' : 'cf';
    if (await flight(POS[pos].x, POS[pos].y + 4, 1100, 34)) recordOut(pos, 'Fly ball caught in');
  };

  const HIT_TARGETS = {
    // Singles drop in front of the outfielders, doubles reach the base of the wall in the gaps,
    // and home runs land in the left-field stands, over the scoreboard, or on the warehouse.
    1: { '-1': [100, 136], 0: [176, 122], 1: [220, 136] },
    2: { '-1': [104, 100], 0: [132, 98], 1: [216, 100] },
    4: { '-1': [44, 70], 0: [186, 26], 1: [272, 46] },
  };

  const hit = async (bases, aim) => {
    const [x, y] = HIT_TARGETS[bases][String(aim)];
    const ok = await flight(x, y, bases === 4 ? 1400 : bases === 2 ? 1000 : 750, bases === 1 ? 10 : bases === 2 ? 26 : 60);
    if (!ok) return;
    if (bases === 4) hideBall();
    strikes = 0;
    setSign(bases === 4 ? 'HOME RUN!' : bases === 2 ? 'DOUBLE!' : 'BASE HIT!');
    say(bases === 4 ? 'Home run!' : bases === 2 ? 'Double!' : 'Base hit!');
    await advance(bases);
    hideBall();
    renderBoard();
    if (bases === 4) openCard(homeRunCard(aim));
    else if (state === 'inplay') state = 'ready';
  };

  // ---------- runners ----------
  const placeRunner = (el, [x, y]) => { el.setAttribute('x', x - 6); el.setAttribute('y', y - 17); };
  const newRunner = () => {
    const el = document.createElementNS(NS, 'use');
    el.setAttribute('href', '#batter');
    el.setAttribute('width', '12');
    el.setAttribute('height', '18');
    placeRunner(el, HOME);
    runnersLayer.appendChild(el);
    return el;
  };
  const stops = (from, to) => {
    const out = [];
    for (let b = from + 1; b <= to; b++) out.push(b >= 3 ? HOME : BASES[b]);
    return out;
  };
  const run = async (el, from, to) => {
    let here = from < 0 ? HOME : BASES[from];
    for (const next of stops(from, to)) {
      const [x0, y0] = here;
      const ok = await tween(420, (p) => placeRunner(el, [x0 + (next[0] - x0) * p, y0 + (next[1] - y0) * p]));
      if (!ok) return;
      here = next;
    }
  };

  const advance = async (bases) => {
    const moves = [];
    const next = [null, null, null];
    for (let b = 2; b >= 0; b--) {
      const el = onBase[b];
      if (!el) continue;
      const to = b + bases;
      moves.push(run(el, b, to).then(() => { if (to >= 3) { runs[inning - 1] += 1; el.remove(); } }));
      if (to < 3) next[to] = el;
    }
    const batterRunner = newRunner();
    const to = bases - 1;
    moves.push(run(batterRunner, -1, to).then(() => { if (to >= 3) { runs[inning - 1] += 1; batterRunner.remove(); } }));
    if (to < 3) next[to] = batterRunner;
    onBase = next;
    await Promise.all(moves);
  };

  const clearBases = () => { runnersLayer.replaceChildren(); onBase = [null, null, null]; };

  // ---------- cards ----------
  // Takes a fielder's position key, or a card built on the spot (home runs).
  const openCard = (keyOrCard) => {
    const card = keyOrCard === 'cf' ? centerFieldCard()
      : typeof keyOrCard === 'string' ? CARDS[keyOrCard] : keyOrCard;
    state = 'popup';
    $('game-card-label').textContent = card.label;
    $('game-card-title').textContent = card.title;
    $('game-card-body').innerHTML = card.body;
    const link = $('game-card-link');
    link.href = card.link[0];
    link.textContent = card.link[1];
    // Other sites open in a new tab; jumps to a section of this page don't.
    if (/^https?:/.test(card.link[0])) {
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', `${card.link[1]} (opens in a new tab)`);
    } else {
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.removeAttribute('aria-label');
    }
    if (!dialog.open) dialog.showModal();
  };

  dialog.addEventListener('close', () => {
    if (state === 'off') return;
    if (outs >= 3) {
      outs = 0;
      strikes = 0;
      clearBases();
      inning += 1;
      runs.push(0);
      setSign('SIDE RETIRED');
      say('Three outs. Side retired. New inning.');
    }
    renderBoard();
    state = 'ready';
    field.focus({ preventScroll: true });
  });
  $('game-card-close').addEventListener('click', () => dialog.close());
  $('game-card-link').addEventListener('click', () => {
    // Following a card's link ends the game and lets the browser go where the link points.
    quit(false);
    dialog.close();
  });

  // ---------- start and stop ----------
  const start = () => {
    token += 1;
    state = 'ready';
    strikes = 0; outs = 0; inning = 1; runs = [0];
    clearBases();
    ball.classList.remove('pitch');
    hideBall();
    sbDefault.style.display = 'none';
    renderBoard();
    setSign('PLAY BALL');
    field.classList.add('playing');
    field.setAttribute('role', 'application');
    toggle.textContent = 'QUIT GAME';
    help.textContent = HELP_PLAYING;
    touch.hidden = false;
    field.focus({ preventScroll: true });
    say('Game on. Press Space to pitch, hold left or right arrow to aim, Enter to swing, Escape to quit.');
  };

  const quit = (refocus = true) => {
    token += 1;
    state = 'off';
    held.left = held.right = false;
    clearBases();
    hideBall();
    showAim();
    sbGame.replaceChildren();
    sbDefault.style.display = '';
    setSign('PLAY BALL');
    field.classList.remove('playing');
    field.removeAttribute('role');
    toggle.textContent = 'PLAY BALL';
    help.textContent = HELP_IDLE;
    touch.hidden = true;
    say('Game over.');
    if (refocus) toggle.focus();
  };

  toggle.addEventListener('click', () => (state === 'off' ? start() : quit()));

  touch.addEventListener('click', (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (!act || state === 'off') return;
    if (act === 'pitch') { pitch(); return; }
    touchAim = act === 'left' ? -1 : act === 'right' ? 1 : 0;
    showAim();
    swing();
    touchAim = null;
    setTimeout(showAim, 300);
  });

  // Keys only count while focus is in the field or its control bar, so the rest of the page
  // keeps normal scrolling and Tab always moves on.
  col.addEventListener('keydown', (e) => {
    if (state === 'off' || state === 'popup') return;
    const onControl = e.target.closest('a, button');
    if (onControl && e.target !== field && (e.key === 'Enter' || e.key === ' ') && !onControl.closest('#game-touch')) return;
    switch (e.key) {
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        if (!e.repeat) pitch();
        break;
      case 'Enter':
        e.preventDefault();
        if (!e.repeat) swing();
        break;
      case 'ArrowLeft':
        e.preventDefault(); held.left = true; showAim();
        break;
      case 'ArrowRight':
        e.preventDefault(); held.right = true; showAim();
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault();
        break;
      case 'Escape':
        e.preventDefault(); quit();
        break;
      default:
    }
  });
  col.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') held.left = false;
    if (e.key === 'ArrowRight') held.right = false;
    showAim();
  });
  // Losing focus releases any held arrow so the aim doesn't stick.
  field.addEventListener('blur', () => { held.left = held.right = false; showAim(); });

  bar.hidden = false;
})();
