"""Patch 3 fixes: loader lower, title removed, no dashboard scroll push."""
content = open('dashboard.py', 'r', encoding='utf-8').read()

# ── Fix 1: loader lower (margin-bottom 10% → 3%) and compact padding ─────────
content = content.replace(
    'margin-bottom: 10%; padding: 20px 26px 16px; border-radius: 16px;',
    'margin-bottom: 3%; padding: 16px 24px 14px; border-radius: 16px;'
)

# ── Fix 2: center the header (title will be hidden) ───────────────────────────
content = content.replace(
    '#loader-header { display: flex; justify-content: space-between; align-items: center; }',
    '#loader-header { display: flex; justify-content: center; align-items: center; }'
)

# ── Fix 3: hide title CSS ─────────────────────────────────────────────────────
content = content.replace(
    '#loader-title { display: flex; align-items: center; gap: 9px; font-size: 13px;\n'
    '  font-weight: 800; letter-spacing: 2px; color: #f0f6ff; text-transform: uppercase;\n'
    '  text-shadow: 0 0 10px rgba(0,208,255,.85); }\n'
    '#loader-title .icon { font-size: 19px; filter: drop-shadow(0 0 7px #00D0FF); }',
    '#loader-title { display: none; }'
)

# ── Fix 4: hide status subtext CSS ───────────────────────────────────────────
content = content.replace(
    '#loader-status { display: flex; justify-content: space-between; font-size: 11px;\n'
    '  font-weight: 700; color: #7a90a8; letter-spacing: 1.4px; }',
    '#loader-status { display: none; }'
)

# ── Fix 5: bigger pct text since it's now the only thing ─────────────────────
content = content.replace(
    "#pct-text { font-family: 'Courier New', monospace; font-size: 18px; font-weight: 900;\n"
    '  color: #00D0FF; letter-spacing: 2px;\n'
    '  text-shadow: 0 0 14px #00D0FF, 0 0 28px rgba(0,208,255,.65); }',
    "#pct-text { font-family: 'Courier New', monospace; font-size: 22px; font-weight: 900;\n"
    '  color: #00D0FF; letter-spacing: 3px;\n'
    '  text-shadow: 0 0 16px #00D0FF, 0 0 32px rgba(0,208,255,.7); }'
)

# ── Fix 6: components.html height=0 so iframe takes zero space in dashboard ───
content = content.replace(
    'components.html(splash_html, height=700, scrolling=False)',
    'components.html(splash_html, height=0, scrolling=False)'
)

open('dashboard.py', 'w', encoding='utf-8').write(content)
print('Done, length:', len(content))
# verify changes
import subprocess
result = subprocess.run(['python', '-m', 'py_compile', 'dashboard.py'], capture_output=True, text=True)
if result.returncode == 0:
    print('SYNTAX OK')
else:
    print('SYNTAX ERROR:', result.stderr)
