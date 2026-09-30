// ÉTRAVE – page behaviour

// Drawing tabs (Profile / Body plan). The 3D view is not available yet.
(function () {
  const tabs = Array.from(document.querySelectorAll('.tabs [role="tab"]'))
    .filter((tab) => tab.getAttribute('aria-disabled') !== 'true');

  function select(tab) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      select(next);
    });
  });
})();

// "Suggest a feature" buttons open the repository's issue tracker.
// Set SUGGEST_URL to your repository's issues page, e.g.
// https://github.com/<user>/<repo>/issues/new
const SUGGEST_URL = 'https://github.com/ayoubais065-afk/etrave/issues/new';

if (SUGGEST_URL) {
  document.querySelectorAll('[data-suggest-link]').forEach((a) => {
    a.href = SUGGEST_URL;
    a.target = '_blank';
    a.rel = 'noopener';
  });
}
