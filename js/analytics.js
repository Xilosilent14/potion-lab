/* Jack's Potion Lab — Structured Analytics v1.0
   Lightweight in-memory event log + localStorage ring buffer.
   Events live under the [bbg.analytics] console tag for build/audit pipelines,
   and are persisted under `potion_lab_events` (last 200 events) so a parent
   dashboard or external sync can read them later. No PII, no network.
*/
const PotionAnalytics = (() => {
  const KEY = 'potion_lab_events';
  const MAX = 200;
  let buf = [];
  let sessionId = 'pl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  let sessionStart = Date.now();

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      buf = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(buf)) buf = [];
    } catch (_) { buf = []; }
  }
  function _persist() {
    try { localStorage.setItem(KEY, JSON.stringify(buf.slice(-MAX))); } catch (_) {}
  }

  function emit(name, props) {
    const evt = {
      n: name,
      t: Date.now(),
      s: sessionId,
      p: props || {}
    };
    buf.push(evt);
    if (buf.length > MAX) buf = buf.slice(-MAX);
    _persist();
    try { console.log('[bbg.analytics]', JSON.stringify(Object.assign({ game: 'potionlab' }, evt))); } catch (_) {}
    return evt;
  }

  function roomEnter(roomId, potionId) {
    emit('room_enter', { room: roomId, potion: potionId });
  }
  function questionAnswered(type, correct, ms, conceptId) {
    emit('question_answer', { type: type, correct: !!correct, ms: ms || 0, c: conceptId || '' });
  }
  function potionEarned(potionId, name, roomId) {
    emit('potion_earned', { id: potionId, name: name, room: roomId });
  }
  function hintUsed(type, level) {
    // level: 'pulse' (gentle), 'sally' (text), 'wrong' (after wrong answer)
    emit('hint_used', { type: type, level: level || 'sally' });
  }
  function variableRewardFired(kind, value) {
    emit('variable_reward', { kind: kind, value: value });
  }
  function sessionEnd(reason) {
    emit('session_end', { reason: reason || 'normal', duration_ms: Date.now() - sessionStart });
  }
  function sessionRestart() {
    sessionId = 'pl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    sessionStart = Date.now();
    emit('session_start', {});
  }

  function getEvents() { return buf.slice(); }
  function clear() { buf = []; _persist(); }

  _load();
  // Session start fired automatically once
  emit('session_start', {});

  return {
    emit,
    roomEnter, questionAnswered, potionEarned, hintUsed, variableRewardFired,
    sessionEnd, sessionRestart,
    getEvents, clear
  };
})();
