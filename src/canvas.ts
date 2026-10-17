import { Doc, Obj } from './types';

export const W = 1080;
export const H = (d: Doc) => Math.round(W * d.r);
const font = (o: Obj) => '900 ' + o.size + 'px Impact, "Arial Black", sans-serif';

const mc = document.createElement('canvas').getContext('2d')!;
const size = (o: Obj) => {
  mc.font = font(o);
  return { w: mc.measureText(o.text).width + o.stroke, h: o.size * 1.2 };
};

export function draw(
  c: HTMLCanvasElement, d: Doc, img: HTMLImageElement | null,
  sel: number | null = null, guides?: { x: boolean; y: boolean }
) {
  const h = H(d);
  c.width = W; c.height = h;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, W, h);
  gr.addColorStop(0, d.a); gr.addColorStop(1, d.b);
  g.fillStyle = gr; g.fillRect(0, 0, W, h);
  if (img) { // GIF diperlakukan sebagai gambar diam (frame pertama)
    const s = Math.max(W / img.width, h / img.height);
    g.drawImage(img, (W - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
  }
  for (const o of d.objs) {
    g.save();
    g.translate(o.x, o.y); g.rotate((o.rot * Math.PI) / 180);
    g.globalAlpha = o.op; g.font = font(o);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (o.stroke) { g.lineWidth = o.stroke; g.strokeStyle = '#000'; g.strokeText(o.text, 0, 0); }
    g.fillStyle = o.color; g.fillText(o.text, 0, 0);
    g.restore();
  }
  const so = d.objs.find((o) => o.id === sel);
  if (so) {
    const s = size(so);
    g.save();
    g.translate(so.x, so.y); g.rotate((so.rot * Math.PI) / 180);
    g.strokeStyle = '#ff8906'; g.lineWidth = 3; g.setLineDash([12, 8]);
    g.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
    g.restore();
  }
  if (guides) {
    g.strokeStyle = '#2cb67d'; g.lineWidth = 2;
    if (guides.x) { g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, h); g.stroke(); }
    if (guides.y) { g.beginPath(); g.moveTo(0, h / 2); g.lineTo(W, h / 2); g.stroke(); }
  }
}

export function hit(d: Doc, x: number, y: number): number | null {
  for (let i = d.objs.length - 1; i >= 0; i--) {
    const o = d.objs[i], t = (o.rot * Math.PI) / 180;
    const dx = x - o.x, dy = y - o.y;
    const lx = dx * Math.cos(t) + dy * Math.sin(t);
    const ly = -dx * Math.sin(t) + dy * Math.cos(t);
    const s = size(o);
    if (Math.abs(lx) <= s.w / 2 && Math.abs(ly) <= s.h / 2) return o.id;
  }
  return null;
}

export function snap(d: Doc, x: number, y: number, grid: boolean) {
  const h = H(d);
  let gx = false, gy = false;
  if (Math.abs(x - W / 2) < 14) { x = W / 2; gx = true; } else if (grid) x = Math.round(x / 54) * 54;
  if (Math.abs(y - h / 2) < 14) { y = h / 2; gy = true; } else if (grid) y = Math.round(y / 54) * 54;
  return { x, y, gx, gy };
}
