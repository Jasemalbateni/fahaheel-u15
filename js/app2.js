/* التمارين + المباريات + الإحصائيات + تقرير الموسم + الإعدادات */
(function () {
  const { esc, $, $$, today, addDays, dayName, fmtD, fmtFull, fmtLong, pd, toast, modal, ask, formData, fld, selF, saveFile, csv } = U;
  const { playersSorted, avatar, evRow, datebox } = FAHU;
  const { ATT, STATUS_CHIP } = FAH;
  const LOGO = window.FAH_LOGO;
  const total = (sum) => sum.reduce((s, d) => s + (parseFloat(d.dur) || 0), 0);

  /* =====================================================================
     التمارين: الحصص + مكتبة التمارين
     ===================================================================== */
  let dTab = "sessions", dq = "", dcat = "";
  const sheetsSorted = () => Store.D.sheets.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.updated_at || "").localeCompare(a.updated_at || ""));
  const allDrills = () => { const out = []; sheetsSorted().forEach((sh) => sh.summary.forEach((d) => { if (d.type !== "match" && d.title) out.push({ ...d, sheet: sh }); })); return out; };
  window.FAHU.allDrills = allDrills;
  const libGrid = () => {
    const list = allDrills().filter((d) => (!dq || (d.title + " " + (d.code || "")).includes(dq)) && (!dcat || d.cat === dcat));
    if (!list.length) return `<div class="card empty"><b>${Store.D.sheets.length ? "ما في نتائج" : "المكتبة فاضية"}</b>كل تمرين تحفظه في ورقة تمرين يدخل المكتبة تلقائياً حسب محوره.</div>`;
    return `<div class="dgrid">${list.map((d) => { const th = Store.thumbOf(d.sheet.id, d.id);
      return `<a class="dcard" href="#sheet-${d.sheet.id}" data-drill="${d.id}"><span class="img">${th ? `<img src="${th}" alt="" loading="lazy">` : IC.pitch}</span><span class="in"><b>${esc(d.title)}</b><span class="m"><span class="chip dark">${esc(d.cat || "—")}</span>${d.dur ? `<span class="chip num">${esc(d.dur)} د</span>` : ""}${d.intensity ? `<span class="chip ${d.intensity === "عالية" ? "red" : ""}">${esc(d.intensity)}</span>` : ""}</span><span class="muted small" style="display:block;margin-top:6px">${esc(d.code || "")} ${d.sheet.date ? "· " + fmtFull(d.sheet.date) : ""}</span></span></a>`; }).join("")}</div>`;
  };
  V.drills = () => {
    const sheets = sheetsSorted(), drills = allDrills(), cats = Array.from(new Set(drills.map((d) => d.cat).filter(Boolean)));
    const linked = new Map(); Store.D.events.forEach((e) => { if (e.sheet_id) linked.set(e.sheet_id, e); });
    let body;
    if (dTab === "sessions") {
      body = sheets.length ? `<section class="card"><div class="rows">${sheets.map((sh) => { const ev = linked.get(sh.id), n = sh.summary.length, t = total(sh.summary);
        return `<div class="rw"><a href="#sheet-${sh.id}" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">${sh.date ? datebox({ date: sh.date, type: "training" }) : '<span class="datebox off"><b>—</b><span>بدون</span></span>'}
          <span class="grow"><b>${esc(sh.title || (sh.kind === "session" ? "حصة بدون اسم" : "تمرين بدون اسم"))}</b><span>${sh.kind === "session" ? n + " تمارين" : "تمرين واحد"}${t ? " · " + t + " دقيقة" : ""}${sh.goal_phys ? " · " + esc(sh.goal_phys) : ""}</span></span></a>
          ${ev ? '<span class="chip ok">في التقويم</span>' : '<span class="chip">غير مربوطة</span>'}<button type="button" class="b sm danger" data-act="shDel" data-id="${sh.id}" aria-label="حذف الورقة">حذف</button></div>`; }).join("")}</div></section>`
        : `<div class="card empty"><b>ما في أوراق تمرين بعد</b>أنشئ أول ورقة، أو استورد ملفات ورقة تمرين فحيحيل اللي عندك (حصة أو مكتبة كاملة).<br><button type="button" class="b red mt" data-act="shNew">${IC.plus} ورقة جديدة</button> <button type="button" class="b mt" data-act="shImport">استيراد ملف</button></div>`;
    } else {
      body = `<div class="toolbar"><input class="search" id="dq" type="search" placeholder="ابحث باسم التمرين أو رمزه" value="${esc(dq)}"><select class="search" id="dcat" style="flex:0 1 200px"><option value="">كل المحاور</option>${cats.map((c) => `<option${c === dcat ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></div><div id="dgrid">${libGrid()}</div>`;
    }
    return ph("DRILLS · " + sheets.length + " SHEETS · " + drills.length + " DRILLS", "التمارين", "", `<button type="button" class="b" data-act="shImport">استيراد ملف</button><button type="button" class="b red" data-act="shNew">${IC.plus} ورقة تمرين جديدة</button>`) +
      `<div class="toolbar"><div class="seg2"><button type="button" class="${dTab === "sessions" ? "on" : ""}" data-act="dTab" data-k="sessions">الحصص وأوراق التمرين</button><button type="button" class="${dTab === "library" ? "on" : ""}" data-act="dTab" data-k="library">مكتبة التمارين</button></div></div>${body}`;
  };
  let thumbsAsked = false;
  After.drills = (root) => {
    if (dTab !== "library") return;
    $("#dq", root).addEventListener("input", (e) => { dq = e.target.value.trim(); $("#dgrid", root).innerHTML = libGrid(); });
    $("#dcat", root).addEventListener("change", (e) => { dcat = e.target.value; $("#dgrid", root).innerHTML = libGrid(); });
    $("#dgrid", root).addEventListener("click", (e) => { const a = e.target.closest("[data-drill]"); if (a) App.pendingSheet = { drill: a.dataset.drill }; });
    if (!thumbsAsked) { thumbsAsked = true; Store.thumbs().then(() => { const g = $("#dgrid"); if (g) g.innerHTML = libGrid(); }); }
  };
  A.dTab = (el) => { dTab = el.dataset.k; App.render(); };
  A.shNew = () => App.go("sheet-new");
  A.shImport = () => SheetApp.importDialog();
  A.shDel = async (el) => {
    const sh = Store.get("sheets", el.dataset.id);
    if (!(await ask("حذف ورقة التمرين؟", `«${sh.title || "بدون اسم"}» تنحذف نهائياً مع تمارينها من المكتبة، وما يمكن التراجع.`, "حذف نهائي"))) return;
    Store.del("sheets", sh.id); toast("تم حذف الورقة");
  };

  /* =====================================================================
     المباريات
     ===================================================================== */
  V.matches = () => {
    const ms = C.events("match"), t = today();
    const played = ms.filter((m) => C.held(m) && C.result(m)), up = ms.filter((m) => !C.result(m) && m.date >= t);
    const n = (r) => played.filter((m) => C.result(m) === r).length;
    const gf = played.reduce((s, m) => s + m.score_for, 0), ga = played.reduce((s, m) => s + m.score_against, 0);
    const pending = ms.filter((m) => C.held(m) && !C.result(m) && m.date < t);
    return ph("MATCHES · SEASON " + esc(C.season().name), "المباريات والنتائج", "", `<button type="button" class="b red" data-act="evNew" data-type="match">${IC.plus} إضافة مباراة</button>`) +
      `<div class="tiles"><div class="tile dark"><b>${played.length}</b><span>مباراة ملعوبة</span></div><div class="tile ok"><b>${n("W")}</b><span>فوز</span></div><div class="tile"><b>${n("D")}</b><span>تعادل</span></div><div class="tile red"><b>${n("L")}</b><span>خسارة</span></div><div class="tile"><b>${gf}<small> : ${ga}</small></b><span>لنا : علينا</span></div>
        <div class="tile"><div class="form5" style="height:38px;align-items:center">${played.slice(-5).map((m) => `<i class="${C.result(m)}">${{ W: "ف", D: "ت", L: "خ" }[C.result(m)]}</i>`).join("") || '<span class="muted">—</span>'}</div><span>آخر 5 مباريات</span></div></div>
      ${pending.length ? `<div class="banner info mt">${pending.length} مباراة سابقة بدون نتيجة — افتحها وأدخل النتيجة.</div>` : ""}
      <div class="grid g2 mt"><section class="card"><h3>القادمة</h3><div class="rows">${up.map(evRow).join("") || '<div class="empty small">ما في مباريات قادمة</div>'}</div></section>
      <section class="card"><h3>النتائج</h3><div class="rows">${ms.filter((m) => !up.includes(m)).reverse().map(evRow).join("") || '<div class="empty small">ما في نتائج بعد</div>'}</div></section></div>`;
  };

  /* =====================================================================
     الإحصائيات
     ===================================================================== */
  let sTab = "team", sRange = "season", sSort = "pct", sDir = -1;
  const range = () => sRange === "30" ? [addDays(today(), -30), today()] : sRange === "7" ? [addDays(today(), -7), today()] : [null, today()];
  function teamTab(from, to) {
    const evs = C.events().filter((e) => (!from || e.date >= from) && e.date <= to);
    const tr = evs.filter((e) => e.type === "training"), held = tr.filter(C.held), cancelled = tr.length - held.length;
    const maps = C.attMaps();
    let ok = 0, n = 0;
    const wk = C.weeks(evs.filter(C.countable)).map(([w, list]) => {
      let o = 0, t = 0, load = 0, mins = 0;
      list.forEach((e) => { const m = maps.get(e.id); if (m) m.forEach((a) => { t++; if (a.status === "present" || a.status === "late") o++; }); const l = C.load(e); if (l) load += l; mins += C.dur(e); });
      ok += o; n += t;
      return { w, pct: t ? Math.round((o / t) * 100) : null, load, mins, sessions: list.length };
    });
    const mins = held.reduce((s, e) => s + C.dur(e), 0);
    const avgLoad = wk.length ? Math.round(wk.reduce((s, x) => s + x.load, 0) / wk.length) : 0;
    const phys = {}; held.forEach((e) => { if (e.goal_phys) phys[e.goal_phys] = (phys[e.goal_phys] || 0) + 1; });
    const ps = C.playerStats(from, to).filter((s) => s.p.active !== false);
    const top = (key, fmt, filter) => ps.filter(filter || ((s) => s[key] > 0)).sort((a, b) => b[key] - a[key]).slice(0, 5).map((s) => `<a class="rw" href="#player-${s.p.id}">${avatar(s.p)}<span class="grow"><b>${esc(s.p.name)}</b><span>${esc(s.p.position || "")}</span></span><b class="num" style="font-size:20px">${fmt(s)}</b></a>`).join("") || '<div class="empty small">لا توجد بيانات بعد</div>';
    const ms = evs.filter((e) => e.type === "match" && C.result(e));
    return `<div class="tiles">
        <div class="tile dark"><b>${held.length}</b><span>حصة منفذة</span></div><div class="tile"><b>${cancelled}</b><span>حصة ملغاة</span></div>
        <div class="tile ${n && ok / n < 0.75 ? "red" : "ok"}"><b>${n ? Math.round((ok / n) * 100) + "<small>%</small>" : "—"}</b><span>نسبة حضور الفريق</span></div>
        <div class="tile"><b>${Math.round(mins / 60)}<small> س</small></b><span>ساعات التدريب</span></div><div class="tile"><b>${avgLoad}</b><span>متوسط الحمل الأسبوعي</span></div>
        <div class="tile"><b>${ms.filter((m) => C.result(m) === "W").length}-${ms.filter((m) => C.result(m) === "D").length}-${ms.filter((m) => C.result(m) === "L").length}</b><span>فوز - تعادل - خسارة</span></div></div>
      <div class="grid g2 mt">
        <section class="card"><h3>حضور الفريق أسبوعياً <span class="sp"></span><small>%</small></h3>${U.line(wk.map((x) => ({ label: fmtD(x.w), value: x.pct, tip: `أسبوع ${fmtD(x.w)} · ${x.pct == null ? "—" : x.pct + "%"}` })), { max: 100, label: "نسبة حضور الفريق أسبوعياً" })}</section>
        <section class="card"><h3>الحمل التدريبي الأسبوعي <span class="sp"></span><small>مجموع (المدة × الشدة)</small></h3>${U.bars(wk.map((x) => ({ label: fmtD(x.w), value: x.load, tip: `أسبوع ${fmtD(x.w)} · ${x.load} (${x.sessions} نشاط)` })), { label: "الحمل الأسبوعي" })}</section>
        <section class="card"><h3>توزيع المحتوى التدريبي <span class="sp"></span><small>دقائق حسب المحور</small></h3>${U.hbars(C.catMinutes(held), { fmt: (v) => v + " د", red: true })}</section>
        <section class="card"><h3>الأهداف البدنية <span class="sp"></span><small>عدد الحصص</small></h3>${U.hbars(Object.entries(phys).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value), { red: true })}</section>
        <section class="card"><h3>الأعلى حضوراً</h3><div class="rows">${top("pct", (s) => s.pct + "%", (s) => s.pct != null && s.total >= 3)}</div></section>
        <section class="card"><h3>الأكثر غياباً</h3><div class="rows">${ps.filter((s) => s.absent + s.excused > 0).sort((a, b) => b.absent + b.excused - (a.absent + a.excused)).slice(0, 5).map((s) => `<a class="rw" href="#player-${s.p.id}">${avatar(s.p)}<span class="grow"><b>${esc(s.p.name)}</b><span>${s.absent} دون عذر · ${s.excused} بعذر · ${s.late} تأخير</span></span><b class="num" style="font-size:20px;color:var(--red)">${s.absent + s.excused}</b></a>`).join("") || '<div class="empty small">ما في غياب مسجل</div>'}</div></section>
        <section class="card"><h3>الهدافون</h3><div class="rows">${top("goals", (s) => s.goals)}</div></section>
        <section class="card"><h3>الأكثر مشاركة <span class="sp"></span><small>دقائق</small></h3><div class="rows">${top("minutes", (s) => s.minutes)}</div></section>
      </div>
      <section class="card mt"><h3>نتائج المباريات</h3><div class="tw"><table class="t"><thead><tr><th>التاريخ</th><th>المنافس</th><th class="n">لنا</th><th class="n">علينا</th><th class="n">الفارق</th></tr></thead><tbody>${ms.map((m) => `<tr><td class="num">${fmtFull(m.date)}</td><td class="name"><a href="#event-${m.id}">${esc(m.opponent || "—")}</a></td><td class="n">${m.score_for}</td><td class="n">${m.score_against}</td><td class="n" style="color:${m.score_for - m.score_against < 0 ? "var(--red)" : "var(--ok)"}">${m.score_for - m.score_against > 0 ? "+" : ""}${m.score_for - m.score_against}</td></tr>`).join("") || '<tr><td colspan="5" class="muted" style="text-align:center">ما في نتائج</td></tr>'}</tbody></table></div></section>`;
  }
  const PCOLS = [["pct", "الحضور %"], ["present", "حاضر"], ["late", "تأخير"], ["absent", "غياب"], ["excused", "بعذر"], ["matches", "مباريات"], ["starts", "أساسي"], ["minutes", "دقائق"], ["goals", "أهداف"], ["assists", "صناعة"], ["yellow", "صفراء"], ["red", "حمراء"], ["trainMin", "دقائق تدريب"], ["load", "الحمل"]];
  function playersTab(from, to) {
    const ps = C.playerStats(from, to).filter((s) => s.p.active !== false).sort((a, b) => ((a[sSort] ?? -1) - (b[sSort] ?? -1)) * sDir || (a.p.number ?? 999) - (b.p.number ?? 999));
    return `<div class="toolbar"><span class="muted small">اضغط على عنوان العمود للترتيب</span><span style="flex:1"></span><button type="button" class="b sm" data-act="xPlayers">${IC.down} تصدير Excel</button></div>
      <div class="tw"><table class="t"><thead><tr><th>اللاعب</th>${PCOLS.map(([k, t]) => `<th class="n${sSort === k ? " sorted" : ""}" data-sort="${k}" data-act="sSort" data-k="${k}">${t}${sSort === k ? (sDir < 0 ? " ▾" : " ▴") : ""}</th>`).join("")}</tr></thead><tbody>
      ${ps.map((s) => `<tr><td class="name"><a href="#player-${s.p.id}"><span class="num" style="color:var(--red);font-weight:700;margin-inline-end:6px">${s.p.number ?? ""}</span>${esc(s.p.name)}</a></td>${PCOLS.map(([k]) => k === "pct" ? `<td><span class="bar-cell"><i><u class="${s.pct != null && s.pct < 75 ? "low" : ""}" style="width:${s.pct || 0}%"></u></i><b class="num">${s.pct != null ? s.pct + "%" : "—"}</b></span></td>` : `<td class="n">${s[k] || (s[k] === 0 ? '<span style="color:#cfc7c9">0</span>' : "—")}</td>`).join("")}</tr>`).join("")}
      </tbody></table></div>`;
  }
  function attTab(from, to) {
    const evs = C.events().filter((e) => C.countable(e) && (!from || e.date >= from) && e.date <= to).slice(-30);
    const maps = C.attMaps(), ps = playersSorted();
    const ch = { present: "✓", late: "ت", absent: "✕", excused: "ع" }, col = { present: "var(--ok)", late: "#b26a00", absent: "var(--red)", excused: "var(--info)" };
    return `<div class="toolbar"><span class="muted small">آخر ${evs.length} نشاط · ✓ حاضر · ت متأخر · ✕ غائب · ع بعذر</span><span style="flex:1"></span><button type="button" class="b sm" data-act="xAtt">${IC.down} تصدير كشف الحضور</button></div>
      <div class="tw"><table class="t"><thead><tr><th>اللاعب</th>${evs.map((e) => `<th class="n" title="${esc(C.title(e))}"><span class="num">${fmtD(e.date)}</span>${e.type === "match" ? "<br>م" : ""}</th>`).join("")}</tr></thead><tbody>
      ${ps.map((p) => `<tr><td class="name">${esc(p.name)}</td>${evs.map((e) => { const a = maps.get(e.id) && maps.get(e.id).get(p.id); return `<td class="n" style="font-family:inherit;font-weight:800;color:${a ? col[a.status] : "#d6cfd1"}">${a ? ch[a.status] : "·"}</td>`; }).join("")}</tr>`).join("")}
      </tbody></table></div>`;
  }
  V.stats = () => {
    const [from, to] = range();
    return ph("STATISTICS · SEASON " + esc(C.season().name), "الإحصائيات", "", "") +
      `<div class="toolbar"><div class="seg2">${[["team", "الفريق"], ["players", "اللاعبون"], ["att", "كشف الحضور"]].map(([k, t]) => `<button type="button" class="${sTab === k ? "on" : ""}" data-act="sTab" data-k="${k}">${t}</button>`).join("")}</div><span style="flex:1"></span>
        <div class="seg2">${[["season", "الموسم"], ["30", "آخر 30 يوم"], ["7", "آخر 7 أيام"]].map(([k, t]) => `<button type="button" class="${sRange === k ? "on" : ""}" data-act="sRange" data-k="${k}">${t}</button>`).join("")}</div></div>` +
      (sTab === "team" ? teamTab(from, to) : sTab === "players" ? playersTab(from, to) : attTab(from, to));
  };
  A.sTab = (el) => { sTab = el.dataset.k; App.render(); };
  A.sRange = (el) => { sRange = el.dataset.k; App.render(); };
  A.sSort = (el) => { if (sSort === el.dataset.k) sDir = -sDir; else { sSort = el.dataset.k; sDir = -1; } App.render(); };
  A.xPlayers = () => {
    const [from, to] = range(), ps = C.playerStats(from, to).filter((s) => s.p.active !== false).sort((a, b) => (a.p.number ?? 999) - (b.p.number ?? 999));
    saveFile("فحيحيل تحت 15 - إحصائيات اللاعبين.csv", csv([["الرقم", "اللاعب", "المركز", ...PCOLS.map((c) => c[1])], ...ps.map((s) => [s.p.number ?? "", s.p.name, s.p.position || "", ...PCOLS.map(([k]) => s[k] ?? "")])]), "text/csv;charset=utf-8").then((ok) => ok && toast("تم تصدير الملف"));
  };
  A.xAtt = () => {
    const [from, to] = range(), evs = C.events().filter((e) => C.countable(e) && (!from || e.date >= from) && e.date <= to), maps = C.attMaps(), ps = playersSorted();
    const rows = [["الرقم", "اللاعب", ...evs.map((e) => fmtFull(e.date) + " " + C.typeName(e)), "حاضر", "متأخر", "غائب", "بعذر", "النسبة %"]];
    ps.forEach((p) => { const c = { present: 0, late: 0, absent: 0, excused: 0 };
      const cells = evs.map((e) => { const a = maps.get(e.id) && maps.get(e.id).get(p.id); if (a) c[a.status]++; return a ? ATT[a.status] : ""; });
      const n = c.present + c.late + c.absent + c.excused;
      rows.push([p.number ?? "", p.name, ...cells, c.present, c.late, c.absent, c.excused, n ? Math.round(((c.present + c.late) / n) * 100) : ""]); });
    saveFile("فحيحيل تحت 15 - كشف الحضور.csv", csv(rows), "text/csv;charset=utf-8").then((ok) => ok && toast("تم تصدير كشف الحضور"));
  };

  /* =====================================================================
     تقرير الموسم: كل التمارين، مع أو بدون الحمل التدريبي
     ===================================================================== */
  const R = { from: null, to: null, load: true, thumbs: false, cancelled: false };
  V.report = () => {
    const s = C.season();
    if (!R.from) { R.from = s.start; R.to = today() < s.end ? today() : s.end; }
    const evs = C.events("training").filter((e) => e.date >= R.from && e.date <= R.to && (R.cancelled || C.held(e)));
    const held = evs.filter(C.held), withSheet = held.filter((e) => C.sheetOf(e));
    const nDrills = withSheet.reduce((n, e) => n + C.sheetOf(e).summary.length, 0), mins = held.reduce((n, e) => n + C.dur(e), 0);
    const wk = C.weeks(held).map(([w, list]) => ({ w, load: list.reduce((n, e) => n + (C.load(e) || 0), 0), n: list.length, mins: list.reduce((n, e) => n + C.dur(e), 0) }));
    const staff = Store.D.staff;
    const sessions = evs.map((e) => {
      const sh = C.sheetOf(e), r = C.rpe(e), load = C.load(e), canc = !C.held(e);
      return `<article class="rs${canc ? " cancelled" : ""}"><header><span class="d">${fmtFull(e.date)}</span><span class="muted small">${dayName(e.date)}</span><b>${esc(C.title(e))}</b>${canc ? `<span class="chip red">ملغاة${e.cancel_reason ? " — " + esc(e.cancel_reason) : ""}</span>` : ""}<span class="sp"></span>
          ${e.goal_tech ? `<span class="chip dark">${esc(e.goal_tech)}</span>` : ""}${e.goal_phys ? `<span class="chip red">${esc(e.goal_phys)}</span>` : ""}
          ${R.load && !canc ? `<span class="chip"><span class="num">${C.dur(e)}</span> د${r ? ` × شدة <span class="num">${r.v}</span>${r.est ? "*" : ""} = <b class="num">${load}</b>` : ""}</span>` : !canc && C.dur(e) ? `<span class="chip"><span class="num">${C.dur(e)}</span> د</span>` : ""}</header>
        ${sh && !canc ? `<table><thead><tr><th style="width:34px">#</th><th>التمرين</th><th>المحور</th>${R.load ? "<th>الشدة</th>" : ""}<th style="width:70px">المدة</th></tr></thead><tbody>${sh.summary.map((d, i) => `<tr><td class="num">${i + 1}</td><td><b>${esc(d.title || "—")}</b>${d.code ? ` <span class="muted num small">${esc(d.code)}</span>` : ""}</td><td>${esc(d.type === "match" ? "مباراة" + (d.format ? " " + d.format : "") : d.cat || "")}</td>${R.load ? `<td>${esc(d.intensity || "")}</td>` : ""}<td class="num">${d.dur ? esc(d.dur) + " د" : "—"}</td></tr>`).join("")}</tbody></table>
          ${R.thumbs ? (() => { const th = sh.summary.map((d) => Store.thumbOf(sh.id, d.id)).filter(Boolean); return th.length ? `<div class="thumbs">${th.map((t) => `<img src="${t}" alt="">`).join("")}</div>` : ""; })() : ""}` : canc ? "" : '<p class="muted small" style="margin:8px 14px">بدون ورقة تمرين مربوطة</p>'}
        ${e.notes_after && !canc ? `<p class="small" style="margin:8px 14px"><b>ملاحظات:</b> ${esc(e.notes_after)}</p>` : ""}</article>`;
    }).join("");
    return ph("SEASON REPORT", "تقرير تمارين الموسم", "كل الحصص وتمارينها بالتاريخ — مع أو بدون الحمل التدريبي", `<button type="button" class="b" data-act="repCsv">${IC.down} Excel</button><button type="button" class="b red" data-act="repPrint">${IC.print} طباعة / حفظ PDF</button>`) +
      `<section class="card no-print" style="margin-bottom:16px"><div class="fr3">
          <div class="f"><label>من تاريخ</label><input type="date" dir="ltr" value="${R.from}" data-chg="repOpt" data-k="from" data-rerender="1"></div>
          <div class="f"><label>إلى تاريخ</label><input type="date" dir="ltr" value="${R.to}" data-chg="repOpt" data-k="to" data-rerender="1"></div>
          <div class="f"><label>الفترة</label><button type="button" class="b block" data-act="repSeason">الموسم كامل</button></div></div>
        <div style="display:flex;gap:8px 18px;flex-wrap:wrap;font-weight:700">
          ${[["load", "مع الحمل التدريبي (رسم بياني + شدة كل حصة)"], ["thumbs", "مع رسومات التمارين"], ["cancelled", "إظهار الحصص الملغاة"]].map(([k, t]) => `<label style="display:flex;gap:7px;align-items:center;cursor:pointer"><input type="checkbox" ${R[k] ? "checked" : ""} data-chg="repOpt" data-k="${k}" data-rerender="1" style="width:20px;height:20px;accent-color:#d71920">${t}</label>`).join("")}</div></section>
      <div class="rep" id="rep">
        <div class="rep-head"><img src="${LOGO}" alt=""><div><h2>تقرير تمارين الموسم</h2><p>نادي الفحيحيل · فريق تحت 15 سنة · موسم ${esc(s.name)}</p><p>${staff.map((x) => esc(x.name) + " (" + esc(x.role) + ")").join(" · ")}</p></div><div class="en">FAHAHEEL SC · U15<br>${fmtFull(R.from)} – ${fmtFull(R.to)}</div></div>
        <div class="tiles" style="margin-top:14px"><div class="tile dark"><b>${held.length}</b><span>حصة تدريبية</span></div><div class="tile"><b>${nDrills}</b><span>تمرين</span></div><div class="tile"><b>${Math.round(mins / 60)}<small> س</small></b><span>ساعات تدريب</span></div>${R.load ? `<div class="tile red"><b>${wk.reduce((n, x) => n + x.load, 0)}</b><span>إجمالي الحمل</span></div>` : ""}</div>
        ${R.load ? `<h3>الحمل التدريبي الأسبوعي</h3><div class="card" style="box-shadow:none">${U.bars(wk.map((x) => ({ label: fmtD(x.w), value: x.load, tip: `أسبوع ${fmtD(x.w)} · ${x.load} (${x.n} حصص)` })), { h: 210, label: "الحمل التدريبي الأسبوعي" })}
          <p class="muted small" style="margin:8px 0 0">الحمل = المدة الفعلية × شدة الجهد (RPE). الشدة المعلّمة بـ * تقديرية من شدة تمارين الورقة لأن الطاقم ما أدخلها.</p></div>
          <div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>الأسبوع (يبدأ الأحد)</th><th class="n">حصص</th><th class="n">دقائق</th><th class="n">الحمل</th></tr></thead><tbody>${wk.map((x) => `<tr><td class="num">${fmtFull(x.w)}</td><td class="n">${x.n}</td><td class="n">${x.mins}</td><td class="n">${x.load}</td></tr>`).join("")}</tbody></table></div>` : ""}
        <h3>توزيع المحتوى حسب المحور</h3><div class="card" style="box-shadow:none">${U.hbars(C.catMinutes(held), { fmt: (v) => v + " د", red: true })}</div>
        <h3>الحصص والتمارين</h3>${sessions || '<div class="empty">ما في حصص بهذي الفترة</div>'}
      </div>`;
  };
  let repThumbs = false;
  After.report = () => { if (R.thumbs && !repThumbs) { repThumbs = true; Store.thumbs().then(() => App.render()); } };
  A.repOpt = (el) => { const k = el.dataset.k; R[k] = el.type === "checkbox" ? el.checked : el.value || R[k]; if (R.from > R.to) R.to = R.from; App.render(); };
  A.repSeason = () => { const s = C.season(); R.from = s.start; R.to = s.end; App.render(); };
  A.repPrint = () => {
    if (window.self !== window.top) { toast("الطباعة وحفظ PDF تشتغل في الموقع المنشور (مو داخل المعاينة)", true); return; }
    window.print();
  };
  A.repCsv = () => {
    const rows = [["التاريخ", "اليوم", "الحصة", "الهدف الفني/التكتيكي", "الهدف البدني", "الحالة", "#", "التمرين", "الرمز", "المحور", "شدة التمرين", "مدة التمرين", "مدة الحصة", "شدة الحصة RPE", "تقديرية؟", "الحمل"]];
    C.events("training").filter((e) => e.date >= R.from && e.date <= R.to).forEach((e) => {
      const sh = C.sheetOf(e), r = C.rpe(e), base = [fmtFull(e.date), dayName(e.date), C.title(e), e.goal_tech || "", e.goal_phys || "", C.held(e) ? "منفذة" : "ملغاة"], tail = C.held(e) ? [C.dur(e), r ? r.v : "", r && r.est ? "نعم" : "", C.load(e) ?? ""] : ["", "", "", ""];
      if (sh && C.held(e)) sh.summary.forEach((d, i) => rows.push([...base, i + 1, d.title || "", d.code || "", d.type === "match" ? "مباراة" : d.cat || "", d.intensity || "", d.dur || "", ...tail]));
      else rows.push([...base, "", "", "", "", "", "", ...tail]);
    });
    saveFile("فحيحيل تحت 15 - تمارين الموسم.csv", csv(rows), "text/csv;charset=utf-8").then((ok) => ok && toast("تم تصدير الملف"));
  };

  /* =====================================================================
     الإعدادات
     ===================================================================== */
  V.prefs = () => {
    const c = C.conf(), me = Store.me || {}, cur = C.season();
    return ph("SETTINGS", "الإعدادات", "", "") + `<div class="grid g2">
      <section class="card"><h3>الطاقم</h3><div class="rows">${Store.D.staff.map((s) => `<div class="rw"><span class="avatar">${esc(s.name[0])}</span><span class="grow"><b>${esc(s.name)}</b><span>${esc(s.role)}</span></span>${s.id === me.id ? '<span class="chip ok">أنت</span>' : ""}</div>`).join("")}</div>
        ${Store.DEMO ? "" : `<button type="button" class="b mt" data-act="signOut">${IC.out} تسجيل الخروج</button>`}</section>
      <section class="card"><h3>الموسم</h3>
        <div class="f"><label>الموسم المعروض</label><select data-chg="seasonPick">${c.seasons.map((s) => `<option${s.name === cur.name ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</select><div class="hint">من ${fmtFull(cur.start)} إلى ${fmtFull(cur.end)} — كل الإحصائيات والتقارير تنحسب على الموسم المعروض، والمواسم السابقة تبقى محفوظة.</div></div>
        <button type="button" class="b" data-act="seasonNew">${IC.plus} بدء موسم جديد</button></section>
      <section class="card"><h3>القيم الافتراضية للحصة</h3>
        <div id="defs">${fld("الملعب", "place", c.place)}<div class="fr">${fld("وقت التمرين", "time", c.time, 'type="time" dir="ltr"')}${fld("المدة (دقيقة)", "duration", c.duration, 'inputmode="numeric" data-num dir="ltr"')}</div></div>
        <button type="button" class="b dark" data-act="defsSave">حفظ</button></section>
      <section class="card"><h3>البيانات</h3><p class="muted" style="margin-top:0">نسخة احتياطية كاملة (لاعبين، حصص، حضور، مباريات) كملف واحد. أوراق التمرين تنحفظ من صفحة الورقة نفسها.</p>
        <button type="button" class="b" data-act="backup">${IC.down} تنزيل نسخة احتياطية</button>
        ${Store.DEMO ? '<button type="button" class="b danger" data-act="demoReset" style="margin-inline-start:8px">إرجاع البيانات التجريبية</button>' : ""}</section></div>`;
  };
  A.signOut = async () => { await Store.signOut(); location.reload(); };
  A.seasonPick = (el) => { try { localStorage.setItem("fah-season", el.value); } catch {} App.render(); };
  A.seasonNew = () => {
    const c = C.conf(), last = c.seasons[c.seasons.length - 1], y = +last.end.slice(0, 4);
    modal({ title: "بدء موسم جديد", body: `${fld("اسم الموسم", "name", y + "/" + (y + 1))}<div class="fr">${fld("البداية", "start", addDays(last.end, 1), 'type="date" dir="ltr"')}${fld("النهاية", "end", y + 1 + last.end.slice(4), 'type="date" dir="ltr"')}</div><p class="muted small">الموسم الحالي يبقى محفوظ في الأرشيف وتقدر ترجع له من نفس القائمة.</p>`,
      foot: `<button type="button" class="b red" data-save>بدء الموسم</button><button type="button" class="b" data-close>إلغاء</button>`,
      onMount(w, api) { $("[data-save]", w).addEventListener("click", () => { const f = formData(w); if (!f.name || !f.start || !f.end || f.end <= f.start) return toast("تحقق من الاسم والتواريخ", true); if (c.seasons.some((s) => s.name === f.name)) return toast("هذا الموسم موجود", true);
        Store.setSetting("app", { ...c, seasons: [...c.seasons, f], season: f.name }); try { localStorage.setItem("fah-season", f.name); } catch {} toast("بدأ موسم " + f.name); api.close(); }); } });
  };
  A.defsSave = () => { const f = formData($("#defs")); Store.setSetting("app", { ...C.conf(), ...f }); toast("تم الحفظ"); };
  A.backup = () => saveFile("فحيحيل تحت 15 - نسخة احتياطية " + today() + ".json", Store.exportAll(), "application/json").then((ok) => ok && toast("تم تنزيل النسخة"));
  A.demoReset = async () => { if (await ask("إرجاع البيانات التجريبية؟", "تنمسح تغييراتك في الوضع التجريبي وترجع البيانات الوهمية الأصلية.", "إرجاع")) Store.resetDemo(); };
})();
