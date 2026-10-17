import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Efek tekan (blur lembut) sejak pointerdown; dibersihkan saat up/cancel/leave/blur
const SEL = 'button,label.btn,[data-press]';
let cur: Element | null = null;
const release = () => { cur?.classList.remove('pressed'); cur = null; };
document.addEventListener('pointerdown', (e) => {
  const t = (e.target as Element).closest(SEL);
  if (t) { cur = t; t.classList.add('pressed'); }
});
document.addEventListener('pointerup', release);
document.addEventListener('pointercancel', release);
document.addEventListener('pointerout', (e) => {
  if (cur && !cur.contains(e.relatedTarget as Node)) release();
});
window.addEventListener('blur', release);

createRoot(document.getElementById('root')!).render(<App />);
