import { useEffect, useRef, useState } from 'react';
import { useDoc } from './store';
import { W, H, draw, hit, snap } from './canvas';
import { Obj } from './types';

const EMOJI = ['😂', '🔥', '💀', '😎', '🤡', '👀', '🫠', '💯', '🗿', '🥲', '🤝', '✨'];
const RATIOS: [string, number][] = [['1:1', 1], ['4:5', 1.25], ['16:9', 9 / 16], ['9:16', 16 / 9]];
const TPL = [
  { n: 'Klasik', a: '#232946', b: '#b8c1ec' }, { n: 'Sunset', a: '#ff6a3d', b: '#7b2ff7' },
  { n: 'Neon', a: '#0f0c29', b: '#24c6dc' }, { n: 'Mono', a: '#111111', b: '#777777' },
];
let uid = 1;

export default function App() {
  const [{ now: d, past, future }, dispatch] = useDoc();
  const [sel, setSel] = useState<number | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [guides, setGuides] = useState({ x: false, y: false });
  const [grid, setGrid] = useState(true);
  const [txt, setTxt] = useState('');
  const cv = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const o = d.objs.find((v) => v.id === sel);

  useEffect(() => {
    if (!d.img) { setImg(null); return; }
    const i = new Image(); i.onload = () => setImg(i); i.src = d.img;
  }, [d.img]);
  useEffect(() => { if (cv.current) draw(cv.current, d, img, sel, guides); }, [d, img, sel, guides]);
  useEffect(() => {
    const end = () => dispatch({ t: 'end' });
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || !(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z') { e.preventDefault(); dispatch({ t: e.shiftKey ? 'redo' : 'undo' }); }
      if (k === 'y') { e.preventDefault(); dispatch({ t: 'redo' }); }
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerup', end); window.removeEventListener('keydown', key); };
  }, [dispatch]);

  const patch = (p: Partial<Obj>, key: string) =>
    dispatch({ t: 'edit', key: key + sel, f: (s) => ({ ...s, objs: s.objs.map((v) => (v.id === sel ? { ...v, ...p } : v)) }) });

  const add = (kind: Obj['kind'], text: string) => {
    const id = uid++;
    dispatch({ t: 'edit', f: (s) => ({ ...s, objs: [...s.objs, {
      id, kind, text, x: W / 2, y: H(s) / 2, size: kind === 'emoji' ? 220 : 96,
      color: '#ffffff', stroke: kind === 'emoji' ? 0 : 8, rot: 0, op: 1 }] }) });
    setSel(id);
  };
  const template = (t: (typeof TPL)[0]) => {
    const a = uid++, b = uid++;
    const mk = (id: number, text: string, y: number): Obj =>
      ({ id, kind: 'text', text, x: W / 2, y, size: 96, color: '#ffffff', stroke: 8, rot: 0, op: 1 });
    dispatch({ t: 'edit', f: (s) => ({ ...s, a: t.a, b: t.b, img: null,
      objs: [mk(a, 'TEKS ATAS', 120), mk(b, 'TEKS BAWAH', H(s) - 120)] }) });
    setSel(null);
  };
  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { const u = URL.createObjectURL(f); dispatch({ t: 'edit', f: (s) => ({ ...s, img: u }) }); }
    e.target.value = '';
  };
  const layer = (n: number) => dispatch({ t: 'edit', f: (s) => {
    const i = s.objs.findIndex((v) => v.id === sel), j = i + n;
    if (i < 0 || j < 0 || j >= s.objs.length) return s;
    const a = [...s.objs]; [a[i], a[j]] = [a[j], a[i]];
    return { ...s, objs: a };
  } });
  const remove = () => { dispatch({ t: 'edit', f: (s) => ({ ...s, objs: s.objs.filter((v) => v.id !== sel) }) }); setSel(null); };
  const save = () => {
    const c = document.createElement('canvas'); draw(c, d, img);
    const a = document.createElement('a'); a.download = 'meme.png';
    if (c.toBlob) c.toBlob((b) => {
      if (!b) return;
      a.href = URL.createObjectURL(b); a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1e4);
    }, 'image/png');
    else { a.href = c.toDataURL('image/png'); a.click(); }
  };

  const pt = (e: React.PointerEvent) => {
    const r = cv.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H(d)) / r.height };
  };
  const down = (e: React.PointerEvent) => {
    const p = pt(e), id = hit(d, p.x, p.y), t = d.objs.find((v) => v.id === id);
    setSel(id);
    if (t) { drag.current = { dx: t.x - p.x, dy: t.y - p.y }; cv.current!.setPointerCapture(e.pointerId); }
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current || sel == null) return;
    const p = pt(e), s = snap(d, p.x + drag.current.dx, p.y + drag.current.dy, grid);
    setGuides({ x: s.gx, y: s.gy });
    patch({ x: s.x, y: s.y }, 'drag');
  };
  const stop = () => { drag.current = null; setGuides({ x: false, y: false }); };

  const Range = (l: string, k: 'size' | 'stroke' | 'rot' | 'op', min: number, max: number, step = 1) => (
    <label className="row">{l}
      <input type="range" min={min} max={max} step={step} value={o![k]}
        onChange={(e) => patch({ [k]: +e.target.value } as Partial<Obj>, k)} />
    </label>
  );

  return (
    <div className="app">
      <header>
        <h1>Meme<span>Forge</span></h1>
        <div className="bar">
          <button disabled={!past.length} onClick={() => dispatch({ t: 'undo' })}>↶ Undo</button>
          <button disabled={!future.length} onClick={() => dispatch({ t: 'redo' })}>↷ Redo</button>
          <button className="primary" onClick={save}>Ekspor PNG</button>
        </div>
      </header>
      <main>
        <section className="stage">
          <canvas ref={cv} onPointerDown={down} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} />
        </section>
        <aside>
          <div className="card">
            <h2>Gambar & Template</h2>
            <label className="btn">Upload gambar
              <input type="file" accept="image/*" hidden onChange={upload} />
            </label>
            <div className="chips">{TPL.map((t) => <button key={t.n} onClick={() => template(t)}>{t.n}</button>)}</div>
            <div className="chips">{RATIOS.map(([n, r]) => (
              <button key={n} className={d.r === r ? 'on' : ''}
                onClick={() => dispatch({ t: 'edit', f: (s) => ({ ...s, r }) })}>{n}</button>))}
            </div>
            <label className="row"><span>Snap ke grid</span>
              <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} /></label>
          </div>
          <div className="card">
            <h2>Tambah</h2>
            <div className="row">
              <input value={txt} placeholder="Ketik teks…" onChange={(e) => setTxt(e.target.value)} />
              <button onClick={() => { add('text', txt || 'TEKS ANDA'); setTxt(''); }}>＋ Teks</button>
            </div>
            <div className="chips">{EMOJI.map((m) => <button key={m} onClick={() => add('emoji', m)}>{m}</button>)}</div>
          </div>
          {o && (
            <div className="card">
              <h2>Objek terpilih</h2>
              {o.kind === 'text' && <input value={o.text} onChange={(e) => patch({ text: e.target.value }, 'text')} />}
              {Range('Ukuran', 'size', 20, 500)}
              {Range('Outline', 'stroke', 0, 30)}
              {Range('Rotasi', 'rot', -180, 180)}
              {Range('Opacity', 'op', 0.1, 1, 0.05)}
              {o.kind === 'text' && (
                <label className="row">Warna
                  <input type="color" value={o.color} onChange={(e) => patch({ color: e.target.value }, 'color')} />
                </label>)}
              <div className="chips">
                <button onClick={() => layer(1)}>Naik ↑</button>
                <button onClick={() => layer(-1)}>Turun ↓</button>
                <button className="danger" onClick={remove}>Hapus</button>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
