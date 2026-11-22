/* نقطة الدخول: يركّب استوديو الرسم داخل موقع فحيحيل (الموقع نفسه بدون React) */
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Check, Download, Ellipsis, FileText, CopyPlus, Trash2 } from "lucide-react";
import Editor, { type EditorApi } from "@/components/drills/editor";
import { newBoard, parseBoard, boardDims } from "@/lib/drills/board";
import type { Board } from "@/lib/drills/types";

type Opts = {
  board: Board | null;
  title: string;
  /** label of the main (red) action, e.g. «اعتماد الرسم» */
  primaryLabel: string;
  /** small status next to the title: محفوظ / جارٍ الحفظ */
  status?: () => string;
  onChange?: (b: Board) => void;
  onTitle?: (t: string) => void;
  onPrimary: (api: Api) => void | Promise<void>;
  onBack: (api: Api) => void;
  menu?: { label: string; danger?: boolean; icon?: "sheet" | "copy" | "trash"; run: (api: Api) => void }[];
};
type Api = { getBoard: () => Board; getTitle: () => string; exportPlain: (maxPx?: number) => Promise<Blob | null>; exportImage: () => Promise<void> };

const ICONS = { sheet: FileText, copy: CopyPlus, trash: Trash2 };

function App({ opts, bind }: { opts: Opts; bind: (a: Api) => void }) {
  const ed = useRef<EditorApi>(null);
  const [title, setTitle] = useState(opts.title || "");
  const titleRef = useRef(title);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState(opts.status ? opts.status() : "");
  const [initial] = useState<Board>(() => (opts.board ? parseBoard(opts.board) : newBoard("half")));
  const api: Api = {
    getBoard: () => ed.current!.getBoard(),
    getTitle: () => titleRef.current.trim(),
    exportPlain: (m) => ed.current!.exportPlain(m),
    exportImage: () => ed.current!.exportImage(),
  };
  useEffect(() => { bind(api); });
  useEffect(() => {
    if (!opts.status) return;
    const t = setInterval(() => setStatus(opts.status!()), 500);
    return () => clearInterval(t);
  }, [opts]);

  const primary = async () => {
    if (busy) return;
    setBusy(true);
    try { await opts.onPrimary(api); } finally { setBusy(false); }
  };

  const titleNode = (
    <>
      <button type="button" onClick={() => opts.onBack(api)} className="h-10 w-10 shrink-0 grid place-items-center rounded-xl text-silver hover:text-white hover:bg-white/[0.08]" aria-label="رجوع">
        <ArrowRight size={20} />
      </button>
      <span className="min-w-0 flex-1 max-w-[340px]">
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); titleRef.current = e.target.value; opts.onTitle?.(e.target.value); }}
          placeholder="اسم الرسم"
          aria-label="اسم الرسم"
          className="block w-full bg-transparent border-0 outline-none font-extrabold text-[16px] sm:text-[15px] text-white placeholder:text-silver/50 rounded-lg px-2 py-1 focus:bg-white/[0.08]"
        />
        {status ? <span className="block text-[11px] text-silver/80 px-2 truncate">{status}</span> : null}
      </span>
    </>
  );

  const actions = (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={primary} disabled={busy} className="h-10 px-3.5 rounded-xl font-bold text-[13.5px] inline-flex items-center gap-1.5 bg-ice text-white disabled:opacity-60 whitespace-nowrap">
        <Check size={17} /> {busy ? "جارٍ…" : opts.primaryLabel}
      </button>
      <div className="relative">
        <button type="button" onClick={() => setMenuOpen((v) => !v)} className="h-10 w-10 grid place-items-center rounded-xl text-silver hover:text-white hover:bg-white/[0.08]" aria-label="المزيد" aria-expanded={menuOpen}>
          <Ellipsis size={20} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-[70]" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-12 z-[71] w-60 rounded-2xl bg-white text-navy shadow-[var(--shadow-pop)] border border-silver-200 p-1.5 fade-up">
              <MenuItem icon={<Download size={17} />} onClick={() => { setMenuOpen(false); api.exportImage(); }}>تنزيل صورة بإطار النادي</MenuItem>
              {(opts.menu || []).map((m) => {
                const I = m.icon ? ICONS[m.icon] : FileText;
                return (
                  <MenuItem key={m.label} danger={m.danger} icon={<I size={17} />} onClick={() => { setMenuOpen(false); m.run(api); }}>
                    {m.label}
                  </MenuItem>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return <Editor initial={initial} onChange={(b) => opts.onChange?.(b)} onSave={primary} title={titleNode} actions={actions} exportTitle={title.trim() || "تمرين"} exportSubtitle="نادي الفحيحيل · فريق تحت 15" ref={ed} />;
}

function MenuItem({ icon, children, onClick, danger }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={"w-full flex items-center gap-2.5 rounded-xl px-3 h-11 text-[14px] font-bold text-start " + (danger ? "text-error hover:bg-error-100" : "text-navy hover:bg-navy-50")}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

(window as unknown as { FahStudio: unknown }).FahStudio = {
  newBoard,
  parseBoard,
  boardDims,
  mount(el: HTMLElement, opts: Opts) {
    const root = createRoot(el);
    let api: Api | null = null;
    root.render(<App opts={opts} bind={(a) => (api = a)} />);
    return { unmount: () => root.unmount(), api: () => api };
  },
};
