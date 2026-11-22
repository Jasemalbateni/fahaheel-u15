/* بيانات وهمية للوضع التجريبي فقط — لا تُرفع لقاعدة البيانات */
window.FAH_DEMO_SEED = function () {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const staff = [
    { id: "s1", name: "مشعل المنصور", role: "مدرب الفريق", sort: 1 },
    { id: "s2", name: "جاسم الباطني", role: "مساعد المدرب", sort: 2 },
    { id: "s3", name: "عبدالله الرتيبان", role: "إداري الفريق", sort: 3 }
  ];
  const names = ["فهد العنزي", "يوسف المطيري", "عبدالعزيز الرشيدي", "سالم العجمي", "خالد الهاجري", "محمد الدوسري", "ناصر العازمي", "بدر الشمري", "حمد الظفيري", "علي الكندري", "عمر الفضلي", "مشاري السبيعي", "طلال الحربي", "راشد العتيبي", "سعود المري", "جراح الخالدي", "ضاري العدواني", "فيصل البلوشي", "عبدالله الصالح", "حسين القلاف", "مبارك الهدية", "زيد النصار"];
  const pos = ["حارس مرمى", "حارس مرمى", "قلب دفاع", "قلب دفاع", "قلب دفاع", "ظهير أيمن", "ظهير أيسر", "ظهير أيمن", "محور", "محور", "وسط", "وسط", "وسط", "جناح أيمن", "جناح أيسر", "صانع ألعاب", "مهاجم", "مهاجم", "قلب دفاع", "وسط", "جناح أيسر", "مهاجم"];
  const nums = [1, 22, 4, 5, 3, 2, 12, 13, 6, 8, 14, 16, 18, 7, 11, 10, 9, 19, 15, 20, 17, 21];
  const players = names.map((n, i) => ({
    id: "p" + (i + 1), name: n, number: nums[i], dob: "2012-" + String(1 + Math.floor(rnd() * 12)).padStart(2, "0") + "-" + String(1 + Math.floor(rnd() * 27)).padStart(2, "0"),
    position: pos[i], alt_positions: "", foot: rnd() > 0.78 ? "اليسرى" : "اليمنى", height: 150 + Math.floor(rnd() * 22), weight: 40 + Math.floor(rnd() * 18), measured_at: "2026-10-05",
    phone: "", guardian_name: "", guardian_phone: "", status: "متاح", status_note: "", notes: "", photo: "", active: true, updated_at: "2026-10-01T00:00:00Z"
  }));
  players[4].status = "مصاب"; players[4].status_note = "التواء في الكاحل — متوقع يرجع خلال أسبوعين";
  players[12].status = "مريض"; players[12].status_note = "إنفلونزا";
  players[16].status = "موقوف"; players[16].status_note = "إيقاف مباراة واحدة (بطاقة حمراء)";

  const themes = [
    { title: "التنظيم الدفاعي + القوة", tech: "التنظيم الدفاعي 5-2-1-2", phys: "القوة", rpe: 5,
      drills: [["إحماء: انزلاق الخط الخماسي", "الإحماء", 12, "منخفضة"], ["روندو 5 ضد 2", "تمرير واستقبال", 14, "متوسطة"], ["8 ضد 6 على نصف ملعب", "الدفاع والتمركز", 18, "متوسطة"], ["مباراة مشروطة: بلوك منخفض", "ألعاب مصغّرة", 20, "عالية"], ["قوة بوزن الجسم", "اللياقة البدنية", 12, "متوسطة"]] },
    { title: "دفاع الأطراف + التحمّل", tech: "دفاع الأطراف", phys: "التحمّل", rpe: 7,
      drills: [["إحماء ديناميكي بالكرة", "الإحماء", 12, "منخفضة"], ["1 ضد 1 على الطرف", "الدفاع والتمركز", 15, "عالية"], ["مثلث الطرف 3 ضد 3 + 1", "الدفاع والتمركز", 18, "عالية"], ["مباراة 9 ضد 9 على ثلثي الملعب", "ألعاب مصغّرة", 24, "عالية"]] },
    { title: "الاستحواذ + رد الفعل", tech: "الاستحواذ والخروج بالكرة", phys: "رد الفعل والرشاقة", rpe: 4,
      drills: [["إحماء: رد فعل وألوان", "الإحماء", 10, "منخفضة"], ["مربع التمرير", "تمرير واستقبال", 15, "منخفضة"], ["بناء اللعب H5-1 بدون ضغط", "بناء اللعب", 18, "متوسطة"], ["استحواذ 6 ضد 3", "تمرير واستقبال", 16, "متوسطة"], ["مباراة: هدف بعد 5 تمريرات", "ألعاب مصغّرة", 18, "متوسطة"]] },
    { title: "الهجمة المرتدة + السرعة", tech: "التحول من الدفاع للهجوم", phys: "السرعة", rpe: 8,
      drills: [["إحماء + تسارعات قصيرة", "الإحماء", 12, "متوسطة"], ["2 ضد 1 بعد قطع الكرة", "التحولات", 15, "عالية"], ["مرتدة 4 ضد 3 من البلوك المتوسط", "التحولات", 18, "عالية"], ["إنهاء الهجمة أمام المرمى", "التسديد والإنهاء", 15, "متوسطة"], ["مباراة: هدف المرتدة = هدفان", "ألعاب مصغّرة", 20, "عالية"]] }
  ];
  const events = [], attendance = [], sheets = [], match_stats = [];
  const matches = { "-44": ["اليرموك", 0, 6], "-37": ["الساحل", 0, 5], "-30": ["النصر", 1, 5], "-23": ["التضامن", 0, 3], "-16": ["الجهراء", 0, 4], "-5": ["الكويت", 0, 9], "2": ["خيطان", null, null], "9": ["الشباب", null, null] };
  let k = 0;
  for (let off = -49; off <= 12; off++) {
    const d = new Date(today); d.setDate(d.getDate() + off);
    const dow = d.getDay(), id = "e" + (off + 100), past = off < 0;
    if (matches[off]) {
      const [opp, gf, ga] = matches[off];
      events.push({ id, type: "match", date: iso(d), time: "16:30", duration: 70, place: off % 2 ? "ملعب نادي الفحيحيل" : "ملعب " + opp, title: "", status: "scheduled", opponent: opp, competition: "دوري تحت 15", home_away: off % 2 ? "على أرضنا" : "خارج أرضنا", meet_time: "15:15", meet_place: "بوابة النادي", score_for: gf, score_against: ga, rpe: past ? 8 : null, sheet_id: null, updated_at: "2026-10-01T00:00:00Z" });
      if (past) {
        const avail = players.filter(() => rnd() > 0.12).slice(0, 18);
        let goalsLeft = gf || 0;
        avail.forEach((p, i) => {
          const st = i < 11, min = st ? (rnd() > 0.3 ? 70 : 45) : (rnd() > 0.4 ? 25 : 0);
          attendance.push({ id: id + "_" + p.id, event_id: id, player_id: p.id, status: "present", updated_at: "2026-10-01T00:00:00Z" });
          const g = goalsLeft && i === 9 ? goalsLeft-- && 1 : 0;
          match_stats.push({ id: id + "_" + p.id, event_id: id, player_id: p.id, started: st, minutes: min, goals: g, assists: g && 0, yellow: rnd() > 0.93 ? 1 : 0, red: 0, position: p.position, updated_at: "2026-10-01T00:00:00Z" });
        });
        players.filter((p) => !avail.includes(p)).forEach((p) => attendance.push({ id: id + "_" + p.id, event_id: id, player_id: p.id, status: rnd() > 0.5 ? "absent" : "excused", updated_at: "2026-10-01T00:00:00Z" }));
      }
      continue;
    }
    if (dow > 3) continue; // تمارين الأحد–الأربعاء
    const th = themes[dow];
    const sid = "sh" + (off + 100);
    const cancelled = off === -19;
    const hasSheet = off <= 3 && !cancelled;
    if (hasSheet) {
      const drills = th.drills.map((x, i) => ({ id: sid + "d" + i, type: /^مباراة/.test(x[0]) ? "match" : "drill", title: x[0], code: /^مباراة/.test(x[0]) ? "" : "FAH-" + String(++k).padStart(3, "0"), cat: x[1], age: "تحت 15", dur: String(x[2]), players: "20 + حارسين", area: i < 2 ? "30 × 20" : "60 × 45", intensity: x[3], img: "", desc: "", obj: "", eq: "", pts: "", prog: "", format: /^مباراة/.test(x[0]) ? "9 ضد 9" : "" }));
      const sh = { id: sid, kind: "session", title: th.title, date: iso(d), age: "تحت 15", coach: "مشعل المنصور · جاسم الباطني", goal_tech: th.tech, goal_phys: th.phys, drills, active: 0, event_id: id };
      sheets.push({ id: sid, kind: "session", title: th.title, date: iso(d), age: "تحت 15", coach: sh.coach, goal_tech: th.tech, goal_phys: th.phys, summary: drills.map(({ id, type, title, code, cat, dur, intensity, players, area, format }) => ({ id, type, title, code, cat, dur, intensity, players, area, format })), thumbs: {}, data: sh, updated_at: "2026-10-01T00:00:00Z" });
    }
    events.push({ id, type: "training", date: iso(d), time: "17:00", duration: 90, place: "ملعب نادي الفحيحيل", title: th.title, goal_tech: th.tech, goal_phys: th.phys, status: cancelled ? "cancelled" : "scheduled", cancel_reason: cancelled ? "الملعب محجوز لمباراة الفريق الأول" : "", sheet_id: hasSheet ? sid : null, rpe: past && !cancelled ? Math.max(3, Math.min(9, th.rpe + Math.round(rnd() * 2 - 1))) : null, actual_duration: past && !cancelled ? 80 + Math.floor(rnd() * 3) * 5 : null, notes_after: "", updated_at: "2026-10-01T00:00:00Z" });
    if (past && !cancelled) {
      players.forEach((p, i) => {
        const r = rnd(), lazy = i === 7 || i === 14 ? 0.3 : 0;
        const st = r < 0.08 + lazy ? "absent" : r < 0.13 + lazy ? "excused" : r < 0.19 + lazy ? "late" : "present";
        attendance.push({ id: id + "_" + p.id, event_id: id, player_id: p.id, status: st, late_min: st === "late" ? 10 : null, reason: st === "excused" ? "ظرف عائلي" : "", updated_at: "2026-10-01T00:00:00Z" });
      });
    }
  }
  const settings = [{ id: "app", value: { season: "2026/2027", seasons: [{ name: "2026/2027", start: "2026-08-01", end: "2027-07-31" }], place: "ملعب نادي الفحيحيل", time: "17:00", duration: 90 }, updated_at: "2026-10-01T00:00:00Z" }];
  return { staff, players, events, attendance, match_stats, sheets, settings };
};
