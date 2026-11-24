/* استيراد لمرة واحدة: حصص جاهزة (ملفات في مجلد import) تنضاف لقاعدة البيانات وتنربط بحصصها في التقويم */
(function () {
  const SEEDS = [
    { id: "s-2026-11-02", event: "tr-2026-11-02" },
    { id: "s-2026-11-08", event: "tr-2026-11-08" },
    { id: "s-2026-11-09", event: "tr-2026-11-09" },
    { id: "s-2026-11-14", event: "tr-2026-11-14" },
    { id: "s-2026-11-15", event: "tr-2026-11-15" }
  ];
  window.FahSeed = async function () {
    if (Store.DEMO) return;
    const done = Store.setting("seeds", []);
    const todo = SEEDS.filter((s) => !done.includes(s.id) && !Store.get("sheets", s.id) && Store.get("events", s.event));
    if (!todo.length) return;
    const ok = [];
    for (const s of todo) {
      try {
        const r = await fetch("import/" + s.id + ".json");
        if (!r.ok) continue;
        const sh = await r.json();
        if (!sh || sh.id !== s.id || !Array.isArray(sh.drills)) continue;
        Store.saveSheet(sh);
        const ev = Store.get("events", s.event);
        if (ev && !ev.sheet_id) Store.put("events", { ...ev, sheet_id: sh.id });
        ok.push(s.id);
      } catch (e) { console.error("seed", s.id, e); }
    }
    if (ok.length) {
      Store.setSetting("seeds", Array.from(new Set([...Store.setting("seeds", []), ...ok])));
      U.toast(ok.length === 1 ? "انضافت حصة جديدة مع تمارينها" : `انضافت ${ok.length} حصص مع تمارينها`);
    }
  };
})();
