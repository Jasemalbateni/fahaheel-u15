/* طبقة البيانات: Supabase في الموقع المنشور، أو تخزين محلي في الوضع التجريبي */
(function () {
  const CFG = window.FAH_CONFIG || {};
  const DEMO = !CFG.url || CFG.demo || /[?&]demo\b/.test(location.search);
  const TABLES = ["staff", "players", "events", "attendance", "match_stats", "sheets", "settings", "drawings"];
  const SHEET_COLS = "id,kind,title,date,age,coach,goal_tech,goal_phys,summary,updated_at";
  const D = { staff: [], players: [], events: [], attendance: [], match_stats: [], sheets: [], settings: [], drawings: [] };
  const sheetData = new Map();  // id -> full sheet object
  const sheetThumbs = new Map(); // id -> { drillId: dataURL }
  let thumbsLoaded = false;
  const listeners = new Set();
  const statusListeners = new Set();
  let sb = null, me = null, pollTimer = 0;

  const emit = () => listeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  const emitStatus = () => statusListeners.forEach((f) => f(Store.status()));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  /* ---------- outbox: تغييرات تنتظر الإرسال (تشتغل حتى لو انقطع النت في الملعب) ---------- */
  const OUT_KEY = "fah-outbox-v1";
  let outbox = DEMO ? [] : (lsGet(OUT_KEY) || []);
  let flushing = false, offline = false, lastError = "";
  const saveOutbox = () => { if (!DEMO) lsSet(OUT_KEY, outbox); };
  function queue(item) {
    if (DEMO) { persistDemo(); return; }
    const at = outbox.findIndex((o, i) => o.table === item.table && o.id === item.id && !(i === 0 && flushing));
    if (at >= 0) outbox[at] = item; else outbox.push(item); // نفس السجل يأخذ مكانه في الطابور (الترتيب مهم للروابط)
    saveOutbox(); saveCache(); emitStatus(); flush();
  }
  async function flush() {
    if (DEMO || flushing || !sb || !outbox.length) return;
    flushing = true; emitStatus();
    while (outbox.length) {
      const o = outbox[0];
      let error = null;
      try {
        const r = o.op === "del" ? await sb.from(o.table).delete().eq("id", o.id) : await sb.from(o.table).upsert(o.row);
        error = r.error;
      } catch (e) { error = { network: true, message: String(e) }; }
      if (error) {
        const net = error.network || !navigator.onLine || /fetch|network|Failed/i.test(error.message || "");
        if (net) { offline = true; break; }
        lastError = error.message || "خطأ في الحفظ";
        console.error("save failed", o.table, error);
        outbox.shift(); saveOutbox();
        statusListeners.forEach((f) => f({ ...Store.status(), failed: lastError }));
        continue;
      }
      offline = false; outbox.shift(); saveOutbox();
    }
    flushing = false; emitStatus();
  }

  /* ---------- demo persistence ---------- */
  const DEMO_KEY = "fah-demo-v2";
  let demoTimer = 0;
  function persistDemo() {
    clearTimeout(demoTimer);
    demoTimer = setTimeout(() => {
      const sheetsFull = D.sheets.map((s) => ({ ...s, data: sheetData.get(s.id) || null, thumbs: sheetThumbs.get(s.id) || {} }));
      lsSet(DEMO_KEY, { ...D, sheets: sheetsFull });
    }, 300);
  }
  function loadDemo() {
    let v = lsGet(DEMO_KEY);
    if (!v || !v.players) { v = window.FAH_DEMO_SEED(); }
    TABLES.forEach((t) => { D[t] = v[t] || []; });
    D.sheets = (v.sheets || []).map((s) => {
      if (s.data) sheetData.set(s.id, s.data);
      sheetThumbs.set(s.id, s.thumbs || {});
      const { data, thumbs, ...light } = s; return light;
    });
    thumbsLoaded = true;
    me = D.staff[1] || D.staff[0];
  }

  /* ---------- remote ---------- */
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("تعذّر تحميل مكتبة الاتصال")); document.head.appendChild(s); });
  }
  /* آخر نسخة من البيانات تنحفظ على الجهاز، عشان الموقع يفتح حتى لو انقطع النت في الملعب */
  const CACHE_KEY = "fah-cache-v1";
  let cacheTimer = 0;
  function saveCache() { clearTimeout(cacheTimer); cacheTimer = setTimeout(() => lsSet(CACHE_KEY, D), 400); }
  function applyOutbox() {
    outbox.forEach((o) => {
      const a = D[o.table]; if (!a) return;
      const i = a.findIndex((r) => r.id === o.id);
      if (o.op === "del") { if (i >= 0) a.splice(i, 1); return; }
      let row = o.row;
      if (o.table === "sheets") { const { data, thumbs, ...light } = o.row; row = light; if (data) sheetData.set(o.id, data); if (thumbs) sheetThumbs.set(o.id, thumbs); }
      if (i >= 0) a[i] = row; else a.push(row);
    });
  }
  async function fetchAll(force) {
    if (outbox.length && !force) return false; // لا نستبدل تغييرات محلية ما انرسلت
    const reqs = TABLES.map((t) => sb.from(t).select(t === "sheets" ? SHEET_COLS : "*"));
    const rs = await Promise.all(reqs);
    const bad = rs.find((r) => r.error);
    if (bad) throw bad.error;
    if (outbox.length && !force) return false;
    let changed = false;
    TABLES.forEach((t, i) => {
      const sig = (a) => a.length + "|" + a.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), "") ;
      if (sig(D[t]) !== sig(rs[i].data)) changed = true;
      D[t] = rs[i].data;
    });
    D.staff.sort((a, b) => a.sort - b.sort);
    if (force) applyOutbox();
    saveCache();
    return changed;
  }
  function startPolling() {
    clearInterval(pollTimer);
    const tick = async () => {
      if (document.hidden || !me) return;
      await flush();
      try { if (await fetchAll()) emit(); offline = false; } catch { offline = true; }
      emitStatus();
    };
    pollTimer = setInterval(tick, 30000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
    window.addEventListener("online", tick);
  }
  async function afterSession(session) {
    if (!session) { me = null; return false; }
    try { await fetchAll(true); }
    catch (e) {
      const cache = lsGet(CACHE_KEY);
      if (!cache || !cache.staff) throw new Error("تعذّر الاتصال بقاعدة البيانات — تحقق من الإنترنت وحدّث الصفحة");
      TABLES.forEach((t) => { D[t] = cache[t] || []; });
      applyOutbox(); offline = true;
    }
    const email = (session.user.email || "").toLowerCase();
    me = D.staff.find((s) => (s.email || "").toLowerCase() === email) || null;
    if (!me) { await sb.auth.signOut(); throw new Error("هذا الحساب غير مصرح له"); }
    startPolling(); flush();
    return true;
  }

  const Store = {
    DEMO, D, uid,
    get me() { return me; },
    on(f) { listeners.add(f); return () => listeners.delete(f); },
    onStatus(f) { statusListeners.add(f); },
    status() { return { pending: outbox.length, offline, flushing }; },

    /** returns true when signed in (or demo), false when login is needed */
    async init() {
      if (DEMO) { loadDemo(); return true; }
      await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      sb = window.supabase.createClient(CFG.url, CFG.key);
      const { data } = await sb.auth.getSession();
      return afterSession(data.session);
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(/Invalid login/i.test(error.message) ? "الإيميل أو كلمة المرور غير صحيحة" : /confirm/i.test(error.message) ? "فعّل حسابك من الرسالة اللي وصلت إيميلك أولاً" : error.message);
      return afterSession(data.session);
    },
    /** first-time activation: only emails listed in the staff table are accepted by the database */
    async signUp(email, password) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
      if (error) throw new Error(/غير مصرح|Database error/i.test(error.message) ? "هذا الإيميل غير مسجل ضمن طاقم الفريق" : /registered/i.test(error.message) ? "الحساب مفعّل من قبل — سجّل دخولك" : error.message);
      if (data.session) return afterSession(data.session);
      // الطاقم يتفعّل مباشرة من قاعدة البيانات، فندخل على طول بدون رسالة إيميل
      const r = await sb.auth.signInWithPassword({ email, password });
      if (r.error || !r.data.session) throw new Error("الحساب مفعّل من قبل بكلمة مرور ثانية — سجّل دخولك بها");
      return afterSession(r.data.session);
    },
    async signOut() { clearInterval(pollTimer); try { localStorage.removeItem(CACHE_KEY); } catch {} if (sb) await sb.auth.signOut(); me = null; },

    get(table, id) { return D[table].find((r) => r.id === id) || null; },
    put(table, row) {
      row.updated_at = new Date().toISOString();
      const a = D[table], i = a.findIndex((r) => r.id === row.id);
      if (i >= 0) a[i] = row; else a.push(row);
      queue({ op: "up", table, id: row.id, row });
      emit();
      return row;
    },
    del(table, id) {
      D[table] = D[table].filter((r) => r.id !== id);
      if (table === "events") { D.attendance = D.attendance.filter((r) => r.event_id !== id); D.match_stats = D.match_stats.filter((r) => r.event_id !== id); }
      if (table === "players") { D.attendance = D.attendance.filter((r) => r.player_id !== id); D.match_stats = D.match_stats.filter((r) => r.player_id !== id); }
      if (table === "sheets") { D.events.forEach((e) => { if (e.sheet_id === id) e.sheet_id = null; }); sheetData.delete(id); sheetThumbs.delete(id); }
      queue({ op: "del", table, id });
      emit();
    },

    /* ----- sheets (the heavy part is loaded only when needed) ----- */
    async sheetData(id) {
      if (sheetData.has(id)) return sheetData.get(id);
      if (DEMO) return null;
      const { data, error } = await sb.from("sheets").select("data").eq("id", id).maybeSingle();
      if (error) throw error;
      if (data && data.data) sheetData.set(id, data.data);
      return data ? data.data : null;
    },
    async thumbs() {
      if (!thumbsLoaded && !DEMO) {
        const { data, error } = await sb.from("sheets").select("id,thumbs");
        if (!error) { data.forEach((r) => { if (!sheetThumbs.has(r.id)) sheetThumbs.set(r.id, r.thumbs || {}); }); thumbsLoaded = true; }
      }
      return sheetThumbs;
    },
    thumbOf(sheetId, drillId) { const t = sheetThumbs.get(sheetId); return (t && t[drillId]) || ""; },
    saveSheet(sh) {
      const first = sh.drills[0] || {};
      const summary = sh.drills.map((d) => ({ id: d.id, type: d.type, title: d.title, code: d.code, cat: d.cat, dur: d.dur, intensity: d.intensity, players: d.players, area: d.area, format: d.format }));
      const thumbs = {};
      sh.drills.forEach((d) => { if (d.thumb) thumbs[d.id] = d.thumb; });
      const light = { id: sh.id, kind: sh.kind, title: sh.kind === "session" ? sh.title : first.title, date: sh.date || null, age: sh.age, coach: sh.coach, goal_tech: sh.goal_tech || "", goal_phys: sh.goal_phys || "", summary, updated_at: new Date().toISOString() };
      sheetData.set(sh.id, sh); sheetThumbs.set(sh.id, thumbs);
      const i = D.sheets.findIndex((r) => r.id === sh.id);
      if (i >= 0) D.sheets[i] = light; else D.sheets.push(light);
      queue({ op: "up", table: "sheets", id: sh.id, row: { ...light, thumbs, data: sh } });
      emit();
      return light;
    },

    /* ----- settings ----- */
    setting(key, dflt) { const r = D.settings.find((s) => s.id === key); return r ? r.value : dflt; },
    setSetting(key, value) { Store.put("settings", { id: key, value }); },

    resetDemo() { try { localStorage.removeItem(DEMO_KEY); } catch {} location.reload(); },
    exportAll() { return JSON.stringify({ app: "fahaheel-u15", exported_at: new Date().toISOString(), ...D }, null, 1); }
  };
  window.Store = Store;
})();
