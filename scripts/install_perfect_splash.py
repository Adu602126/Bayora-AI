with open('dashboard.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Update get_intro_video_base64 to auto-invalidate cache based on file mtime
old_cache_func = '''@st.cache_data(show_spinner=False)
def get_intro_video_base64():
    """Reads and encodes the intro video to base64 for instant zero-latency playback."""
    if os.path.exists(INTRO_VIDEO_PATH):
        try:
            with open(INTRO_VIDEO_PATH, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")
        except Exception:
            return None
    return None'''

new_cache_func = '''@st.cache_data(show_spinner=False)
def _get_intro_video_base64_cached(mtime: float):
    if os.path.exists(INTRO_VIDEO_PATH):
        try:
            with open(INTRO_VIDEO_PATH, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")
        except Exception:
            return None
    return None

def get_intro_video_base64():
    mtime = os.path.getmtime(INTRO_VIDEO_PATH) if os.path.exists(INTRO_VIDEO_PATH) else 0.0
    return _get_intro_video_base64_cached(mtime)'''

if old_cache_func in code:
    code = code.replace(old_cache_func, new_cache_func)
    print("Updated video cache function.")

# Now replace render_fullscreen_splash and its invocation
new_splash_implementation = '''def render_fullscreen_splash(force_replay=False):
    video_b64 = get_intro_video_base64()
    video_source = f'<source src="data:video/mp4;base64,{video_b64}" type="video/mp4">' if video_b64 else ''
    force_js = "true" if force_replay else "false"

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
  background: linear-gradient(to bottom, rgba(3,7,18,0.2) 0%, transparent 35%, rgba(3,7,18,0.72) 68%, rgba(3,7,18,0.96) 100%);
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
  var FORCE_REPLAY = \'\'\' + force_js + \'\'\';
  var dismissed = false;
  var splash  = document.getElementById('splash');
  var vid     = document.getElementById('bgvid');
  var fill    = document.getElementById('fill');
  var pctText = document.getElementById('pct-text');

  // Check if intro has already played in this browser tab
  var alreadyPlayed = false;
  try {
    alreadyPlayed = (window.parent && window.parent.__bayora_intro_done === true);
  } catch(e) {}

  if (alreadyPlayed && !FORCE_REPLAY) {
    // This is an in-dashboard widget click: do not show intro!
    if (window.frameElement) {
      window.frameElement.style.display = 'none';
      window.frameElement.style.height = '0px';
    }
    return;
  }

  // First time in this window or page reloaded: mark as played for future widget clicks
  try {
    if (window.parent) window.parent.__bayora_intro_done = true;
  } catch(e) {}

  // Apply parent fullscreen overlay style dynamically
  try {
    var pDoc = window.parent.document;
    var existingStyle = pDoc.getElementById('bayora-fullscreen-splash-style');
    if (!existingStyle) {
      var s = pDoc.createElement('style');
      s.id = 'bayora-fullscreen-splash-style';
      s.innerHTML = `
        [data-testid="stSidebar"], [data-testid="stSidebarCollapsedControl"], [data-testid="collapsedControl"], [data-testid="stHeader"], header {
          display: none !important;
        }
        .main .block-container, [data-testid="stAppViewContainer"] > .main {
          padding: 0 !important; margin: 0 !important; max-width: 100vw !important; width: 100vw !important; background: #030712 !important;
        }
        iframe {
          position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important;
          border: none !important; z-index: 2147483647 !important; margin: 0 !important; padding: 0 !important;
        }
      `;
      pDoc.head.appendChild(s);
    }
  } catch(e) {}

  function dismissSplash() {
    if (dismissed) return;
    dismissed = true;
    splash.classList.add('hidden');
    setTimeout(function() {
      try {
        var pDoc = window.parent.document;
        var s = pDoc.getElementById('bayora-fullscreen-splash-style');
        if (s) s.remove();
        if (window.frameElement) {
          window.frameElement.style.opacity = '0';
          window.frameElement.style.display = 'none';
          window.frameElement.style.height = '0px';
        }
      } catch(e) {}
    }, 350);
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
      setTimeout(dismissSplash, 200);
    });
    vid.addEventListener('error', function() { startFallbackTimer(); });
    setTimeout(function() {
      if (!dismissed && (vid.paused || vid.readyState < 2)) startFallbackTimer();
    }, 1200);
  } else { startFallbackTimer(); }

  setTimeout(dismissSplash, 6500);
})();
</script>
</body>
</html>\'\'\'

    splash_html = html_head + "    " + video_source + html_body
    import streamlit.components.v1 as components
    components.html(splash_html, height=0, scrolling=False)


# Trigger splash on fresh browser load or explicit replay
force_intro = st.session_state.get("force_intro", False)
if force_intro:
    st.session_state["force_intro"] = False
render_fullscreen_splash(force_replay=force_intro)
'''

start_marker = "def render_fullscreen_splash():"
end_marker = "# ==============================================================================\n# 8. CYBER GRID"

s_idx = code.find(start_marker)
e_idx = code.find(end_marker)

code = code[:s_idx] + new_splash_implementation + "\n\n" + code[e_idx:]

# Also update the sidebar button to set force_intro = True
code = code.replace(
    'st.session_state.intro_shown = False',
    'st.session_state["force_intro"] = True'
)

with open('dashboard.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Installed perfect splash system.")
