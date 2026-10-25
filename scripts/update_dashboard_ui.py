with open('dashboard.py', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Page title & Icon
text = text.replace('page_title=Bayora Hardened AI Safety Mesh', 'page_title=Bayora: Adversarial AI Fortress & Red-Team Arena')
text = text.replace('page_icon=🛡️', 'page_icon=🦜')

# 2. Add custom styles
custom_css = '''
    /* Deep Oceanic Cyber-Pirate Theme */
    .stApp {
        background: radial-gradient(circle at top center, #071527 0%, #030712 100%) !important;
        color: #e2e8f0;
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace;
    }
    .char-card-red {
        border-radius: 12px;
        border: 1px solid rgba(239, 68, 68, 0.45);
        box-shadow: 0 0 25px rgba(239, 68, 68, 0.25);
        overflow: hidden;
        margin-bottom: 12px;
    }
    .char-card-blue {
        border-radius: 12px;
        border: 1px solid rgba(56, 189, 248, 0.45);
        box-shadow: 0 0 25px rgba(56, 189, 248, 0.25);
        overflow: hidden;
        margin-bottom: 12px;
    }
    .char-card-vault {
        border-radius: 12px;
        border: 1px solid rgba(245, 158, 11, 0.45);
        box-shadow: 0 0 25px rgba(245, 158, 11, 0.25);
        overflow: hidden;
        margin-bottom: 12px;
    }
    .banner-container {
        position: relative;
        width: 100%;
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid rgba(56, 189, 248, 0.5);
        box-shadow: 0 0 35px rgba(56, 189, 248, 0.3);
        margin-bottom: 18px;
    }
    .banner-badge {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(3, 7, 18, 0.92);
        backdrop-filter: blur(10px);
        border: 1px solid #38bdf8;
        padding: 6px 20px;
        border-radius: 25px;
        color: #38bdf8;
        font-family: monospace;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 2px;
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
        white-space: nowrap;
    }
    div[data-testid=stMetric] {
        background: rgba(11, 25, 44, 0.8) !important;
        border: 1px solid rgba(56, 189, 248, 0.25) !important;
        border-radius: 10px !important;
    }
'''

# Insert css into existing style block
text = text.replace('<style>', '<style>' + custom_css)

# 3. Top Banner Injection
banner_html = '''
# Top Cyber-Parrot Recon Drone Banner
if BANNER_B64:
    st.markdown(f"
    <div class=banner-container>
        <img src=data:image/png;base64,{BANNER_B64} style=width:100%; display:block; object-fit:cover; max-height:260px; />
        <div class=banner-badge>⚡ BAYORA: BLIND ADVERSARIAL EVALUATION SANDBOX • DEFCON-1 ⚡</div>
    </div>
    ", unsafe_allow_html=True)
'''

target_anchor = 'st.caption(Recursive De-Obfuscation Pipeline • Blind HMAC-SHA256 Ledger • Constant-Time Normalization Matrix)'
if 'banner-container' not in text:
    text = text.replace(target_anchor, target_anchor + '\n\n' + banner_html)

# 4. Column 1 Card: Pirate Captain
captain_html = '''
    if CAPTAIN_B64:
        st.markdown(f"
        <div class=char-card-red>
            <img src=data:image/png;base64,{CAPTAIN_B64} style=width:100%; display:block; />
        </div>
        ", unsafe_allow_html=True)
'''
c1_target = 'st.subheader(🔴 Adversarial Mutator vs 🔵 Sentinel)'
if 'char-card-red' not in text:
    text = text.replace(c1_target, c1_target + '\n' + captain_html)

# 5. Column 2 Card: Harbor Admiral
admiral_html = '''
    if ADMIRAL_B64:
        st.markdown(f"
        <div class=char-card-blue>
            <img src=data:image/png;base64,{ADMIRAL_B64} style=width:100%; display:block; />
        </div>
        ", unsafe_allow_html=True)
'''
c2_target = 'st.caption(Constant-Time Window (2.0s) & Live Evasion Resistance)'
if 'char-card-blue' not in text:
    text = text.replace(c2_target, c2_target + '\n' + admiral_html)

# 6. Column 3 Card: Kraken Vault
kraken_html = '''
    if KRAKEN_B64:
        st.markdown(f"
        <div class=char-card-vault>
            <img src=data:image/png;base64,{KRAKEN_B64} style=width:100%; display:block; />
        </div>
        ", unsafe_allow_html=True)
'''
c3_target = 'st.caption(Atomic lock protected: Zero race conditions or chain forks.)'
if 'char-card-vault' not in text:
    text = text.replace(c3_target, c3_target + '\n' + kraken_html)

with open('dashboard.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('DASHBOARD_UPGRADED_SUCCESSFULLY')
