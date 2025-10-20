(function attachGameTouchKeyboard(){
  if (typeof window === 'undefined') return;
  if (window.GameTouchKeyboard) return;

  const panel = document.getElementById('gameTouchControls');
  const labelEl = document.getElementById('gameTouchLabel');
  const keyboardWrapper = panel ? panel.querySelector('[data-virtual-keyboard]') : null;
  const keyboardRoot = panel ? panel.querySelector('[data-keyboard-root]') : null;
  const keyboardContainer = panel ? panel.querySelector('.simple-keyboard') : null;
  const closeBtn = panel ? panel.querySelector('[data-touch-close]') : null;

  const defaultLayout = [
    'Q W E R T Y U I O P',
    'A S D F G H J K L',
    'Z X C V B N M'
  ];

  const state = {
    isTouch: detectTouch(),
    keyboard: null,
    active: null,
    pending: null,
    visible: false,
    hideTimer: null,
    resizeHandler: null,
    paddingTarget: null,
    appliedThemeKeys: [],
    keyFlashTimers: new Map()
  };

  function detectTouch(){
    if (typeof window === 'undefined') return false;
    const hasTouchEvent = 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch);
    const hasTouchPoints = (navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0) > 0;
    const coarsePointer = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)').matches : false;
    return hasTouchEvent || hasTouchPoints || coarsePointer;
  }

  function computeKeys(rows){
    return rows
      .join(' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function isLetterKey(key){
    return typeof key === 'string' && key.length === 1 && /[a-z]/i.test(key);
  }

  function isSpaceKey(key){
    return typeof key === 'string' && key.toLowerCase() === 'space';
  }

  function keyDisplayLabel(key){
    if(isSpaceKey(key)) return 'Space';
    if(isLetterKey(key)) return key.toUpperCase();
    return key;
  }

  function ariaLabelForKey(key){
    if(isSpaceKey(key)) return 'Space key';
    if(isLetterKey(key)) return `Letter ${key.toUpperCase()}`;
    return `Key ${key}`;
  }

  function dataLetterForKey(key){
    if(isSpaceKey(key)) return 'SPACE';
    if(typeof key === 'string') return key.toUpperCase();
    return '';
  }

  function normalizeVirtualKey(button){
    if(typeof button !== 'string') return null;
    if(isSpaceKey(button)) return { value: ' ', label: 'Space' };
    if(isLetterKey(button)) return { value: button.toLowerCase(), label: button };
    return null;
  }

  function ensureKeyboard(options = {}){
    if (!panel || !keyboardWrapper || !keyboardRoot || !keyboardContainer) {
      return Promise.resolve(null);
    }
    if (!window.SimpleKeyboardLoader) {
      return Promise.resolve(null);
    }
    return window.SimpleKeyboardLoader
      .load()
      .then(KeyboardCtor => {
        if (!KeyboardCtor) return null;
        if (!state.keyboard) {
          state.keyboard = new KeyboardCtor(keyboardContainer, {
            layout: { default: defaultLayout },
            mergeDisplay: true,
            display: {},
            theme: 'hg-theme-default game-touch-keyboard',
            useButtonTag: true,
            preventMouseDownDefault: true,
            onKeyPress: handleVirtualKeyPress
          });
        }
        configureKeyboard(options);
        return state.keyboard;
      })
      .catch(() => null);
  }

  function configureKeyboard(options = {}){
    if (!state.keyboard) return;
    const layoutRows = Array.isArray(options.layout)
      ? options.layout
      : (options.layout && Array.isArray(options.layout.default))
        ? options.layout.default
        : defaultLayout;
    const layout = { default: layoutRows };
    const keys = computeKeys(layoutRows);
    const display = keys.reduce((acc, key) => {
      acc[key] = keyDisplayLabel(key);
      return acc;
    }, {});
    const attributes = keys.flatMap(key => ([
      { attribute: 'aria-label', value: ariaLabelForKey(key), button: key },
      { attribute: 'data-letter', value: dataLetterForKey(key), button: key }
    ]));

    state.keyboard.setOptions({
      layout,
      display,
      mergeDisplay: true,
      buttonAttributes: attributes,
      theme: 'hg-theme-default game-touch-keyboard',
      onKeyPress: handleVirtualKeyPress,
      useButtonTag: true
    });

    if (keyboardWrapper) {
      keyboardWrapper.querySelectorAll('.hg-button.is-flashing').forEach(btn => btn.classList.remove('is-flashing'));
    }
  }

  function applyTheme(theme){
    if (!panel) return;
    if (state.appliedThemeKeys.length) {
      state.appliedThemeKeys.forEach(key => panel.style.removeProperty(key));
      state.appliedThemeKeys = [];
    }
    if (!theme || typeof theme !== 'object') return;
    Object.entries(theme).forEach(([key, value]) => {
      if (!key) return;
      if (value == null) {
        panel.style.removeProperty(key);
        return;
      }
      panel.style.setProperty(key, value);
      state.appliedThemeKeys.push(key);
    });
  }

  function updateLabel(text){
    if (!labelEl) return;
    labelEl.textContent = text || 'Tap letters to play';
  }

  function updatePadding(connection){
    if (!state.visible || !panel) return;
    const paddingTarget = getPaddingTarget(connection);
    state.paddingTarget = paddingTarget || null;
    if (!paddingTarget) return;
    const height = Math.round(panel.offsetHeight || 0);
    if (height > 0) {
      paddingTarget.style.paddingBottom = `${height + 36}px`;
    } else {
      paddingTarget.style.removeProperty('padding-bottom');
    }
  }

  function getPaddingTarget(connection){
    if (!connection) return document.querySelector('.game-shell');
    const { getPaddingTarget } = connection.options || {};
    if (typeof getPaddingTarget === 'function') {
      try {
        const target = getPaddingTarget();
        if (target instanceof HTMLElement) return target;
      } catch (_) {
        /* swallow */
      }
    }
    return document.querySelector('.game-shell');
  }

  function ensureVisible(connection, opts = {}){
    if (!state.visible || !panel) return;
    const anchor = opts.anchor || getViewportAnchor(connection);
    if (!anchor || typeof anchor.getBoundingClientRect !== 'function') return;
    const anchorRect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    if (anchorRect.bottom > panelRect.top - 12) {
      const offset = anchorRect.bottom - panelRect.top + 24;
      window.scrollBy({ top: offset, behavior: 'smooth' });
    }
  }

  function getViewportAnchor(connection){
    if (!connection) return null;
    const getter = connection.options?.getViewportTarget;
    if (typeof getter === 'function') {
      try {
        const el = getter();
        if (el instanceof HTMLElement) return el;
      } catch (_) {
        /* ignore */
      }
    }
    return null;
  }

  function handleVirtualKeyPress(button){
    if (!state.active) return;
    const normalized = normalizeVirtualKey(button);
    if (!normalized) return;
    state.active.options?.onKeyPress?.(normalized.value, { source: 'virtual', original: button });
    flashKey(normalized.value);
  }

  function flashKey(char){
    if (!state.visible || !keyboardWrapper) return;
    if (typeof char !== 'string' || char.length !== 1) return;
    if (char === ' ') {
      const spaceButton = keyboardWrapper.querySelector('.hg-button[data-letter="SPACE"]');
      if (!spaceButton) return;
      spaceButton.classList.add('is-flashing');
      const timers = state.keyFlashTimers;
      if (timers.has('SPACE')) {
        clearTimeout(timers.get('SPACE'));
      }
      const timer = window.setTimeout(() => {
        spaceButton.classList.remove('is-flashing');
        timers.delete('SPACE');
      }, 180);
      timers.set('SPACE', timer);
      return;
    }
    const letter = char.toUpperCase();
    if (!/[A-Z]/.test(letter)) return;
    const btn = keyboardWrapper.querySelector(`.hg-button[data-letter="${letter}"]`);
    if (!btn) return;
    btn.classList.add('is-flashing');
    const timers = state.keyFlashTimers;
    if (timers.has(letter)) {
      clearTimeout(timers.get(letter));
    }
    const timer = window.setTimeout(() => {
      btn.classList.remove('is-flashing');
      timers.delete(letter);
    }, 180);
    timers.set(letter, timer);
  }

  function clearFlashTimers(){
    state.keyFlashTimers.forEach(timer => window.clearTimeout(timer));
    state.keyFlashTimers.clear();
    if (keyboardWrapper) {
      keyboardWrapper.querySelectorAll('.hg-button.is-flashing').forEach(btn => btn.classList.remove('is-flashing'));
    }
  }

  function activatePanel(connection){
    if (!panel) return;
    state.visible = true;
    panel.classList.remove('hidden');
    panel.style.removeProperty('display');
    panel.setAttribute('aria-hidden', 'false');
    if (keyboardWrapper) {
      keyboardWrapper.classList.remove('hidden');
      keyboardWrapper.style.removeProperty('display');
      keyboardWrapper.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('game-touch-keyboard-open');
    requestAnimationFrame(() => {
      panel.classList.add('is-active');
      updatePadding(connection);
      window.setTimeout(() => {
        updatePadding(connection);
        ensureVisible(connection);
        window.GameUI?.fitAllLetterRows?.();
      }, 200);
    });

    state.resizeHandler = () => {
      updatePadding(connection);
      ensureVisible(connection);
    };
    window.addEventListener('resize', state.resizeHandler);
    window.addEventListener('orientationchange', state.resizeHandler);
  }

  function deactivatePanel(connection){
    if (!panel) return;
    if (!state.visible) return;
    state.visible = false;
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('is-active');
    document.body.classList.remove('game-touch-keyboard-open');
    if (state.resizeHandler) {
      window.removeEventListener('resize', state.resizeHandler);
      window.removeEventListener('orientationchange', state.resizeHandler);
      state.resizeHandler = null;
    }
    clearFlashTimers();
    if (state.paddingTarget) {
      state.paddingTarget.style.removeProperty('padding-bottom');
      state.paddingTarget = null;
    }
    window.GameUI?.fitAllLetterRows?.();
    if (state.hideTimer) {
      clearTimeout(state.hideTimer);
    }
    state.hideTimer = window.setTimeout(() => {
      if (keyboardWrapper) {
        keyboardWrapper.classList.add('hidden');
        keyboardWrapper.style.display = 'none';
        keyboardWrapper.setAttribute('aria-hidden', 'true');
      }
      panel.classList.add('hidden');
      panel.style.display = 'none';
    }, 360);
    connection?.options?.onHide?.();
  }

  function mergeOptions(connection, overrides = {}){
    if (!connection || !overrides) return;
    connection.options = Object.assign({}, connection.options, overrides);
  }

  function show(connection, overrides = {}){
    if (!state.isTouch) return;
    if (!panel) return;
    mergeOptions(connection, overrides);
    state.pending = connection;
    if (state.active && state.active !== connection) {
      hide(state.active);
    }
    const { label, theme } = connection.options || {};
    updateLabel(label);
    applyTheme(theme);
    ensureKeyboard(connection.options).then(keyboard => {
      if (!keyboard) return;
      if (state.pending !== connection) return;
      state.active = connection;
      state.pending = null;
      activatePanel(connection);
      connection.options?.onShow?.();
    });
  }

  function hide(connection){
    if (!panel) return;
    if (connection && state.active && state.active !== connection) return;
    if (!state.visible) {
      if (state.active === connection) {
        state.active = null;
      }
      return;
    }
    const active = state.active;
    state.active = null;
    state.pending = null;
    deactivatePanel(active);
  }

  function ensureAnchor(connection, anchor){
    if (!panel) return;
    ensureVisible(connection, { anchor });
  }

  function updateActiveOptions(connection){
    if (connection !== state.active) return;
    const { label, theme } = connection.options || {};
    updateLabel(label);
    applyTheme(theme);
    configureKeyboard(connection.options);
    updatePadding(connection);
  }

  function attach(options = {}){
    const connection = {
      id: options.id || `touch-keyboard-${Math.random().toString(36).slice(2, 8)}`,
      options: Object.assign({
        label: 'Tap letters to play',
        layout: defaultLayout,
        theme: null,
        onKeyPress: null,
        onShow: null,
        onHide: null,
        getPaddingTarget: null,
        getViewportTarget: null
      }, options || {})
    };

    return {
      isTouchDevice: () => state.isTouch,
      show(extra) {
        show(connection, extra);
      },
      hide() {
        hide(connection);
      },
      flashKey(char) {
        flashKey(char);
      },
      setLabel(text) {
        connection.options.label = text;
        updateActiveOptions(connection);
      },
      setTheme(theme) {
        connection.options.theme = theme || null;
        updateActiveOptions(connection);
      },
      ensureVisible(anchor) {
        ensureAnchor(connection, anchor);
      },
      update(extra) {
        mergeOptions(connection, extra);
        updateActiveOptions(connection);
      }
    };
  }

  window.GameTouchKeyboard = {
    attach,
    flashKey,
    hide: hide.bind(null, null),
    isTouchDevice: () => state.isTouch
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', () => hide());
  }
})();
