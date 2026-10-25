with open('dashboard.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Build splash function without f-string for HTML to avoid brace conflicts
clean_func = '''def render_fullscreen_splash():
    video_b64 = get_intro_video_base64()
    video_source = f'<source src="data:video/mp4;base64,{video_b64}" type="video/mp4">' if video_b64 else ''
    accent = INTRO_ACCENT_COLOR

    html_head = \'\'\'<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%; height: 100%; overflow: hidden;
  background: #030712;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
}
#splash {
  position: fixed; inset: 0;
  width: 100vw; height: 100vh;
  background: #030712;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  transition: opacity 0.45s ease-out;
  z-index: 9999; overflow: hidden;
}
#splash.hidden { opacity: 0; pointer-events: none; }
#bgvid {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; z-index: 1;
}
#scrim {
  position: absolute; inset: 0; z-index: 2;
  background: linear-gradient(to bottom, rgba(3,7,18,0.3) 0%, transparent 35%, rgba(3,7,18,0.75) 68%, rgba(3,7,18,0.96) 100%);
}
#loader-hud {
  position: relative; z-index: 9999;
  width: 88%; max-width: 800px;
  margin-bottom: 3.5%;
  padding: 16px 24px 14px;
  border-radius: 16px;
  background: rgba(3,8,22,0.94);
  border: 2px solid #00D0FF;
  box-shadow: 0 0 35px rgba(0,208,255,0.55), 0 20px 60px rgba(0,0,0,0.95), inset 0 0 20px rgba(0,208,255,0.2);
  display: flex; flex-direction: column; gap: 10px;
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
}
#loader-header {
  display: flex; justify-content: center; align-items: center; width: 100%;
}
#pct-text {
  font-family: "Courier New", monospace;
  font-size: 22px; font-weight: 900;
  color: #00D0FF; letter-spacing: 3px;
  text-shadow: 0 0 16px #00D0FF, 0 0 32px rgba(0,208,255,0.7);
}
#track {
  width: 100%; height: 16px;
  background: rgba(6,12,28,0.97);
  border: 2px solid rgba(0,208,255,0.6);
  border-radius: 999px;
  position: relative; overflow: visible;
  box-shadow: inset 0 2px 7px rgba(0,0,0,0.95), 0 0 10px rgba(0,208,255,0.2);
}
#fill {
  height: 100%; width: 0%;
  background: linear-gradient(90deg, rgba(0,208,255,0.3) 0%, rgba(0,208,255,0.88) 65%, #00D0FF 100%);
  border-radius: 999px; position: relative;
  box-shadow: 0 0 18px #00D0FF, 0 0 38px #00D0FF, 0 0 55px rgba(0,208,255,0.75);
  transition: width 0.08s linear;
}
#sword-marker {
  position: absolute; top: 50%; right: -22px;
  transform: translate(50%, -50%);
  display: flex; align-items: center; justify-content: center; pointer-events: none;
}
#sword-icon {
  font-size: 36px; display: inline-block;
  filter: drop-shadow(0 0 8px #00D0FF) drop-shadow(0 0 20px rgba(0,208,255,1)) drop-shadow(0 0 36px #00D0FF);
  animation: swordSwing 0.55s ease-in-out infinite alternate;
  transform-origin: center;
}
@keyframes swordSwing {
  0%   { transform: rotate(-28deg) scale(0.90); }
  100% { transform: rotate(28deg) scale(1.38); }
}
#sword-glow {
  position: absolute; width: 50px; height: 50px;
  background: radial-gradient(circle, rgba(0,208,255,0.8) 0%, transparent 70%);
  border-radius: 50%;
  animation: glowPulse 0.55s ease-in-out infinite alternate;
}
@keyframes glowPulse {
  0%   { opacity: 0.45; transform: scale(0.82); }
  100% { opacity: 1.00; transform: scale(1.48); }
}
</style>
</head>
<body>
<div id="splash">
  <video id="bgvid" playsinline muted autoplay preload="auto"
         controlslist="nodownload nofullscreen noremoteplayback" disablepictureinpicture>
\'\'\'

    html_body = \'\'\'
  </video>
  <div id="scrim"></div>
  <div id="loader-hud">
    <div id="loader-header">
      <span id="pct-text">Loading... 0%</span>
    </div>
    <div id="track">
      <div id="fill">
        <div id="sword-marker">
          <span id="sword-icon">&#x2694;&#xFE0F;</span>
          <div id="sword-glow"></div>
        </div>
      </div>
    </div>
  </div>
</div>
<script>
(function() {
  var DURATION = 6.0;
  var dismissed = false;
  var splash  = document.getElementById('splash');
  var vid     = document.getElementById('bgvid');
  var fill    = document.getElementById('fill');
  var pctText = document.getElementById('pct-text');

  function dismissSplash() {
    if (dismissed) return;
    dismissed = true;
    splash.classList.add('hidden');
    setTimeout(function() {
      try {
        var pDoc = window.parent.document;
        var curtain = pDoc.getElementById('bayora-curtain');
        if (curtain) {
          curtain.style.opacity = '0';
          setTimeout(function() { curtain.remove(); }, 350);
        }
        var cStyle = pDoc.getElementById('bayora-curtain-style');
        if (cStyle) {
          setTimeout(function() { cStyle.remove(); }, 350);
        }
        if (window.frameElement) {
          window.frameElement.style.opacity = '0';
          setTimeout(function() {
            window.frameElement.style.display = 'none';
            window.frameElement.style.height = '0px';
          }, 350);
        }
      } catch(e) {
        console.error(e);
      }
    }, 450);
  }

  function updateProgress() {
    if (dismissed) return;
    var pct = 0;
    if (vid && !vid.paused && vid.duration > 0) {
      pct = Math.min(100, (vid.currentTime / vid.duration) * 100);
    }
    fill.style.width = pct.toFixed(1) + '%';
    pctText.textContent = 'Loading... ' + Math.floor(pct) + '%';
    requestAnimationFrame(updateProgress);
  }

  function startFallbackTimer() {
    var t0 = Date.now();
    (function tick() {
      if (dismissed) return;
      var pct = Math.min(100, ((Date.now() - t0) / (DURATION * 1000)) * 100);
      fill.style.width = pct.toFixed(1) + '%';
      pctText.textContent = 'Loading... ' + Math.floor(pct) + '%';
      if (pct >= 100) { dismissSplash(); return; }
      requestAnimationFrame(tick);
    })();
  }

  if (vid) {
    vid.addEventListener('playing', function() { requestAnimationFrame(updateProgress); });
    vid.addEventListener('ended', function() {
      fill.style.width = '100%';
      pctText.textContent = 'Loading... 100%';
      setTimeout(dismissSplash, 280);
    });
    vid.addEventListener('error', function() { startFallbackTimer(); });
    setTimeout(function() {
      if (!dismissed && (vid.paused || vid.readyState < 2)) startFallbackTimer();
    }, 1200);
  } else { startFallbackTimer(); }

  setTimeout(dismissSplash, 7000);
})();
</script>
</body>
</html>\'\'\'

    splash_html = html_head + "    " + video_source + html_body
    import streamlit.components.v1 as components
    components.html(splash_html, height=0, scrolling=False)


if not st.session_state.intro_shown:
    st.markdown("""
<div id="bayora-curtain"></div>
<style id="bayora-curtain-style">
#bayora-curtain {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: #030712 !important;
    z-index: 2147483640 !important;
    pointer-events: none !important;
    animation: bayoraCurtainAutoFade 0.5s ease-out 6.5s forwards !important;
}
@keyframes bayoraCurtainAutoFade {
    0%, 90% { opacity: 1; visibility: visible; }
    100% { opacity: 0; visibility: hidden; pointer-events: none; }
}
iframe {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    border: none !important;
    z-index: 2147483647 !important;
    margin: 0 !important;
    padding: 0 !important;
}
</style>
""", unsafe_allow_html=True)
    render_fullscreen_splash()
    st.session_state.intro_shown = True
'''

start_marker = "def render_fullscreen_splash():"
end_marker = "# ==============================================================================\n# 8. CYBER GRID"

s_idx = code.find(start_marker)
e_idx = code.find(end_marker)

code = code[:s_idx] + clean_func + "\n\n" + code[e_idx:]

with open('dashboard.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated dashboard.py successfully.")
