/* Jack's Potion Lab — Canvas Engine v1.0
   Renders: background, Jack, Zero, cauldron, ingredient particles, celebration effects
*/

const PotionEngine = (() => {

  /* ---- State ---- */
  let canvas, ctx;
  let W, H;
  let raf = null;
  let mode = 'menu'; // menu | game | celebrate

  const particles = [];
  const stars = [];

  // Characters
  const jack = {
    x: 0, y: 0, w: 80, h: 140,
    armAngle: 0,
    eyeScale: 1,
    bobY: 0,
    state: 'idle',  // idle | talk | celebrate | hint
    stateTimer: 0
  };

  const zero = {
    x: 0, y: 0, r: 22,
    noseGlow: 1,
    bobAngle: 0,
    bobX: 0,
    state: 'idle',  // idle | happy | trick | sad
    stateTimer: 0,
    tailAngle: 0
  };

  const cauldron = {
    x: 0, y: 0, w: 140, h: 110,
    bubblePhase: 0,
    color: '#1a8a2e',
    glowIntensity: 0.3,
    erupting: false,
    eruptTimer: 0,
    ingredientCount: 0,
    maxIngredients: 3
  };

  // Ingredient fly-in
  let flyIngredient = null;

  /* ---- Init ---- */
  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    generateStars();
    positionCharacters();
    loop();
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
    positionCharacters();
  }

  function positionCharacters() {
    if (!W) return;
    // Jack: left third, vertically centered in bottom 60%
    jack.x = W * 0.15;
    jack.y = H * 0.45;

    // Zero: right of Jack, floating
    zero.x = W * 0.30;
    zero.y = H * 0.42;

    // Cauldron: center-bottom
    cauldron.x = W * 0.5 - cauldron.w / 2;
    cauldron.y = H * 0.62;
  }

  function generateStars() {
    stars.length = 0;
    const count = 60;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.75,
        r: Math.random() * 1.5 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01
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

    // Stars twinkle
    stars.forEach(s => s.twinkle += s.speed);

    // Jack animation
    jack.bobY = Math.sin(t * 1.2) * 6;
    jack.armAngle = Math.sin(t * 0.8) * 0.15;
    jack.eyeScale = 1 + Math.sin(t * 2) * 0.05;

    if (jack.stateTimer > 0) {
      jack.stateTimer--;
      if (jack.stateTimer <= 0) jack.state = 'idle';
    }

    // Zero animation
    zero.bobAngle += 0.03;
    zero.bobX = Math.sin(zero.bobAngle * 0.7) * 15;
    zero.tailAngle = Math.sin(zero.bobAngle * 1.3) * 0.4;
    zero.noseGlow = 0.7 + Math.sin(t * 2) * 0.3;

    if (zero.stateTimer > 0) {
      zero.stateTimer--;
      if (zero.stateTimer <= 0) zero.state = 'idle';
    }

    // Cauldron
    cauldron.bubblePhase += 0.04;
    const progress = cauldron.ingredientCount / cauldron.maxIngredients;
    cauldron.glowIntensity = 0.3 + progress * 0.5;
    const greenBlend = Math.floor(progress * 80 + 30);
    cauldron.color = `rgb(20, ${greenBlend + 50}, 30)`;

    if (cauldron.erupting) {
      cauldron.eruptTimer++;
      if (cauldron.eruptTimer > 80) cauldron.erupting = false;
    }

    // Fly ingredient
    if (flyIngredient) {
      flyIngredient.t += 0.06;
      // Cubic ease to cauldron center
      const cx = cauldron.x + cauldron.w / 2;
      const cy = cauldron.y + cauldron.h * 0.3;
      flyIngredient.x += (cx - flyIngredient.x) * 0.12;
      flyIngredient.y += (cy - flyIngredient.y) * 0.12;
      flyIngredient.scale = 1 - flyIngredient.t * 0.8;
      if (flyIngredient.t >= 1) flyIngredient = null;
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += p.gravity || 0.08;
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
    drawStars();
    drawMoon();
    drawCauldron();
    if (flyIngredient) drawFlyIngredient();
    drawZero();
    drawJack();
    drawParticles();
  }

  function drawBackground() {
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, W * 0.8);
    grad.addColorStop(0, '#1a0a3e');
    grad.addColorStop(1, '#0d0d2b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle fog layer at bottom
    const fog = ctx.createLinearGradient(0, H * 0.7, 0, H);
    fog.addColorStop(0, 'rgba(13,13,43,0)');
    fog.addColorStop(1, 'rgba(26,10,62,0.5)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, H * 0.7, W, H * 0.3);

    // Spiral Hill silhouette (right side)
    drawSpiralHill();
  }

  function drawSpiralHill() {
    ctx.save();
    ctx.fillStyle = '#060618';
    ctx.beginPath();
    ctx.moveTo(W * 0.72, H);
    // Hill curve
    ctx.bezierCurveTo(W * 0.72, H * 0.75, W * 0.78, H * 0.55, W * 0.84, H * 0.35);
    ctx.bezierCurveTo(W * 0.87, H * 0.28, W * 0.82, H * 0.22, W * 0.84, H * 0.18);
    // Spiral (simplified)
    ctx.bezierCurveTo(W * 0.86, H * 0.14, W * 0.90, H * 0.16, W * 0.89, H * 0.21);
    ctx.bezierCurveTo(W * 0.88, H * 0.28, W * 0.92, H * 0.30, W * 0.94, H * 0.25);
    ctx.lineTo(W, H * 0.3);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawStars() {
    stars.forEach(s => {
      const alpha = 0.4 + Math.sin(s.twinkle) * 0.4;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#e8d5ff';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawMoon() {
    const mx = W * 0.82;
    const my = H * 0.12;
    const mr = 36;

    // Glow
    const glow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 2.5);
    glow.addColorStop(0, 'rgba(232,213,255,0.25)');
    glow.addColorStop(1, 'rgba(232,213,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    const moonGrad = ctx.createRadialGradient(mx - 10, my - 10, 5, mx, my, mr);
    moonGrad.addColorStop(0, '#fff8dc');
    moonGrad.addColorStop(0.6, '#e8d5ff');
    moonGrad.addColorStop(1, '#b89fd4');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();

    // Crater
    ctx.fillStyle = 'rgba(160,130,200,0.3)';
    ctx.beginPath();
    ctx.arc(mx + 10, my + 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx - 8, my - 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCauldron() {
    const cx = cauldron.x + cauldron.w / 2;
    const cy = cauldron.y;
    const cw = cauldron.w;
    const ch = cauldron.h;

    // Cauldron glow
    if (cauldron.glowIntensity > 0) {
      const glow = ctx.createRadialGradient(cx, cy + ch * 0.3, 10, cx, cy + ch * 0.3, cw * 0.7);
      glow.addColorStop(0, `rgba(57,255,20,${cauldron.glowIntensity * 0.4})`);
      glow.addColorStop(1, 'rgba(57,255,20,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy + ch * 0.3, cw * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cauldron legs
    ctx.fillStyle = '#2a2a3e';
    ctx.save();
    ctx.translate(cx - cw * 0.25, cy + ch * 0.88);
    ctx.rotate(-0.2);
    ctx.fillRect(-5, 0, 10, 22);
    ctx.restore();
    ctx.save();
    ctx.translate(cx + cw * 0.25, cy + ch * 0.88);
    ctx.rotate(0.2);
    ctx.fillRect(-5, 0, 10, 22);
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy + ch * 0.88);
    ctx.fillRect(-5, 0, 10, 20);
    ctx.restore();

    // Cauldron body
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#3a3a5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy + ch * 0.85, cw * 0.42, ch * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - cw * 0.42, cy + ch * 0.85);
    ctx.bezierCurveTo(cx - cw * 0.5, cy + ch * 0.4, cx - cw * 0.45, cy + ch * 0.15, cx, cy + ch * 0.1);
    ctx.bezierCurveTo(cx + cw * 0.45, cy + ch * 0.15, cx + cw * 0.5, cy + ch * 0.4, cx + cw * 0.42, cy + ch * 0.85);
    ctx.closePath();
    ctx.fillStyle = '#2a2a4a';
    ctx.fill();
    ctx.stroke();

    // Cauldron rim
    ctx.fillStyle = '#3a3a5e';
    ctx.beginPath();
    ctx.ellipse(cx, cy + ch * 0.12, cw * 0.46, ch * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brew liquid
    const liquidGrad = ctx.createRadialGradient(cx, cy + ch * 0.18, 5, cx, cy + ch * 0.18, cw * 0.4);
    const progress = cauldron.ingredientCount / cauldron.maxIngredients;
    const r = Math.floor(20 + progress * 10);
    const g = Math.floor(80 + progress * 80);
    const b = Math.floor(30 + progress * 20);
    liquidGrad.addColorStop(0, `rgba(${r * 2},${g * 2},${b * 2},0.9)`);
    liquidGrad.addColorStop(1, `rgba(${r},${g},${b},0.7)`);
    ctx.fillStyle = liquidGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + ch * 0.18, cw * 0.40, ch * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bubbles
    if (!cauldron.erupting) {
      drawBubbles(cx, cy, cw, ch);
    }

    // Eruption
    if (cauldron.erupting) {
      drawEruption(cx, cy, cw, ch);
    }

    // Handle
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy + ch * 0.12, cw * 0.28, Math.PI, 0);
    ctx.stroke();
  }

  function drawBubbles(cx, cy, cw, ch) {
    const bTime = cauldron.bubblePhase;
    for (let i = 0; i < 3; i++) {
      const bx = cx + Math.sin(bTime * 1.2 + i * 2.1) * cw * 0.2;
      const by = cy + ch * 0.18 - Math.abs(Math.sin(bTime + i * 1.5)) * ch * 0.25;
      const br = 4 + Math.sin(bTime * 2 + i) * 2;
      const alpha = 0.5 + Math.sin(bTime + i) * 0.3;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEruption(cx, cy, cw, ch) {
    const t = cauldron.eruptTimer / 80;
    const height = t < 0.5 ? t * 2 : 2 - t * 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = (cw * 0.3) * height;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + ch * 0.1 - height * ch * 0.8;
      const alpha = 1 - t;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = cauldron.eruptTimer < 40 ? '#39ff14' : '#7cfc00';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawJack() {
    const x = jack.x;
    const y = jack.y + jack.bobY;
    const scale = jack.state === 'celebrate' ? 1.12 : 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 75, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (suit)
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#3a3a5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, 20, 36, 55, 4);
    ctx.fill();
    ctx.stroke();

    // Pinstripes
    ctx.strokeStyle = '#2e2e4e';
    ctx.lineWidth = 1;
    for (let sx = -14; sx <= 14; sx += 7) {
      ctx.beginPath();
      ctx.moveTo(sx, 22);
      ctx.lineTo(sx, 73);
      ctx.stroke();
    }

    // Arms
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    // Left arm
    ctx.save();
    ctx.translate(-18, 30);
    ctx.rotate(-0.4 + jack.armAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-25, 25);
    ctx.stroke();
    // Left hand
    ctx.fillStyle = '#e8d5ff';
    ctx.beginPath();
    ctx.arc(-25, 25, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Right arm
    ctx.save();
    ctx.translate(18, 30);
    ctx.rotate(0.4 - jack.armAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(25, 25);
    ctx.stroke();
    ctx.fillStyle = '#e8d5ff';
    ctx.beginPath();
    ctx.arc(25, 25, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Legs
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 7;
    [-8, 8].forEach((lx, i) => {
      ctx.beginPath();
      ctx.moveTo(lx, 73);
      ctx.lineTo(lx + (i === 0 ? -4 : 4), 100);
      ctx.stroke();
      // Shoes
      ctx.fillStyle = '#0d0d1e';
      ctx.beginPath();
      ctx.ellipse(lx + (i === 0 ? -8 : 8), 102, 12, 5, i === 0 ? -0.2 : 0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Neck
    ctx.fillStyle = '#e8d5ff';
    ctx.beginPath();
    ctx.roundRect(-5, 12, 10, 12, 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#e8d5ff';
    ctx.strokeStyle = '#b89fd4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Jack's iconic smile + eyes
    // Eyes (hollow triangles)
    ctx.fillStyle = '#0d0d2b';
    ctx.save();
    ctx.scale(1, jack.eyeScale);
    // Left eye
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(-6, -2);
    ctx.lineTo(-14, -2);
    ctx.closePath();
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(14, -2);
    ctx.lineTo(6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Smile (stitched)
    ctx.strokeStyle = '#0d0d2b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 8, 12, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Stitch marks on smile
    for (let sx = -8; sx <= 8; sx += 4) {
      ctx.beginPath();
      ctx.moveTo(sx, 8 + Math.sqrt(144 - sx * sx) * 0.6);
      ctx.lineTo(sx, 8 + Math.sqrt(144 - sx * sx) * 0.6 + 4);
      ctx.stroke();
    }

    // Top hat
    ctx.fillStyle = '#0d0d1e';
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 2;
    // Brim
    ctx.beginPath();
    ctx.ellipse(0, -24, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Hat body
    ctx.beginPath();
    ctx.roundRect(-16, -58, 32, 36, 2);
    ctx.fill();
    ctx.stroke();
    // Hat band
    ctx.fillStyle = '#1a0a3e';
    ctx.beginPath();
    ctx.roundRect(-16, -30, 32, 7, 1);
    ctx.fill();

    // Celebrate expression
    if (jack.state === 'celebrate') {
      ctx.fillStyle = 'rgba(255,215,0,0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawZero() {
    const x = zero.x + zero.bobX;
    const y = zero.y + Math.sin(zero.bobAngle) * 10;
    const r = zero.r;

    ctx.save();
    ctx.translate(x, y);

    // Ghost body glow
    const glow = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2);
    glow.addColorStop(0, `rgba(232,213,255,${zero.noseGlow * 0.3})`);
    glow.addColorStop(1, 'rgba(232,213,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
    ctx.fill();

    // Ghost body (teardrop)
    ctx.fillStyle = zero.state === 'sad' ? '#c8c0d8' : '#e8e8ff';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(0, -r * 0.3, r, Math.PI, 0);
    ctx.bezierCurveTo(r, r * 0.7, r * 0.6, r * 1.2, 0, r * 1.4);
    ctx.bezierCurveTo(-r * 0.6, r * 1.2, -r, r * 0.7, -r, r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Eyes
    ctx.fillStyle = '#2a1a4e';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.1, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.35, -r * 0.1, r * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Nose (pumpkin-shaped, glowing orange)
    const noseGrad = ctx.createRadialGradient(0, r * 0.35, 2, 0, r * 0.35, r * 0.45);
    noseGrad.addColorStop(0, `rgba(255,200,50,${zero.noseGlow})`);
    noseGrad.addColorStop(0.5, `rgba(255,120,0,${zero.noseGlow * 0.8})`);
    noseGrad.addColorStop(1, `rgba(200,60,0,0)`);
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.arc(0, r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Tail (wavy line behind)
    ctx.save();
    ctx.rotate(zero.tailAngle);
    ctx.strokeStyle = 'rgba(232,213,255,0.6)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, r * 1.4);
    ctx.bezierCurveTo(r * 0.4, r * 1.8, -r * 0.4, r * 2.1, 0, r * 2.4);
    ctx.stroke();
    ctx.restore();

    // Happy state: sparkles around
    if (zero.state === 'happy') {
      ctx.fillStyle = '#ffd700';
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + zero.bobAngle;
        const px = Math.cos(a) * r * 1.7;
        const py = Math.sin(a) * r * 1.7;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawFlyIngredient() {
    if (!flyIngredient) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, flyIngredient.alpha);
    ctx.font = `${Math.floor(40 * flyIngredient.scale)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(flyIngredient.emoji, flyIngredient.x, flyIngredient.y);
    ctx.restore();
  }

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

  function jackTalk() {
    jack.state = 'talk';
    jack.stateTimer = 120;
  }

  function jackCelebrate() {
    jack.state = 'celebrate';
    jack.stateTimer = 180;
    // Arms up position
    jack.armAngle = 0.8;
  }

  function jackHint() {
    jack.state = 'hint';
    jack.stateTimer = 90;
  }

  function zeroHappy() {
    zero.state = 'happy';
    zero.stateTimer = 100;
  }

  function zeroTrick() {
    zero.state = 'happy';
    zero.stateTimer = 180;
  }

  function zeroSad() {
    zero.state = 'sad';
    zero.stateTimer = 60;
    // Recover quickly
    setTimeout(() => { zero.state = 'idle'; }, 1000);
  }

  function flyIngredientTo(emoji, startX, startY) {
    flyIngredient = {
      emoji,
      x: startX,
      y: startY,
      scale: 1,
      alpha: 1,
      t: 0
    };
  }

  function addIngredient() {
    cauldron.ingredientCount = Math.min(cauldron.maxIngredients, cauldron.ingredientCount + 1);
    PotionAudio.playCauldronBubble();
    // Spawn bubble particles
    const cx = cauldron.x + cauldron.w / 2;
    const cy = cauldron.y + cauldron.h * 0.15;
    for (let i = 0; i < 6; i++) {
      particles.push({
        type: 'glow',
        x: cx + (Math.random() - 0.5) * 40,
        y: cy,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        size: Math.random() * 10 + 5,
        color: 'rgba(57,255,20,0.5)',
        life: 30 + Math.random() * 20,
        maxLife: 50,
        alpha: 1,
        gravity: 0
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
    const n = count || 30;
    const cx = cauldron.x + cauldron.w / 2;
    const cy = cauldron.y;
    const types = ['bat', 'pumpkin', 'star', 'glow'];
    for (let i = 0; i < n; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      particles.push({
        type,
        x: cx + (Math.random() - 0.5) * 60,
        y: cy,
        vx: (Math.random() - 0.5) * 5,
        vy: -(Math.random() * 6 + 2),
        size: type === 'glow' ? Math.random() * 12 + 6 : Math.floor(Math.random() * 12 + 16),
        color: type === 'glow' ? 'rgba(255,117,24,0.6)' : null,
        life: 60 + Math.random() * 40,
        maxLife: 100,
        alpha: 1,
        gravity: 0.05
      });
    }
  }

  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  return {
    init, resize, stop, setMode,
    jackTalk, jackCelebrate, jackHint,
    zeroHappy, zeroTrick, zeroSad,
    flyIngredientTo, addIngredient, resetCauldron, eruptCauldron,
    spawnCelebrationParticles
  };
})();
