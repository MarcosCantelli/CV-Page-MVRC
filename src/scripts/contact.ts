import { HONEYPOT_FIELD, invalidFields, type ContactErrorCode } from '../lib/contact-schema';

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id?: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onTurnstileLoad?: () => void;
  }
}

const TURNSTILE_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';

export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('#contact-form');
  if (!form) return;

  const messages = JSON.parse(form.dataset['messages'] ?? '{}') as Record<string, string>;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const buttonLabel = form.querySelector<HTMLElement>('[data-submit-label]')!;
  const widget = form.querySelector<HTMLElement>('[data-turnstile]')!;
  let token = '';
  let widgetId: string | undefined;

  // Load Turnstile only when the form gets close to the viewport.
  const loadTurnstile = () => {
    if (document.querySelector(`script[src^="${TURNSTILE_SRC.split('?')[0]}"]`)) return;
    window.onTurnstileLoad = () => {
      widgetId = window.turnstile?.render(widget, {
        sitekey: form.dataset['sitekey'],
        language: form.dataset['lang'] === 'en' ? 'en' : 'pt-br',
        theme: document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light',
        callback: (t: string) => (token = t),
        'expired-callback': () => (token = ''),
        'error-callback': () => (token = ''),
      });
    };
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    document.head.append(s);
  };
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        loadTurnstile();
        io.disconnect();
      }
    },
    { rootMargin: '400px' },
  );
  io.observe(form);
  form.addEventListener('focusin', loadTurnstile, { once: true });

  const showErrors = (codes: ContactErrorCode[]) => {
    form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((el) => {
      const field = el.dataset['errorFor'] as ContactErrorCode;
      const invalid = codes.includes(field);
      el.classList.toggle('hidden', !invalid);
      form.querySelector(`[name="${field}"]`)?.setAttribute('aria-invalid', String(invalid));
    });
    const general = codes.find((c) => ['captcha', 'rate_limited', 'server'].includes(c));
    setStatus(general ? messages[general] : '', 'error');
  };

  const setStatus = (text = '', kind: 'error' | 'success' = 'error') => {
    status.textContent = text;
    status.className = `text-sm ${kind === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const payload = {
      name: data['name'] ?? '',
      email: data['email'] ?? '',
      company: data['company'] || undefined,
      message: data['message'] ?? '',
      [HONEYPOT_FIELD]: data[HONEYPOT_FIELD] ?? '',
      turnstileToken: token,
      lang: form.dataset['lang'],
    };

    const invalid = invalidFields(payload);
    if (invalid.length) {
      showErrors(invalid);
      form.querySelector<HTMLElement>(`[name="${invalid[0]}"]`)?.focus();
      return;
    }
    if (!token) {
      showErrors(['captcha']);
      return;
    }
    showErrors([]);

    button.disabled = true;
    const original = buttonLabel.textContent;
    buttonLabel.textContent = form.dataset['sending'] ?? '…';
    try {
      const res = await fetch(form.dataset['endpoint']!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        errors?: ContactErrorCode[];
      };
      if (res.ok && body.ok) {
        form.reset();
        setStatus(messages['success'], 'success');
      } else {
        showErrors(body.errors?.length ? body.errors : ['server']);
      }
    } catch {
      setStatus(messages['network'], 'error');
    } finally {
      token = '';
      window.turnstile?.reset(widgetId);
      button.disabled = false;
      buttonLabel.textContent = original;
    }
  });
}
