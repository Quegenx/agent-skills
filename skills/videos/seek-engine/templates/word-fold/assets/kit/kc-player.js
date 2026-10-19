// [word-fold, assets/kit/kc-player.js]
/* Shared CoAnimator player harness for x-motion-lab timelines.
   An animation calls: KC.mount({ duration, fps, render }) once its render(t)
   is ready. render(t) MUST be a pure function of time  -  same t, same frame. */
(function () {
  window.KC = {
    mount: function (opts) {
      var DURATION = opts.duration;
      var render = opts.render;
      var time = 0, playing = false, raf = 0, last = 0;
      function clampT(t) { return Math.max(0, Math.min(DURATION, Number(t) || 0)); }
      function tick(now) {
        if (!playing) return;
        if (!last) last = now;
        time = clampT(time + (now - last) / 1000);
        last = now;
        render(time);
        if (time >= DURATION) { time = 0; last = now; }
        raf = requestAnimationFrame(tick);
      }
      window.__kcControl = {
        duration: DURATION, totalDuration: DURATION,
        seek: function (t) { time = clampT(t); render(time); },
        seekAndPause: function (t) { playing = false; last = 0; cancelAnimationFrame(raf); time = clampT(t); render(time); },
        play: function () { if (!playing) { playing = true; last = 0; raf = requestAnimationFrame(tick); } },
        pause: function () { playing = false; last = 0; cancelAnimationFrame(raf); },
        hoverPreview: function (t) { render(t != null ? clampT(t) : time); },
        getTime: function () { return time; },
        getDuration: function () { return DURATION; },
        isPlaying: function () { return playing; }
      };
      render(0);
      window.__kcReady = true;
      // ?t= cold-seek: boot paused at that time (export chunk contract)
      var v = new URLSearchParams(location.search).get('t');
      if (v != null) {
        var t0 = parseFloat(v);
        if (isFinite(t0)) window.__kcControl.seekAndPause(t0);
      }
    },
    /* fit a fixed authoring frame into the viewport.
       The element is also TAGGED as the authored canvas: CoAnimator's stage
       shapes its render frame from a [data-kc-canvas] element (or, failing
       that, a div with INLINE width/height plus a scale transform) and falls
       back to 16:9 when it finds neither. Sizing the frame from a stylesheet
       alone  -  which every piece here does  -  leaves nothing for that probe to
       read, so a 4:3 animation was being letterboxed inside a 16:9 stage.
       Declaring it here fixes every timeline in the project at once. */
    fit: function (el, W, H) {
      el.setAttribute('data-kc-canvas', '');
      el.style.width  = W + 'px';
      el.style.height = H + 'px';
      function go() {
        var vw = document.documentElement.clientWidth || window.innerWidth;
        var vh = document.documentElement.clientHeight || window.innerHeight;
        var s = Math.min(vw / W, vh / H);
        el.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
      }
      go(); window.addEventListener('resize', go);
    },
    /* easing + math helpers */
    clamp01: function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; },
    prog: function (t, a, b) { return KC.clamp01((t - a) / (b - a)); },
    lerp: function (a, b, k) { return a + (b - a) * k; },
    easeInOut: function (p) { return 0.5 - Math.cos(Math.PI * p) / 2; },
    easeOut: function (p) { return 1 - Math.pow(1 - p, 3); },
    easeIn: function (p) { return p * p * p; },
    easeOutBack: function (p) { var c = 1.70158, q = p - 1; return 1 + (c + 1) * q * q * q + c * q * q; },
    easeInBack: function (p) { var c = 1.70158; return (c + 1) * p * p * p - c * p * p; },
    easeOutExpo: function (p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); },
    spring: function (p, freq, damp) {
      if (p >= 1) return 1;
      return 1 - Math.exp(-(damp || 5) * p) * Math.cos((freq || 3) * Math.PI * p);
    },
    hash: function (n) {
      n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4);
      n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15);
      return (n >>> 0) / 4294967296;
    }
  };
})();
