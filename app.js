(() => {
  const { DETENTION, fmt, parse, buildSchedule, analyse } = Engine;
  const CFG = window.ATTENDANCE_DATA;
  const KEY = "attendance-predictor-v1";
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  const state = { section: Object.keys(CFG.sections)[0], target: 75, records: {}, leaves: {}, ...saved };
  if (!CFG.sections[state.section]) state.section = Object.keys(CFG.sections)[0];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

  // "Today" clamped to the semester window.
  const real = fmt(new Date());
  let today = real < CFG.start ? CFG.start : real > CFG.end ? CFG.end : real;

  const LABEL = { safe: "Safe", watch: "Watch", risk: "At risk", detention: "Detention zone" };
  const f = n => n.toFixed(1);

  function message(s, T) {
    if (s.level === "detention") {
      return s.mustAttend > s.remaining
        ? `⛔ Below ${DETENTION}% and ${T}% is out of reach. Best possible: ${f(s.best)}%.`
        : `🚨 Attend the next ${s.streak} classes in a row to reach ${T}%. Must attend ${s.mustAttend} of ${s.remaining} remaining.`;
    }
    if (s.canSkip < 0) return `⚠️ ${T}% is out of reach. Best possible: ${f(s.best)}%.`;
    const leaveNote = s.skipped ? ` Your planned leaves skip ${s.skipped} → ${f(s.projected)}%.` : "";
    return `✅ You can skip ${s.canSkip} of ${s.remaining} remaining classes and stay ≥ ${T}%.${leaveNote}`;
  }

  function card(s, T) {
    return `<article class="card ${s.level}">
      <h3>${esc(s.subject)}<span class="badge">${LABEL[s.level]}</span></h3>
      <div class="bar"><i style="width:${Math.min(100, s.pct)}%"></i><b style="left:${T}%"></b></div>
      <div class="pct">${f(s.pct)}% <small>${s.attended}/${s.conducted}</small></div>
      <p class="msg">${message(s, T)}</p>
      <p class="stats">Remaining: ${s.remaining} · Semester total: ${s.total} · Must attend: ${s.mustAttend}</p>
      <div class="inputs">
        <label>Attended<input type="number" min="0" data-s="${esc(s.subject)}" data-k="attended" value="${s.attended}"></label>
        <label>Conducted<input type="number" min="0" data-s="${esc(s.subject)}" data-k="conducted" value="${s.conducted}"></label>
      </div>
    </article>`;
  }

  function render() {
    const T = +state.target;
    const schedule = buildSchedule(CFG.sections[state.section], CFG);
    const leaves = new Set(state.leaves[state.section] || []);
    const { subjects, overall } = analyse(schedule, today, state.records[state.section] || {}, leaves, T);

    $("#overall").innerHTML = `<h2>Overall</h2>
      <span class="pct">${f(overall.pct)}%<small> now</small></span>
      <span class="pct">${f(overall.projected)}%<small> projected</small></span>
      <span class="badge">${LABEL[overall.level]}</span>`;
    $("#subjects").innerHTML = subjects.map(s => card(s, T)).join("");
    $("#chips").innerHTML = [...leaves].sort().map(d =>
      `<span class="chip">${d}<button data-del="${d}" aria-label="Remove ${d}">✕</button></span>`).join("");
  }

  // ---- events ----
  $("#section").innerHTML = Object.keys(CFG.sections).map(k => `<option>${esc(k)}</option>`).join("");
  $("#section").value = state.section;
  $("#target").value = state.target;
  $("#asof").value = today; $("#asof").min = CFG.start; $("#asof").max = CFG.end;
  $("#leaveFrom").min = $("#leaveTo").min = CFG.start; $("#leaveFrom").max = $("#leaveTo").max = CFG.end;

  $("#section").onchange = e => { state.section = e.target.value; save(); render(); };
  $("#target").onchange = e => { state.target = +e.target.value; save(); render(); };
  $("#asof").onchange = e => { if (e.target.value) { today = e.target.value; render(); } };

  $("#subjects").addEventListener("change", e => {
    const { s, k } = e.target.dataset; if (!s) return;
    const recs = (state.records[state.section] ||= {});
    (recs[s] ||= {})[k] = e.target.value;
    save(); render();
  });

  $("#addLeave").onclick = () => {
    const from = $("#leaveFrom").value, to = $("#leaveTo").value || from;
    if (!from || to < from) return;
    const set = new Set(state.leaves[state.section] || []);
    for (const d = parse(from), end = parse(to); d <= end; d.setDate(d.getDate() + 1)) {
      const k = fmt(d); if (k >= today && k <= CFG.end) set.add(k);
    }
    state.leaves[state.section] = [...set]; save(); render();
  };
  $("#clearLeaves").onclick = () => { state.leaves[state.section] = []; save(); render(); };
  $("#chips").addEventListener("click", e => {
    const d = e.target.dataset.del; if (!d) return;
    state.leaves[state.section] = (state.leaves[state.section] || []).filter(x => x !== d);
    save(); render();
  });

  render();
})();
