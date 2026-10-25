import os
import re

with open('dashboard.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Add base64 helper
helper = '''
def get_image_base64(path: str) -> str:
    if os.path.exists(path):
        with open(path, rb) as img_f:
            return base64.b64encode(img_f.read()).decode(utf-8)
    return "

BANNER_B64 = get_image_base64(assets/banner_recon_parrot.png)
CAPTAIN_B64 = get_image_base64(assets/captain_red_team.png)
ADMIRAL_B64 = get_image_base64(assets/admiral_blue_team.png)
KRAKEN_B64 = get_image_base64(assets/kraken_ledger_vault.png)
'''

if 'BANNER_B64' not in text:
 anchor = '# --- ADVANCED GAP FIX'
 text = text.replace(anchor, helper + '\n\n' + anchor)

with open('dashboard.py', 'w', encoding='utf-8') as f:
 f.write(text)

print('SUCCESS')
