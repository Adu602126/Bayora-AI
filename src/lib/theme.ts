// Dark/Light mode store utility
// Reads/writes the 'safepath-theme' key in localStorage

export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('safepath-theme') as Theme) || 'dark';
}

export function setTheme(t: Theme) {
  localStorage.setItem('safepath-theme', t);
  applyTheme(t);
}

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'light') {
    root.style.setProperty('--bg',       '#f0f4ff');
    root.style.setProperty('--bg-2',     '#e4eaf8');
    root.style.setProperty('--bg-3',     '#d8e0f0');
    root.style.setProperty('--bg-4',     '#ccd5ea');
    root.style.setProperty('--bg-5',     '#bfcade');
    root.style.setProperty('--text',     '#0f172a');
    root.style.setProperty('--text-2',   '#334155');
    root.style.setProperty('--text-3',   '#64748b');
    root.style.setProperty('--border',   '#c8d3e8');
    root.style.setProperty('--border-2', '#b8c6e0');
    root.style.setProperty('--border-3', '#a8b8d8');
  } else {
    root.style.setProperty('--bg',       '#080d18');
    root.style.setProperty('--bg-2',     '#0e1628');
    root.style.setProperty('--bg-3',     '#141f35');
    root.style.setProperty('--bg-4',     '#1a2740');
    root.style.setProperty('--bg-5',     '#1f2f4a');
    root.style.setProperty('--text',     '#e8f0fe');
    root.style.setProperty('--text-2',   '#94a3b8');
    root.style.setProperty('--text-3',   '#546a8a');
    root.style.setProperty('--border',   '#1a2740');
    root.style.setProperty('--border-2', '#243352');
    root.style.setProperty('--border-3', '#2d3f5c');
  }
}
