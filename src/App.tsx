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
