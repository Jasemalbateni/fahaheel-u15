/* استوديو الرسم: يحمّل الاستوديو عند الحاجة فقط، ويربطه برسومات الفريق وبورقة التمرين */
(function () {
  const { esc, $, toast, modal, ask, fmtFull } = U;
  let loading = null, host = null, mounted = null, onClosed = null;

  function load() {
    if (window.FahStudio) return Promise.resolve();
    if (!loading) loading = new Promise((res, rej) => {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "css/studio.css"; document.head.appendChild(l);
      const s = document.createElement("script"); s.src = "js/studio.js"; s.onload = () => res(); s.onerror = () => { loading = null; rej(new Error("load")); };
      document.head.appendChild(s);
    });
    return loading;
  }
  /** opens the studio full-screen; opts are passed to the editor (see studio-src/src/entry.tsx) */
  async function open(opts, closed) {
    close(true);
    host = document.createElement("div");
    host.className = "fah-studio";
    host.innerHTML = '<div style="position:fixed;inset:0;display:grid;place-items:center;background:#0e0d0d;color:#cfc7c9;font-weight:700">جارٍ فتح استوديو الرسم…</div>';
    document.body.appendChild(host);
    onClosed = closed || null;
    try { await load(); if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); }
    catch { toast("تعذّر تحميل استوديو الرسم — تحقق من الاتصال", true); close(); return; }
    if (!host) return;
    host.innerHTML = "";
    mounted = window.FahStudio.mount(host, opts);
  }
  function close(silent) {
    if (mounted) { try { mounted.unmount(); } catch {} }
    if (host) host.remove();
    const cb = onClosed;
    host = mounted = onClosed = null;
    if (cb && !silent) cb();
  }
  const isOpen = () => !!host;
  window.addEventListener("hashchange", () => { if (isOpen() && cur) leave(); else if (isOpen()) close(); });

  const hasContent = (b) => !!b && Array.isArray(b.frames) && b.frames.some((f) => f.els && f.els.length);
  function blobToCanvas(blob) {
    return new Promise((res, rej) => {
      const im = new Image(), url = URL.createObjectURL(blob);
      im.onload = () => { const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; c.getContext("2d").drawImage(im, 0, 0); URL.revokeObjectURL(url); res(c); };
      im.onerror = rej; im.src = url;
    });
  }
  async function thumbOf(api) {
    try { const blob = await api.exportPlain(640); return blob ? window.SheetApp.thumb(await blobToCanvas(blob)) : ""; } catch { return ""; }
  }

  /* ---------- رسوماتي (drawings saved for the whole staff) ---------- */
  let cur = null, timer = 0, state = "";
  function persist(withThumb, api) {
    clearTimeout(timer);
    if (!cur) return Promise.resolve();
    if (!cur.existed && !cur.title && !hasContent(cur.board)) { state = ""; return Promise.resolve(); }
    const go = (thumb) => { Store.put("drawings", { id: cur.id, title: cur.title || "", board: cur.board || {}, thumb: thumb != null ? thumb : cur.thumb || "" }); if (thumb != null) cur.thumb = thumb; cur.existed = true; cur.dirty = false; state = "محفوظ ✓"; };
    if (withThumb && api && hasContent(cur.board)) return thumbOf(api).then(go);
    go(null); return Promise.resolve();
  }
  const touch = () => { if (!cur) return; cur.dirty = true; state = "جارٍ الحفظ…"; clearTimeout(timer); timer = setTimeout(() => persist(false), 1500); };
  async function leave() {
    const api = mounted && mounted.api();
    if (cur && api && (cur.dirty || (cur.existed && !cur.thumb))) { cur.board = api.getBoard(); await persist(true, api); }
    cur = null; close(); App.render();
  }
  function openDrawing(id, seed) {
    const row = id ? Store.get("drawings", id) : null;
    cur = row ? { id: row.id, title: row.title || "", board: row.board, thumb: row.thumb || "", existed: true, dirty: false } : { id: Store.uid(), title: (seed && seed.title) || "", board: (seed && seed.board) || null, thumb: "", existed: false, dirty: !!seed };
    state = cur.existed ? "محفوظ ✓" : "رسم جديد";
    open({
      board: cur.board, title: cur.title, primaryLabel: "حفظ", status: () => state,
      onChange: (b) => { cur.board = b; touch(); },
      onTitle: (t) => { cur.title = t.trim(); touch(); },
      onPrimary: async (api) => { cur.board = api.getBoard(); cur.title = api.getTitle(); if (!hasContent(cur.board) && !cur.title) return toast("الرسم فاضي — أضف عناصر أولاً", true); cur.existed = true; await persist(true, api); toast("تم حفظ الرسم"); },
      onBack: () => leave(),
      menu: [
        { label: "إنشاء ورقة تمرين من هذا الرسم", icon: "sheet", run: async (api) => {
            const board = api.getBoard(); if (!hasContent(board)) return toast("الرسم فاضي — أضف عناصر أولاً", true);
            cur.board = board; cur.title = api.getTitle(); cur.existed = true; await persist(true, api);
            const blob = await api.exportPlain(1400); if (!blob) return toast("تعذّر تجهيز الصورة", true);
            const title = cur.title; cur = null; close(true);
            App.pendingSheet = { drawing: { blob, board, title } }; App.go("sheet-new");
          } },
        { label: "نسخة جديدة منه", icon: "copy", run: async (api) => { const board = JSON.parse(JSON.stringify(api.getBoard())), title = api.getTitle(); cur.board = api.getBoard(); await persist(true, api); cur = null; close(true); openDrawing(null, { board, title: title ? title + " (نسخة)" : "" }); } },
        { label: "حذف الرسم", icon: "trash", danger: true, run: async () => {
            if (!(await ask("حذف الرسم نهائياً؟", "ينحذف من رسومات الفريق وما يمكن التراجع. أوراق التمرين اللي استخدمته تبقى فيها صورته.", "حذف نهائي"))) return;
            clearTimeout(timer); if (cur.existed) Store.del("drawings", cur.id); cur = null; close(); App.render(); toast("تم حذف الرسم");
          } }
      ]
    });
  }

  /* ---------- from a drill sheet: draw (or re-edit) the diagram of drill d ---------- */
  function drawForSheet(d, apply) {
    const start = (board) => open({
      board, title: d.title || "", primaryLabel: "اعتماد الرسم",
      onPrimary: async (api) => {
        const b = api.getBoard(); if (!hasContent(b)) return toast("الرسم فاضي — أضف عناصر أولاً", true);
        const blob = await api.exportPlain(1400); if (!blob) return toast("تعذّر تجهيز الصورة", true);
        d.board = JSON.parse(JSON.stringify(b)); close(true); apply(blob);
      },
      onBack: () => close(),
      menu: [{ label: "حفظ نسخة في رسومات الفريق", icon: "copy", run: async (api) => { const b = api.getBoard(); if (!hasContent(b)) return toast("الرسم فاضي", true); Store.put("drawings", { id: Store.uid(), title: api.getTitle() || d.title || "", board: JSON.parse(JSON.stringify(b)), thumb: await thumbOf(api) }); toast("انحفظت نسخة في رسومات الفريق"); } }]
    });
    const saved = Store.D.drawings.slice().sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
    if (d.board && hasContent(d.board)) return start(d.board);
    if (!saved.length) return start(null);
    modal({
      title: "رسم التمرين",
      body: `<div class="optlist"><button type="button" data-new>${IC.plus} رسم جديد</button></div><p class="muted small" style="margin:14px 0 8px">أو ابدأ من رسم محفوظ:</p><div class="dgrid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">${saved.map(card).join("")}</div>`,
      wide: true,
      onMount(w, api) { w.addEventListener("click", (e) => { const n = e.target.closest("[data-new]"), c = e.target.closest("[data-draw]"); if (!n && !c) return; e.preventDefault(); api.close(); start(c ? JSON.parse(JSON.stringify(Store.get("drawings", c.dataset.draw).board)) : null); }); }
    });
  }

  const card = (r) => `<a class="dcard" href="#draw" data-draw="${r.id}"><span class="img" style="background:#1f1c1d">${r.thumb ? `<img src="${r.thumb}" alt="" loading="lazy">` : IC.pitch}</span><span class="in"><b>${esc(r.title || "رسم بدون اسم")}</b><span class="muted small" style="display:block;margin-top:4px">${r.updated_at ? fmtFull(r.updated_at.slice(0, 10)) : ""}</span></span></a>`;
  V.draw = () => {
    const list = Store.D.drawings.slice().sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
    return ph("DRAWING STUDIO · " + list.length + " BOARDS", "استوديو الرسم", "ارسم التمرين على الملعب: لاعبين، أدوات، أسهم ومراحل حركة — واستخدمه في ورقة التمرين", `<button type="button" class="b red" data-act="drawNew">${IC.plus} رسم جديد</button>`) +
      (list.length ? `<div class="dgrid">${list.map(card).join("")}</div>` : `<div class="card empty"><b>ما في رسومات بعد</b>ابدأ أول رسم، وبعدها تقدر تحوله لورقة تمرين بضغطة.<br><button type="button" class="b red mt" data-act="drawNew">${IC.plus} رسم جديد</button></div>`);
  };
  After.draw = (root) => root.addEventListener("click", (e) => { const c = e.target.closest("[data-draw]"); if (c) { e.preventDefault(); openDrawing(c.dataset.draw); } });
  A.drawNew = () => openDrawing(null);

  window.Draw = { open, close, isOpen, drawForSheet, openDrawing };
})();
