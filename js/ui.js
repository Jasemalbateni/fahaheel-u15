/* أدوات مشتركة: تواريخ، نوافذ، رسوم بيانية، حسابات */
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- dates (all ISO yyyy-mm-dd, local) ---------- */
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const pd = (s) => { const [y, m, d] = String(s).slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return iso(d); };
  const diffDays = (a, b) => Math.round((pd(a) - pd(b)) / 864e5);
  const weekStart = (s) => addDays(s, -pd(s).getDay());
  const dayName = (s) => DAYS[pd(s).getDay()];
  const fmtD = (s) => { if (!s) return "—"; const d = pd(s); return d.getDate() + "/" + (d.getMonth() + 1); };
  const fmtFull = (s) => { if (!s) return "—"; const d = pd(s); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(); };
  const fmtLong = (s) => { if (!s) return "—"; const d = pd(s); return DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()]; };
  const relDay = (s) => { const n = diffDays(s, today()); return n === 0 ? "اليوم" : n === 1 ? "بكرة" : n === -1 ? "أمس" : n > 1 ? "بعد " + n + " " + (n <= 10 ? "أيام" : "يوم") : "قبل " + -n + " " + (-n <= 10 ? "أيام" : "يوم"); };
  const age = (dob) => { if (!dob) return null; const d = pd(dob), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a; };

  /* ---------- toast + modal ---------- */
  let toastEl = null;
  function toast(text, err) {
    if (toastEl) toastEl.remove();
    toastEl = document.createElement("div");
    toastEl.className = "toast2" + (err ? " err" : ""); toastEl.setAttribute("role", "status"); toastEl.textContent = text;
    document.body.appendChild(toastEl);
    const me = toastEl; setTimeout(() => me.remove(), 3000);
  }
  const X = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  /** modal({title, body, foot, wide, onMount}) -> { el, close } ; buttons with data-close close it */
  function modal(o) {
    const w = document.createElement("div");
    w.className = "modal-back";
    w.innerHTML = `<div class="modal${o.wide ? " wide" : ""}" role="dialog" aria-modal="true"><header><h4>${esc(o.title)}</h4><button type="button" data-close aria-label="إغلاق">${X}</button></header><div class="body">${o.body || ""}</div>${o.foot ? `<footer>${o.foot}</footer>` : ""}</div>`;
    const api = { el: w, close: () => { w.remove(); document.removeEventListener("keydown", onKey); if (o.onClose) o.onClose(); document.dispatchEvent(new Event("fah-modal-close")); } };
    const onKey = (e) => { if (e.key === "Escape") api.close(); };
    w.addEventListener("click", (e) => { if (e.target === w || e.target.closest("[data-close]")) api.close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(w);
    if (o.onMount) o.onMount(w, api);
    return api;
  }
  function ask(title, msg, okText, danger) {
    return new Promise((res) => {
      let done = false;
      const m = modal({
        title, body: `<p class="muted" style="margin:0 0 6px">${esc(msg || "")}</p>`,
        foot: `<button type="button" class="b ${danger === false ? "dark" : "red"}" data-ok>${esc(okText || "تأكيد")}</button><button type="button" class="b" data-close>رجوع</button>`,
        onClose: () => { if (!done) res(false); },
        onMount: (w, api) => { $("[data-ok]", w).addEventListener("click", () => { done = true; api.close(); res(true); }); $("[data-ok]", w).focus(); }
      });
    });
  }
  /** read all [name] fields inside root into an object */
  function formData(root) {
    const o = {};
    $$("[name]", root).forEach((el) => {
      let v = el.type === "checkbox" ? el.checked : el.value;
      if (el.dataset.num !== undefined) v = v === "" ? null : Number(v);
      if (el.type === "date" && v === "") v = null;
      o[el.name] = v;
    });
    return o;
  }
  const fld = (label, name, value, attrs) => `<div class="f"><label>${label}</label><input name="${name}" value="${esc(value ?? "")}" ${attrs || ""}></div>`;
  const selF = (label, name, value, opts) => `<div class="f"><label>${label}</label><select name="${name}">${opts.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(value ?? "") ? " selected" : ""}>${esc(t)}</option>`; }).join("")}</select></div>`;
  const areaF = (label, name, value, ph) => `<div class="f"><label>${label}</label><textarea name="${name}" placeholder="${esc(ph || "")}">${esc(value ?? "")}</textarea></div>`;

  /* ---------- file save (works on the hosted site and inside Claude's preview) ---------- */
  let downloads = null;
  if (window.claude && window.claude.use) window.claude.use("downloads").then((d) => { downloads = d; }).catch(() => {});
  async function saveFile(filename, data, mime) {
    if (downloads) {
      try { await downloads.save({ filename, data }); return true; } catch (e) { if (e && e.code !== "declined") toast("تعذّر التنزيل", true); return false; }
    }
    try {
      const blob = data instanceof Blob ? data : new Blob([data], { type: mime || "application/octet-stream" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      return true;
    } catch { toast("تعذّر التنزيل", true); return false; }
  }
  const csv = (rows) => "﻿" + rows.map((r) => r.map((c) => { const s = String(c ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(",")).join("\r\n");

  /* ---------- charts (SVG, single hue, hover tooltips) ---------- */
  const nice = (m) => { if (m <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(m))), n = m / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
  function frame(items, o) {
    const W = 640, H = o.h || 200, L = 34, R = 8, T = 12, B = 26;
    const max = o.max || nice(Math.max(1, ...items.map((d) => d.value || 0)));
    const y = (v) => T + (H - T - B) * (1 - v / max);
    let g = "";
    for (let i = 0; i <= 4; i++) { const v = (max * i) / 4, yy = y(v); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="${i ? "#ece8e9" : "#cfc7c9"}" stroke-width="1"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end">${o.fmt ? o.fmt(v) : Math.round(v)}</text>`; }
    return { W, H, L, R, T, B, max, y, g };
  }
  const tipAttr = (d) => `data-tip="${esc(d.tip || d.label + " · " + d.value)}"`;
  function bars(items, o) {
    o = o || {};
    if (!items.length) return '<div class="empty small">لا توجد بيانات كافية بعد</div>';
    const f = frame(items, o), n = items.length, slot = (f.W - f.L - f.R) / n, bw = Math.min(26, slot * 0.62), step = Math.ceil(n / 12);
    let s = f.g;
    items.forEach((d, i) => {
      const cx = f.L + slot * (i + 0.5), v = d.value || 0, yy = f.y(v), h = f.H - f.B - yy;
      if (v > 0) s += `<path d="M${cx - bw / 2} ${f.H - f.B}V${yy + Math.min(4, h)}q0-${Math.min(4, h)} ${Math.min(4, h)}-${Math.min(4, h)}h${bw - 2 * Math.min(4, h)}q${Math.min(4, h)} 0 ${Math.min(4, h)} ${Math.min(4, h)}V${f.H - f.B}z" fill="${d.color || o.color || "#141213"}"/>`;
      s += `<rect x="${cx - slot / 2}" y="${f.T}" width="${slot}" height="${f.H - f.T - f.B}" fill="transparent" ${tipAttr(d)}/>`;
      if (i % step === 0) s += `<text x="${cx}" y="${f.H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
    });
    return `<div class="chart"><svg viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${esc(o.label || "رسم بياني")}">${s}</svg><div class="tip"></div></div>`;
  }
  function line(items, o) {
    o = o || {};
    if (items.length < 2) return '<div class="empty small">لا توجد بيانات كافية بعد</div>';
    const f = frame(items, o), n = items.length, slot = (f.W - f.L - f.R) / n, step = Math.ceil(n / 12);
    const pts = items.map((d, i) => [f.L + slot * (i + 0.5), d.value == null ? null : f.y(d.value)]);
    let path = "", pen = false;
    pts.forEach(([x, y]) => { if (y == null) { pen = false; return; } path += (pen ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); pen = true; });
    let s = f.g + `<path d="${path}" fill="none" stroke="${o.color || "#d71920"}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    items.forEach((d, i) => {
      const [x, y] = pts[i];
      if (y != null) s += `<circle cx="${x}" cy="${y}" r="4" fill="${o.color || "#d71920"}" stroke="#fff" stroke-width="2"/>`;
      s += `<rect x="${x - slot / 2}" y="${f.T}" width="${slot}" height="${f.H - f.T - f.B}" fill="transparent" ${tipAttr(d)}/>`;
      if (i % step === 0) s += `<text x="${x}" y="${f.H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
    });
    return `<div class="chart"><svg viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="${esc(o.label || "رسم بياني")}">${s}</svg><div class="tip"></div></div>`;
  }
  function hbars(items, o) {
    o = o || {};
    if (!items.length) return '<div class="empty small">لا توجد بيانات كافية بعد</div>';
    const max = Math.max(1, ...items.map((d) => d.value));
    return `<div class="hb">${items.map((d, i) => `<span class="lbl">${esc(d.label)}</span><span class="trk"><i class="${o.red && i === 0 ? "red" : ""}" style="width:${(d.value / max) * 100}%"></i></span><span class="val">${o.fmt ? o.fmt(d.value) : d.value}</span>`).join("")}</div>`;
  }
  const showTip = (e) => {
    const t = e.target.closest && e.target.closest("[data-tip]");
    $$(".chart .tip").forEach((el) => { if (!t || el.parentNode !== t.closest(".chart")) el.style.opacity = 0; });
    if (!t) return;
    const c = t.closest(".chart"), tip = $(".tip", c), r = c.getBoundingClientRect(), tr = t.getBoundingClientRect();
    const [a, b] = t.dataset.tip.split(" · ");
    tip.innerHTML = `${esc(b || a)}${b ? `<small>${esc(a)}</small>` : ""}`;
    tip.style.left = Math.max(60, Math.min(r.width - 60, tr.left + tr.width / 2 - r.left)) + "px";
    tip.style.top = Math.max(30, e.clientY - r.top - 8) + "px";
    tip.style.opacity = 1;
  };
  document.addEventListener("pointermove", showTip);
  document.addEventListener("pointerdown", showTip);

  /* ---------- calculations ---------- */
  const D = () => Store.D;
  const RPE_EST = { "منخفضة": 3, "متوسطة": 5, "عالية": 8 };
  const C = {
    conf() { return Object.assign({ season: "2026/2027", seasons: [{ name: "2026/2027", start: "2026-08-01", end: "2027-07-31" }], place: "ملعب نادي الفحيحيل", time: "17:00", duration: 90 }, Store.setting("app", {})); },
    season() { const c = C.conf(); const pick = localStorage.getItem("fah-season") || c.season; return c.seasons.find((s) => s.name === pick) || c.seasons[c.seasons.length - 1]; },
    events(type) {
      const s = C.season();
      return D().events.filter((e) => e.date >= s.start && e.date <= s.end && (!type || e.type === type)).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
    },
    held(e) { return e.status !== "cancelled"; },
    countable(e) { return (e.type === "training" || e.type === "match") && C.held(e); },
    title(e) { return e.type === "match" ? "مباراة ضد " + (e.opponent || "—") : e.title || { training: "حصة تدريبية", meeting: "اجتماع", rest: "راحة" }[e.type] || "نشاط"; },
    /** وقت التجمع: المدخل يدوياً، وإلا قبل المباراة بـ75 دقيقة دائماً */
    meet(e) {
      if (!e || e.type !== "match") return (e && e.meet_time) || "";
      if (e.meet_time) return e.meet_time;
      const m = /^(\d{1,2}):(\d{2})/.exec(e.time || ""); if (!m) return "";
      const t = (((+m[1]) * 60 + (+m[2]) - 75) % 1440 + 1440) % 1440;
      return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
    },
    typeName(e) { return { training: "تمرين", match: "مباراة", meeting: "اجتماع", rest: "راحة" }[e.type] || ""; },
    attOf(eventId) { return D().attendance.filter((a) => a.event_id === eventId); },
    attMaps() { const m = new Map(); D().attendance.forEach((a) => { if (!m.has(a.event_id)) m.set(a.event_id, new Map()); m.get(a.event_id).set(a.player_id, a); }); return m; },
    sheetOf(e) { return e.sheet_id ? Store.get("sheets", e.sheet_id) : null; },
    dur(e) { return Number(e.actual_duration || e.duration || 0); },
    /** session RPE: what the staff entered, otherwise estimated from the drill intensities on the sheet */
    rpe(e) {
      if (e.rpe != null && e.rpe !== "") return { v: Number(e.rpe), est: false };
      const sh = C.sheetOf(e);
      if (sh && sh.summary.length) {
        let t = 0, w = 0;
        sh.summary.forEach((d) => { const m = parseFloat(d.dur) || 0; t += m; w += m * (RPE_EST[d.intensity] || 5); });
        if (t) return { v: Math.round((w / t) * 10) / 10, est: true };
      }
      return null;
    },
    load(e) { const r = C.rpe(e); return r ? Math.round(C.dur(e) * r.v) : null; },
    /** opponent crest: uploaded by the staff (settings) or shipped with the site */
    logo(name) {
      if (!name) return "";
      const up = Store.setting("logos", {});
      if (/فحيحيل/.test(name)) return "img/teams/fahaheel.png";
      return up[name.trim()] || ({ "خيطان": "img/teams/khaitan.png", "القادسية": "img/teams/qadsia.png", "كاظمة": "img/teams/kazma.png" })[name.trim()] || "";
    },
    /** fixed-size crest box (same size + alignment for every team; initial letter when no crest yet) */
    crest(name, size) {
      const l = C.logo(name), z = size || 28;
      return `<span class="crest" style="width:${z}px;height:${z}px;font-size:${Math.round(z * 0.46)}px">${l ? `<img src="${l}" alt="" width="${z}" height="${z}" style="width:${z}px;height:${z}px">` : esc((name || "؟").trim()[0])}</span>`;
    },
    oppBadge(name) { const l = C.logo(name); return l ? `<img class="oppimg" src="${l}" alt="">` : `<span class="opp">${esc((name || "؟").trim()[0])}</span>`; },
    result(e) { if (e.score_for == null || e.score_against == null) return null; return e.score_for > e.score_against ? "W" : e.score_for < e.score_against ? "L" : "D"; },
    /** full per-player season numbers */
    playerStats(from, to) {
      const evs = C.events().filter((e) => C.countable(e) && (!from || e.date >= from) && (!to || e.date <= to));
      const maps = C.attMaps();
      const ms = new Map(); D().match_stats.forEach((s) => ms.set(s.event_id + "_" + s.player_id, s));
      return D().players.map((p) => {
        const r = { p, present: 0, late: 0, absent: 0, excused: 0, total: 0, matches: 0, starts: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0, load: 0, trainMin: 0, recs: [] };
        evs.forEach((e) => {
          const a = maps.get(e.id) && maps.get(e.id).get(p.id);
          if (a) { r[a.status]++; r.total++; r.recs.push({ e, status: a.status, a }); }
          const here = a && (a.status === "present" || a.status === "late");
          if (e.type === "match") {
            const s = ms.get(e.id + "_" + p.id);
            if (s && (s.started || s.minutes > 0)) {
              r.matches++; if (s.started) r.starts++; r.minutes += s.minutes || 0;
              const q = C.rpe(e); if (q) r.load += (s.minutes || 0) * q.v;
            }
            if (s) { r.goals += s.goals || 0; r.assists += s.assists || 0; r.yellow += s.yellow || 0; r.red += s.red || 0; }
          } else if (here) {
            const mins = Math.max(0, C.dur(e) - (a.status === "late" ? a.late_min || 0 : 0));
            r.trainMin += mins; const q = C.rpe(e); if (q) r.load += mins * q.v;
          }
        });
        r.pct = r.total ? Math.round(((r.present + r.late) / r.total) * 100) : null;
        r.load = Math.round(r.load);
        return r;
      });
    },
    /** minutes per drill category for a list of events (via their linked sheets) */
    catMinutes(evs) {
      const m = {};
      evs.forEach((e) => { const sh = C.sheetOf(e); if (sh) sh.summary.forEach((d) => { const k = d.type === "match" ? "ألعاب مصغّرة" : d.cat || "أخرى"; m[k] = (m[k] || 0) + (parseFloat(d.dur) || 0); }); });
      return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    },
    weeks(evs) {
      const m = new Map();
      evs.forEach((e) => { const k = weekStart(e.date); if (!m.has(k)) m.set(k, []); m.get(k).push(e); });
      return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }
  };

  window.U = { esc, $, $$, DAYS, MONTHS, iso, pd, today, addDays, diffDays, weekStart, dayName, fmtD, fmtFull, fmtLong, relDay, age, toast, modal, ask, formData, fld, selF, areaF, saveFile, csv, bars, line, hbars, X };
  window.C = C;
})();
