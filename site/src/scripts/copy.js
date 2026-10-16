// Copy buttons: any [data-copy] button copies its data-copy-text, or the text
// of the element named by data-copy-target. Delegated, so it covers markup
// added later.
let live;

function announce(message) {
  if (!live) {
    live = document.createElement('div');
    live.className = 'visually-hidden';
    live.setAttribute('aria-live', 'polite');
    document.body.append(live);
  }
  live.textContent = '';
  requestAnimationFrame(() => (live.textContent = message));
}

async function writeText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  const target = button.dataset.copyTarget && document.getElementById(button.dataset.copyTarget);
  const text = button.dataset.copyText ?? target?.textContent ?? button.closest('.cmd')?.querySelector('pre')?.textContent ?? '';
  if (!text.trim()) return;
  const ok = await writeText(text.trim());
  const label = button.querySelector('[data-copy-label]') ?? button;
  const original = label.dataset.original ?? label.textContent;
  label.dataset.original = original;
  label.textContent = ok ? 'Copied' : 'Copy failed';
  button.toggleAttribute('data-copied', ok);
  announce(ok ? 'Copied to clipboard' : 'Copy failed');
  clearTimeout(button._copyTimer);
  button._copyTimer = setTimeout(() => {
    label.textContent = original;
    button.removeAttribute('data-copied');
  }, 1800);
});
