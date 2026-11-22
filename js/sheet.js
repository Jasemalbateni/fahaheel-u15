/* محرر ورقة تمرين فحيحيل — نفس الصفحة الأصلية (تمرين واحد / حصة كاملة، A4، PDF) مربوطة بموقع الفريق */
window.SheetCore = function (root, S, hooks) {
  const LOGO = window.FAH_LOGO;
  const PHYS = window.FAH.PHYS;
  const STORE = "fah-sheet-draft-v1";
  const COACH_KEY = "fah-coach";

  const AGES = ["تحت 15", "تحت 14", "تحت 16", "تحت 17", "الفريق الأول"];
  const CATS = ["الإحماء", "تمرير واستقبال", "بناء اللعب", "التحكم والمراوغة", "التسديد والإنهاء", "الدفاع والتمركز", "الضغط واستعادة الكرة", "التحولات", "الكرات الثابتة", "ألعاب مصغّرة", "اللياقة البدنية", "حراسة المرمى", "أخرى"];
  const INTENSITY = ["منخفضة", "متوسطة", "عالية"];
  const FORMATS = ["3 ضد 3", "4 ضد 4", "5 ضد 5", "7 ضد 7", "8 ضد 8", "11 ضد 11", "أخرى"];
  const KIND_LABEL = { drill: "تمرين واحد", session: "حصة كاملة" };

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const newDrill = (age) => ({ id: uid(), type: "drill", title: "", code: "", cat: CATS[1], age: age || AGES[0], dur: "", players: "", area: "", intensity: "متوسطة", img: "", desc: "", obj: "", eq: "", pts: "", prog: "", format: "" });
  const newMatch = (age) => ({ ...newDrill(age), type: "match", title: "مباراة", format: "7 ضد 7", cat: "ألعاب مصغّرة", intensity: "عالية" });
  const isMatch = (d) => d.type === "match";
  const lines = (t) => String(t || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const fmtDate = (d) => { if (!d) return "—"; const [y, m, dd] = d.split("-"); return dd + "/" + m + "/" + y; };
  const total = (ds) => ds.reduce((s, d) => s + (parseFloat(d.dur) || 0), 0);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function sample() {
    const d = newDrill("تحت 15");
    Object.assign(d, {
      title: "بناء اللعب من الخلف ضد ضغط 2", code: "FAH-B01", cat: "بناء اللعب", dur: "18", players: "10 + حارس", area: "40 × 30", intensity: "متوسطة",
      desc: "الحارس + 3 مدافعين + محوران ضد مهاجمَين يضغطان. الفريق المدافع يحاول الخروج بالكرة من منطقته والوصول إلى أحد المرميين الصغيرين على خط المنتصف.\nعند قطع الكرة يحاول المهاجمان التسجيل في المرمى الكبير خلال 6 ثوانٍ.",
      obj: "الخروج بالكرة بهدوء تحت الضغط\nخلق التفوق العددي حول الحارس\nإيجاد خط التمرير الحر للمحور",
      eq: "مرمى كبير + مرميان صغيران\n10 أقماع\nصدريات لونين\n8 كرات",
      pts: "فتح الجسم قبل الاستلام\nالمدافع الطرفي يفتح عرض الملعب\nالمحور يظهر بين المهاجمَين\nالتمرير للقدم البعيدة عن الضاغط",
      prog: "أسهل: مهاجم واحد يضغط\nأصعب: إضافة مهاجم ثالث أو لمستين كحد أقصى"
    });
    return { kind: "drill", title: "", date: today(), age: "تحت 15", coach: "جاسم الباطني", drills: [d], active: 0 };
  }

  let LIB = null; // a library file: { title, sheets: [...], idx }
  const normSheet = (sh, coach) => ({ kind: sh.kind === "session" ? "session" : "drill", title: sh.title || "", date: sh.date || today(), age: sh.age || AGES[0], coach: sh.coach || coach || "", drills: sh.drills.map((d) => ({ ...newDrill(), ...d })), active: 0 });
  // the library is too big for localStorage, so it lives in IndexedDB (this browser only)
  function idb() { return new Promise((res, rej) => { try { const r = indexedDB.open("fah-sheets", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); }
  async function idbSet(k, v) { try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction("kv", "readwrite"); tx.objectStore("kv").put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch {} }
  async function idbGet(k) { try { const db = await idb(); return await new Promise((res) => { const rq = db.transaction("kv").objectStore("kv").get(k); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); }); } catch { return null; } }
  function load() {
    try { const v = JSON.parse(localStorage.getItem(STORE) || "null"); return v && Array.isArray(v.drills) && v.drills.length ? v : null; } catch { return null; }
  }
  let saveTimer = 0, storageWarned = false;
  function persist() { clearTimeout(saveTimer); hooks.dirty(); saveTimer = setTimeout(() => hooks.save(S), 700); }
  const cur = () => S.drills[Math.min(S.active, S.drills.length - 1)];

  /* ---------- icons ---------- */
  const IC = {
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    cup: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>'
  };

  /* ---------- editor ---------- */
  const ed = document.getElementById("editor");
  function opts(list, v) { return list.map((o) => `<option${o === v ? " selected" : ""}>${esc(o)}</option>`).join(""); }
  function fld(id, label, key, ph, extra) {
    const d = cur();
    return `<div class="field"><label for="${id}">${label}</label><input id="${id}" data-k="${key}" value="${esc(d[key])}" placeholder="${esc(ph)}"${extra || ""}></div>`;
  }
  function area(id, label, key, ph, hint) {
    const d = cur();
    return `<div class="field"><label for="${id}">${label}</label><textarea id="${id}" data-k="${key}" placeholder="${esc(ph)}">${esc(d[key])}</textarea>${hint ? `<div class="hint">${hint}</div>` : ""}</div>`;
  }
  function sel(id, label, key, list) {
    const d = cur();
    return `<div class="field"><label for="${id}">${label}</label><select id="${id}" data-k="${key}">${opts(list, d[key])}</select></div>`;
  }
  function drillListHTML() {
    return S.drills.map((d, i) => `
      <div class="drill-row${i === S.active ? " on" : ""}" data-i="${i}" role="button" tabindex="0">
        <span class="n">${i + 1}</span>
        ${isMatch(d) ? `<span class="cup">${IC.cup}</span>` : ""}
        <span class="t${d.title ? "" : " empty"}">${esc(isMatch(d) ? (d.title || "مباراة") + (d.format ? " · " + d.format : "") : d.title || "تمرين بدون اسم")}</span>
        ${d.dur ? `<span class="d num">${esc(d.dur)} د</span>` : ""}
        <button type="button" class="icon" data-act="up" data-i="${i}" aria-label="تحريك لأعلى"${i === 0 ? " disabled" : ""}>${IC.up}</button>
        <button type="button" class="icon" data-act="down" data-i="${i}" aria-label="تحريك لأسفل"${i === S.drills.length - 1 ? " disabled" : ""}>${IC.down}</button>
        <button type="button" class="icon del" data-act="del" data-i="${i}" aria-label="حذف"${S.drills.length <= 1 ? " disabled" : ""}>${IC.x}</button>
      </div>`).join("");
  }

  function renderEditor() {
    const d = cur(), m = isMatch(d);
    const libTitle = (sh, i) => `${i + 1}. ${sh.kind === "session" ? sh.title || "حصة بدون اسم" : (sh.drills[0] && sh.drills[0].title) || "تمرين بدون اسم"}`;
    let h = LIB ? `<div class="lib">
      <div class="lib-top"><b>${esc(LIB.title || "مكتبة الحصص")}</b><span class="num">${LIB.idx + 1} / ${LIB.sheets.length}</span><span class="sp"></span><button type="button" class="lib-x" data-lib="close">إغلاق المكتبة</button></div>
      <div class="lib-row">
        <button type="button" class="icon" data-lib="prev" aria-label="الحصة السابقة"${LIB.idx === 0 ? " disabled" : ""}>›</button>
        <select id="libSel" aria-label="اختر الحصة">${LIB.sheets.map((sh, i) => `<option value="${i}"${i === LIB.idx ? " selected" : ""}>${esc(libTitle(i === LIB.idx ? S : sh, i))}</option>`).join("")}</select>
        <button type="button" class="icon" data-lib="next" aria-label="الحصة التالية"${LIB.idx === LIB.sheets.length - 1 ? " disabled" : ""}>‹</button>
      </div></div>` : "";
    h += `<div class="mode" role="tablist" aria-label="نوع الورقة">
      <button type="button" role="tab" data-mode="drill" class="${S.kind === "drill" ? "on" : ""}" aria-selected="${S.kind === "drill"}"><b>تمرين واحد</b><span>صفحة A4 واحدة</span></button>
      <button type="button" role="tab" data-mode="session" class="${S.kind === "session" ? "on" : ""}" aria-selected="${S.kind === "session"}"><b>حصة كاملة</b><span>غلاف + صفحة لكل تمرين</span></button>
    </div>`;
    if (S.kind === "session") {
      h += `<h2>بيانات الحصة</h2>
        <div class="field"><label for="sTitle">اسم الحصة</label><input id="sTitle" data-s="title" value="${esc(S.title)}" placeholder="مثال: بناء اللعب — الأسبوع 4"></div>
        <div class="row">
          <div class="field"><label for="sDate">التاريخ</label><input id="sDate" class="en" dir="ltr" type="date" data-s="date" value="${esc(S.date)}"></div>
          <div class="field"><label for="sAge">الفئة</label><select id="sAge" data-s="age">${opts(AGES, S.age)}</select></div>
        </div>
        <div class="row">
          <div class="field"><label for="sTech">الهدف الفني / التكتيكي</label><input id="sTech" data-s="goal_tech" value="${esc(S.goal_tech)}" placeholder="مثال: دفاع الأطراف"></div>
          <div class="field"><label for="sPhys">الهدف البدني</label><select id="sPhys" data-s="goal_phys">${opts(PHYS, S.goal_phys || "")}</select></div>
        </div>
        ${hooks.linkHTML(S)}
        <h2>تمارين الحصة</h2>
        <div class="drills" id="drillList">${drillListHTML()}</div>
        <div class="row">
          <button type="button" class="add" id="addDrill">${IC.plus} إضافة تمرين</button>
          <button type="button" class="add dark" id="addMatch">${IC.cup} إضافة مباراة</button>
        </div>
        <button type="button" class="add ghosty" id="addFromLib">إضافة تمرين من مكتبة التمارين</button>
        <button type="button" class="add ghosty" id="addFromFile">إضافة تمرين محفوظ من ملف</button>
        <h2>${m ? "بيانات المباراة" : "بيانات التمرين"} <span class="num">${S.active + 1}</span></h2>`;
    } else {
      h += `<h2>بيانات التمرين</h2>`;
    }
    h += fld("fTitle", m ? "اسم المباراة" : "اسم التمرين", "title", m ? "مثال: مباراة تطبيقية" : "مثال: بناء اللعب من الخلف ضد ضغط 2");
    if (m) {
      h += `<div class="row">
        <div class="field"><label for="fFormat">الصيغة</label><select id="fFormat" data-fmt="1">${opts(FORMATS, FORMATS.includes(d.format) ? d.format : "أخرى")}</select></div>
        ${fld("fFormat2", "صيغة مخصصة", "format", "مثال: 6 ضد 6 + حارسين")}
      </div>`;
    } else {
      h += `<div class="row">${fld("fCode", "رمز التمرين", "code", "FAH-01", ' class="en" dir="ltr"')}${sel("fCat", "المحور", "cat", CATS)}</div>`;
    }
    h += `<div class="row3">${sel("fAge", "الفئة", "age", AGES)}${fld("fDur", "المدة (د)", "dur", "15", ' class="en" dir="ltr" inputmode="numeric"')}${fld("fPlayers", "اللاعبون", "players", "10 + حارس", ' dir="auto"')}</div>`;
    h += `<div class="row">${fld("fArea", "المساحة (م)", "area", "40 × 30", ' class="en" dir="ltr"')}${sel("fInt", "الشدة", "intensity", INTENSITY)}</div>`;
    if (S.kind === "drill") h += `<div class="field"><label for="fDate">التاريخ</label><input id="fDate" class="en" dir="ltr" type="date" data-s="date" value="${esc(S.date)}"></div>`;

    h += `<h2>رسم التمرين</h2>
      <label class="drop" id="drop">
        <input type="file" id="imgInput" accept="image/*">
        <strong>اسحب الصورة هنا</strong> أو اضغط للاختيار<br>
        <span style="font-size:12px">PNG · JPG · صورة من TacticalPad أو من الجوال · أو الصق صورة (Ctrl+V)</span>
        ${d.img ? `<img class="thumb" src="${d.img}" alt="">` : ""}
      </label>
      <div class="imgtools"><button type="button" class="btn red" id="imgDraw">${d.board ? "تعديل الرسم في الاستوديو" : "ارسم التمرين في الاستوديو"}</button>${d.img ? `<button type="button" class="btn" id="imgDel">حذف الصورة</button>` : ""}</div>`;

    h += `<h2>المحتوى</h2>`;
    if (m) {
      h += area("fObj", "الهدف من المباراة", "obj", "تطبيق الخروج بالكرة تحت الضغط\nاتخاذ القرار بسرعة", "كل سطر = نقطة");
      h += area("fPts", "شروط المباراة", "pts", "الهدف يُحتسب بعد 4 تمريرات\nلمستان كحد أقصى في الثلث الأول", "القيود اللي توجّه اللعب نحو الهدف");
      h += area("fDesc", "ملاحظات للمدرب", "desc", "وش يراقب المدرب؟ متى يوقف اللعب؟ وش يسأل اللاعبين؟");
      h += area("fEq", "الأدوات", "eq", "مرميان\nصدريات لونين\n8 أقماع");
      h += area("fProg", "التدرّج والتعديلات (اختياري)", "prog", "أسهل: مساحة أكبر\nأصعب: لمسة واحدة");
    } else {
      h += area("fDesc", "شرح التمرين (التنظيم وسير التمرين)", "desc", "يتوزع اللاعبون في...");
      h += area("fObj", "الأهداف", "obj", "كل هدف في سطر", "كل سطر = نقطة");
      h += area("fEq", "الأدوات", "eq", "10 أقماع\n8 كرات");
      h += area("fPts", "النقاط الفنية", "pts", "فتح الجسم قبل الاستلام\nرفع الرأس قبل التمرير");
      h += area("fProg", "التدرّج والتعديلات (اختياري)", "prog", "أسهل: ...\nأصعب: ...");
    }
    h += `<h2>التوقيع</h2>
      <div class="field"><label for="fCoach">المدرب</label><input id="fCoach" data-s="coach" value="${esc(S.coach)}" placeholder="اسم المدرب"><div class="hint">يُحفظ ويظهر أسفل كل صفحة</div></div>
      <div class="actions">
        ${S.kind === "session"
          ? `<button type="button" class="btn red" data-proxy="btn-pdf">تنزيل الحصة كاملة PDF (<span class="num">${S.drills.length + 1}</span> صفحات)</button>
             <button type="button" class="btn" id="pdfOne">تنزيل التمرين الحالي فقط PDF</button>`
          : `<button type="button" class="btn red" data-proxy="btn-pdf">تنزيل PDF (A4)</button>`}
        ${LIB ? `<button type="button" class="btn" data-proxy="btn-save">حفظ المكتبة كاملة (<span class="num">${LIB.sheets.length}</span> حصة)</button>
             <button type="button" class="btn sub" id="saveOne">حفظ هذه الحصة فقط</button>`
          : `<button type="button" class="btn" data-proxy="btn-save">تنزيل ملف الورقة (نسخة احتياطية)</button>`}
        <button type="button" class="btn sub" data-proxy="btn-new">ورقة جديدة</button>
        <div class="saved-note">الورقة تُحفظ تلقائياً في موقع الفريق ويشوفها كل الطاقم.</div>
      </div>`;
    ed.innerHTML = h;
    document.querySelectorAll(".seg button").forEach((b) => { const on = b.dataset.kind === S.kind; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    document.getElementById("pdf-label").textContent = S.kind === "session" ? "تنزيل الحصة PDF" : "تنزيل PDF";
  }

  ed.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.k) { cur()[t.dataset.k] = t.value; if (t.dataset.k === "format") syncFormatSelect(); }
    else if (t.dataset.s) S[t.dataset.s] = t.value;
    else return;
    afterChange();
  });
  ed.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.fmt) {
      cur().format = t.value === "أخرى" ? "" : t.value;
      const f2 = document.getElementById("fFormat2"); if (f2) f2.value = cur().format;
      afterChange();
    } else if (t.id === "imgInput") setImage(t.files && t.files[0]);
    else if (t.id === "libSel") switchLib(+t.value);
    else if (t.id === "sLink") { hooks.link(S, t.value); full(); }
    else if (t.dataset.s === "date") full();
  });
  function syncFormatSelect() { const s = document.getElementById("fFormat"); if (s) s.value = FORMATS.includes(cur().format) ? cur().format : "أخرى"; }
  function afterChange() {
    const list = document.getElementById("drillList");
    if (list) list.innerHTML = drillListHTML();
    renderPreview(); persist();
  }

  ed.addEventListener("click", async (e) => {
    const b = e.target.closest("button, .drill-row");
    if (!b) return;
    if (b.dataset.proxy) { e.preventDefault(); document.getElementById(b.dataset.proxy).click(); return; }
    if (b.id === "addDrill" || b.id === "addMatch") {
      S.drills.push(b.id === "addMatch" ? newMatch(S.age) : newDrill(S.age));
      S.active = S.drills.length - 1; full(); return;
    }
    if (b.dataset.mode) { switchKind(b.dataset.mode); return; }
    if (b.dataset.lib === "prev") { switchLib(LIB.idx - 1); return; }
    if (b.dataset.lib === "next") { switchLib(LIB.idx + 1); return; }
    if (b.dataset.lib === "close") {
      if (!(await ask("إغلاق المكتبة؟", "الحصة الحالية تبقى في المحرر. تقدر تفتح المكتبة مرة ثانية من «فتح ملف».", "إغلاق"))) return;
      LIB = null; idbSet("lib", null); full(); return;
    }
    if (b.id === "saveOne") { saveSheet(S); return; }
    if (b.id === "addFromLib") {
      hooks.pickDrill((d) => {
        const first = S.drills[0];
        S.drills.push({ ...newDrill(), ...d, id: uid() });
        if (S.drills.length === 2 && !first.title && !first.img && !first.desc && !isMatch(first)) S.drills.shift();
        S.active = S.drills.length - 1; full(); toast("انضاف التمرين للحصة");
      });
      return;
    }
    if (b.id === "addFromFile") { document.getElementById("import-input").click(); return; }
    if (b.id === "pdfOne") {
      const i = S.active, d = S.drills[i];
      const kicker = `${S.title || "حصة تدريبية"} · ${isMatch(d) ? "مباراة" : "تمرين"} ${i + 1} من ${S.drills.length}`;
      exportPdf([isMatch(d) ? matchPage(d, kicker) : drillPage(d, kicker)], baseName() + " - " + (i + 1) + " " + (d.title || "تمرين"));
      return;
    }
    if (b.id === "imgDel") { e.preventDefault(); cur().img = ""; cur().thumb = ""; cur().board = null; full(); return; }
    if (b.id === "imgDraw") { e.preventDefault(); const d = cur(); hooks.draw(d, (blob) => setImage(blob, d)); return; }
    const act = b.dataset.act;
    if (act) {
      e.stopPropagation();
      const i = +b.dataset.i;
      if (act === "del") {
        const d = S.drills[i];
        if ((d.title || d.img || d.desc) && !(await ask("حذف هذا التمرين من الحصة؟", d.title || "تمرين بدون اسم", "حذف"))) return;
        S.drills.splice(i, 1);
        S.active = Math.max(0, Math.min(S.active > i ? S.active - 1 : S.active, S.drills.length - 1));
      } else {
        const j = i + (act === "up" ? -1 : 1);
        if (j < 0 || j >= S.drills.length) return;
        [S.drills[i], S.drills[j]] = [S.drills[j], S.drills[i]];
        S.active = j;
      }
      full(); return;
    }
    if (b.classList.contains("drill-row")) { S.active = +b.dataset.i; full(); }
  });
  ed.addEventListener("keydown", (e) => { const r = e.target.closest(".drill-row"); if (r && e.key === "Enter" && e.target === r) { S.active = +r.dataset.i; full(); } });

  // drag & drop + paste
  ed.addEventListener("dragover", (e) => { const d = e.target.closest("#drop"); if (d) { e.preventDefault(); d.classList.add("over"); } });
  ed.addEventListener("dragleave", (e) => { const d = e.target.closest("#drop"); if (d) d.classList.remove("over"); });
  ed.addEventListener("drop", (e) => { const d = e.target.closest("#drop"); if (d) { e.preventDefault(); d.classList.remove("over"); setImage(e.dataTransfer.files[0]); } });
  const onPaste = (e) => {
    const it = Array.from((e.clipboardData && e.clipboardData.items) || []).find((i) => i.type.startsWith("image/"));
    if (it) { e.preventDefault(); setImage(it.getAsFile()); }
  };
  document.addEventListener("paste", onPaste);

  /** target = the drill a studio drawing belongs to (keeps its editable board); a plain upload drops the board */
  function setImage(file, target) {
    if (!file || !file.type.startsWith("image/")) return;
    const dd = target || cur();
    if (!target) dd.board = null;
    if (!root.isConnected) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const sc = Math.min(1, 1400 / Math.max(im.width, im.height));
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      dd.img = c.toDataURL("image/jpeg", target ? 0.9 : 0.84);
      dd.thumb = window.SheetApp.thumb(c);
      full();
    };
    im.onerror = () => toast("تعذّر قراءة الصورة", true);
    im.src = url;
  }

  function full() { renderEditor(); renderPreview(); persist(); }
  function switchLib(i) {
    if (!LIB || i < 0 || i >= LIB.sheets.length || i === LIB.idx) return;
    LIB.sheets[LIB.idx] = S;
    LIB.idx = i;
    S = LIB.sheets[i]; S.active = 0;
    full();
    pv.scrollTop = 0; ed.scrollTop = 0;
    try { window.scrollTo({ top: 0 }); } catch {}
  }

  /* ---------- kind switch ---------- */
  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => switchKind(b.dataset.kind)));
  async function switchKind(k) {
    if (k === S.kind) return;
    if (k === "drill" && S.drills.length > 1) {
      if (!(await ask("التحويل إلى تمرين واحد", "يُحتفظ بالتمرين الأول فقط، وتُحذف بقية تمارين الحصة من هذه الورقة.", "تحويل"))) return;
      S.drills = [S.drills.find((d) => !isMatch(d)) || newDrill(S.age)];
      S.active = 0;
    }
    if (k === "drill" && isMatch(S.drills[0])) S.drills = [newDrill(S.age)];
    if (k === "session" && !S.title && S.drills[0].title) S.title = "حصة " + S.drills[0].title;
    if (k === "session") S.age = S.drills[0].age || S.age;
    S.kind = k; full();
    if (k === "session") toast("صارت حصة — أضف تمارينها من «تمارين الحصة»");
  }

  /* ---------- A4 pages ---------- */
  function head(kicker, title, code, label) {
    return `<header class="sheet-head"><img src="${LOGO}" alt="نادي الفحيحيل">
      <div class="t"><p class="kicker">${esc(kicker)}</p><h1>${esc(title)}</h1></div>
      <div class="code"><span>${esc(code || "—")}</span><small>${label || "DRILL SHEET"}</small></div></header><div class="accent"></div>`;
  }
  function foot() {
    return `<footer class="sheet-foot"><span class="en">FAHAHEEL SC</span><span class="club">نادي الفحيحيل <i>·</i> قطاع الناشئين</span><span class="coach">المدرب: <b>${esc(S.coach || "—")}</b></span></footer>`;
  }
  function list(t, cls) { const L = lines(t); return `<ul${cls ? ` class="${cls}"` : ""}>${L.length ? L.map((s) => `<li>${esc(s)}</li>`).join("") : '<li class="none">—</li>'}</ul>`; }
  function meta(d) {
    return `<div class="meta"><div><b>${esc(d.dur || "—")}</b><span>دقيقة</span></div><div><b>${esc(d.players || "—")}</b><span>لاعب</span></div><div><b>${esc(d.area || "—")}</b><span>متر</span></div><div><b class="ar">${esc(d.intensity)}</b><span>الشدة</span></div><div><b>${fmtDate(S.date)}</b><span>التاريخ</span></div></div>`;
  }
  const EMPTY_IMG = '<div class="empty"><svg width="40" height="32" viewBox="0 0 40 32" fill="none" stroke="#141213" stroke-width="1.8"><rect x="1" y="1" width="38" height="30" rx="2"/><path d="M1 22l10-9 8 7 6-5 14 12"/><circle cx="29" cy="9" r="3"/></svg>ارفع رسم التمرين</div>';

  function drillPage(d, kicker) {
    return `<article class="sheet">${head(kicker, d.title || "اسم التمرين", d.code)}
      <div class="sheet-body">${meta(d)}
        <div class="diagram">${d.img ? `<img src="${d.img}" alt="رسم التمرين">` : EMPTY_IMG}</div>
        <section class="sec"><h3>شرح التمرين</h3><p${d.desc ? "" : ' class="none"'}>${esc(d.desc || "—")}</p></section>
        <div class="cols">
          <div><section class="sec"><h3>الأهداف</h3>${list(d.obj)}</section>
            <section class="sec pts mt"><h3 class="dark">النقاط الفنية</h3>${list(d.pts)}</section></div>
          <div><section class="sec"><h3>الأدوات</h3>${list(d.eq)}</section>
            ${lines(d.prog).length ? `<section class="sec mt"><h3>التدرّج والتعديلات</h3>${list(d.prog)}</section>` : ""}</div>
        </div>
      </div>${foot()}</article>`;
  }
  function matchPage(d, kicker) {
    const sub = [d.players ? d.players + " لاعب" : "", d.area ? d.area + " م" : ""].filter(Boolean).join(" · ");
    return `<article class="sheet">${head(kicker, (d.title || "مباراة") + (d.format ? " — " + d.format : ""), d.format || "MATCH", "MATCH")}
      <div class="sheet-body">${meta(d)}
        ${d.img ? `<div class="diagram"><img src="${d.img}" alt="رسم المباراة"></div>` : `<div class="match-hero"><span class="fmt">${esc(d.format || "مباراة")}</span><span class="sub">${esc(sub)}</span></div>`}
        <div class="cols">
          <div><section class="sec"><h3>الهدف من المباراة</h3>${list(d.obj)}</section>
            <section class="sec pts mt"><h3 class="dark">شروط المباراة</h3>${list(d.pts)}</section></div>
          <div><section class="sec"><h3>الأدوات</h3>${list(d.eq)}</section>
            ${lines(d.prog).length ? `<section class="sec mt"><h3>التدرّج والتعديلات</h3>${list(d.prog)}</section>` : ""}</div>
        </div>
        <section class="sec notes"><h3>ملاحظات للمدرب</h3><p${d.desc ? "" : ' class="none"'}>${esc(d.desc || "—")}</p></section>
      </div>${foot()}</article>`;
  }
  function coverPage() {
    const ds = S.drills, t = total(ds), nM = ds.filter(isMatch).length, nD = ds.length - nM;
    const imgs = ds.filter((d) => d.img).slice(0, 6);
    const rows = ds.map((d, i) => `<tr><td class="n">${i + 1}</td><td><strong>${esc(isMatch(d) ? (d.title || "مباراة") + (d.format ? " " + d.format : "") : d.title || "تمرين بدون اسم")}</strong>${d.code && !isMatch(d) ? `<span class="num code">${esc(d.code)}</span>` : ""}</td><td>${esc(isMatch(d) ? "مباراة" : d.cat)}</td><td>${esc(d.intensity)}</td><td class="num">${d.dur ? esc(d.dur) + " د" : "—"}</td></tr>`).join("");
    return `<article class="sheet">${head("حصة تدريبية · فئة " + S.age, S.title || "اسم الحصة", nD + " DRILLS" + (nM ? " + " + nM + " MATCH" : ""))}
      <div class="sheet-body">
        <div class="meta"><div><b>${nM ? nD + "+" + nM : nD}</b><span>${nM ? "تمرين + مباراة" : "تمرين"}</span></div><div><b>${t || "—"}</b><span>دقيقة إجمالي</span></div><div><b class="ar">${esc(S.age)}</b><span>الفئة</span></div><div><b class="ar">${esc(S.coach || "—")}</b><span>المدرب</span></div><div><b>${fmtDate(S.date)}</b><span>التاريخ</span></div></div>
        ${S.goal_tech || S.goal_phys ? `<section class="sec"><h3>أهداف الحصة</h3><p>${[S.goal_tech ? "فني / تكتيكي: " + esc(S.goal_tech) : "", S.goal_phys ? "بدني: " + esc(S.goal_phys) : ""].filter(Boolean).join("  ·  ")}</p></section>` : ""}
        <section class="sec"><h3>خطة الحصة</h3>
          <table class="plan"><thead><tr><th>#</th><th>التمرين</th><th>المحور</th><th>الشدة</th><th>المدة</th></tr></thead>
          <tbody>${rows}</tbody><tfoot><tr><td colspan="4">الإجمالي</td><td class="num">${t ? t + " د" : "—"}</td></tr></tfoot></table>
        </section>
        ${imgs.length ? `<section class="sec"><h3>نظرة سريعة</h3><div class="thumbs">${imgs.map((d) => `<div><img src="${d.img}" alt=""><span class="lbl"><span class="num">${ds.indexOf(d) + 1}</span> · ${esc(d.title || "تمرين")}</span></div>`).join("")}</div></section>` : ""}
      </div>${foot()}</article>`;
  }
  function pagesHTML() {
    const out = [];
    if (S.kind === "session") out.push(coverPage());
    S.drills.forEach((d, i) => {
      const kicker = S.kind === "session" ? `${S.title || "حصة تدريبية"} · ${isMatch(d) ? "مباراة" : "تمرين"} ${i + 1} من ${S.drills.length}` : `${d.cat} · فئة ${d.age}`;
      out.push(isMatch(d) ? matchPage(d, kicker) : drillPage(d, kicker));
    });
    return out;
  }
  const pv = document.getElementById("preview");
  function renderPreview() { pv.innerHTML = pagesHTML().map((p) => `<div class="page-scale">${p}</div>`).join(""); }

  // scale A4 pages down on narrow screens
  const mm = 96 / 25.4;
  const setScale = () => pv.style.setProperty("--scale", Math.min(1, pv.clientWidth / (210 * mm)));
  new ResizeObserver(setScale).observe(pv);

  /* ---------- dialog + toast ---------- */
  function ask(title, msg, okText) {
    return new Promise((res) => {
      const w = document.createElement("div");
      w.className = "dlg-back";
      w.innerHTML = `<div class="dlg" role="dialog" aria-modal="true"><h4>${esc(title)}</h4><p>${esc(msg || "")}</p><div class="acts"><button type="button" class="btn red" data-v="1">${esc(okText || "تأكيد")}</button><button type="button" class="btn" data-v="0">إلغاء</button></div></div>`;
      const done = (v) => { w.remove(); res(v); };
      w.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) done(b.dataset.v === "1"); else if (e.target === w) done(false); });
      root.appendChild(w);
      w.querySelector("[data-v='1']").focus();
    });
  }
  let toastEl = null;
  function toast(text, err) {
    if (toastEl) toastEl.remove();
    toastEl = document.createElement("div");
    toastEl.className = "toast" + (err ? " err" : ""); toastEl.setAttribute("role", "status"); toastEl.textContent = text;
    root.appendChild(toastEl);
    const me = toastEl; setTimeout(() => me.remove(), 2800);
  }
  function busy(text) { const b = document.createElement("div"); b.className = "busy"; b.innerHTML = `<span>${esc(text)}</span>`; root.appendChild(b); return () => b.remove(); }

  /* ---------- files ---------- */
  function baseName() {
    const t = (S.kind === "session" ? S.title : S.drills[0].title) || "ورقة تمرين";
    const code = S.kind === "drill" && S.drills[0].code ? S.drills[0].code + " - " : "";
    return ("فحيحيل - " + code + t).replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 90);
  }
  const offer = (filename, data) => U.saveFile(filename, data, /\.json$/.test(filename) ? "application/json" : "application/pdf");

  async function saveSheet(sh) {
    const data = JSON.stringify({ app: "fahaheel-drill-sheet", v: 1, sheet: sh }, null, 1);
    if (await offer(baseName() + ".json", data)) toast("تم حفظ الملف");
  }
  document.getElementById("btn-save").addEventListener("click", async () => {
    if (!LIB) return saveSheet(S);
    LIB.sheets[LIB.idx] = S;
    const data = JSON.stringify({ app: "fahaheel-drill-sheet", v: 2, title: LIB.title, sheets: LIB.sheets });
    if (await offer("فحيحيل - " + (LIB.title || "مكتبة الحصص").replace(/[\\/:*?"<>|]+/g, " ") + ".json", data)) toast("تم حفظ المكتبة");
  });

  const openInput = document.getElementById("open-input");
  document.getElementById("btn-open").addEventListener("click", () => openInput.click());
  openInput.addEventListener("change", () => {
    const f = openInput.files && openInput.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const list = window.SheetApp.parseFile(r.result, S.coach);
        if (!list.length) throw 0;
        hooks.importSheets(list);
      } catch { toast("هذا الملف مو ورقة تمرين فحيحيل", true); }
      openInput.value = "";
    };
    r.readAsText(f);
  });

  const importInput = document.getElementById("import-input");
  importInput.addEventListener("change", async () => {
    const files = Array.from(importInput.files || []);
    importInput.value = "";
    let added = 0, bad = 0;
    for (const f of files) {
      try {
        const j = JSON.parse(await f.text());
        if (Array.isArray(j.sheets)) { toast("هذا ملف مكتبة — افتحه من «فتح ملف»", true); continue; }
        const sh = j.sheet || j;
        if (!Array.isArray(sh.drills) || !sh.drills.length) throw 0;
        sh.drills.forEach((d) => { S.drills.push({ ...newDrill(), ...d, id: uid() }); added++; });
      } catch { bad++; }
    }
    if (added) {
      // drop the untouched empty drill a new session starts with
      const first = S.drills[0];
      if (S.drills.length > added && !first.title && !first.img && !first.desc && !isMatch(first)) S.drills.shift();
      S.active = S.drills.length - 1; full();
      toast(`انضاف ${added} ${added === 1 ? "تمرين" : "تمارين"} للحصة`);
    }
    if (bad) toast(bad === 1 ? "ملف واحد مو ورقة تمرين فحيحيل" : `${bad} ملفات مو أوراق تمرين`, true);
  });

  document.getElementById("btn-new").addEventListener("click", () => hooks.newSheet());
  document.getElementById("btn-back").addEventListener("click", () => hooks.back());

  document.getElementById("btn-pdf").addEventListener("click", () => exportPdf(pagesHTML(), baseName()));
  async function exportPdf(pages, name) {
    if (!window.html2canvas || !window.jspdf) { toast("أداة PDF ما تحمّلت — تحقق من الاتصال وأعد المحاولة", true); return; }
    const stop = busy("جارٍ تجهيز PDF…");
    const host = document.getElementById("capture-host");
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      host.innerHTML = pages.join("");
      const sheets = Array.from(host.querySelectorAll(".sheet"));
      sheets.forEach((s) => s.classList.add("capture"));
      await Promise.all(Array.from(host.querySelectorAll("img")).map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; })));
      const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      for (let i = 0; i < sheets.length; i++) {
        const canvas = await window.html2canvas(sheets[i], { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297);
      }
      const blob = pdf.output("blob");
      stop();
      if (await offer(name.replace(/[\\/:*?"<>|]+/g, " ").slice(0, 120) + ".pdf", blob)) toast(sheets.length > 1 ? `تم تنزيل PDF (${sheets.length} صفحات)` : "تم تنزيل PDF");
    } catch (e) {
      stop(); toast("تعذّر تجهيز PDF", true);
    } finally { host.innerHTML = ""; }
  }

  renderEditor(); renderPreview();
  return {
    get S() { return S; }, full, toast, ask, setImage,
    flush() { clearTimeout(saveTimer); hooks.save(S); },
    setActive(i) { S.active = Math.max(0, Math.min(i, S.drills.length - 1)); renderEditor(); renderPreview(); },
    destroy() { clearTimeout(saveTimer); document.removeEventListener("paste", onPaste); }
  };
};
/* ---------------------------------------------------------------------
   SheetApp: يفتح محرر ورقة التمرين فوق الموقع ويربطه بقاعدة البيانات والتقويم والمكتبة
   --------------------------------------------------------------------- */
window.SheetApp = (function () {
  const { esc, $, $$, toast, modal, today, addDays, fmtLong, diffDays } = U;
  let root = null, core = null, curId = null, existed = false;
  const AGE = "تحت 15";
  const uid = () => Store.uid();
  const blankDrill = () => ({ id: uid(), type: "drill", title: "", code: "", cat: "تمرير واستقبال", age: AGE, dur: "", players: "", area: "", intensity: "متوسطة", img: "", desc: "", obj: "", eq: "", pts: "", prog: "", format: "" });
  const coachName = () => { try { return localStorage.getItem("fah-coach") || (Store.me && Store.me.name) || ""; } catch { return (Store.me && Store.me.name) || ""; } };
  const norm = (sh, coach) => ({ id: uid(), kind: sh.kind === "session" ? "session" : "drill", title: sh.title || "", date: sh.date || today(), age: sh.age || AGE, coach: sh.coach || coach || coachName(), goal_tech: sh.goal_tech || "", goal_phys: sh.goal_phys || "", event_id: null, drills: sh.drills.map((d) => ({ ...blankDrill(), ...d, id: uid() })), active: 0 });

  function thumb(canvas) {
    const s = Math.min(1, 320 / canvas.width), t = document.createElement("canvas");
    t.width = Math.max(1, Math.round(canvas.width * s)); t.height = Math.max(1, Math.round(canvas.height * s));
    const ctx = t.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, t.width, t.height); ctx.drawImage(canvas, 0, 0, t.width, t.height);
    return t.toDataURL("image/jpeg", 0.6);
  }
  function thumbFromDataURL(url) {
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => { try { const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; c.getContext("2d").drawImage(im, 0, 0); res(thumb(c)); } catch { res(""); } };
      im.onerror = () => res("");
      im.src = url;
    });
  }
  async function backfillThumbs(sh) {
    let changed = false;
    for (const d of sh.drills) if (d.img && !d.thumb) { d.thumb = await thumbFromDataURL(d.img); if (d.thumb) changed = true; }
    return changed;
  }
  /** text of a saved file -> list of normalized sheets (one sheet file, or a whole library file) */
  function parseFile(text, coach) {
    const j = JSON.parse(text);
    const arr = Array.isArray(j.sheets) ? j.sheets : [j.sheet || j];
    return arr.filter((sh) => sh && Array.isArray(sh.drills) && sh.drills.length).map((sh) => norm(sh, coach));
  }
  async function importSheets(list) {
    for (const sh of list) { await backfillThumbs(sh); Store.saveSheet(sh); }
    toast(list.length === 1 ? "انضافت الورقة لموقع الفريق" : `انضافت ${list.length} ورقة لموقع الفريق`);
    if (list.length === 1) App.go("sheet-" + list[0].id); else { if (isOpen()) close(true); App.go("drills"); }
  }
  function importDialog() {
    const inp = Object.assign(document.createElement("input"), { type: "file", accept: ".json,application/json", multiple: true });
    inp.addEventListener("change", async () => {
      const all = []; let bad = 0;
      for (const f of Array.from(inp.files || [])) { try { const l = parseFile(await f.text()); if (!l.length) throw 0; all.push(...l); } catch { bad++; } }
      if (bad) toast(bad === 1 ? "ملف واحد مو ورقة تمرين فحيحيل" : `${bad} ملفات مو أوراق تمرين`, true);
      if (all.length) importSheets(all);
    });
    inp.click();
  }

  const isBlank = (S) => !S.title && S.drills.every((d) => !d.title && !d.img && !d.desc && !d.obj && !d.pts);
  const setState = (t) => { const el = document.getElementById("save-state"); if (el) el.textContent = t; };
  const totalMin = (S) => S.drills.reduce((n, d) => n + (parseFloat(d.dur) || 0), 0);

  const hooks = {
    dirty() { setState("جارٍ الحفظ…"); },
    save(S) {
      if (!existed && isBlank(S)) { setState("ورقة جديدة"); return; }
      try { localStorage.setItem("fah-coach", S.coach || ""); } catch {}
      Store.saveSheet(S); existed = true;
      // keep the calendar in step with the sheet
      Store.D.events.filter((e) => e.sheet_id === S.id && e.id !== S.event_id).forEach((e) => Store.put("events", { ...e, sheet_id: null }));
      const ev = S.event_id && Store.get("events", S.event_id);
      if (ev) {
        const want = { sheet_id: S.id, goal_tech: S.goal_tech || ev.goal_tech || "", goal_phys: S.goal_phys || ev.goal_phys || "", title: (S.kind === "session" ? S.title : "") || ev.title || "" };
        if (Object.keys(want).some((k) => (ev[k] || "") !== want[k])) Store.put("events", { ...ev, ...want });
      } else if (S.event_id) S.event_id = null;
      setState("محفوظة ✓");
    },
    linkHTML(S) {
      const d = S.date || today();
      const evs = Store.D.events.filter((e) => e.type === "training" && (e.id === S.event_id || (e.status !== "cancelled" && Math.abs(diffDays(e.date, d)) <= 7))).sort((a, b) => a.date.localeCompare(b.date));
      const ev = S.event_id && Store.get("events", S.event_id);
      return `<div class="field"><label for="sLink">ربط الورقة بحصة في التقويم</label><select id="sLink">
        <option value="">— بدون ربط —</option>
        ${evs.map((e) => `<option value="${e.id}"${e.id === S.event_id ? " selected" : ""}>${esc(fmtLong(e.date) + (e.time ? " · " + e.time : "") + (e.title ? " · " + e.title : "") + (e.sheet_id && e.sheet_id !== S.id ? " (فيها ورقة ثانية)" : ""))}</option>`).join("")}
        <option value="new">＋ حصة جديدة في التقويم بتاريخ الورقة</option></select>
        <div class="hint">${ev ? "مربوطة: حضور هذي الحصة وحملها التدريبي ينحسب على تمارين الورقة." : "اربطها عشان تدخل تمارينها في إحصائيات اللاعبين وتقرير الموسم."}</div></div>`;
    },
    link(S, v) {
      if (v === "new") {
        const c = C.conf(), id = uid();
        Store.put("events", { id, type: "training", date: S.date || today(), time: c.time, duration: totalMin(S) || c.duration, place: c.place, title: S.title || "", goal_tech: S.goal_tech || "", goal_phys: S.goal_phys || "", status: "scheduled", sheet_id: null });
        S.event_id = id; toast("انضافت حصة للتقويم وانربطت بالورقة");
      } else {
        const ev = v && Store.get("events", v);
        if (ev && ev.sheet_id && ev.sheet_id !== S.id) toast("الحصة كانت مربوطة بورقة ثانية — صارت مربوطة بهذي الورقة");
        S.event_id = v || null;
        if (ev) { if (!S.goal_tech) S.goal_tech = ev.goal_tech || ""; if (!S.goal_phys) S.goal_phys = ev.goal_phys || ""; if (!S.title) S.title = ev.title || ""; }
      }
    },
    pickDrill(cb) {
      const all = FAHU.allDrills().filter((d) => d.sheet.id !== curId);
      const cats = Array.from(new Set(all.map((d) => d.cat).filter(Boolean)));
      const rows = (q, cat) => all.filter((d) => (!q || d.title.includes(q)) && (!cat || d.cat === cat)).slice(0, 80).map((d) => `<button type="button" class="rw" data-s="${d.sheet.id}" data-d="${d.id}"><span class="grow"><b>${esc(d.title)}</b><span>${esc([d.cat, d.dur ? d.dur + " د" : "", d.intensity, d.sheet.title].filter(Boolean).join(" · "))}</span></span><span class="chip dark">إضافة</span></button>`).join("") || '<div class="empty small">ما في تمارين مطابقة</div>';
      modal({
        title: "إضافة تمرين من المكتبة",
        body: `<div class="toolbar"><input class="search" type="search" placeholder="ابحث باسم التمرين"><select class="search" style="flex:0 1 170px"><option value="">كل المحاور</option>${cats.map((c) => `<option>${esc(c)}</option>`).join("")}</select></div><div class="rows" id="pickRows">${rows("", "")}</div>`,
        onMount(w, api) {
          const q = $("input", w), c = $("select", w), upd = () => ($("#pickRows", w).innerHTML = rows(q.value.trim(), c.value));
          q.addEventListener("input", upd); c.addEventListener("change", upd);
          w.addEventListener("click", async (e) => {
            const b = e.target.closest("[data-d]"); if (!b) return;
            b.disabled = true;
            try { const sh = await Store.sheetData(b.dataset.s), d = sh && sh.drills.find((x) => x.id === b.dataset.d); if (!d) throw 0; cb(JSON.parse(JSON.stringify(d))); api.close(); }
            catch { toast("تعذّر تحميل التمرين", true); b.disabled = false; }
          });
        }
      });
    },
    importSheets,
    draw(d, apply) { window.Draw.drawForSheet(d, apply); },
    newSheet() { if (core) core.flush(); App.go("sheet-new"); },
    back() { close(); }
  };

  const TOPBAR = () => `
    <header class="topbar">
      <button type="button" class="btn ghost" id="btn-back" aria-label="رجوع">› رجوع</button>
      <div class="brand"><img src="${window.FAH_LOGO}" alt=""><h1>إنشاء ورقة تمرين</h1><span class="en">FAHAHEEL · DRILL SHEET</span></div>
      <div class="seg" role="tablist" aria-label="نوع الورقة"><button type="button" role="tab" data-kind="drill" id="kind-drill">تمرين واحد</button><button type="button" role="tab" data-kind="session" id="kind-session">حصة كاملة</button></div>
      <span class="spacer"></span><span class="en" id="save-state" style="font-family:var(--f-ar);letter-spacing:0;font-size:12.5px"></span>
      <div class="tools">
        <button type="button" class="btn ghost" id="btn-new">ورقة جديدة</button>
        <button type="button" class="btn ghost" id="btn-open">فتح ملف</button>
        <button type="button" class="btn" id="btn-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14"/></svg>ملف</button>
        <button type="button" class="btn red" id="btn-pdf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14"/></svg><span id="pdf-label">تنزيل PDF</span></button>
      </div>
      <input type="file" id="open-input" accept=".json,application/json" hidden><input type="file" id="import-input" accept=".json,application/json" multiple hidden>
    </header>
    <div class="workspace"><aside class="editor" id="editor" aria-label="محرر التمرين"></aside><main class="preview" id="preview"></main></div>
    <div id="capture-host" aria-hidden="true"></div>`;

  let opening = 0;
  async function open(id, opts) {
    opts = opts || {};
    if (isOpen()) close(true);
    const token = ++opening;
    let S;
    if (id) {
      try { S = await Store.sheetData(id); } catch { S = null; }
      if (token !== opening) return;
      if (!S || !Array.isArray(S.drills)) { toast("تعذّر فتح الورقة", true); App.back(); return; }
      S = JSON.parse(JSON.stringify(S)); S.id = id; S.active = 0; existed = true;
      const ev = Store.D.events.find((e) => e.sheet_id === id);
      S.event_id = ev ? ev.id : null;
      if (opts.drill) { const i = S.drills.findIndex((d) => d.id === opts.drill); if (i >= 0) S.active = i; }
    } else {
      const ev = opts.event;
      S = { id: uid(), kind: "session", title: ev ? ev.title || "" : "", date: ev ? ev.date : today(), age: AGE, coach: coachName(), goal_tech: ev ? ev.goal_tech || "" : "", goal_phys: ev ? ev.goal_phys || "" : "", event_id: ev ? ev.id : null, drills: [blankDrill()], active: 0 };
      existed = false;
      try { history.replaceState(null, "", "#sheet-" + S.id); } catch {}
    }
    S.goal_tech = S.goal_tech || ""; S.goal_phys = S.goal_phys || "";
    curId = S.id;
    root = document.createElement("div");
    root.className = "sheetapp";
    root.innerHTML = TOPBAR();
    document.body.appendChild(root);
    document.documentElement.classList.add("sheet-open");
    core = window.SheetCore(root, S, hooks);
    if (!id && opts.drawing) { const d0 = core.S.drills[0]; d0.title = opts.drawing.title || ""; d0.board = JSON.parse(JSON.stringify(opts.drawing.board)); core.S.kind = "drill"; core.setImage(opts.drawing.blob, d0); }
    setState(existed ? "محفوظة ✓" : "ورقة جديدة");
    if (existed) backfillThumbs(core.S).then((ch) => { if (ch && core) core.flush(); });
  }
  function close(silent) {
    opening++;
    if (core) { core.flush(); core.destroy(); }
    if (root) root.remove();
    root = core = null; curId = null;
    document.documentElement.classList.remove("sheet-open");
    if (!silent) App.back();
  }
  const isOpen = () => !!root;
  return { open, close, isOpen, currentId: () => curId, thumb, parseFile, importDialog };
})();
