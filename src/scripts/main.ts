type Theme = 'light' | 'dark';

const root = document.documentElement;

// ---------- Theme ----------
function applyTheme(theme: Theme) {
  root.dataset['theme'] = theme;
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

document.querySelector('[data-theme-toggle]')?.addEventListener('click', switchTheme);

// Follow the system theme while the user has not chosen one.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light');
});

// ---------- Mobile menu ----------
const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav');

function setMenu(open: boolean) {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute(
    'aria-label',
    (open ? menuButton.dataset['labelClose'] : menuButton.dataset['labelOpen']) ?? '',
  );
  mobileNav.classList.toggle('hidden', !open);
}

menuButton?.addEventListener('click', () =>
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true'),
);
mobileNav?.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('a')) setMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});

// ---------- Reveal on scroll ----------
const revealTargets = document.querySelectorAll('.reveal, .timeline-line');
if (root.classList.contains('motion') && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  revealTargets.forEach((el) => io.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}

// ---------- Active section (nav highlight + language switch keeps the section) ----------
let activeSection = '';
const navLinks = document.querySelectorAll<HTMLAnchorElement>('[data-nav]');
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) activeSection = entry.target.id;
    }
    navLinks.forEach((a) =>
      a.setAttribute('aria-current', String(a.dataset['nav'] === activeSection)),
    );
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
document.querySelectorAll('[data-section]').forEach((s) => sectionObserver.observe(s));

document.querySelector<HTMLAnchorElement>('[data-lang-switch]')?.addEventListener('click', (e) => {
  const link = e.currentTarget as HTMLAnchorElement;
  const hash = activeSection ? `#${activeSection}` : location.hash;
  if (hash) link.href = link.href.split('#')[0] + hash;
});
