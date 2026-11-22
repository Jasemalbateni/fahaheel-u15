/* الهيكل + اليوم + التقويم + النشاط + الحضور + اللاعبون */
(function () {
  const { esc, $, $$, today, addDays, diffDays, dayName, fmtD, fmtFull, fmtLong, relDay, pd, iso, toast, modal, ask, formData, fld, selF, areaF } = U;
  const LOGO = window.FAH_LOGO;
  const V = (window.V = {}); // views: name -> (arg) => html
  const A = (window.A = {}); // click actions: name -> (el, event)
  const After = (window.After = {}); // optional post-render hooks per view

  const I = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra || ""}>${d}</svg>`;
  const IC = (window.IC = {
    today: I('<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
    calendar: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    players: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.900 1.900 6.500 5.500M16 4.800a3.500 3.500 0 0 1 0 6.400M18 14.800c2 .700 3.200 2.500 3.500 5.200"/>'),
    attendance: I('<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 2.500h6v3H9zM8.500 13l2.500 2.500 4.500-5"/>'),
    drills: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 12h3.500M21 12h-3.500"/><circle cx="12" cy="12" r="2.500"/>'),
    matches: I('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
    stats: I('<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>'),
    report: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
    settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 0 0 .300 1.800l.100.100a2 2 0 1 1-2.800 2.800l-.100-.100a1.700 1.700 0 0 0-2.800 1.200V21a2 2 0 1 1-4 0v-.100a1.700 1.700 0 0 0-2.900-1.200l-.100.100a2 2 0 1 1-2.800-2.800l.100-.100a1.700 1.700 0 0 0-1.200-2.800H3a2 2 0 1 1 0-4h.100a1.700 1.700 0 0 0 1.200-2.900l-.100-.100a2 2 0 1 1 2.800-2.800l.100.100a1.700 1.700 0 0 0 1.800.300H9a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.100a1.700 1.700 0 0 0 2.900 1.200l.100-.100a2 2 0 1 1 2.800 2.800l-.100.100a1.700 1.700 0 0 0-.300 1.800V9a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.100a1.700 1.700 0 0 0-1.500 1z"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.400"'),
    more: I('<circle cx="5" cy="12" r="1.600"/><circle cx="12" cy="12" r="1.600"/><circle cx="19" cy="12" r="1.600"/>'),
    next: I('<path d="M15 6l-6 6 6 6"/>'), prev: I('<path d="M9 6l6 6-6 6"/>'),
    check: I('<path d="M5 12.500l4.500 4.500L19 7.500"/>', 'stroke-width="2.600"'),
    draw: I('<path d="M3 21l3.500-1 11-11-2.500-2.500-11 11zM14 5.500l2.500 2.500M17 3.500l3.500 3.500-2 2-3.500-3.500z"/>'),
    edit: I('<path d="M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4"/>'),
    down: I('<path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14"/>'),
    print: I('<path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/>'),
    pitch: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/><circle cx="12" cy="12" r="2.500"/>'),
    out: I('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h9"/>')
  });

  IC.prefs = IC.settings;
  const NAV = [
    ["today", "اليوم"], ["calendar", "التقويم"], ["players", "اللاعبون"], ["attendance", "الحضور"], ["drills", "التمارين"], ["draw", "استوديو الرسم"],
    ["matches", "المباريات"], ["stats", "الإحصائيات"], ["report", "تقرير الموسم"], ["prefs", "الإعدادات"]
  ];
  const STATUS_CHIP = { "متاح": "ok", "مصاب": "red", "مريض": "warn", "موقوف": "dark", "غائب بعذر": "info" };
  const ATT = { present: "حاضر", absent: "غائب", late: "متأخر", excused: "غائب بعذر" };
  const POSITIONS = ["حارس مرمى", "قلب دفاع", "ظهير أيمن", "ظهير أيسر", "محور", "وسط", "صانع ألعاب", "جناح أيمن", "جناح أيسر", "مهاجم"];
  const PHYS = ["", "القوة", "التحمّل", "السرعة", "رد الفعل والرشاقة", "التوافق", "المرونة والاستشفاء"];
  window.FAH = { STATUS_CHIP, ATT, POSITIONS, PHYS };

  const playersSorted = (all) => Store.D.players.filter((p) => all || p.active !== false).sort((a, b) => (a.number ?? 999) - (b.number ?? 999) || a.name.localeCompare(b.name, "ar"));
  const initials = (p) => (p.number != null && p.number !== "" ? p.number : (p.name || "؟").trim()[0]);
  const avatar = (p) => `<span class="avatar">${p.photo ? `<img src="${p.photo}" alt="">` : esc(initials(p))}</span>`;
  window.FAHU = { playersSorted, avatar };

  /* ---------- shell ---------- */
  function shell() {
    const me = Store.me || {};
    document.body.innerHTML = `
      ${Store.DEMO ? '<div class="demo-bar">وضع تجريبي — البيانات المعروضة وهمية ومحفوظة على هذا الجهاز فقط</div>' : ""}
      <div id="app">
        <aside class="side">
          <a class="club" href="#today"><img src="${LOGO}" alt="شعار نادي الفحيحيل"><div><b>نادي الفحيحيل</b><span>U15 · FAHAHEEL SC</span></div></a>
          <nav>${NAV.map(([k, t], i) => `${i === 6 || i === 9 ? '<div class="sep"></div>' : ""}<a href="#${k}" data-nav="${k}">${IC[k]}<span>${t}</span></a>`).join("")}</nav>
          <div class="who"><b>${esc(me.name || "")}</b>${esc(me.role || "")}<div class="sync" id="sync"></div></div>
        </aside>
        <header class="mtop"><img src="${LOGO}" alt=""><div><b>نادي الفحيحيل</b><span>U15 · FAHAHEEL SC</span></div><span class="sp"></span><span class="sync" id="sync-m"></span></header>
        <main id="main"></main>
        <nav class="tabs">
          ${[["today", "اليوم"], ["calendar", "التقويم"], ["attendance", "الحضور"], ["drills", "التمارين"]].map(([k, t]) => `<a href="#${k}" data-nav="${k}">${IC[k]}<span>${t}</span></a>`).join("")}
          <button type="button" data-act="more" data-nav="more">${IC.more}<span>المزيد</span></button>
        </nav>
      </div>`;
    document.getElementById("app").addEventListener("click", onClick);
    document.getElementById("app").addEventListener("change", onChange);
    syncStatus(Store.status());
  }
  function syncStatus(s) {
    const html = Store.DEMO ? '<i class="dot wait"></i>تجريبي' : s.failed ? '<i class="dot off"></i>تعذّر حفظ تغيير' : s.offline ? `<i class="dot off"></i>بدون اتصال${s.pending ? " · " + s.pending + " بانتظار الإرسال" : ""}` : s.pending ? '<i class="dot wait"></i>جارٍ الحفظ…' : '<i class="dot"></i>محفوظ';
    ["sync", "sync-m"].forEach((id) => { const el = document.getElementById(id); if (el) el.innerHTML = html; });
    if (s.failed) toast("تعذّر حفظ آخر تغيير: " + s.failed, true);
  }
  function onClick(e) {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const fn = A[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  }
  function onChange(e) {
    const el = e.target.closest("[data-chg]");
    if (el && A[el.dataset.chg]) A[el.dataset.chg](el, e);
  }

  /* ---------- router ---------- */
  let current = "";
  function route() {
    const h = (location.hash || "#today").slice(1);
    const m = h.match(/^(player|event|attendance|sheet)-(.+)$/);
    return m ? { name: m[1], arg: m[2] } : { name: V[h] ? h : "today", arg: null };
  }
  function render() {
    const main = document.getElementById("main");
    if (!main) return;
    const r = route();
    if (r.name === "sheet") { openSheetRoute(r.arg); return; }
    if (window.SheetApp && SheetApp.isOpen()) SheetApp.close(true);
    const key = r.name + (r.arg || "");
    const y = key === current ? window.scrollY : 0;
    main.innerHTML = V[r.name](r.arg) || "";
    const navKey = { player: "players", event: route().from || "calendar" }[r.name] || r.name;
    $$("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === navKey || (a.dataset.nav === "more" && !["today", "calendar", "attendance", "drills"].includes(navKey) && a.closest(".tabs"))));
    if (After[r.name]) After[r.name](main, r.arg);
    window.scrollTo(0, y);
    current = key;
  }
  let lastNonSheet = "#drills";
  function openSheetRoute(arg) {
    if (!SheetApp.isOpen() || SheetApp.currentId() !== arg) SheetApp.open(arg === "new" ? null : arg, App.pendingSheet || {});
    App.pendingSheet = null;
  }
  let raf = 0;
  function refresh() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (document.querySelector(".modal-back") || (window.SheetApp && SheetApp.isOpen())) { dirty = true; return; }
      const ae = document.activeElement;
      if (ae && ae.closest && ae.closest("#main") && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && !ae.dataset.rerender) { dirty = true; return; }
      dirty = false; render();
    });
  }
  let dirty = false;
  document.addEventListener("fah-modal-close", () => { if (dirty || true) setTimeout(refresh, 0); });
  document.addEventListener("focusout", () => { if (dirty) setTimeout(refresh, 50); });
  window.addEventListener("hashchange", () => { const h = location.hash; if (!/^#sheet-/.test(h)) lastNonSheet = h || "#today"; render(); });

  const App = (window.App = {
    render, refresh, pendingSheet: null,
    go(h) { if (location.hash === "#" + h) render(); else location.hash = h; },
    back() { location.hash = lastNonSheet; },
    async start() {
      document.body.innerHTML = `<div class="splash"><div><img src="${LOGO}" alt=""><p>نادي الفحيحيل · تحت 15</p></div></div>`;
      let ok = false;
      try { ok = await Store.init(); } catch (e) { return login(e.message || "تعذّر الاتصال"); }
      if (!ok) return login();
      boot();
    }
  });
  function boot() {
    shell();
    Store.on(refresh);
    Store.onStatus(syncStatus);
    render();
  }

  /* ---------- login ---------- */
  function login(msg) {
    let mode = "in";
    const draw = () => {
      document.body.innerHTML = `<div class="login"><form class="box" novalidate>
        <img src="${LOGO}" alt="شعار نادي الفحيحيل"><h1>نادي الفحيحيل</h1><p>فريق تحت 15 سنة · بوابة الطاقم الفني</p>
        <div class="f"><label>الإيميل</label><input name="email" type="email" autocomplete="username" dir="ltr" required></div>
        <div class="f"><label>${mode === "in" ? "كلمة المرور" : "اختر كلمة مرور (8 أحرف أو أكثر)"}</label><input name="password" type="password" autocomplete="${mode === "in" ? "current-password" : "new-password"}" dir="ltr" required minlength="8"></div>
        <div class="err">${esc(msg || "")}</div>
        <button class="b red block" type="submit">${mode === "in" ? "دخول" : "تفعيل الحساب"}</button>
        <button class="lnk" type="button">${mode === "in" ? "أول مرة؟ فعّل حسابك" : "عندي حساب — تسجيل الدخول"}</button>
      </form></div>`;
      const f = $("form"), err = $(".err");
      $(".lnk").onclick = () => { mode = mode === "in" ? "up" : "in"; msg = ""; draw(); };
      f.onsubmit = async (e) => {
        e.preventDefault();
        const email = f.email.value.trim(), pw = f.password.value;
        if (!email || pw.length < 8) { err.textContent = "اكتب الإيميل وكلمة مرور من 8 أحرف أو أكثر"; return; }
        $("button[type=submit]").disabled = true; err.textContent = "";
        try {
          const r = mode === "in" ? await Store.signIn(email, pw) : await Store.signUp(email, pw);
          if (r === "confirm") { mode = "in"; msg = "وصلتك رسالة تفعيل على الإيميل — افتح الرابط ثم سجّل دخولك"; draw(); return; }
          boot();
        } catch (ex) { err.textContent = ex.message || "تعذّر الدخول"; $("button[type=submit]").disabled = false; }
      };
    };
    draw();
  }

  A.more = () => {
    modal({ title: "المزيد", body: `<div class="optlist">${NAV.filter(([k]) => !["today", "calendar", "attendance", "drills"].includes(k)).map(([k, t]) => `<button type="button" data-go="${k}" data-close><span style="width:20px;height:20px;display:grid">${IC[k]}</span>${t}</button>`).join("")}</div>`,
      onMount: (w) => w.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) App.go(b.dataset.go); }) });
  };
  A.go = (el) => App.go(el.dataset.to);

  /* ---------- shared bits ---------- */
  const ph = (kick, title, sub, acts) => `<div class="ph"><div class="t"><div class="kick">${kick}</div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="acts no-print">${acts || ""}</div></div>`;
  window.ph = ph;
  const datebox = (e) => { const d = pd(e.date); return `<span class="datebox ${e.type === "match" ? "match" : ""} ${e.status === "cancelled" ? "off" : ""}"><b>${d.getDate()}</b><span>${U.MONTHS[d.getMonth()]}</span></span>`; };
  const evRow = (e) => {
    const sh = C.sheetOf(e), res = C.result(e);
    const sub = [dayName(e.date), e.time, e.place].filter(Boolean).join(" · ");
    const chip = e.status === "cancelled" ? '<span class="chip red">ملغاة</span>' : e.type === "match" ? (res ? `<span class="chip ${res === "W" ? "ok" : res === "L" ? "red" : ""} num">${e.score_for} - ${e.score_against}</span>` : '<span class="chip dark">مباراة</span>') : sh ? '<span class="chip ok">ورقة جاهزة</span>' : e.type === "training" ? '<span class="chip">بدون ورقة</span>' : `<span class="chip info">${C.typeName(e)}</span>`;
    return `<a class="rw" href="#event-${e.id}">${datebox(e)}${e.type === "match" ? C.crest(e.opponent, 34) : ""}<span class="grow"><b>${esc(C.title(e))}</b><span>${esc(sub)}</span></span>${chip}</a>`;
  };
  window.FAHU.evRow = evRow; window.FAHU.datebox = datebox;

  /* =====================================================================
     اليوم
     ===================================================================== */
  V.today = () => {
    const t = today(), evs = C.events();
    const todays = evs.filter((e) => e.date === t && C.held(e));
    const nextTr = evs.find((e) => e.type === "training" && e.date >= t && C.held(e));
    const nextM = evs.find((e) => e.type === "match" && e.date >= t && C.held(e) && C.result(e) == null);
    const focus = todays.find((e) => e.type === "match") || todays.find((e) => e.type === "training") || nextTr;
    const ps = playersSorted();
    const out = ps.filter((p) => p.status && p.status !== "متاح");
    const avail = ps.length - out.length;
    const me = Store.me || {};
    let hero = "";
    if (focus) {
      const isToday = focus.date === t, sh = C.sheetOf(focus), att = C.attOf(focus.id);
      const pres = att.filter((a) => a.status === "present" || a.status === "late").length, abs = att.filter((a) => a.status === "absent" || a.status === "excused").length;
      hero = `<section class="hero">
        <div class="kick">${isToday ? "TODAY" : "NEXT SESSION"} · ${focus.type === "match" ? "MATCHDAY" : "TRAINING"}</div>
        <h2>${esc(C.title(focus))}</h2>
        <div class="meta"><span><b>${isToday ? "اليوم" : fmtLong(focus.date)}</b>${isToday ? "" : " · " + relDay(focus.date)}</span>${focus.time ? `<span>الساعة <b class="num">${esc(focus.time)}</b></span>` : ""}${focus.place ? `<span>${esc(focus.place)}</span>` : ""}${C.dur(focus) ? `<span><b class="num">${C.dur(focus)}</b> دقيقة</span>` : ""}</div>
        ${focus.goal_tech || focus.goal_phys ? `<div class="goals">${focus.goal_tech ? `<span>فني/تكتيكي: ${esc(focus.goal_tech)}</span>` : ""}${focus.goal_phys ? `<span>بدني: ${esc(focus.goal_phys)}</span>` : ""}</div>` : ""}
        ${att.length ? `<div class="goals"><span>حاضر <b class="num">${pres}</b></span><span>غائب <b class="num">${abs}</b></span><span>لم يُسجل <b class="num">${Math.max(0, ps.length - att.length)}</b></span></div>` : ""}
        <div class="acts">
          <a class="b red" href="#attendance-${focus.id}">${IC.attendance} تسجيل الحضور</a>
          ${focus.type === "training" ? `<button type="button" class="b ghost" data-act="evSheet" data-id="${focus.id}">${IC.drills} ${sh ? "ورقة التمرين" : "إنشاء ورقة التمرين"}</button>` : ""}
          <a class="b ghost" href="#event-${focus.id}">التفاصيل</a>
        </div></section>`;
    } else {
      hero = `<section class="hero"><div class="kick">NO SESSION</div><h2>ما في نشاط قادم في التقويم</h2><div class="acts"><button type="button" class="b red" data-act="evNew">${IC.plus} إضافة حصة</button></div></section>`;
    }
    let match = "";
    if (nextM) {
      const n = diffDays(nextM.date, t);
      match = `<section class="hero match"><div class="kick">NEXT MATCH · ${esc(nextM.competition || "")}</div>
        <div class="vs"><div class="team"><img src="${LOGO}" alt="">الفحيحيل</div>
          <div class="mid"><div class="big">${n === 0 ? "اليوم" : n}</div><small>${n === 0 ? "يوم المباراة" : n === 1 ? "يوم على المباراة" : "أيام على المباراة"}</small></div>
          <div class="team">${C.oppBadge(nextM.opponent)}${esc(nextM.opponent || "—")}</div></div>
        <div class="meta" style="justify-content:center;margin-top:12px"><span><b>${fmtLong(nextM.date)}</b></span>${nextM.time ? `<span class="num">${esc(nextM.time)}</span>` : ""}${nextM.place ? `<span>${esc(nextM.place)}</span>` : ""}</div>
        ${nextM.meet_time ? `<div class="meta" style="justify-content:center"><span>التجمع <b class="num">${esc(nextM.meet_time)}</b>${nextM.meet_place ? " · " + esc(nextM.meet_place) : ""}</span></div>` : ""}
        <div class="acts" style="justify-content:center"><a class="b ghost" href="#event-${nextM.id}">تفاصيل المباراة</a></div></section>`;
    }
    // alerts
    const stats = C.playerStats(addDays(t, -30), t);
    const absent = stats.filter((s) => s.p.active !== false && s.absent + s.excused >= 3).sort((a, b) => b.absent + b.excused - (a.absent + a.excused));
    const seasonStats = C.playerStats();
    const cards = seasonStats.filter((s) => s.yellow >= 2 || s.red > 0);
    const alerts = [
      ...out.map((p) => `<a class="rw" href="#player-${p.id}">${avatar(p)}<span class="grow"><b>${esc(p.name)}</b><span>${esc(p.status_note || "—")}</span></span><span class="chip ${STATUS_CHIP[p.status] || ""}">${esc(p.status)}</span></a>`),
      ...absent.map((s) => `<a class="rw" href="#player-${s.p.id}">${avatar(s.p)}<span class="grow"><b>${esc(s.p.name)}</b><span>غاب ${s.absent + s.excused} مرات في آخر 30 يوم</span></span><span class="chip warn">غياب متكرر</span></a>`),
      ...cards.map((s) => `<a class="rw" href="#player-${s.p.id}">${avatar(s.p)}<span class="grow"><b>${esc(s.p.name)}</b><span>${s.yellow} صفراء${s.red ? " · " + s.red + " حمراء" : ""} هذا الموسم</span></span><span class="chip dark">بطاقات</span></a>`)
    ];
    const upcoming = evs.filter((e) => e.date >= t && e !== focus).slice(0, 5);
    const lastM = evs.filter((e) => e.type === "match" && C.result(e)).slice(-1)[0];
    const hello = new Date().getHours() < 12 ? "صباح الخير" : "مساء الخير";
    return ph("FAHAHEEL U15 · " + fmtFull(t), `${hello}${me.name ? "، " + esc(me.name.split(" ")[0]) : ""}`, fmtLong(t), `<button type="button" class="b dark" data-act="evNew">${IC.plus} إضافة نشاط</button>`) +
      `<div class="grid ${match ? "g23" : ""}">${hero}${match}</div>
      <div class="tiles mt">
        <div class="tile ok"><b>${avail}<small> / ${ps.length}</small></b><span>لاعب متاح</span></div>
        <div class="tile ${out.filter((p) => p.status === "مصاب" || p.status === "مريض").length ? "red" : ""}"><b>${out.filter((p) => p.status === "مصاب" || p.status === "مريض").length}</b><span>مصاب أو مريض</span></div>
        <div class="tile"><b>${out.filter((p) => p.status === "موقوف").length}</b><span>موقوف</span></div>
        ${lastM ? `<a class="tile dark" href="#event-${lastM.id}"><b>${lastM.score_for} - ${lastM.score_against}</b><span>آخر مباراة · ${esc(lastM.opponent || "")}</span></a>` : ""}
      </div>
      <div class="grid g2 mt">
        <section class="card"><h3>تنبيهات <span class="sp"></span><small>${alerts.length || "لا يوجد"}</small></h3><div class="rows">${alerts.slice(0, 7).join("") + (alerts.length > 7 ? `<a class="rw" href="#players"><span class="grow"><span>و ${alerts.length - 7} تنبيهات أخرى — افتح قائمة اللاعبين</span></span></a>` : "") || '<div class="empty small">كل اللاعبين متاحين وما في تنبيهات</div>'}</div></section>
        <section class="card"><h3>القادم <span class="sp"></span><a class="b sm" href="#calendar">التقويم</a></h3><div class="rows">${upcoming.map(evRow).join("") || '<div class="empty small">ما في أنشطة قادمة</div>'}</div></section>
      </div>`;
  };

  /* =====================================================================
     التقويم
     ===================================================================== */
  let calMonth = today().slice(0, 7), calSel = today();
  V.calendar = () => {
    const [y, m] = calMonth.split("-").map(Number), first = new Date(y, m - 1, 1), start = addDays(iso(first), -first.getDay());
    const byDate = {};
    Store.D.events.forEach((e) => (byDate[e.date] = byDate[e.date] || []).push(e));
    Object.values(byDate).forEach((a) => a.sort((p, q) => (p.time || "").localeCompare(q.time || "")));
    let cells = "";
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i), out = d.slice(0, 7) !== calMonth;
      if (i >= 35 && out && i % 7 === 0) break;
      cells += `<button type="button" class="day${out ? " out" : ""}${d === today() ? " today" : ""}${d === calSel ? " sel" : ""}" data-act="calDay" data-d="${d}"><span class="n">${pd(d).getDate()}</span><span class="evs">${(byDate[d] || []).map((e) => `<span class="ev ${e.type} ${e.status === "cancelled" ? "cancelled" : ""}">${esc((e.time ? e.time + " " : "") + C.title(e))}</span>`).join("")}</span></button>`;
    }
    const sel = byDate[calSel] || [];
    return ph("CALENDAR", "التقويم وجدول الفريق", "", `<button type="button" class="b red" data-act="evNew" data-d="${calSel}">${IC.plus} إضافة نشاط</button>`) +
      `<div class="cal-head"><button type="button" class="b sm" data-act="calNav" data-n="-1" aria-label="الشهر السابق">${IC.prev}</button><h2>${U.MONTHS[m - 1]} <span class="num">${y}</span></h2><button type="button" class="b sm" data-act="calNav" data-n="1" aria-label="الشهر التالي">${IC.next}</button><button type="button" class="b sm" data-act="calNav" data-n="0">اليوم</button></div>
      <div class="cal">${U.DAYS.map((d) => `<div class="dn">${d}</div>`).join("")}${cells}</div>
      <div class="legend"><span><i style="background:#141213"></i>تمرين</span><span><i style="background:#d71920"></i>مباراة</span><span><i style="background:#3d5a78"></i>اجتماع</span><span><i style="background:#1d7a46"></i>راحة</span></div>
      <section class="card mt"><h3>${fmtLong(calSel)} <span class="sp"></span><small>${relDay(calSel)}</small></h3><div class="rows">${sel.map(evRow).join("") || `<div class="empty small">ما في نشاط بهذا اليوم<br><button type="button" class="b sm mt" data-act="evNew" data-d="${calSel}">${IC.plus} إضافة</button></div>`}</div></section>`;
  };
  A.calDay = (el) => { calSel = el.dataset.d; if (calSel.slice(0, 7) !== calMonth) calMonth = calSel.slice(0, 7); render(); };
  A.calNav = (el) => {
    const n = +el.dataset.n;
    if (!n) { calMonth = today().slice(0, 7); calSel = today(); } else { const [y, m] = calMonth.split("-").map(Number); calMonth = iso(new Date(y, m - 1 + n, 1)).slice(0, 7); }
    render();
  };

  /** شعار المنافس: نشيل الخلفية البيضاء المحيطة فقط (الأبيض داخل الشعار يبقى) */
  function dropWhiteBg(c) {
    const ctx = c.getContext("2d"), w = c.width, h = c.height, d = ctx.getImageData(0, 0, w, h), px = d.data;
    const white = (i) => px[i * 4 + 3] > 0 && px[i * 4] > 236 && px[i * 4 + 1] > 236 && px[i * 4 + 2] > 236;
    const seen = new Uint8Array(w * h), q = [];
    const push = (i) => { if (!seen[i] && white(i)) { seen[i] = 1; q.push(i); } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (q.length) { const i = q.pop(), x = i % w; px[i * 4 + 3] = 0; if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (i >= w) push(i - w); if (i < w * (h - 1)) push(i + w); }
    ctx.putImageData(d, 0, 0);
  }

  /* ---------- event form ---------- */
  function eventForm(ev, presetDate, presetType) {
    const conf = C.conf(), isNew = !ev;
    const e = ev || { id: Store.uid(), type: presetType || "training", date: presetDate || today(), time: conf.time, duration: conf.duration, place: conf.place, status: "scheduled", title: "", competition: "دوري تحت 15", home_away: "على أرضنا" };
    const body = `
      <div class="fr">${selF("النوع", "type", e.type, [["training", "تمرين"], ["match", "مباراة"], ["meeting", "اجتماع"], ["rest", "يوم راحة"]])}${fld("التاريخ", "date", e.date, 'type="date" dir="ltr" required')}</div>
      <div class="fr">${fld("الوقت", "time", e.time, 'type="time" dir="ltr"')}${fld("المدة (دقيقة)", "duration", e.duration, 'inputmode="numeric" data-num dir="ltr"')}</div>
      ${fld("المكان", "place", e.place)}
      <div data-for="training meeting rest">${fld("العنوان", "title", e.title, 'placeholder="مثال: التنظيم الدفاعي + القوة"')}</div>
      <div data-for="training"><div class="fr">${fld("الهدف الفني / التكتيكي", "goal_tech", e.goal_tech)}${selF("الهدف البدني", "goal_phys", e.goal_phys || "", PHYS.map((p) => [p, p || "—"]))}</div></div>
      <div data-for="match">
        <div class="fr">${fld("المنافس", "opponent", e.opponent)}${fld("البطولة", "competition", e.competition)}</div>
        <div class="f"><label>شعار المنافس (اختياري)</label><div style="display:flex;align-items:center;gap:12px"><span id="lgPrev" style="width:44px;height:44px;display:grid;place-items:center">${C.logo(e.opponent) ? `<img src="${C.logo(e.opponent)}" alt="" style="width:44px;height:44px;object-fit:contain">` : ""}</span><input type="file" accept="image/*" id="lgIn" style="flex:1;min-width:0"></div><div class="hint">ينحفظ باسم المنافس ويظهر في كل مبارياته.</div></div>
        <div class="fr3">${selF("الملعب", "home_away", e.home_away, ["على أرضنا", "خارج أرضنا", "محايد"])}${fld("وقت التجمع", "meet_time", e.meet_time, 'type="time" dir="ltr"')}${fld("مكان التجمع", "meet_place", e.meet_place)}</div>
      </div>
      ${isNew ? `<div data-for="training" class="f"><label>تكرار أسبوعي (اختياري)</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${U.DAYS.map((d, i) => `<label class="chip" style="cursor:pointer;padding:6px 10px"><input type="checkbox" data-rep="${i}" style="margin:0 0 0 4px;accent-color:#d71920">${d}</label>`).join("")}</div>
        <div class="fr" style="margin-top:8px">${fld("حتى تاريخ", "until", "", 'type="date" dir="ltr"')}<div></div></div>
        <div class="hint">اختر الأيام وتاريخ النهاية، وتنضاف كل الحصص للتقويم مرة وحدة.</div></div>` : ""}`;
    modal({
      title: isNew ? "إضافة نشاط" : "تعديل النشاط", body,
      foot: `<button type="button" class="b red" data-save>حفظ</button><button type="button" class="b" data-close>إلغاء</button>`,
      onMount(w, api) {
        const sync = () => { const t = $("[name=type]", w).value; $$("[data-for]", w).forEach((x) => (x.style.display = x.dataset.for.split(" ").includes(t) ? "" : "none")); };
        $("[name=type]", w).addEventListener("change", sync); sync();
        let newLogo = "";
        $("#lgIn", w).addEventListener("change", (x) => {
          const f = x.target.files[0]; if (!f) return;
          const im = new Image(), url = URL.createObjectURL(f);
          im.onload = () => { const sc = Math.min(1, 200 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); dropWhiteBg(c); newLogo = c.toDataURL("image/png"); $("#lgPrev", w).innerHTML = `<img src="${newLogo}" alt="" style="width:44px;height:44px;object-fit:contain">`; URL.revokeObjectURL(url); };
          im.onerror = () => toast("تعذّر قراءة الصورة", true);
          im.src = url;
        });
        $("[data-save]", w).addEventListener("click", () => {
          const f = formData(w), until = f.until; delete f.until;
          if (!f.date) return toast("حدد التاريخ", true);
          if (f.type === "match" && !f.opponent) return toast("اكتب اسم المنافس", true);
          if (f.type === "match" && newLogo) Store.setSetting("logos", { ...Store.setting("logos", {}), [f.opponent.trim()]: newLogo });
          const base = { ...e, ...f };
          const reps = $$("[data-rep]:checked", w).map((c) => +c.dataset.rep);
          if (isNew && f.type === "training" && reps.length && until) {
            if (diffDays(until, f.date) > 370) return toast("أقصى مدة للتكرار سنة", true);
            let n = 0;
            for (let d = f.date; d <= until; d = addDays(d, 1)) if (reps.includes(pd(d).getDay())) { Store.put("events", { ...base, id: Store.uid(), date: d }); n++; }
            toast(`انضافت ${n} حصة للتقويم`);
          } else { Store.put("events", base); toast("تم الحفظ"); }
          calSel = f.date; calMonth = f.date.slice(0, 7);
          api.close();
        });
      }
    });
  }
  A.evNew = (el) => eventForm(null, el.dataset.d, el.dataset.type);
  A.evEdit = (el) => eventForm({ ...Store.get("events", el.dataset.id) });
  A.evSheet = (el) => {
    const e = Store.get("events", el.dataset.id);
    if (e.sheet_id && Store.get("sheets", e.sheet_id)) return App.go("sheet-" + e.sheet_id);
    App.pendingSheet = { event: e };
    App.go("sheet-new");
  };
  A.evCancel = async (el) => {
    const e = { ...Store.get("events", el.dataset.id) };
    if (e.status === "cancelled") { e.status = "scheduled"; e.cancel_reason = ""; Store.put("events", e); toast("رجعت الحصة للجدول"); return; }
    modal({
      title: "إلغاء " + (e.type === "match" ? "المباراة" : "الحصة"),
      body: `<p class="muted" style="margin-top:0">تبقى في التقويم كملغاة، وما تنحسب في الحضور ولا الإحصائيات. وتقدر ترجّعها أي وقت.</p>${fld("سبب الإلغاء (اختياري)", "reason", "", 'placeholder="مثال: الملعب غير متاح / أمطار"')}`,
      foot: `<button type="button" class="b red" data-ok>إلغاء الحصة</button><button type="button" class="b" data-close>رجوع</button>`,
      onMount(w, api) { $("[data-ok]", w).addEventListener("click", () => { e.status = "cancelled"; e.cancel_reason = $("[name=reason]", w).value; Store.put("events", e); toast("تم إلغاء الحصة"); api.close(); }); }
    });
  };
  A.evDel = async (el) => {
    const e = Store.get("events", el.dataset.id);
    if (!(await ask("حذف النشاط نهائياً؟", "ينحذف من التقويم مع سجل الحضور الخاص فيه، وما يمكن التراجع. إذا تبي تحتفظ بالسجل استخدم «إلغاء الحصة» بدل الحذف.", "حذف نهائي"))) return;
    Store.del("events", e.id); toast("تم الحذف"); App.go("calendar");
  };

  /* =====================================================================
     صفحة النشاط (حصة / مباراة)
     ===================================================================== */
  V.event = (id) => {
    const e = Store.get("events", id);
    if (!e) return `<div class="empty"><b>النشاط غير موجود</b><a class="b mt" href="#calendar">رجوع للتقويم</a></div>`;
    const cancelled = e.status === "cancelled", sh = C.sheetOf(e), att = C.attOf(id), past = e.date <= today();
    const cnt = (s) => att.filter((a) => a.status === s).length;
    const isT = e.type === "training", isM = e.type === "match", r = C.rpe(e), load = C.load(e);
    const absentees = att.filter((a) => a.status !== "present").map((a) => ({ a, p: Store.get("players", a.player_id) })).filter((x) => x.p);
    let html = ph(`${C.typeName(e).toUpperCase()} · ${fmtFull(e.date)}`.replace("تمرين", "TRAINING").replace("مباراة", "MATCH").replace("اجتماع", "MEETING").replace("راحة", "REST"), esc(C.title(e)),
      [fmtLong(e.date), e.time ? `<span class="num">${esc(e.time)}</span>` : "", esc(e.place || ""), C.dur(e) ? C.dur(e) + " دقيقة" : ""].filter(Boolean).join(" · "),
      `<button type="button" class="b" data-act="evEdit" data-id="${id}">${IC.edit} تعديل</button>`);
    if (cancelled) html += `<div class="banner red">هذي ${isM ? "المباراة" : "الحصة"} ملغاة${e.cancel_reason ? " — " + esc(e.cancel_reason) : ""}<span class="sp"></span><button type="button" class="b sm" data-act="evCancel" data-id="${id}">إرجاع للجدول</button></div>`;
    html += `<div class="toolbar no-print">
      ${isT || isM ? `<a class="b red" href="#attendance-${id}">${IC.attendance} ${att.length ? "تعديل الحضور" : "تسجيل الحضور"}</a>` : ""}
      ${isT ? `<button type="button" class="b dark" data-act="evSheet" data-id="${id}">${IC.drills} ${sh ? "فتح ورقة التمرين" : "إنشاء ورقة التمرين"}</button>` : ""}
      ${!cancelled ? `<button type="button" class="b" data-act="evCancel" data-id="${id}">إلغاء ${isM ? "المباراة" : "الحصة"}</button>` : ""}
      <button type="button" class="b danger" data-act="evDel" data-id="${id}">حذف</button></div>`;
    if (isM) {
      html += `<section class="card"><h3>النتيجة</h3>
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <b>الفحيحيل</b>${C.crest("الفحيحيل", 44)}<input class="search num" style="flex:0 0 74px;min-width:0;text-align:center;font-size:26px;font-weight:700" inputmode="numeric" data-chg="evField" data-id="${id}" data-k="score_for" data-num value="${e.score_for ?? ""}">
          <span class="muted">—</span><input class="search num" style="flex:0 0 74px;min-width:0;text-align:center;font-size:26px;font-weight:700" inputmode="numeric" data-chg="evField" data-id="${id}" data-k="score_against" data-num value="${e.score_against ?? ""}">${C.crest(e.opponent, 44)}<b>${esc(e.opponent || "المنافس")}</b>
          <span class="sp" style="flex:1"></span>${e.competition ? `<span class="chip">${esc(e.competition)}</span>` : ""}${e.home_away ? `<span class="chip">${esc(e.home_away)}</span>` : ""}
        </div>${e.meet_time ? `<p class="muted small" style="margin:10px 0 0">التجمع ${esc(e.meet_time)}${e.meet_place ? " · " + esc(e.meet_place) : ""}</p>` : ""}</section>`;
    }
    html += `<div class="grid g2 mt">`;
    if (isT || isM) {
      html += `<section class="card"><h3>الحضور <span class="sp"></span><small>${att.length ? att.length + " مسجل" : "لم يُسجل بعد"}</small></h3>
        <div class="att-count" style="margin:0 0 10px"><div class="p"><b>${cnt("present")}</b><span>حاضر</span></div><div class="l"><b>${cnt("late")}</b><span>متأخر</span></div><div class="a"><b>${cnt("absent")}</b><span>غائب</span></div><div><b>${cnt("excused")}</b><span>بعذر</span></div></div>
        <div class="rows">${absentees.map(({ a, p }) => `<a class="rw" href="#player-${p.id}">${avatar(p)}<span class="grow"><b>${esc(p.name)}</b><span>${esc(a.status === "late" && a.late_min ? "تأخر " + a.late_min + " دقيقة" : a.reason || "")}</span></span><span class="chip ${a.status === "absent" ? "red" : a.status === "late" ? "warn" : "info"}">${ATT[a.status]}</span></a>`).join("") || (att.length ? '<div class="empty small">الكل حاضر</div>' : "")}</div></section>`;
      html += `<section class="card"><h3>بعد ${isM ? "المباراة" : "الحصة"} <span class="sp"></span><small>${load != null ? `الحمل <b class="num">${load}</b>${r.est ? " (تقديري)" : ""}` : ""}</small></h3>
        <div class="fr">${`<div class="f"><label>المدة الفعلية (دقيقة)</label><input inputmode="numeric" dir="ltr" data-chg="evField" data-id="${id}" data-k="actual_duration" data-num value="${e.actual_duration ?? ""}" placeholder="${e.duration ?? ""}"></div>`}
          <div class="f"><label>شدة الجهد RPE ${r && r.est ? `<span class="muted">· تقديري ${r.v}</span>` : ""}</label><div class="rpe">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<button type="button" class="${Number(e.rpe) === n ? "on" : ""}" data-act="evRpe" data-id="${id}" data-n="${n}">${n}</button>`).join("")}</div></div></div>
        <div class="f"><label>ما نُفذ فعلياً وملاحظات</label><textarea data-chg="evField" data-id="${id}" data-k="notes_after" placeholder="وش مشى زين؟ وش يحتاج إعادة؟">${esc(e.notes_after || "")}</textarea></div>
        <div class="hint muted small">الحمل = المدة × شدة الجهد. إذا ما دخلت الشدة، تنحسب تقديرياً من شدة تمارين الورقة.</div></section>`;
    }
    if (isT) {
      html += `<section class="card" style="grid-column:1/-1"><h3>ورقة التمرين <span class="sp"></span>${sh ? `<button type="button" class="b sm" data-act="evSheet" data-id="${id}">فتح</button>` : ""}</h3>
        ${e.goal_tech || e.goal_phys ? `<p style="margin:0 0 10px">${e.goal_tech ? `<span class="chip dark">فني/تكتيكي: ${esc(e.goal_tech)}</span> ` : ""}${e.goal_phys ? `<span class="chip red">بدني: ${esc(e.goal_phys)}</span>` : ""}</p>` : ""}
        ${sh ? `<div class="tw"><table class="t"><thead><tr><th>#</th><th>التمرين</th><th>المحور</th><th>الشدة</th><th class="n">المدة</th></tr></thead><tbody>${sh.summary.map((d, i) => `<tr><td class="n">${i + 1}</td><td class="name">${esc(d.title || "—")}</td><td>${esc(d.type === "match" ? "مباراة" : d.cat || "")}</td><td>${esc(d.intensity || "")}</td><td class="n">${esc(d.dur || "—")}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty small">ما في ورقة مربوطة بهذي الحصة<br><button type="button" class="b sm red mt" data-act="evSheet" data-id="${id}">${IC.plus} إنشاء ورقة التمرين</button></div>`}</section>`;
    }
    html += `</div>`;
    if (isM) {
      const ms = new Map(Store.D.match_stats.filter((s) => s.event_id === id).map((s) => [s.player_id, s]));
      const amap = new Map(att.map((a) => [a.player_id, a]));
      const list = playersSorted(true).filter((p) => p.active !== false || ms.has(p.id));
      html += `<section class="card mt"><h3>المشاركات والإحصائيات <span class="sp"></span><small>تُحفظ تلقائياً</small></h3>
        <div class="tw"><table class="t"><thead><tr><th>اللاعب</th><th class="n">أساسي</th><th class="n">دقائق</th><th class="n">أهداف</th><th class="n">صناعة</th><th class="n">صفراء</th><th class="n">حمراء</th></tr></thead><tbody>
        ${list.map((p) => { const s = ms.get(p.id) || {}, a = amap.get(p.id), off = a && (a.status === "absent" || a.status === "excused");
          const inp = (k) => `<td class="n"><input inputmode="numeric" data-chg="msField" data-e="${id}" data-p="${p.id}" data-k="${k}" value="${s[k] || ""}" ${off ? "disabled" : ""}></td>`;
          return `<tr style="${off ? "opacity:.45" : ""}"><td class="name"><span class="num" style="color:var(--red);font-weight:700;margin-inline-end:6px">${p.number ?? ""}</span>${esc(p.name)}${off ? ` <span class="chip">${ATT[a.status]}</span>` : p.status !== "متاح" ? ` <span class="chip ${STATUS_CHIP[p.status] || ""}">${esc(p.status)}</span>` : ""}</td>
            <td class="n"><input type="checkbox" data-chg="msField" data-e="${id}" data-p="${p.id}" data-k="started" ${s.started ? "checked" : ""} ${off ? "disabled" : ""}></td>${inp("minutes")}${inp("goals")}${inp("assists")}${inp("yellow")}${inp("red")}</tr>`; }).join("")}
        </tbody></table></div></section>`;
    }
    return html;
  };
  A.evField = (el) => {
    const e = { ...Store.get("events", el.dataset.id) };
    let v = el.value; if (el.dataset.num !== undefined) v = v === "" ? null : Number(v);
    if (el.dataset.num !== undefined && v != null && (isNaN(v) || v < 0)) { toast("أدخل رقم صحيح", true); return; }
    e[el.dataset.k] = v; Store.put("events", e);
  };
  A.evRpe = (el) => { const e = { ...Store.get("events", el.dataset.id) }, n = +el.dataset.n; e.rpe = Number(e.rpe) === n ? null : n; Store.put("events", e); };
  A.msField = (el) => {
    const id = el.dataset.e + "_" + el.dataset.p;
    const s = { ...(Store.get("match_stats", id) || { id, event_id: el.dataset.e, player_id: el.dataset.p, started: false, minutes: null, goals: 0, assists: 0, yellow: 0, red: 0, position: (Store.get("players", el.dataset.p) || {}).position || "" }) };
    const k = el.dataset.k;
    if (k === "started") { s.started = el.checked; if (el.checked && !s.minutes) s.minutes = C.dur(Store.get("events", el.dataset.e)) || null; }
    else { const v = el.value === "" ? 0 : Number(el.value); if (isNaN(v) || v < 0) return toast("أدخل رقم صحيح", true); s[k] = k === "minutes" && el.value === "" ? null : v; }
    Store.put("match_stats", s);
  };

  /* =====================================================================
     الحضور والغياب — ضغطة: حاضر · ضغطتين: غائب · ثلاث: إلغاء
     ===================================================================== */
  function attEvents() { return C.events().filter((e) => e.type === "training" || e.type === "match"); }
  function attDefault() {
    const evs = attEvents(), t = today();
    return evs.find((e) => e.date === t && C.held(e)) || evs.filter((e) => e.date < t && C.held(e)).slice(-1)[0] || evs.find((e) => e.date > t) || null;
  }
  V.attendance = (id) => {
    const evs = attEvents(), e = (id && Store.get("events", id)) || attDefault();
    if (!e) return ph("ATTENDANCE", "الحضور والغياب") + `<div class="card empty"><b>ما في حصص بالتقويم</b>أضف حصة أولاً عشان تسجل حضورها.<br><button type="button" class="b red mt" data-act="evNew">${IC.plus} إضافة حصة</button></div>`;
    const i = evs.findIndex((x) => x.id === e.id), prev = evs[i - 1], next = evs[i + 1];
    const amap = new Map(C.attOf(e.id).map((a) => [a.player_id, a]));
    const list = playersSorted(true).filter((p) => p.active !== false || amap.has(p.id));
    const cnt = (s) => Array.from(amap.values()).filter((a) => a.status === s).length;
    const cancelled = e.status === "cancelled";
    return ph("ATTENDANCE", "الحضور والغياب", "ضغطة = حاضر · ضغطتين = غائب · ثلاث ضغطات = إلغاء", `<a class="b" href="#event-${e.id}">تفاصيل ${e.type === "match" ? "المباراة" : "الحصة"}</a>`) +
      `<div class="att-bar"><div class="att-ev">
          <button type="button" data-act="go" data-to="attendance-${prev ? prev.id : ""}" ${prev ? "" : "disabled"} aria-label="السابق">${IC.prev}</button>
          <div class="mid"><b>${esc(C.title(e))}</b><span>${fmtLong(e.date)} · ${relDay(e.date)}${e.time ? " · " + esc(e.time) : ""}</span></div>
          <button type="button" data-act="go" data-to="attendance-${next ? next.id : ""}" ${next ? "" : "disabled"} aria-label="التالي">${IC.next}</button></div>
        <div class="att-count"><div class="p"><b>${cnt("present") + cnt("late")}</b><span>حاضر</span></div><div class="a"><b>${cnt("absent") + cnt("excused")}</b><span>غائب</span></div><div class="l"><b>${cnt("late")}</b><span>متأخر</span></div><div><b>${list.length - amap.size}</b><span>لم يُسجل</span></div></div></div>
      ${cancelled ? `<div class="banner red">هذي الحصة ملغاة${e.cancel_reason ? " — " + esc(e.cancel_reason) : ""} وما ينسجل لها حضور.<span class="sp"></span><button type="button" class="b sm" data-act="evCancel" data-id="${e.id}">إرجاع للجدول</button></div>` : `
      <div class="toolbar"><button type="button" class="b sm" data-act="attAll" data-id="${e.id}">${IC.check} الكل حاضر</button><button type="button" class="b sm" data-act="attClear" data-id="${e.id}">مسح الكل</button><span style="flex:1"></span><button type="button" class="b sm danger" data-act="evCancel" data-id="${e.id}">إلغاء الحصة</button></div>
      <div class="agrid">${list.map((p) => { const a = amap.get(p.id), st = a ? a.status : "";
        return `<div class="pc ${st}" role="button" tabindex="0" data-act="attTap" data-e="${e.id}" data-p="${p.id}" aria-label="${esc(p.name)} — ${st ? ATT[st] : "لم يُسجل"}">
          ${p.status && p.status !== "متاح" ? `<span class="flag">${esc(p.status)}</span>` : ""}
          <button type="button" class="more" data-act="attMore" data-e="${e.id}" data-p="${p.id}" aria-label="خيارات أكثر">${IC.more}</button>
          <span class="no">${p.number ?? "–"}</span><span class="nm">${esc(p.name)}</span><span class="st">${st ? ATT[st] + (st === "late" && a.late_min ? " " + a.late_min + " د" : "") : "اضغط للتسجيل"}</span></div>`; }).join("")}</div>
      ${list.length ? "" : '<div class="card empty"><b>ما في لاعبين</b>أضف اللاعبين من قسم «اللاعبون».</div>'}`}`;
  };
  const attRow = (e, p, status, extra) => ({ id: e + "_" + p, event_id: e, player_id: p, status, late_min: null, reason: "", ...extra });
  A.attTap = (el, ev) => {
    if (ev.target.closest(".more")) return;
    const { e, p } = el.dataset, a = Store.get("attendance", e + "_" + p);
    const next = !a ? "present" : a.status === "present" || a.status === "late" ? "absent" : null;
    if (next) Store.put("attendance", attRow(e, p, next)); else Store.del("attendance", a.id);
    if (navigator.vibrate) try { navigator.vibrate(12); } catch {}
  };
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("pc")) { e.preventDefault(); e.target.click(); } });
  A.attMore = (el) => {
    const { e, p } = el.dataset, pl = Store.get("players", p), a = Store.get("attendance", e + "_" + p) || {};
    modal({
      title: pl.name,
      body: `<div class="optlist">${[["present", "حاضر"], ["late", "متأخر"], ["absent", "غائب دون عذر"], ["excused", "غائب بعذر"], ["", "مسح التسجيل"]].map(([k, t]) => `<button type="button" data-st="${k}" class="${(a.status || "") === k ? "on" : ""}">${t}</button>`).join("")}</div>
        <div class="fr" style="margin-top:12px">${fld("مدة التأخير (دقيقة)", "late_min", a.late_min, 'inputmode="numeric" data-num dir="ltr"')}${fld("السبب", "reason", a.reason)}</div>`,
      foot: `<button type="button" class="b red" data-save>حفظ</button><button type="button" class="b" data-close>إلغاء</button>`,
      onMount(w, api) {
        let st = a.status || "";
        w.addEventListener("click", (x) => { const b = x.target.closest("[data-st]"); if (b) { st = b.dataset.st; $$("[data-st]", w).forEach((y) => y.classList.toggle("on", y === b)); } });
        $("[data-save]", w).addEventListener("click", () => {
          const f = formData(w);
          if (!st) { if (a.id) Store.del("attendance", a.id); } else Store.put("attendance", attRow(e, p, st, { late_min: st === "late" ? f.late_min : null, reason: f.reason || "" }));
          api.close();
        });
      }
    });
  };
  A.attAll = (el) => {
    const amap = new Set(C.attOf(el.dataset.id).map((a) => a.player_id));
    playersSorted().forEach((p) => { if (!amap.has(p.id)) Store.put("attendance", attRow(el.dataset.id, p.id, "present")); });
    toast("انسجل الباقي حاضر — اضغط على الغايب مرة وحدة");
  };
  A.attClear = async (el) => {
    const recs = C.attOf(el.dataset.id);
    if (!recs.length) return;
    if (!(await ask("مسح حضور هذي الحصة؟", `ينمسح تسجيل ${recs.length} لاعب لهذي الحصة.`, "مسح"))) return;
    recs.forEach((a) => Store.del("attendance", a.id));
  };

  /* =====================================================================
     اللاعبون
     ===================================================================== */
  let pq = "", pfilter = "all";
  const pGrid = () => {
    const stats = new Map(C.playerStats().map((s) => [s.p.id, s]));
    const list = playersSorted(true).filter((p) => (!pq || p.name.includes(pq) || String(p.number ?? "") === pq) && (pfilter === "all" ? p.active !== false : pfilter === "out" ? p.active !== false && p.status !== "متاح" : pfilter === "inactive" ? p.active === false : true));
    if (!list.length) return `<div class="card empty"><b>${Store.D.players.length ? "ما في نتائج" : "ما في لاعبين بعد"}</b>${Store.D.players.length ? "جرّب بحث ثاني." : "أضف أول لاعب للقائمة."}</div>`;
    return `<div class="pgrid">${list.map((p) => { const s = stats.get(p.id);
      return `<a class="pcard${p.active === false ? " inactive" : ""}" href="#player-${p.id}"><div class="top"><span class="no">${p.number ?? ""}</span>${avatar(p)}<b>${esc(p.name)}</b></div>
        <div class="bot"><span>${esc(p.position || "—")}</span>${p.status && p.status !== "متاح" ? `<span class="chip ${STATUS_CHIP[p.status] || ""}">${esc(p.status)}</span>` : ""}${s && s.pct != null ? `<span class="pct num" title="نسبة الحضور">${s.pct}%</span>` : ""}</div></a>`; }).join("")}</div>`;
  };
  V.players = () => {
    const all = Store.D.players.filter((p) => p.active !== false);
    return ph("SQUAD · " + all.length + " PLAYERS", "قائمة اللاعبين", "", `<button type="button" class="b red" data-act="pNew">${IC.plus} إضافة لاعب</button>`) +
      `<div class="toolbar"><input class="search" id="pq" type="search" placeholder="ابحث بالاسم أو رقم القميص" value="${esc(pq)}">
        <div class="seg2">${[["all", "الكل"], ["out", "غير متاح"], ["inactive", "خارج القائمة"]].map(([k, t]) => `<button type="button" class="${pfilter === k ? "on" : ""}" data-act="pFilter" data-k="${k}">${t}</button>`).join("")}</div></div>
      <div id="pgrid">${pGrid()}</div>`;
  };
  After.players = (root) => { $("#pq", root).addEventListener("input", (e) => { pq = e.target.value.trim(); $("#pgrid", root).innerHTML = pGrid(); }); };
  A.pFilter = (el) => { pfilter = el.dataset.k; render(); };

  function playerForm(pl) {
    const isNew = !pl;
    const p = pl || { id: Store.uid(), name: "", status: "متاح", active: true, foot: "اليمنى", photo: "" };
    let photo = p.photo || "";
    modal({
      title: isNew ? "إضافة لاعب" : "تعديل بيانات اللاعب", wide: true,
      body: `<div class="fr">${fld("اسم اللاعب", "name", p.name, "required")}${fld("رقم القميص", "number", p.number, 'inputmode="numeric" data-num dir="ltr"')}</div>
        <div class="fr3">${selF("المركز الأساسي", "position", p.position || "", ["", ...POSITIONS].map((x) => [x, x || "—"]))}${fld("مراكز إضافية", "alt_positions", p.alt_positions)}${selF("القدم المفضلة", "foot", p.foot || "اليمنى", ["اليمنى", "اليسرى", "كلتاهما"])}</div>
        <div class="fr3">${fld("تاريخ الميلاد", "dob", p.dob, 'type="date" dir="ltr"')}${fld("الطول (سم)", "height", p.height, 'inputmode="decimal" data-num dir="ltr"')}${fld("الوزن (كجم)", "weight", p.weight, 'inputmode="decimal" data-num dir="ltr"')}</div>
        <div class="fr3">${fld("تاريخ القياس", "measured_at", p.measured_at, 'type="date" dir="ltr"')}${fld("جوال اللاعب", "phone", p.phone, 'inputmode="tel" dir="ltr"')}<div></div></div>
        <div class="fr">${fld("اسم ولي الأمر", "guardian_name", p.guardian_name)}${fld("جوال ولي الأمر", "guardian_phone", p.guardian_phone, 'inputmode="tel" dir="ltr"')}</div>
        <div class="fr">${selF("حالة اللاعب", "status", p.status || "متاح", ["متاح", "مصاب", "مريض", "موقوف", "غائب بعذر", "غير ذلك"])}${fld("تفاصيل الحالة", "status_note", p.status_note, 'placeholder="نوع الإصابة / مدة الغياب المتوقعة"')}</div>
        ${areaF("ملاحظات فنية وإدارية", "notes", p.notes)}
        <div class="f"><label>صورة اللاعب (اختياري)</label><div style="display:flex;align-items:center;gap:12px"><span class="avatar" id="phPrev" style="width:56px;height:56px">${photo ? `<img src="${photo}" alt="">` : "؟"}</span><input type="file" accept="image/*" id="phIn" style="flex:1"><button type="button" class="b sm" id="phDel">حذف الصورة</button></div></div>
        <label style="display:flex;gap:8px;align-items:center;font-weight:700"><input type="checkbox" name="active" ${p.active !== false ? "checked" : ""} style="width:20px;height:20px;accent-color:#d71920"> ضمن قائمة الفريق الحالية</label>`,
      foot: `<button type="button" class="b red" data-save>حفظ</button><button type="button" class="b" data-close>إلغاء</button>${isNew ? "" : '<span class="sp"></span><button type="button" class="b danger" data-del>حذف اللاعب</button>'}`,
      onMount(w, api) {
        $("#phIn", w).addEventListener("change", (e) => {
          const f = e.target.files[0]; if (!f) return;
          const im = new Image(), url = URL.createObjectURL(f);
          im.onload = () => { const s = Math.min(im.width, im.height), c = document.createElement("canvas"); c.width = c.height = 240; c.getContext("2d").drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 240, 240); photo = c.toDataURL("image/jpeg", 0.82); $("#phPrev", w).innerHTML = `<img src="${photo}" alt="">`; URL.revokeObjectURL(url); };
          im.onerror = () => toast("تعذّر قراءة الصورة", true);
          im.src = url;
        });
        $("#phDel", w).addEventListener("click", () => { photo = ""; $("#phPrev", w).textContent = "؟"; });
        $("[data-save]", w).addEventListener("click", () => {
          const f = formData(w);
          if (!f.name.trim()) return toast("اكتب اسم اللاعب", true);
          const dup = f.number != null && Store.D.players.find((x) => x.id !== p.id && x.active !== false && x.number === f.number);
          Store.put("players", { ...p, ...f, name: f.name.trim(), photo });
          toast(dup ? `تم الحفظ — تنبيه: الرقم ${f.number} مستخدم عند ${dup.name}` : "تم الحفظ", !!dup);
          api.close();
        });
        const del = $("[data-del]", w);
        if (del) del.addEventListener("click", async () => {
          if (!(await ask("حذف اللاعب نهائياً؟", "ينحذف مع كل سجل حضوره وإحصائياته، وما يمكن التراجع. إذا اللاعب ترك الفريق، الأفضل تشيل علامة «ضمن قائمة الفريق» عشان يبقى سجله.", "حذف نهائي"))) return;
          Store.del("players", p.id); api.close(); App.go("players");
        });
      }
    });
  }
  A.pNew = () => playerForm(null);
  A.pEdit = (el) => playerForm({ ...Store.get("players", el.dataset.id) });

  V.player = (id) => {
    const p = Store.get("players", id);
    if (!p) return `<div class="empty"><b>اللاعب غير موجود</b><a class="b mt" href="#players">رجوع للقائمة</a></div>`;
    const s = C.playerStats().find((x) => x.p.id === id);
    const months = {};
    s.recs.forEach(({ e, status }) => { const k = e.date.slice(0, 7); months[k] = months[k] || { ok: 0, n: 0 }; months[k].n++; if (status === "present" || status === "late") months[k].ok++; });
    const monthItems = Object.keys(months).sort().map((k) => ({ label: U.MONTHS[+k.slice(5) - 1], value: Math.round((months[k].ok / months[k].n) * 100), tip: `${U.MONTHS[+k.slice(5) - 1]} · ${Math.round((months[k].ok / months[k].n) * 100)}% (${months[k].ok} من ${months[k].n})` }));
    const attended = s.recs.filter((r) => (r.status === "present" || r.status === "late") && r.e.type === "training").map((r) => r.e);
    const cats = C.catMinutes(attended);
    const weeks = C.weeks(s.recs.filter((r) => r.status === "present" || r.status === "late").map((r) => r.e)).map(([w, evs]) => {
      let v = 0; evs.forEach((e) => { const q = C.rpe(e); if (!q) return; if (e.type === "match") { const m = Store.get("match_stats", e.id + "_" + id); v += ((m && m.minutes) || 0) * q.v; } else v += C.dur(e) * q.v; });
      return { label: fmtD(w), value: Math.round(v), tip: `أسبوع ${fmtD(w)} · ${Math.round(v)}` };
    }).slice(-12);
    const misses = s.recs.filter((r) => r.status !== "present").slice(-12).reverse();
    const info = [["المركز", p.position], ["مراكز إضافية", p.alt_positions], ["القدم", p.foot], ["العمر", p.dob ? U.age(p.dob) + " سنة · " + fmtFull(p.dob) : ""], ["الطول", p.height ? p.height + " سم" : ""], ["الوزن", p.weight ? p.weight + " كجم" : ""], ["تاريخ القياس", p.measured_at ? fmtFull(p.measured_at) : ""], ["جوال اللاعب", p.phone], ["ولي الأمر", [p.guardian_name, p.guardian_phone].filter(Boolean).join(" · ")]].filter((x) => x[1]);
    return `<p class="no-print" style="margin:0 0 10px"><a class="b sm" href="#players">${IC.prev} قائمة اللاعبين</a></p>
      <section class="hero"><div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <span class="avatar" style="width:84px;height:84px;font-size:40px;background:var(--red)">${p.photo ? `<img src="${p.photo}" alt="">` : esc(initials(p))}</span>
        <div style="flex:1;min-width:180px"><div class="kick">${p.number != null ? "NO. " + p.number + " · " : ""}FAHAHEEL U15</div><h2>${esc(p.name)}</h2>
          <div class="meta"><span>${esc(p.position || "—")}</span><span class="chip ${STATUS_CHIP[p.status] || ""}">${esc(p.status || "متاح")}</span>${p.active === false ? '<span class="chip">خارج القائمة</span>' : ""}</div>
          ${p.status_note ? `<div class="meta" style="margin-top:6px"><span>${esc(p.status_note)}</span></div>` : ""}</div>
        <div class="acts no-print" style="margin:0"><button type="button" class="b ghost" data-act="pEdit" data-id="${id}">${IC.edit} تعديل</button></div></div></section>
      <div class="tiles mt">
        <div class="tile ${s.pct != null && s.pct < 75 ? "red" : "ok"}"><b>${s.pct != null ? s.pct + "<small>%</small>" : "—"}</b><span>نسبة الحضور</span></div>
        <div class="tile"><b>${s.present + s.late}<small> / ${s.total}</small></b><span>حضور من المسجل</span></div>
        <div class="tile"><b>${s.late}</b><span>تأخير</span></div>
        <div class="tile"><b>${s.matches}<small> (${s.starts} أساسي)</small></b><span>مباريات</span></div>
        <div class="tile"><b>${s.minutes}</b><span>دقائق لعب</span></div>
        <div class="tile"><b>${s.goals}<small> + ${s.assists}</small></b><span>أهداف + صناعة</span></div>
        <div class="tile"><b>${s.yellow}<small> / ${s.red}</small></b><span>صفراء / حمراء</span></div>
        <div class="tile dark"><b>${s.load}</b><span>الحمل التراكمي</span></div>
      </div>
      <div class="grid g2 mt">
        <section class="card"><h3>سجل الحضور <span class="sp"></span><small>آخر ${Math.min(40, s.recs.length)} نشاط</small></h3>
          <div class="strip">${s.recs.slice(-40).map((r) => `<i class="${r.status}" title="${fmtFull(r.e.date)} — ${ATT[r.status]}"></i>`).join("") || '<span class="muted small">ما في سجل بعد</span>'}</div>
          <div class="legend"><span><i style="background:#1d7a46"></i>حاضر</span><span><i style="background:#e0a030"></i>متأخر</span><span><i style="background:#d71920"></i>غائب</span><span><i style="background:#8aa3bd"></i>بعذر</span></div></section>
        <section class="card"><h3>الحضور الشهري <span class="sp"></span><small>%</small></h3>${U.bars(monthItems, { max: 100, h: 170, label: "نسبة الحضور الشهرية" })}</section>
        <section class="card"><h3>المحتوى التدريبي اللي أخذه <span class="sp"></span><small>دقائق حسب المحور</small></h3>${U.hbars(cats, { fmt: (v) => v + " د", red: true })}</section>
        <section class="card"><h3>الحمل الأسبوعي <span class="sp"></span><small>المدة × الشدة</small></h3>${U.bars(weeks, { h: 170, label: "الحمل الأسبوعي للاعب" })}</section>
        <section class="card"><h3>الغياب والتأخير</h3><div class="rows">${misses.map((r) => `<a class="rw" href="#event-${r.e.id}">${datebox(r.e)}<span class="grow"><b>${esc(C.title(r.e))}</b><span>${esc(r.a.status === "late" && r.a.late_min ? "تأخر " + r.a.late_min + " دقيقة" : r.a.reason || dayName(r.e.date))}</span></span><span class="chip ${r.status === "absent" ? "red" : r.status === "late" ? "warn" : "info"}">${ATT[r.status]}</span></a>`).join("") || '<div class="empty small">ما عنده غياب ولا تأخير</div>'}</div></section>
        <section class="card"><h3>البيانات</h3><div class="rows">${info.map(([k, v]) => `<div class="rw"><span class="muted" style="width:110px;flex:0 0 auto">${k}</span><b class="grow" style="direction:${/^[\d+ ]+$/.test(v) ? "ltr" : "rtl"};text-align:right">${esc(v)}</b></div>`).join("") || '<div class="empty small">ما في بيانات مدخلة</div>'}</div>
          ${p.notes ? `<p style="margin:12px 0 0;white-space:pre-line"><b>ملاحظات:</b> ${esc(p.notes)}</p>` : ""}</section>
      </div>`;
  };
})();
