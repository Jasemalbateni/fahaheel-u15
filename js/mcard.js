/* بطاقة المباراة والتقرير الفني: التشكيلة + الاحتياط + الرسم التكتيكي + أوراق التحليل + مناطق القوة والضعف
   كل شي ينحفظ داخل المباراة نفسها في الحقل events.card */
(function () {
  const { esc, $, $$, fmtLong, toast, modal, ask } = U;
  const { playersSorted } = FAHU;

  /* x من يسار الملعب (0-100)، y من مرمانا (0) إلى مرمى المنافس (100) — نهاجم للأعلى */
  const GK = ["حارس", 50, 9];
  const F = {
    "4-3-3": [GK, ["ظهير أيمن", 86, 25], ["قلب دفاع", 63, 19], ["قلب دفاع", 37, 19], ["ظهير أيسر", 14, 25], ["ارتكاز", 50, 40], ["وسط", 71, 55], ["وسط", 29, 55], ["جناح أيمن", 85, 77], ["مهاجم", 50, 86], ["جناح أيسر", 15, 77]],
    "4-2-3-1": [GK, ["ظهير أيمن", 86, 25], ["قلب دفاع", 63, 19], ["قلب دفاع", 37, 19], ["ظهير أيسر", 14, 25], ["ارتكاز", 64, 41], ["ارتكاز", 36, 41], ["جناح أيمن", 85, 66], ["صانع ألعاب", 50, 64], ["جناح أيسر", 15, 66], ["مهاجم", 50, 86]],
    "4-4-2": [GK, ["ظهير أيمن", 86, 25], ["قلب دفاع", 63, 19], ["قلب دفاع", 37, 19], ["ظهير أيسر", 14, 25], ["وسط أيمن", 86, 54], ["وسط", 62, 49], ["وسط", 38, 49], ["وسط أيسر", 14, 54], ["مهاجم", 63, 83], ["مهاجم", 37, 83]],
    "4-1-4-1": [GK, ["ظهير أيمن", 86, 25], ["قلب دفاع", 63, 19], ["قلب دفاع", 37, 19], ["ظهير أيسر", 14, 25], ["ارتكاز", 50, 38], ["وسط أيمن", 86, 60], ["وسط", 62, 57], ["وسط", 38, 57], ["وسط أيسر", 14, 60], ["مهاجم", 50, 86]],
    "3-5-2": [GK, ["قلب دفاع", 74, 21], ["قلب دفاع", 50, 18], ["قلب دفاع", 26, 21], ["ظهير جناح أيمن", 88, 52], ["وسط", 68, 46], ["ارتكاز", 50, 38], ["وسط", 32, 46], ["ظهير جناح أيسر", 12, 52], ["مهاجم", 63, 83], ["مهاجم", 37, 83]],
    "3-4-3": [GK, ["قلب دفاع", 74, 21], ["قلب دفاع", 50, 18], ["قلب دفاع", 26, 21], ["وسط أيمن", 88, 50], ["وسط", 62, 45], ["وسط", 38, 45], ["وسط أيسر", 12, 50], ["جناح أيمن", 82, 78], ["مهاجم", 50, 86], ["جناح أيسر", 18, 78]],
    "5-3-2": [GK, ["ظهير أيمن", 90, 33], ["قلب دفاع", 72, 21], ["قلب دفاع", 50, 18], ["قلب دفاع", 28, 21], ["ظهير أيسر", 10, 33], ["وسط", 72, 54], ["ارتكاز", 50, 46], ["وسط", 28, 54], ["مهاجم", 63, 83], ["مهاجم", 37, 83]]
  };
  const TALLY = [["shots", "تسديدات"], ["on", "تسديدات على المرمى"], ["chances", "فرص محققة"], ["corners", "ركنيات"], ["fouls", "أخطاء"], ["offside", "تسلل"], ["high", "افتكاك في نصف المنافس"], ["lost", "فقدان كرة في نصفنا"]];
  const HALF = [["b", "بالكرة — البناء والتقدم وإنهاء الهجمة"], ["d", "بدون كرة — الضغط والتنظيم الدفاعي"], ["t", "التحولات — هجومية ودفاعية"], ["s", "الكرات الثابتة — لنا وعلينا"]];
  const ZN = { s: "ق", w: "ض" };

  const cardOf = (e) => { const c = e && e.card && typeof e.card === "object" ? e.card : {}; return { f: F[c.f] ? c.f : "4-3-3", xi: c.xi || {}, n: c.n || {}, z: c.z || {}, t: c.t || {}, of: F[c.of] ? c.of : "", on: c.on || {} }; };
  const save = (id, fn) => { const e = Store.get("events", id); if (!e) return; const c = cardOf(e); fn(c); Store.put("events", { ...e, card: c }); };
  const squadIds = (e) => (Array.isArray(e.squad) ? e.squad.filter((pid) => Store.get("players", pid)) : []);
  const pool = (e) => { const sq = new Set(squadIds(e)); const all = playersSorted(true); return sq.size ? all.filter((p) => sq.has(p.id)) : all.filter((p) => p.active !== false); };
  const short = (p, dup) => { const w = p.name.trim().split(/\s+/); const s = w.length > 2 ? w[0] + " " + w[w.length - 1] : p.name; return dup.has(s) ? p.name : s; };

  /* ---------- الملعب ---------- */
  const pitchSVG = (zones) => `<svg viewBox="0 0 68 105" preserveAspectRatio="none" aria-hidden="true"><rect width="68" height="105" fill="${zones ? "#fff" : "#1d7a46"}"/>
    ${zones ? "" : [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect y="${i * 15}" width="68" height="7.5" fill="#fff" opacity=".045"/>`).join("")}
    <g fill="none" stroke="${zones ? "#141213" : "#fff"}" stroke-width="${zones ? ".45" : ".5"}" opacity="${zones ? "1" : ".9"}"><rect x="1" y="1" width="66" height="103"/><path d="M1 52.5H67"/><circle cx="34" cy="52.5" r="9.15"/>
    <rect x="13.85" y="1" width="40.3" height="16.5"/><rect x="24.85" y="1" width="18.3" height="5.5"/><path d="M26.7 17.5a9.15 9.15 0 0 0 14.6 0"/>
    <rect x="13.85" y="87.5" width="40.3" height="16.5"/><rect x="24.85" y="98.5" width="18.3" height="5.5"/><path d="M26.7 87.5a9.15 9.15 0 0 1 14.6 0"/></g></svg>`;

  function lineup(e, id) {
    const c = cardOf(e), slots = F[c.f];
    const ps = slots.map((_, i) => Store.get("players", c.xi[i]) || null);
    const seen = new Map(); ps.forEach((p) => { if (p) { const w = p.name.trim().split(/\s+/), s = w.length > 2 ? w[0] + " " + w[w.length - 1] : p.name; seen.set(s, (seen.get(s) || 0) + 1); } });
    const dup = new Set([...seen].filter(([, n]) => n > 1).map(([s]) => s));
    return { c, slots, ps, dup };
  }

  V.mcard = (id) => {
    const e = Store.get("events", id);
    if (!e || e.type !== "match") return `<div class="empty"><b>المباراة غير موجودة</b><a class="b mt" href="#matches">رجوع للمباريات</a></div>`;
    const { c, slots, ps, dup } = lineup(e, id);
    const inXI = new Set(ps.filter(Boolean).map((p) => p.id));
    const subs = pool(e).filter((p) => !inXI.has(p.id)), hasSquad = squadIds(e).length > 0;
    const staff = Store.D.staff.slice().sort((a, b) => (a.sort || 0) - (b.sort || 0));
    const sc = e.score_for != null && e.score_against != null ? `<b class="num">${e.score_for} - ${e.score_against}</b>` : `<b class="num vs">VS</b>`;
    const meet = C.meet(e) ? "التجمع " + C.meet(e) + (e.meet_place ? " · " + e.meet_place : "") : "";
    const head = (t) => `<header class="mc-head"><div class="tm">${C.crest("الفحيحيل", 54)}<b>الفحيحيل</b></div><div class="mid"><small>${esc(t)}</small>${sc}<span>${esc([fmtLong(e.date), e.time || "", e.place || ""].filter(Boolean).join(" · "))}</span>${e.competition || meet ? `<span>${esc([e.competition, meet].filter(Boolean).join(" · "))}</span>` : ""}</div><div class="tm">${C.crest(e.opponent, 54)}<b>${esc(e.opponent || "المنافس")}</b></div></header>`;
    const note = (k, label, ph, lines) => `<div class="mc-note"><label>${label}</label><textarea data-chg="mcNote" data-id="${id}" data-k="${k}" rows="${lines || 3}" placeholder="${esc(ph || "")}">${esc(c.n[k] || "")}</textarea><div class="pr${c.n[k] ? "" : " ruled"}" style="min-height:${(lines || 3) * 7}mm">${esc(c.n[k] || "")}</div></div>`;
    const zmap = (key, title) => `<div class="mc-zmap"><h4>${title}</h4><p class="mc-dir">▲ اتجاه هجومنا</p><div class="mc-pitch z">${pitchSVG(true)}<div class="zg">${Array.from({ length: 18 }, (_, i) => { const v = (c.z[key] || {})[i] || ""; const lbl = ["يسار", "وسط", "يمين"][i % 3] + " · " + ["الثلث الهجومي", "الثلث الهجومي", "الثلث الأوسط", "الثلث الأوسط", "الثلث الدفاعي", "الثلث الدفاعي"][Math.floor(i / 3)];
      return `<button type="button" class="zc ${v}" data-act="mcZone" data-id="${id}" data-m="${key}" data-i="${i}" aria-label="${lbl} — ${v === "s" ? "قوة" : v === "w" ? "ضعف" : "بدون تحديد"}">${ZN[v] || ""}</button>`; }).join("")}</div></div></div>`;
    const tv = (k, i) => { const v = (c.t[k] || [])[i] || 0; return `<td class="n"><button type="button" class="tb" data-act="mcTally" data-id="${id}" data-k="${k}" data-i="${i}" aria-label="زيادة">${v || ""}</button></td>`; };

    return `<div class="mc">
    <div class="ph no-print"><div class="t"><div class="kick">MATCH REPORT</div><h1>تقرير المباراة</h1><p>${esc("الفحيحيل × " + (e.opponent || ""))} · ${fmtLong(e.date)}</p></div>
      <div class="acts"><button type="button" class="b red" data-act="mcSave">${IC.check} حفظ التقرير</button><button type="button" class="b" data-act="mcPrint">${IC.down} طباعة / PDF</button><button type="button" class="b" data-act="mcPrintBlank">طباعة نموذج فاضي</button><a class="b" href="#event-${id}">صفحة المباراة</a></div></div>
    <p class="muted small no-print" style="margin:-10px 0 14px">عبّه من الموقع أو اطبعه واكتب بالقلم. كل شي تكتبه ينحفظ تلقائياً داخل المباراة، وتقدر ترجع له وتكمل أي وقت.</p>
    ${hasSquad ? "" : `<div class="banner info no-print">ما حددت قائمة المباراة للحين — تقدر تختار من كل اللاعبين، والأفضل تحدد القائمة أولاً من <a href="#event-${id}" style="text-decoration:underline">صفحة المباراة</a> عشان يطلع الاحتياط صح.</div>`}

    <section class="card mc-page">${head("بطاقة المباراة")}
      <div class="toolbar no-print" style="margin-top:14px"><label style="font-weight:700">الخطة</label><select class="search" style="flex:0 0 auto;width:auto;min-width:110px" data-rerender="1" data-chg="mcForm" data-id="${id}" dir="ltr">${Object.keys(F).map((k) => `<option ${k === c.f ? "selected" : ""}>${k}</option>`).join("")}</select>
        <button type="button" class="b sm" data-act="mcStarted" data-id="${id}">${IC.check} اعتماد الأساسيين في الإحصائيات</button><button type="button" class="b sm" data-act="mcClearXI" data-id="${id}">تفريغ التشكيلة</button></div>
      <p class="muted small no-print" style="margin:0 0 10px">اضغط على أي مركز في الملعب واختر اللاعب.</p>
      <div class="mc-grid">
        <div class="mc-pitch"><span class="fm num">${c.f}</span>${pitchSVG()}${slots.map((s, i) => { const p = ps[i];
          return `<button type="button" class="tk ${p ? "on" : ""}" style="left:${s[1]}%;bottom:${s[2]}%" data-act="mcSlot" data-id="${id}" data-i="${i}" aria-label="${esc(s[0])}${p ? " — " + esc(p.name) : " — فاضي"}"><i class="num">${p ? (p.number ?? "") : "+"}</i><b>${p ? esc(short(p, dup)) : esc(s[0])}</b></button>`; }).join("")}</div>
        <div class="mc-lists">
          <h4>التشكيلة الأساسية <small class="num">${ps.filter(Boolean).length}/11</small></h4>
          <ol class="mc-ol">${slots.map((s, i) => `<li><span class="num no">${ps[i] ? (ps[i].number ?? "–") : ""}</span><b>${ps[i] ? esc(ps[i].name) : `<span class="muted">—</span>`}</b><small>${esc(s[0])}</small></li>`).join("")}</ol>
          <h4>الاحتياط <small class="num">${subs.length}</small></h4>
          ${subs.length ? `<ol class="mc-ol sub">${subs.map((p) => `<li><span class="num no">${p.number ?? "–"}</span><b>${esc(p.name)}</b><small>${esc(p.position || "")}</small></li>`).join("")}</ol>` : `<p class="muted small">${hasSquad ? "كل القائمة في التشكيلة الأساسية." : "—"}</p>`}
          <p class="mc-staff">${staff.map((s) => `${esc(s.role || "")}: <b>${esc(s.name)}</b>`).join(" · ")}</p>
        </div>
      </div>
      ${e.notes_before ? `<div class="mc-nb">${esc(e.notes_before)}</div>` : ""}
      ${note("plan", "خطة المباراة والتعليمات الأساسية", "وش نبي من الفريق اليوم؟ بالكرة، بدون كرة، الكرات الثابتة…", 4)}
    </section>

    <section class="card mc-page mt">${head("التحليل أثناء المباراة")}
      <h3 class="mt">عدّاد المباراة <span class="sp"></span><label class="no-print" style="font-weight:500;font-size:13px;display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" id="mcMinus" style="accent-color:#d71920;width:18px;height:18px">وضع التصحيح (−1)</label></h3>
      <p class="muted small no-print" style="margin:-6px 0 10px">كل ضغطة على الخانة تزيد واحد.</p>
      <div class="tw"><table class="t mc-t"><thead><tr><th rowspan="2">البند</th><th class="n" colspan="2">الشوط الأول</th><th class="n" colspan="2">الشوط الثاني</th><th class="n" colspan="2">المجموع</th></tr><tr><th class="n">نحن</th><th class="n">المنافس</th><th class="n">نحن</th><th class="n">المنافس</th><th class="n">نحن</th><th class="n">المنافس</th></tr></thead>
        <tbody>${TALLY.map(([k, l]) => { const a = c.t[k] || []; const u = (a[0] || 0) + (a[2] || 0), o = (a[1] || 0) + (a[3] || 0); return `<tr><td class="name">${l}</td>${tv(k, 0)}${tv(k, 1)}${tv(k, 2)}${tv(k, 3)}<td class="n sum">${u || ""}</td><td class="n sum">${o || ""}</td></tr>`; }).join("")}</tbody></table></div>
      ${note("events", "أحداث المباراة (الدقيقة — الحدث: هدف، بطاقة، تبديل، فرصة)", "مثال: 12' هدف لنا — عمر من عرضية يمين", 5)}
      <h3 class="mt">الشوط الأول</h3><div class="mc-notes">${HALF.map(([k, l]) => note("h1" + k, l, "", 3)).join("")}</div>
      ${note("ht", "بين الشوطين — التعديلات والتعليمات", "", 3)}
    </section>

    <section class="card mc-page mt">${head("التحليل أثناء المباراة")}
      <h3 class="mt">الشوط الثاني</h3><div class="mc-notes">${HALF.map(([k, l]) => note("h2" + k, l, "", 3)).join("")}</div>
      <h3 class="mt">المنافس — ${esc(e.opponent || "")}</h3>
      <div class="toolbar no-print"><label style="font-weight:700">خطة المنافس</label><select class="search" style="flex:0 0 auto;width:auto;min-width:150px" data-rerender="1" data-chg="mcOppForm" data-id="${id}"><option value="">ملعب فاضي (أرسم بالقلم)</option>${Object.keys(F).map((k) => `<option ${k === c.of ? "selected" : ""}>${k}</option>`).join("")}</select></div>
      ${c.of ? `<p class="muted small no-print" style="margin:-6px 0 10px">اكتب رقم اللاعب داخل الدائرة.</p>` : ""}
      <div class="mc-opp"><div><p class="mc-dir">الرسم التكتيكي للمنافس${c.of ? ` · <span class="num" dir="ltr">${c.of}</span>` : ""} · ▲ اتجاه هجومه</p><div class="mc-pitch z opp">${pitchSVG(true)}${c.of ? F[c.of].map((s, i) => `<span class="ot" style="left:${s[1]}%;bottom:${s[2]}%"><input inputmode="numeric" maxlength="2" dir="ltr" aria-label="رقم لاعب المنافس — ${esc(s[0])}" data-chg="mcOppNo" data-id="${id}" data-i="${i}" value="${esc(c.on[i] || "")}"></span>`).join("") : ""}</div></div>
      <div>${note("oppf", "خطته وطريقة لعبه", "", 3)}${note("oppk", "لاعبيه المؤثرين (الرقم والمركز)", "", 3)}${note("opps", "نقاط قوته", "", 3)}${note("oppw", "نقاط ضعفه وكيف نستغلها", "", 3)}</div></div>
    </section>

    <section class="card mc-page mt">${head("مناطق القوة والضعف")}
      <p class="muted small no-print" style="margin:14px 0 0">اضغط على المنطقة: ضغطة = <b>ق</b> (قوة) · ضغطتين = <b>ض</b> (ضعف) · ثلاث = مسح. أو اتركه فاضي واكتب عليه بالقلم بعد الطباعة.</p>
      <div class="mc-zones">${zmap("a", "بالكرة — وين نشكّل خطورة ووين نفقد الكرة")}${zmap("d", "بدون كرة — وين نفتك الكرة ووين ينضرب دفاعنا")}</div>
      <p class="mc-key"><b>ق</b> = منطقة قوة <b>ض</b> = منطقة ضعف</p>
      <div class="mc-notes">${note("str", "نقاط قوتنا في المباراة", "", 4)}${note("weak", "نقاط ضعفنا في المباراة", "", 4)}</div>
      ${note("next", "وش نشتغل عليه في التمارين الجاية", "", 3)}
      ${note("best", "أبرز اللاعبين وملاحظات فردية", "", 3)}
    </section></div>`;
  };

  A.mcPrint = () => window.print();
  /* حفظ يدوي: يثبّت آخر شي انكتب ويأكد للمستخدم */
  const flush = () => { clearTimeout(tmr); const ae = document.activeElement; if (ae && ae.dataset && ae.dataset.chg === "mcNote") A.mcNote(ae); };
  let tmr = 0;
  A.mcSave = () => { flush(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); toast(navigator.onLine === false ? "انحفظ على الجهاز — يترفع أول ما يرجع النت" : "تم حفظ التقرير"); };
  /* حفظ تلقائي أثناء الكتابة (بدون انتظار الخروج من الخانة) */
  document.addEventListener("input", (x) => { const el = x.target; if (!el || !el.dataset || el.dataset.chg !== "mcNote") return; clearTimeout(tmr); tmr = setTimeout(() => { if (document.body.contains(el)) A.mcNote(el); }, 700); });
  window.addEventListener("hashchange", flush, true); window.addEventListener("pagehide", flush);
  /** يطبع نفس الأوراق لكن كل خانات التحليل فاضية ومسطّرة (التشكيلة تبقى) */
  A.mcPrintBlank = () => { const b = document.body; b.classList.add("mc-blank"); const off = () => { b.classList.remove("mc-blank"); window.removeEventListener("afterprint", off); }; window.addEventListener("afterprint", off); window.print(); setTimeout(off, 60000); };
  A.mcOppForm = (el) => save(el.dataset.id, (c) => { c.of = el.value; });
  A.mcOppNo = (el) => save(el.dataset.id, (c) => { c.on = { ...c.on, [el.dataset.i]: el.value.trim() }; });
  A.mcNote = (el) => save(el.dataset.id, (c) => { c.n = { ...c.n, [el.dataset.k]: el.value }; });
  A.mcForm = (el) => save(el.dataset.id, (c) => { c.f = el.value; });
  A.mcZone = (el) => save(el.dataset.id, (c) => { const m = el.dataset.m, i = el.dataset.i, z = { ...(c.z[m] || {}) }; const nx = { "": "s", s: "w", w: "" }[z[i] || ""]; if (nx) z[i] = nx; else delete z[i]; c.z = { ...c.z, [m]: z }; });
  A.mcTally = (el) => { const minus = $("#mcMinus") && $("#mcMinus").checked; save(el.dataset.id, (c) => { const a = (c.t[el.dataset.k] || [0, 0, 0, 0]).slice(); while (a.length < 4) a.push(0); a[+el.dataset.i] = Math.max(0, (a[+el.dataset.i] || 0) + (minus ? -1 : 1)); c.t = { ...c.t, [el.dataset.k]: a }; }); A._mcMinus = minus; };
  After.mcard = (root) => { const m = $("#mcMinus", root); if (m && A._mcMinus) m.checked = true; if (m) m.addEventListener("change", () => (A._mcMinus = m.checked)); };
  A.mcClearXI = async (el) => { if (await ask("تفريغ التشكيلة؟", "ينشالون كل اللاعبين من الملعب.", "تفريغ")) save(el.dataset.id, (c) => { c.xi = {}; }); };
  A.mcSlot = (el) => {
    const id = el.dataset.id, i = el.dataset.i, e = Store.get("events", id); if (!e) return;
    const c = cardOf(e), slot = F[c.f][i], cur = c.xi[i];
    const where = new Map(Object.entries(c.xi).map(([k, pid]) => [pid, k]));
    const list = pool(e);
    modal({
      title: "اختر لاعب — " + slot[0],
      body: `<div class="rows">${list.map((p) => { const at = where.get(p.id); return `<button type="button" class="rw mc-pick ${p.id === cur ? "cur" : ""}" data-p="${p.id}"><span class="avatar num">${p.number ?? esc(p.name[0])}</span><span class="grow"><b>${esc(p.name)}</b><span>${esc(p.position || "")}</span></span>${at != null && p.id !== cur ? `<span class="chip">${esc(F[c.f][at][0])}</span>` : p.id === cur ? `<span class="chip dark">هنا</span>` : ""}</button>`; }).join("")}</div>`,
      foot: `${cur ? `<button type="button" class="b" data-empty>إفراغ المركز</button>` : ""}<button type="button" class="b" data-close>إغلاق</button>`,
      onMount(w, api) {
        w.addEventListener("click", (x) => {
          const b = x.target.closest("[data-p]"), em = x.target.closest("[data-empty]");
          if (em) { save(id, (cc) => { const xi = { ...cc.xi }; delete xi[i]; cc.xi = xi; }); return api.close(); }
          if (!b) return;
          save(id, (cc) => { const xi = { ...cc.xi }, pid = b.dataset.p; const from = Object.keys(xi).find((k) => xi[k] === pid);
            if (from != null) { if (xi[i]) xi[from] = xi[i]; else delete xi[from]; } /* تبديل مراكز */
            xi[i] = pid; cc.xi = xi; });
          api.close();
        });
      }
    });
  };
  /** يعلّم الـ11 كأساسيين في إحصائيات المباراة (بدون ما يمسح أي أرقام مدخلة) */
  A.mcStarted = async (el) => {
    const id = el.dataset.id, e = Store.get("events", id); if (!e) return;
    const c = cardOf(e), xi = new Set(Object.values(c.xi).filter((pid) => Store.get("players", pid)));
    if (!xi.size) return toast("اختر التشكيلة أولاً", true);
    if (!(await ask("اعتماد الأساسيين؟", `ينسجلون ${xi.size} لاعب كأساسيين في إحصائيات المباراة، والباقي احتياط.`, "اعتماد"))) return;
    const ids = new Set([...xi, ...pool(e).map((p) => p.id)]);
    ids.forEach((pid) => {
      const sid = id + "_" + pid, old = Store.get("match_stats", sid), st = xi.has(pid);
      if (!old && !st) return;
      const s = { ...(old || { id: sid, event_id: id, player_id: pid, started: false, minutes: null, goals: 0, assists: 0, yellow: 0, red: 0, position: (Store.get("players", pid) || {}).position || "" }) };
      if (s.started === st) return;
      s.started = st; Store.put("match_stats", s);
    });
    toast("تم اعتماد الأساسيين");
  };
})();
