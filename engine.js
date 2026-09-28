// Pure logic (no DOM) so it is easy to test. Also usable from Node.
const Engine = (() => {
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DETENTION = 75;
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const num = (v, fallback) => (v !== "" && v != null && Number.isFinite(+v) ? Math.max(0, Math.floor(+v)) : fallback);

  // Expand the weekly timetable into every class between start and end (skipping holidays).
  function buildSchedule(timetable, cfg) {
    const out = [], holidays = new Set(cfg.holidays || []);
    for (const d = parse(cfg.start), end = parse(cfg.end); d <= end; d.setDate(d.getDate() + 1)) {
      const date = fmt(d);
      if (holidays.has(date)) continue;
      for (const subject of timetable[DAYS[d.getDay()]] || []) out.push({ date, subject });
    }
    return out;
  }

  function metrics(subject, a, c, remaining, skipped, T) {
    const total = c + remaining;                                   // classes in whole semester
    const pct = c ? (100 * a) / c : 100;                           // attendance right now
    const projected = total ? (100 * (a + remaining - skipped)) / total : 100; // after planned leaves
    const best = total ? (100 * (a + remaining)) / total : 100;    // if you attend everything left
    const mustAttend = Math.max(0, Math.ceil((T * total) / 100) - a); // of remaining, to end at >= T
    const canSkip = remaining - mustAttend;                        // negative => target unreachable
    const streak = pct >= T || T >= 100 ? 0 : Math.ceil((T * c - 100 * a) / (100 - T)); // consecutive classes to recover
    const level = pct < DETENTION ? "detention" : projected < DETENTION ? "risk" : projected < T ? "watch" : "safe";
    return { subject, attended: a, conducted: c, remaining, skipped, total, pct, projected, best, mustAttend, canSkip, streak, level };
  }

  // records: { subject: {attended, conducted} } from the portal; leaves: Set of planned-absence dates.
  function analyse(schedule, today, records, leaves, target) {
    const by = new Map();
    for (const { date, subject } of schedule) {
      const s = by.get(subject) || by.set(subject, { subject, past: 0, remaining: 0, skipped: 0 }).get(subject);
      if (date < today) s.past++;
      else { s.remaining++; if (leaves.has(date)) s.skipped++; }
    }
    const subjects = [...by.values()].map(s => {
      const r = records[s.subject] || {};
      const conducted = num(r.conducted, s.past);
      const attended = Math.min(num(r.attended, conducted), conducted);
      return metrics(s.subject, attended, conducted, s.remaining, s.skipped, target);
    });
    const sum = k => subjects.reduce((t, s) => t + s[k], 0);
    const overall = metrics("Overall", sum("attended"), sum("conducted"), sum("remaining"), sum("skipped"), target);
    return { subjects, overall };
  }

  return { DAYS, DETENTION, fmt, parse, buildSchedule, analyse };
})();
if (typeof module !== "undefined") module.exports = Engine;
