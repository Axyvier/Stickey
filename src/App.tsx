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
      if ((e.target as HTMLElement).tagName === 'INPUT'  !(e.ctrlKey  e.metaKey)) return;
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
    if (i < 0  j < 0  j >= s.objs.length) return s;
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
