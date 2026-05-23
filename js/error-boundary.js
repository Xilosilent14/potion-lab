/* Jack's Potion Lab — Error Boundary v1.0
   Structured runtime + promise rejection logger.
   Emits one-line JSON tagged [bbg.err] so the build/audit tools can grep for issues.
*/
(function () {
  if (window.__bbgErrBoundary) return;
  window.__bbgErrBoundary = true;

  function _safe(obj) {
    try { return JSON.stringify(obj); } catch (_) { return '"<unstringifiable>"'; }
  }

  function _emit(payload) {
    try {
      console.error('[bbg.err]', _safe(Object.assign({ game: 'potionlab', ts: Date.now() }, payload)));
    } catch (_) { /* never throw from the logger */ }
  }

  window.addEventListener('error', function (e) {
    _emit({
      kind: 'error',
      msg: (e && e.message) || 'unknown',
      src: (e && e.filename) || '',
      line: (e && e.lineno) || 0,
      col: (e && e.colno) || 0,
      stack: (e && e.error && e.error.stack) ? String(e.error.stack).slice(0, 600) : ''
    });
  });

  window.addEventListener('unhandledrejection', function (e) {
    var reason = e && e.reason;
    var msg = '';
    var stack = '';
    if (reason && typeof reason === 'object') {
      msg = reason.message || String(reason);
      stack = reason.stack ? String(reason.stack).slice(0, 600) : '';
    } else {
      msg = String(reason);
    }
    _emit({ kind: 'rejection', msg: msg, stack: stack });
  });
})();
