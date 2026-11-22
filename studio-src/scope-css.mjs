// يحصر تنسيقات الاستوديو داخل .fah-studio حتى ما تأثر على باقي الموقع (ويفك @layer حتى تغلب تنسيقات الموقع العامة)
import fs from "node:fs";
import postcss from "postcss";
const [, , src, out] = process.argv;
const P = ".fah-studio";
const root = postcss.parse(fs.readFileSync(src, "utf8"));
const unwrap = (node) => {
  node.walkAtRules("layer", (r) => { if (r.nodes) { r.replaceWith(r.nodes); } else r.remove(); });
};
for (let i = 0; i < 4; i++) unwrap(root);
const scope = (sel) => {
  sel = sel.trim();
  if (/^(html|body|:root|:host)\b/.test(sel)) { const rest = sel.replace(/^(html|body|:root|:host)/, ""); return P + rest; }
  if (sel.startsWith(P)) return sel;
  if (/^(\*|::|:)/.test(sel)) return sel === "*" ? `${P}, ${P} *` : `${P} ${sel}`;
  return `${P} ${sel}`;
};
root.walkRules((rule) => {
  const p = rule.parent;
  if (p && p.type === "atrule" && /keyframes$/.test(p.name)) return;
  if (p && p.type === "rule") return; // nested rule: parent already scoped
  rule.selectors = [...new Set(rule.selectors.flatMap((s) => scope(s).split(/,\s*(?![^()]*\))/)))];
});
fs.writeFileSync(out, "/* مولّد تلقائياً من studio-src — لا تعدّله يدوياً */\n" + root.toString());
