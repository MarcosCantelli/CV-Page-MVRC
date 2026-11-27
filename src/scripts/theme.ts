// Theme switch (light/dark). Shared by the home pages (via main.ts) and the 404 page.
// The first paint is handled by the inline script in layouts/Base.astro; this one wires the button.
type Theme = 'light' | 'dark';

const root = document.documentElement;

function applyTheme(theme: Theme) {
  root.dataset['theme'] = theme;
  // Keep the browser UI color in sync with the page, whatever the system preference is.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"][data-for]').forEach((m) => {
    m.setAttribute('media', m.dataset['for'] === theme ? 'all' : 'not all');
  });
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(theme === 'dark'));
  });
}

function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

function switchTheme() {
  const next: Theme = root.dataset['theme'] === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* storage unavailable: theme still changes for this page view */
  }
  const reduced = !root.classList.contains('motion');
  if (!reduced && 'startViewTransition' in document) {
    document.startViewTransition(() => applyTheme(next));
    return;
  }
  if (!reduced) {
    root.classList.add('theme-transition');
    setTimeout(() => root.classList.remove('theme-transition'), 350);
  }
  applyTheme(next);
}

// The server cannot know the theme, so expose the real state as soon as the script runs.
applyTheme(root.dataset['theme'] === 'dark' ? 'dark' : 'light');

document.querySelector('[data-theme-toggle]')?.addEventListener('click', switchTheme);

// Follow the system theme while the user has not chosen one.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light');
});
