(function attachGlobalFitLetters(){
  if (typeof window === 'undefined') return;
  if (window.__fitLettersAttached__) return;
  window.__fitLettersAttached__ = true;

  function fitLettersFor(el) {
    if (!el) return;

    el.style.transform = 'none';
    el.style.whiteSpace = 'nowrap';

    const parent = el.parentElement;
    if (!parent) return;

    const available = parent.getBoundingClientRect().width || 0;
    const actual = el.scrollWidth || 0;
    if (!available || !actual) return;

    const scale = Math.min(1, available / actual);
    if (scale < 1) {
      el.style.transform = `scale(${scale})`;
    } else {
      el.style.transform = 'none';
    }
  }

  function fitAllLetterRows() {
    document.querySelectorAll('.letter-row').forEach(fitLettersFor);
  }

  window.GameUI = window.GameUI || {};
  window.GameUI.fitLettersFor = fitLettersFor;
  window.GameUI.fitAllLetterRows = fitAllLetterRows;

  let rafId = null;
  function scheduleReflow() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      fitAllLetterRows();
    });
  }

  window.addEventListener('resize', scheduleReflow, { passive: true });
  window.addEventListener('orientationchange', scheduleReflow);

  const roSupported = typeof ResizeObserver !== 'undefined';
  if (roSupported) {
    const ro = new ResizeObserver(() => scheduleReflow());
    const observed = new WeakSet();

    const observeTargets = () => {
      document.querySelectorAll('.letter-row').forEach(el => {
        if (!observed.has(el)) {
          ro.observe(el);
          observed.add(el);
        }
        const parent = el.parentElement;
        if (parent && !observed.has(parent)) {
          ro.observe(parent);
          observed.add(parent);
        }
      });
    };

    observeTargets();

    const mo = new MutationObserver(() => {
      observeTargets();
      scheduleReflow();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } else {
    const mo = new MutationObserver(scheduleReflow);
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fitAllLetterRows, { once: true });
  } else {
    fitAllLetterRows();
  }
})();
