/* Jack's Potion Lab — Canvas Engine v2.0
   Renders: background, Jack, Zero, cauldron, particles, atmospheric effects
   Room-aware: 5 room backgrounds with distinct atmosphere
*/

const PotionEngine = (() => {

  /* ---- State ---- */
  let canvas, ctx;
  let W, H;
  let raf = null;
  let mode = 'menu';
  let currentRoom = 0;

  // Background images: index 0 = splash/menu, 1-5 = rooms 1-5
  const bgImages = new Array(6).fill(null);

  const particles = [];
  const stars = [];
  const wisps = [];

  // Room atmosphere palettes
  const ROOMS = [
    { bg0: '#1e0a42', bg1: '#0d0d2b', hillColor: '#06061a', fogColor: '#1a0a3e', accent: '#39ff14', name: 'Lab' },
    { bg0: '#0a1a0a', bg1: '#050e05', hillColor: '#030a03', fogColor: '#0a1a0a', accent: '#90e890', name: 'Graveyard' },
    { bg0: '#1a0830', bg1: '#10061e', hillColor: '#080414', fogColor: '#1a0830', accent: '#ff9a40', name: 'Town' },
    { bg0: '#1c1400', bg1: '#0e0a00', hillColor: '#080600', fogColor: '#1c1400', accent: '#ffd700', name: "Oogie's" },
    { bg0: '#0a0a2e', bg1: '#050518', hillColor: '#030310', fogColor: '#0a0a3e', accent: '#e8d5ff', name: 'Tower' },
    { bg0: '#0a1030', bg1: '#060820', hillColor: '#040612', fogColor: '#0a1030', accent: '#c084fc', name: "Sally's Garden" },
    { bg0: '#1a0800', bg1: '#100500', hillColor: '#080300', fogColor: '#1a0800', accent: '#ff6b2b', name: 'Pumpkin Patch' },
    { bg0: '#0e0a1e', bg1: '#080614', hillColor: '#04030a', fogColor: '#0e0a1e', accent: '#39ff14', name: 'Witches Kitchen' },
    { bg0: '#0a0a1e', bg1: '#060614', hillColor: '#04040e', fogColor: '#0a0a2e', accent: '#d4a856', name: 'Clocktower' },
    { bg0: '#0a1420', bg1: '#060e16', hillColor: '#040a10', fogColor: '#0a1a2e', accent: '#64d2ff', name: 'Haunted Library' },
    { bg0: '#0e0820', bg1: '#080418', hillColor: '#060310', fogColor: '#0e0830', accent: '#c084fc', name: 'Crystal Cavern' },
    { bg0: '#081408', bg1: '#040e04', hillColor: '#020a02', fogColor: '#081a08', accent: '#90e890', name: 'Enchanted Forest' },
    { bg0: '#0a1020', bg1: '#060a18', hillColor: '#040610', fogColor: '#0a1028', accent: '#64ffb4', name: 'Ghost Ship' },
    { bg0: '#0a0a28', bg1: '#06061c', hillColor: '#040410', fogColor: '#0a0a38', accent: '#ffd700', name: 'Observatory' }
  ];

  // Characters
  const jack = {
    x: 0, y: 0, w: 80, h: 160,
    armAngle: 0,
    eyeScale: 1,
    bobY: 0,
    state: 'idle',
    stateTimer: 0
  };

  const zero = {
    x: 0, y: 0, r: 26,
    noseGlow: 1,
    bobAngle: 0,
    bobX: 0,
    state: 'idle',
    stateTimer: 0,
    tailAngle: 0,
    earWag: 0
  };

  const cauldron = {
    x: 0, y: 0, w: 150, h: 115,
    bubblePhase: 0,
    color: '#1a8a2e',
    glowIntensity: 0.3,
    erupting: false,
    eruptTimer: 0,
    ingredientCount: 0,
    maxIngredients: 3,
    steamPhase: 0
  };

  let flyIngredient = null;

  /* ---- Init ---- */
  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    generateStars();
    generateWisps();
    positionCharacters();
    preloadBgImages();
    loop();
  }

  function preloadBgImages() {
    const paths = [
      'assets/bg-splash.png',
      'assets/bg-room1.png',
      'assets/bg-room2.png',
      'assets/bg-room3.png',
      'assets/bg-room4.png',
      'assets/bg-room5.png',
      'assets/bg-room6.png',
      'assets/bg-room7.png',
      'assets/bg-room8.png',
      'assets/bg-room9.png',
      'assets/bg-room10.png',
      'assets/bg-room11.png',
      'assets/bg-room12.png',
      'assets/bg-room13.png',
      'assets/bg-room14.png'
    ];
    paths.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      bgImages[i] = img;
    });
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
    positionCharacters();
  }

  function positionCharacters() {
    if (!W) return;
    jack.x = W * 0.14;
    jack.y = H * 0.47;
    zero.x = W * 0.31;
    zero.y = H * 0.41;
    cauldron.x = W * 0.5 - cauldron.w / 2;
    cauldron.y = H * 0.60;
  }

  function generateStars() {
    stars.length = 0;
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.72,
        r: Math.random() * 1.8 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.025 + 0.008,
        color: Math.random() > 0.85 ? '#ffd700' : Math.random() > 0.7 ? '#e8d5ff' : '#ffffff'
      });
    }
  }

  function generateWisps() {
    wisps.length = 0;
    for (let i = 0; i < 4; i++) {
      wisps.push({
        x: 0.15 + Math.random() * 0.6,
        y: 0.45 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.01,
        r: 5 + Math.random() * 5
      });
    }
  }

  /* ---- Main loop ---- */
  function loop() {
    update();
    render();
    raf = requestAnimationFrame(loop);
  }

  /* ---- Update ---- */
  function update() {
    const t = Date.now() / 1000;

    stars.forEach(s => s.twinkle += s.speed);
    wisps.forEach(w => { w.phase += w.speed; });

    // Jack animation
    jack.bobY = Math.sin(t * 1.1) * 5;
    jack.armAngle = Math.sin(t * 0.75) * 0.12;
    jack.eyeScale = 1 + Math.sin(t * 1.8) * 0.04;

    if (jack.stateTimer > 0) {
      jack.stateTimer--;
      if (jack.stateTimer <= 0) jack.state = 'idle';
    }

    // Zero animation
    zero.bobAngle += 0.028;
    zero.bobX = Math.sin(zero.bobAngle * 0.65) * 18;
    zero.tailAngle = Math.sin(zero.bobAngle * 1.2) * 0.45;
    zero.noseGlow = 0.7 + Math.sin(t * 2.2) * 0.3;
    zero.earWag = Math.sin(zero.bobAngle * 0.9) * 0.15;

    if (zero.stateTimer > 0) {
      zero.stateTimer--;
      if (zero.stateTimer <= 0) zero.state = 'idle';
    }

    // Cauldron
    cauldron.bubblePhase += 0.04;
    cauldron.steamPhase += 0.03;
    const progress = cauldron.ingredientCount / cauldron.maxIngredients;
    cauldron.glowIntensity = 0.25 + progress * 0.6;
    const gBlend = Math.floor(progress * 90 + 28);
    cauldron.color = `rgb(18, ${gBlend + 48}, 28)`;

    if (cauldron.erupting) {
      cauldron.eruptTimer++;
      if (cauldron.eruptTimer > 90) cauldron.erupting = false;
    }

    // Fly ingredient
    if (flyIngredient) {
      flyIngredient.t += 0.055;
      const cx = cauldron.x + cauldron.w / 2;
      const cy = cauldron.y + cauldron.h * 0.28;
      flyIngredient.x += (cx - flyIngredient.x) * 0.11;
      flyIngredient.y += (cy - flyIngredient.y) * 0.11;
      flyIngredient.scale = Math.max(0, 1 - flyIngredient.t * 0.85);
      if (flyIngredient.t >= 1.1) flyIngredient = null;
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += p.gravity || 0.07;
      p.vx *= 0.98;
      p.life--;
      p.alpha = p.life / p.maxLife;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  /* ---- Render ---- */
  function render() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    // Only draw procedural stars/moon when the DALL-E image isn't showing
    const imgIdx = (mode === 'menu') ? 0 : (currentRoom + 1);
    const img = bgImages[imgIdx];
    const imgReady = img && img.complete && img.naturalWidth > 0;
    if (!imgReady) {
      drawStars();
      drawMoon();
    }
    drawWisps();
    drawCauldron();
    if (flyIngredient) drawFlyIngredient();
    drawZero();
    drawJack();
    drawParticles();
  }

  /* ---- Background ---- */
  function drawBackground() {
    const room = ROOMS[currentRoom] || ROOMS[0];

    // Pick the right image: splash for menu mode, room image for game mode
    const imgIdx = (mode === 'menu') ? 0 : (currentRoom + 1);
    const img = bgImages[imgIdx];
    const imgReady = img && img.complete && img.naturalWidth > 0;

    if (imgReady) {
      // Cover-fit: fill canvas while maintaining aspect ratio
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const iw = img.naturalWidth * scale;
      const ih = img.naturalHeight * scale;
      const ix = (W - iw) / 2;
      const iy = (H - ih) / 2;
      ctx.drawImage(img, ix, iy, iw, ih);

      // Dark vignette at bottom for character/UI readability
      const fog = ctx.createLinearGradient(0, H * 0.55, 0, H);
      fog.addColorStop(0, 'rgba(0,0,0,0)');
      fog.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);
    } else {
      // Fallback: procedural background (while images load or if missing)
      const grad = ctx.createRadialGradient(W * 0.45, H * 0.25, 0, W * 0.5, H * 0.35, W * 0.9);
      grad.addColorStop(0, room.bg0);
      grad.addColorStop(1, room.bg1);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      switch (currentRoom) {
        case 1: drawGraveyardElements(room); break;
        case 2: drawTownElements(room);      break;
        case 3: drawOogieLairElements(room); break;
        case 4: drawTowerElements(room);     break;
        default: drawLabElements(room);      break;
      }

      drawSpiralHill(room.hillColor);

      const fog = ctx.createLinearGradient(0, H * 0.68, 0, H);
      fog.addColorStop(0, 'rgba(0,0,0,0)');
      fog.addColorStop(1, room.fogColor + 'cc');
      ctx.fillStyle = fog;
      ctx.fillRect(0, H * 0.68, W, H * 0.32);
    }
  }

  function drawLabElements(room) {
    // Subtle shelf/lab silhouette shapes on far right
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    // Right edge shelves
    ctx.fillRect(W * 0.88, H * 0.28, W * 0.12, 4);
    ctx.fillRect(W * 0.88, H * 0.40, W * 0.12, 4);
    ctx.fillRect(W * 0.88, H * 0.52, W * 0.12, 4);
    // Tiny potion silhouettes on shelves
    [0.04, 0.07, 0.10].forEach((ox, i) => {
      const sx = W * (0.89 + ox);
      const sy = H * (0.28 - 0.04) - i;
      ctx.fillRect(sx, sy - 12, 5, 12);
      ctx.beginPath();
      ctx.arc(sx + 2.5, sy - 14, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawGraveyardElements(room) {
    // Tombstone silhouettes in background
    ctx.save();
    ctx.fillStyle = '#050e05';
    const tombstones = [
      { x: 0.58, y: 0.65, w: 24, h: 36 },
      { x: 0.65, y: 0.68, w: 18, h: 28 },
      { x: 0.75, y: 0.63, w: 28, h: 40 }
    ];
    tombstones.forEach(t => {
      const tx = W * t.x;
      const ty = H * t.y;
      ctx.beginPath();
      ctx.roundRect(tx, ty - t.h, t.w, t.h, [t.w / 2, t.w / 2, 0, 0]);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawTownElements(room) {
    // Building silhouettes
    ctx.save();
    ctx.fillStyle = 'rgba(8,4,20,0.8)';
    const buildings = [
      { x: 0.56, w: 0.06, h: 0.3 },
      { x: 0.63, w: 0.05, h: 0.22 },
      { x: 0.69, w: 0.08, h: 0.35 },
      { x: 0.78, w: 0.05, h: 0.25 }
    ];
    buildings.forEach(b => {
      ctx.fillRect(W * b.x, H * (0.65 - b.h), W * b.w, H * b.h);
      // Lit windows (orange dots)
      ctx.fillStyle = 'rgba(255,140,0,0.4)';
      for (let wy = H * (0.65 - b.h) + 10; wy < H * 0.6; wy += 14) {
        ctx.fillRect(W * b.x + 4, wy, 5, 5);
      }
      ctx.fillStyle = 'rgba(8,4,20,0.8)';
    });
    ctx.restore();
  }

  function drawOogieLairElements(room) {
    // Bone/dice decorations
    ctx.save();
    ctx.fillStyle = 'rgba(60,50,10,0.6)';
    // Floor bones
    for (let i = 0; i < 4; i++) {
      const bx = W * (0.55 + i * 0.1);
      const by = H * 0.72;
      ctx.beginPath();
      ctx.ellipse(bx, by, 8, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(bx + 18, by, 8, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(bx + 4, by - 2, 14, 4);
    }
    ctx.restore();
  }

  function drawTowerElements(room) {
    // Tower window glow on far right
    ctx.save();
    const wx = W * 0.92;
    const wy = H * 0.15;
    const windowGlow = ctx.createRadialGradient(wx, wy, 4, wx, wy, 40);
    windowGlow.addColorStop(0, 'rgba(232,213,255,0.3)');
    windowGlow.addColorStop(1, 'rgba(232,213,255,0)');
    ctx.fillStyle = windowGlow;
    ctx.beginPath();
    ctx.arc(wx, wy, 40, 0, Math.PI * 2);
    ctx.fill();
    // Window shape
    ctx.fillStyle = 'rgba(232,213,255,0.2)';
    ctx.beginPath();
    ctx.roundRect(wx - 8, wy - 16, 16, 24, [8, 8, 0, 0]);
    ctx.fill();
    ctx.restore();
  }

  function drawSpiralHill(hillColor) {
    ctx.save();
    ctx.fillStyle = hillColor || '#060618';
    ctx.beginPath();
    ctx.moveTo(W * 0.70, H);
    ctx.bezierCurveTo(W * 0.72, H * 0.72, W * 0.76, H * 0.52, W * 0.83, H * 0.33);
    ctx.bezierCurveTo(W * 0.86, H * 0.26, W * 0.81, H * 0.19, W * 0.83, H * 0.155);
    // Spiral curl
    ctx.bezierCurveTo(W * 0.855, H * 0.12, W * 0.895, H * 0.14, W * 0.885, H * 0.19);
    ctx.bezierCurveTo(W * 0.875, H * 0.26, W * 0.915, H * 0.275, W * 0.935, H * 0.22);
    ctx.lineTo(W * 1.02, H * 0.28);
    ctx.lineTo(W * 1.02, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ---- Stars ---- */
  function drawStars() {
    stars.forEach(s => {
      const alpha = 0.35 + Math.sin(s.twinkle) * 0.45;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /* ---- Will-o-wisps ---- */
  function drawWisps() {
    const room = ROOMS[currentRoom] || ROOMS[0];
    wisps.forEach((w, i) => {
      const wx = (w.x + Math.sin(w.phase) * 0.05) * W;
      const wy = (w.y + Math.cos(w.phase * 0.7) * 0.04) * H;
      const alpha = 0.12 + Math.sin(w.phase * 1.3) * 0.08;
      const wispGrad = ctx.createRadialGradient(wx, wy, 0, wx, wy, w.r * 2.5);
      wispGrad.addColorStop(0, room.accent + 'cc');
      wispGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = wispGrad;
      ctx.beginPath();
      ctx.arc(wx, wy, w.r * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /* ---- Moon ---- */
  function drawMoon() {
    const mx = W * 0.80;
    const my = H * 0.11;
    const mr = 40;

    // Outer atmospheric glow
    const outerGlow = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3.5);
    outerGlow.addColorStop(0, 'rgba(232,213,255,0.18)');
    outerGlow.addColorStop(1, 'rgba(232,213,255,0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Inner glow halo
    const innerGlow = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 1.8);
    innerGlow.addColorStop(0, 'rgba(255,248,220,0.22)');
    innerGlow.addColorStop(1, 'rgba(232,213,255,0)');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    const moonGrad = ctx.createRadialGradient(mx - 12, my - 12, 4, mx, my, mr);
    moonGrad.addColorStop(0, '#fffce8');
    moonGrad.addColorStop(0.45, '#f0e8ff');
    moonGrad.addColorStop(0.75, '#dcc8f0');
    moonGrad.addColorStop(1, '#a888c8');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();

    // Craters
    ctx.fillStyle = 'rgba(148,120,190,0.28)';
    ctx.beginPath();
    ctx.arc(mx + 12, my + 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx - 10, my - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx + 2, my + 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---- Cauldron ---- */
  function drawCauldron() {
    const cx = cauldron.x + cauldron.w / 2;
    const cy = cauldron.y;
    const cw = cauldron.w;
    const ch = cauldron.h;
    const progress = cauldron.ingredientCount / cauldron.maxIngredients;

    // Cauldron under-glow
    if (cauldron.glowIntensity > 0) {
      const glow = ctx.createRadialGradient(cx, cy + ch * 0.6, 10, cx, cy + ch * 0.5, cw * 0.85);
      glow.addColorStop(0, `rgba(57,255,20,${cauldron.glowIntensity * 0.35})`);
      glow.addColorStop(0.5, `rgba(57,200,20,${cauldron.glowIntensity * 0.15})`);
      glow.addColorStop(1, 'rgba(57,255,20,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(cx, cy + ch * 0.7, cw * 0.85, ch * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Steam wisps (above cauldron)
    if (!cauldron.erupting) {
      drawSteam(cx, cy, cw, ch, progress);
    }

    // Tripod legs
    ctx.fillStyle = '#1e1e38';
    ctx.strokeStyle = '#2e2e50';
    ctx.lineWidth = 2;
    [[-0.28, -0.12], [0, 0], [0.28, -0.12]].forEach(([ox, rx]) => {
      ctx.save();
      ctx.translate(cx + cw * ox, cy + ch * 0.88);
      ctx.rotate(rx);
      ctx.fillRect(-4, 0, 8, 24);
      // Foot
      ctx.beginPath();
      ctx.ellipse(0, 24, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Cauldron body shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + ch * 0.98, cw * 0.42, ch * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer body shell
    const bodyGrad = ctx.createLinearGradient(cx - cw * 0.5, 0, cx + cw * 0.5, 0);
    bodyGrad.addColorStop(0, '#16162e');
    bodyGrad.addColorStop(0.35, '#242448');
    bodyGrad.addColorStop(0.65, '#1e1e3c');
    bodyGrad.addColorStop(1, '#10102a');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#3a3a60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - cw * 0.44, cy + ch * 0.84);
    ctx.bezierCurveTo(cx - cw * 0.52, cy + ch * 0.4, cx - cw * 0.46, cy + ch * 0.12, cx, cy + ch * 0.07);
    ctx.bezierCurveTo(cx + cw * 0.46, cy + ch * 0.12, cx + cw * 0.52, cy + ch * 0.4, cx + cw * 0.44, cy + ch * 0.84);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner highlight (3D feel)
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.moveTo(cx - cw * 0.25, cy + ch * 0.72);
    ctx.bezierCurveTo(cx - cw * 0.32, cy + ch * 0.4, cx - cw * 0.28, cy + ch * 0.15, cx - cw * 0.1, cy + ch * 0.1);
    ctx.bezierCurveTo(cx - cw * 0.04, cy + ch * 0.08, cx - cw * 0.02, cy + ch * 0.08, cx - cw * 0.02, cy + ch * 0.25);
    ctx.bezierCurveTo(cx - cw * 0.02, cy + ch * 0.5, cx - cw * 0.15, cy + ch * 0.68, cx - cw * 0.25, cy + ch * 0.72);
    ctx.fill();

    // Rim ellipse
    const rimGrad = ctx.createLinearGradient(cx - cw * 0.5, cy, cx + cw * 0.5, cy);
    rimGrad.addColorStop(0, '#2a2a4e');
    rimGrad.addColorStop(0.5, '#4a4a7e');
    rimGrad.addColorStop(1, '#2a2a4e');
    ctx.fillStyle = rimGrad;
    ctx.strokeStyle = '#5a5a8e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy + ch * 0.09, cw * 0.48, ch * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Liquid surface
    const r = Math.floor(18 + progress * 14);
    const g = Math.floor(88 + progress * 100);
    const b = Math.floor(28 + progress * 20);
    const liquidGrad = ctx.createRadialGradient(cx - cw * 0.08, cy + ch * 0.13, 4, cx, cy + ch * 0.16, cw * 0.42);
    liquidGrad.addColorStop(0, `rgba(${r * 2 + 20},${g * 2},${b * 2},0.95)`);
    liquidGrad.addColorStop(0.6, `rgba(${r * 1.5},${g},${b},0.85)`);
    liquidGrad.addColorStop(1, `rgba(${r},${Math.floor(g * 0.7)},${b},0.7)`);
    ctx.fillStyle = liquidGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + ch * 0.16, cw * 0.42, ch * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bubbles
    if (!cauldron.erupting) {
      drawBubbles(cx, cy, cw, ch);
    }

    if (cauldron.erupting) {
      drawEruption(cx, cy, cw, ch);
    }

    // Handle arc
    ctx.strokeStyle = '#2a2a50';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy + ch * 0.09, cw * 0.3, Math.PI, 0);
    ctx.stroke();
    // Handle highlight
    ctx.strokeStyle = 'rgba(80,80,120,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + ch * 0.07, cw * 0.3, Math.PI + 0.2, -0.2);
    ctx.stroke();
  }

  function drawSteam(cx, cy, cw, ch, progress) {
    if (progress < 0.01) return;
    const sAlpha = Math.min(0.22, progress * 0.3);
    const t = cauldron.steamPhase;

    for (let i = 0; i < 3; i++) {
      const sx = cx + (i - 1) * cw * 0.18 + Math.sin(t + i * 2.1) * cw * 0.06;
      const baseY = cy + ch * 0.04;
      const height = 50 + Math.sin(t * 0.5 + i) * 15;
      const drift = Math.sin(t * 0.8 + i * 1.5) * 12;

      const steamGrad = ctx.createLinearGradient(sx, baseY, sx + drift, baseY - height);
      steamGrad.addColorStop(0, `rgba(180,255,180,${sAlpha})`);
      steamGrad.addColorStop(0.5, `rgba(200,255,200,${sAlpha * 0.5})`);
      steamGrad.addColorStop(1, 'rgba(200,255,200,0)');

      ctx.strokeStyle = steamGrad;
      ctx.lineWidth = 10 - i * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, baseY);
      ctx.bezierCurveTo(
        sx + 14, baseY - height * 0.3,
        sx - 14 + drift, baseY - height * 0.65,
        sx + drift, baseY - height
      );
      ctx.stroke();
    }
  }

  function drawBubbles(cx, cy, cw, ch) {
    const bTime = cauldron.bubblePhase;
    for (let i = 0; i < 4; i++) {
      const bx = cx + Math.sin(bTime * 1.1 + i * 1.9) * cw * 0.22;
      const by = cy + ch * 0.16 - Math.abs(Math.sin(bTime + i * 1.3)) * ch * 0.28;
      const br = 3 + Math.sin(bTime * 1.8 + i) * 2;
      const alpha = 0.45 + Math.sin(bTime * 0.9 + i) * 0.35;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#50ff30';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.stroke();
      // Bubble shine
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = 'rgba(200,255,150,0.5)';
      ctx.beginPath();
      ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEruption(cx, cy, cw, ch) {
    const t = cauldron.eruptTimer / 90;
    const height = t < 0.45 ? t * 2.2 : (1 - t) * 2;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const dist = cw * 0.28 * height;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + ch * 0.08 - height * ch * 0.9;
      const alpha = Math.max(0, 1 - t * 1.2);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = cauldron.eruptTimer < 45 ? '#39ff14' : '#b0ff50';
      ctx.beginPath();
      ctx.arc(px, py, 7 + height * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---- Jack Skellington ---- */
  function drawJack() {
    const x = jack.x;
    const y = jack.y + jack.bobY;
    const celebrate = jack.state === 'celebrate';
    const scale = celebrate ? 1.1 : 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 88, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    /* ====  LEGS (drawn behind body) ==== */
    ctx.strokeStyle = '#181830';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-9, 72); ctx.lineTo(-13, 98);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9, 72); ctx.lineTo(13, 98);
    ctx.stroke();

    // Shoes — elongated, slightly pointed
    ctx.fillStyle = '#0a0a1c';
    // Left shoe
    ctx.beginPath();
    ctx.moveTo(-13, 96);
    ctx.bezierCurveTo(-28, 93, -34, 102, -20, 104);
    ctx.bezierCurveTo(-10, 105, -8, 99, -13, 96);
    ctx.fill();
    // Right shoe
    ctx.beginPath();
    ctx.moveTo(13, 96);
    ctx.bezierCurveTo(28, 93, 34, 102, 20, 104);
    ctx.bezierCurveTo(10, 105, 8, 99, 13, 96);
    ctx.fill();

    /* ==== BODY / SUIT ==== */
    const suitGrad = ctx.createLinearGradient(-22, 15, 22, 15);
    suitGrad.addColorStop(0,   '#111128');
    suitGrad.addColorStop(0.4, '#1c1c3c');
    suitGrad.addColorStop(0.6, '#1c1c3c');
    suitGrad.addColorStop(1,   '#111128');
    ctx.fillStyle = suitGrad;
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 12);    // left collar start
    ctx.lineTo(-22, 18);    // left shoulder
    ctx.lineTo(-22, 72);    // left hip
    ctx.lineTo(22, 72);     // right hip
    ctx.lineTo(22, 18);     // right shoulder
    ctx.lineTo(10, 12);     // right collar start
    ctx.lineTo(5, 20);      // right lapel inner
    ctx.lineTo(2, 16);      // chest center-right
    ctx.lineTo(-2, 16);     // chest center-left
    ctx.lineTo(-5, 20);     // left lapel inner
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // White shirt front triangle
    ctx.fillStyle = 'rgba(240,235,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(-4, 30);
    ctx.lineTo(4, 30);
    ctx.closePath();
    ctx.fill();

    // Pinstripes
    ctx.strokeStyle = 'rgba(70,70,110,0.4)';
    ctx.lineWidth = 1;
    for (let sx = -17; sx <= 17; sx += 5.5) {
      ctx.beginPath();
      ctx.moveTo(sx, 18);
      ctx.lineTo(sx, 70);
      ctx.stroke();
    }

    // Suit buttons
    ctx.fillStyle = '#3a3a6a';
    [35, 47, 59].forEach(by => {
      ctx.beginPath();
      ctx.arc(0, by, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    /* ==== ARMS ==== */
    const armA = celebrate ? -0.75 : jack.armAngle;
    ctx.lineCap = 'round';

    // Left arm
    ctx.save();
    ctx.translate(-22, 26);
    ctx.rotate(-0.45 + armA);
    ctx.strokeStyle = '#181830';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-32, 36);
    ctx.stroke();
    // Left hand base
    ctx.fillStyle = '#d0c0e8';
    ctx.beginPath();
    ctx.arc(-32, 36, 5.5, 0, Math.PI * 2);
    ctx.fill();
    // Left fingers
    ctx.strokeStyle = '#d0c0e8';
    ctx.lineWidth = 2.5;
    [[-28, 31], [-34, 30], [-37, 34], [-35, 40]].forEach(([fx, fy]) => {
      ctx.beginPath();
      ctx.moveTo(-32, 36); ctx.lineTo(fx, fy);
      ctx.stroke();
    });
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.translate(22, 26);
    ctx.rotate(0.45 - armA);
    ctx.strokeStyle = '#181830';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(32, 36);
    ctx.stroke();
    ctx.fillStyle = '#d0c0e8';
    ctx.beginPath();
    ctx.arc(32, 36, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d0c0e8';
    ctx.lineWidth = 2.5;
    [[28, 31], [34, 30], [37, 34], [35, 40]].forEach(([fx, fy]) => {
      ctx.beginPath();
      ctx.moveTo(32, 36); ctx.lineTo(fx, fy);
      ctx.stroke();
    });
    ctx.restore();

    /* ==== BAT-WING BOW TIE ==== */
    const btColor = '#7a1818';
    const btHighlight = '#c02828';
    // Left wing
    ctx.fillStyle = btColor;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.bezierCurveTo(-7, 11, -14, 9, -13, 17);
    ctx.bezierCurveTo(-12, 22, -4, 21, 0, 16);
    ctx.fill();
    // Left wing top notch (bat ear)
    ctx.fillStyle = btColor;
    ctx.beginPath();
    ctx.moveTo(-5, 11);
    ctx.lineTo(-9, 7);
    ctx.lineTo(-12, 11);
    ctx.fill();
    // Right wing
    ctx.fillStyle = btColor;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.bezierCurveTo(7, 11, 14, 9, 13, 17);
    ctx.bezierCurveTo(12, 22, 4, 21, 0, 16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, 11);
    ctx.lineTo(9, 7);
    ctx.lineTo(12, 11);
    ctx.fill();
    // Center knot
    ctx.fillStyle = btHighlight;
    ctx.beginPath();
    ctx.ellipse(0, 16, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    /* ==== NECK ==== */
    ctx.fillStyle = '#d0c0e8';
    ctx.beginPath();
    ctx.roundRect(-4, 8, 8, 7, 2);
    ctx.fill();

    /* ==== HEAD ==== */
    const headGrad = ctx.createRadialGradient(-7, -9, 2, 0, -2, 24);
    headGrad.addColorStop(0,   '#f0e4ff');
    headGrad.addColorStop(0.5, '#dccef0');
    headGrad.addColorStop(0.85,'#c4aade');
    headGrad.addColorStop(1,   '#a888c0');
    ctx.fillStyle = headGrad;
    ctx.strokeStyle = '#9070b0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, -2, 20, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    /* ==== EYES — classic hollow triangular sockets ==== */
    ctx.fillStyle = '#0a0a1e';
    ctx.save();
    ctx.scale(1, jack.eyeScale);
    // Left eye socket
    ctx.beginPath();
    ctx.moveTo(-12, -13);
    ctx.lineTo(-17, -4);
    ctx.lineTo(-7, -4);
    ctx.closePath();
    ctx.fill();
    // Right eye socket
    ctx.beginPath();
    ctx.moveTo(12, -13);
    ctx.lineTo(7, -4);
    ctx.lineTo(17, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* ==== NOSE — small triangular skull nose hole ==== */
    ctx.fillStyle = '#0a0a1e';
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(-2.5, 7);
    ctx.lineTo(2.5, 7);
    ctx.closePath();
    ctx.fill();

    /* ==== STITCHED SMILE ==== */
    ctx.strokeStyle = '#0a0a1e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'butt';
    // Wide grin arc
    ctx.beginPath();
    ctx.arc(0, 5, 15, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Stitches — small crossing lines along the arc
    ctx.lineWidth = 1.5;
    for (let angle = 0.35; angle < Math.PI - 0.35; angle += 0.38) {
      const rx = 15 * Math.cos(Math.PI - angle);
      const ry = 5 + 15 * Math.sin(Math.PI - angle);
      const nx = Math.cos(Math.PI - angle);
      const ny = Math.sin(Math.PI - angle);
      ctx.beginPath();
      ctx.moveTo(rx - nx * 3.5, ry - ny * 3.5);
      ctx.lineTo(rx + nx * 3.5, ry + ny * 3.5);
      ctx.stroke();
    }

    /* ==== TOP HAT — tall iconic stovepipe ==== */
    // Wide brim
    ctx.fillStyle = '#080818';
    ctx.strokeStyle = '#1c1c38';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -24, 28, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hat body (tall!)
    const hatGrad = ctx.createLinearGradient(-17, -90, 17, -90);
    hatGrad.addColorStop(0,   '#080818');
    hatGrad.addColorStop(0.4, '#0e0e24');
    hatGrad.addColorStop(1,   '#080818');
    ctx.fillStyle = hatGrad;
    ctx.beginPath();
    ctx.roundRect(-16, -90, 32, 68, 2);
    ctx.fill();
    ctx.strokeStyle = '#1c1c38';
    ctx.lineWidth = 2;
    ctx.strokeRect(-16, -90, 32, 68);

    // Hat band (deep purple)
    ctx.fillStyle = '#280858';
    ctx.beginPath();
    ctx.rect(-16, -30, 32, 8);
    ctx.fill();
    // Band highlight
    ctx.fillStyle = 'rgba(120,80,220,0.25)';
    ctx.beginPath();
    ctx.rect(-16, -30, 32, 2);
    ctx.fill();

    // Bat buckle on hat band
    ctx.save();
    ctx.translate(0, -26);
    ctx.scale(0.6, 0.6);
    // Buckle frame
    ctx.strokeStyle = '#c8a020';
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -6, 20, 12);
    // Bat shape inside buckle
    ctx.fillStyle = '#c8a020';
    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wings
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.bezierCurveTo(-8, -5, -12, 0, -8, 3);
    ctx.bezierCurveTo(-5, 4, -2, 1, -4, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.bezierCurveTo(8, -5, 12, 0, 8, 3);
    ctx.bezierCurveTo(5, 4, 2, 1, 4, 0);
    ctx.fill();
    ctx.restore();

    // Hat top cap ellipse
    ctx.fillStyle = '#0a0a1e';
    ctx.beginPath();
    ctx.ellipse(0, -89, 14.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hat highlight strip (sheen)
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.beginPath();
    ctx.roundRect(-3, -88, 8, 64, 1);
    ctx.fill();

    /* ==== CELEBRATE GLOW ==== */
    if (celebrate) {
      ctx.globalAlpha = 0.22;
      const celebGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, 45);
      celebGlow.addColorStop(0, '#ffd700');
      celebGlow.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = celebGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  /* ---- Zero (ghost dog) ---- */
  function drawZero() {
    const x = zero.x + zero.bobX;
    const y = zero.y + Math.sin(zero.bobAngle) * 10;
    const r = zero.r;

    ctx.save();
    ctx.translate(x, y);

    // Outer ethereal glow
    const outerGlow = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 3);
    outerGlow.addColorStop(0, `rgba(220,210,255,${zero.noseGlow * 0.18})`);
    outerGlow.addColorStop(1, 'rgba(220,210,255,0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 3, 0, Math.PI * 2);
    ctx.fill();

    // Ghost body — teardrop with floppy-ear hint on right
    const bodyColor = zero.state === 'sad' ? '#b0a8c8' : '#e2e0f8';
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    // Main teardrop body
    ctx.arc(0, -r * 0.3, r * 1.02, Math.PI, 0);
    ctx.bezierCurveTo(r, r * 0.75, r * 0.65, r * 1.3, 0, r * 1.55);
    ctx.bezierCurveTo(-r * 0.65, r * 1.3, -r, r * 0.75, -r, r * 0.32);
    ctx.closePath();
    ctx.fill();

    // Floppy ear — right side, drooping down
    ctx.beginPath();
    ctx.ellipse(r * 0.9, -r * 0.65, r * 0.4, r * 0.6, 0.5 + zero.earWag, 0, Math.PI * 2);
    ctx.fill();

    // Left ear hint
    ctx.beginPath();
    ctx.ellipse(-r * 0.85, -r * 0.7, r * 0.32, r * 0.45, -0.4 - zero.earWag * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Body inner sheen
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, -r * 0.5, r * 0.3, r * 0.4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes — big round dots
    ctx.fillStyle = '#2a1a4e';
    ctx.beginPath();
    ctx.arc(-r * 0.38, -r * 0.2, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.38, -r * 0.2, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(-r * 0.32, -r * 0.26, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.44, -r * 0.26, r * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Pumpkin nose — glowing orange, floating on a small tag
    // Collar string
    ctx.strokeStyle = 'rgba(180,170,210,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.1);
    ctx.lineTo(0, r * 0.52);
    ctx.stroke();

    // Nose glow aura
    const noseAura = ctx.createRadialGradient(0, r * 0.6, 2, 0, r * 0.6, r * 0.6);
    noseAura.addColorStop(0, `rgba(255,140,0,${zero.noseGlow * 0.55})`);
    noseAura.addColorStop(0.5, `rgba(255,80,0,${zero.noseGlow * 0.2})`);
    noseAura.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = noseAura;
    ctx.beginPath();
    ctx.arc(0, r * 0.6, r * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Nose pumpkin face
    const noseGrad = ctx.createRadialGradient(-2, r * 0.53, 1, 0, r * 0.62, r * 0.32);
    noseGrad.addColorStop(0, `rgba(255,200,40,${zero.noseGlow})`);
    noseGrad.addColorStop(0.5, `rgba(255,120,0,${zero.noseGlow * 0.9})`);
    noseGrad.addColorStop(1, `rgba(180,50,0,${zero.noseGlow * 0.5})`);
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.arc(0, r * 0.62, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Nose tiny jack-o-lantern face
    ctx.fillStyle = `rgba(0,0,0,${zero.noseGlow * 0.7})`;
    ctx.save();
    ctx.translate(0, r * 0.62);
    ctx.scale(r * 0.025, r * 0.025);
    // Tiny triangle eyes
    ctx.beginPath(); ctx.moveTo(-4,-2); ctx.lineTo(-1,2); ctx.lineTo(-7,2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4,-2); ctx.lineTo(7,2); ctx.lineTo(1,2); ctx.closePath(); ctx.fill();
    // Tiny jagged mouth
    ctx.beginPath();
    ctx.moveTo(-6,5); ctx.lineTo(-3,8); ctx.lineTo(0,5); ctx.lineTo(3,8); ctx.lineTo(6,5);
    ctx.stroke();
    ctx.restore();

    // Tail — wavy ribbon
    ctx.save();
    ctx.rotate(zero.tailAngle);
    const tailGrad = ctx.createLinearGradient(0, r * 1.55, 0, r * 2.6);
    tailGrad.addColorStop(0, 'rgba(220,215,250,0.7)');
    tailGrad.addColorStop(1, 'rgba(220,215,250,0)');
    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, r * 1.55);
    ctx.bezierCurveTo(r * 0.5, r * 1.9, -r * 0.5, r * 2.2, r * 0.2, r * 2.6);
    ctx.stroke();
    ctx.restore();

    // Happy state: sparkle ring
    if (zero.state === 'happy') {
      ctx.fillStyle = '#ffd700';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + zero.bobAngle * 1.5;
        const px = Math.cos(a) * r * 1.9;
        const py = Math.sin(a) * r * 1.9;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /* ---- Fly Ingredient ---- */
  function drawFlyIngredient() {
    if (!flyIngredient) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, flyIngredient.scale);
    ctx.font = `${Math.floor(36 * flyIngredient.scale)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(flyIngredient.emoji, flyIngredient.x, flyIngredient.y);
    ctx.restore();
  }

  /* ---- Particles ---- */
  function drawParticles() {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      if (p.type === 'bat') {
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🦇', p.x, p.y);
      } else if (p.type === 'pumpkin') {
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🎃', p.x, p.y);
      } else if (p.type === 'star') {
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('⭐', p.x, p.y);
      } else if (p.type === 'ghost') {
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('👻', p.x, p.y);
      } else if (p.type === 'glow') {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, p.color || 'rgba(255,117,24,0.8)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color || '#ff7518';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  /* ---- Public API ---- */
  function setMode(m) { mode = m; }

  function setRoom(n) {
    currentRoom = Math.max(0, Math.min(ROOMS.length - 1, n));
  }

  function jackTalk() {
    jack.state = 'talk';
    jack.stateTimer = 110;
  }

  function jackCelebrate() {
    jack.state = 'celebrate';
    jack.stateTimer = 200;
    jack.armAngle = 0.8;
  }

  function jackHint() {
    jack.state = 'hint';
    jack.stateTimer = 80;
  }

  function zeroHappy() {
    zero.state = 'happy';
    zero.stateTimer = 110;
  }

  function zeroTrick() {
    zero.state = 'happy';
    zero.stateTimer = 200;
  }

  function zeroSad() {
    zero.state = 'sad';
    zero.stateTimer = 55;
    setTimeout(() => { zero.state = 'idle'; }, 1100);
  }

  function flyIngredientTo(emoji, startX, startY) {
    flyIngredient = { emoji, x: startX, y: startY, scale: 1, alpha: 1, t: 0 };
  }

  function addIngredient() {
    cauldron.ingredientCount = Math.min(cauldron.maxIngredients, cauldron.ingredientCount + 1);
    PotionAudio.playCauldronBubble();
    const cx = cauldron.x + cauldron.w / 2;
    const cy = cauldron.y + cauldron.h * 0.14;
    for (let i = 0; i < 7; i++) {
      particles.push({
        type: 'glow',
        x: cx + (Math.random() - 0.5) * 45,
        y: cy,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -Math.random() * 3.5 - 1,
        size: Math.random() * 12 + 5,
        color: 'rgba(57,255,20,0.55)',
        life: 28 + Math.random() * 22,
        maxLife: 50,
        alpha: 1,
        gravity: -0.02
      });
    }
  }

  function resetCauldron(maxIngredients) {
    cauldron.ingredientCount = 0;
    cauldron.maxIngredients = maxIngredients || 3;
    cauldron.erupting = false;
    cauldron.eruptTimer = 0;
  }

  function eruptCauldron() {
    cauldron.erupting = true;
    cauldron.eruptTimer = 0;
    PotionAudio.playCauldronErupt();
    spawnCelebrationParticles();
  }

  function spawnCelebrationParticles(count) {
    const n = count || 35;
    const cx = cauldron.x + cauldron.w / 2;
    const cy = cauldron.y;
    const types = ['bat', 'pumpkin', 'star', 'ghost', 'glow'];
    for (let i = 0; i < n; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      particles.push({
        type,
        x: cx + (Math.random() - 0.5) * 70,
        y: cy + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 6,
        vy: -(Math.random() * 7 + 2),
        size: type === 'glow' ? Math.random() * 14 + 6 : Math.floor(Math.random() * 14 + 16),
        color: type === 'glow' ? 'rgba(255,117,24,0.65)' : null,
        life: 65 + Math.random() * 45,
        maxLife: 110,
        alpha: 1,
        gravity: 0.06
      });
    }
  }

  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  return {
    init, resize, stop, setMode, setRoom,
    jackTalk, jackCelebrate, jackHint,
    zeroHappy, zeroTrick, zeroSad,
    flyIngredientTo, addIngredient, resetCauldron, eruptCauldron,
    spawnCelebrationParticles
  };
})();
