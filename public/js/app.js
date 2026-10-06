// Interface: Preact + htm, mapa em Canvas 2D.
// startApp é chamado por main.js depois que o contorno é carregado; TABELAS é preenchida
// com a tabela de locais de votação de cada ano, conforme a eleição escolhida.
function startApp(GEO, TABELAS) {
const { html, render, useState, useEffect, useMemo, useRef } = htmPreact;
const UF = 'PB', CIDADE = 'Bayeux';
const NORM = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

// ---------- Geometria ----------
const K = Math.cos(-7.13 * Math.PI / 180);
const proj = ([lon, lat]) => [lon * K, -lat];
const GEOM = GEO.features[0].geometry;
const OUTLINE = new Path2D();
let BB = [Infinity, Infinity, -Infinity, -Infinity];
for (const poly of (GEOM.type === 'Polygon' ? [GEOM.coordinates] : GEOM.coordinates)) {
  for (const ring of poly) {
    ring.map(proj).forEach(([x, y], i) => {
      if (i) OUTLINE.lineTo(x, y); else OUTLINE.moveTo(x, y);
      BB = [Math.min(BB[0], x), Math.min(BB[1], y), Math.max(BB[2], x), Math.max(BB[3], y)];
    });
    OUTLINE.closePath();
  }
}

// Bairros de cada eleição: agrupa os locais de votação pelo campo de bairro do TSE.
const bairrosCache = {};
function bairrosDe(ano) {
  if (bairrosCache[ano]) return bairrosCache[ano];
  if (!TABELAS[ano]) return [];
  const m = new Map();
  TABELAS[ano].locais.forEach((l, i) => {
    const k = NORM(l.bairro) || 'SEM BAIRRO';
    let b = m.get(k);
    if (!b) { b = { key: k, name: l.bairro || 'Sem bairro', locais: [], pts: [], eleitores: 0 }; m.set(k, b); }
    b.locais.push(i); b.eleitores += l.eleitores;
    if (l.lat != null) b.pts.push(proj([l.lon, l.lat]));
  });
  return bairrosCache[ano] = [...m.values()].map(b => {
    const n = b.pts.length;
    b.c = n ? [b.pts.reduce((s, p) => s + p[0], 0) / n, b.pts.reduce((s, p) => s + p[1], 0) / n] : null;
    return b;
  });
}

// ---------- Formatação ----------
const nf = new Intl.NumberFormat('pt-BR');
const pct = (v, d = 2) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d === 2 ? 1 : d, maximumFractionDigits: d }) + '%';
const LOWER = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du']);
const titleCase = s => String(s || '').toLowerCase().split(/\s+/).map((w, i) => (i && LOWER.has(w)) ? w : w.replace(/^(\p{L})/u, c => c.toUpperCase())).join(' ');
const sentence = s => { s = String(s || '').toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };
const CARGO_ORDER = { '1': 0, '3': 1, '5': 2, '6': 3, '7': 4, '13': 5 };
// Partido pelo prefixo do número (os votos de legenda do arquivo trazem o nome do partido)
const partidoDe = (ds, ano, nr) => (ds.partidos && ds.partidos[ano] && ds.partidos[ano][String(nr).slice(0, 2)]) || '';
// Nome de escola/local: título em caixa mista, mas siglas (EMEF, E.E.E.F.M., CRAS…) continuam em maiúsculas
const SIGLAS = new Set(['EMEF', 'EEEF', 'EEEFM', 'EMEB', 'EMEI', 'ECI', 'CRAS', 'SENAI', 'SESI', 'CAIC', 'APAE', 'UFPB', 'IFPB']);
const localNome = s => String(s || '').split(/\s+/).map((w, i) => (SIGLAS.has(w) || w.includes('.') && w.length <= 10) ? w : titleCase(w).replace(/^(de|da|do|das|dos|e)$/i, m => i ? m.toLowerCase() : titleCase(m))).join(' ');

// ---------- Armazenamento local ----------
const ls = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };

// ---------- Visão de um candidato ----------
function buildView(ds, cand) {
  const ano = cand.ano, tk = ano + '|' + cand.turno + '|' + cand.cargo;
  const tot = ds.tot[tk] || {};
  const rivals = ds.cands.filter(c => c.ano === ano && c.turno === cand.turno && c.cargo === cand.cargo);
  const soma = (b, o) => b.locais.reduce((s, i) => s + (o[i] || 0), 0);
  const bairros = bairrosDe(ano).map(b => {
    const v = soma(b, cand.loc), t = soma(b, tot);
    let rank = null;
    if (v > 0) { rank = 1; for (const r of rivals) if (r.key !== cand.key && soma(b, r.loc) > v) rank++; }
    return { key: b.key, name: b.name, c: b.c, v, t, p: t ? v / t : 0, rank, eleitores: b.eleitores,
      locais: b.locais.map(i => ({ nome: TABELAS[ano].locais[i].nome, v: cand.loc[i] || 0, t: tot[i] || 0 })).sort((x, y) => y.v - x.v) };
  });
  const sorted = rivals.map(c => c.total).sort((a, b) => b - a);
  return { ano, turno: cand.turno, cargo: cand.cargo, cargoNome: cand.cargoNome, nr: cand.nr, nome: cand.nome || cand.urna, partido: cand.partido || partidoDe(ds, ano, cand.nr), sit: cand.sit || '',
    total: cand.total, posicao: sorted.indexOf(cand.total) + 1, nCands: rivals.length,
    totCidade: Object.values(tot).reduce((a, b) => a + b, 0), esp: ds.esp[tk], bairros };
}

function quantBreaks(vals) {
  const a = vals.filter(v => v > 0).sort((x, y) => x - y);
  if (!a.length) return { b: [], min: 0, max: 0 };
  const b = [];
  for (let i = 1; i < 6; i++) { const q = a[Math.floor(i * a.length / 6)]; if (q > a[0] && (!b.length || q > b[b.length - 1])) b.push(q); }
  return { b, min: a[0], max: a[a.length - 1] };
}
const classOf = (v, b) => { if (!(v > 0)) return -1; let i = 0; while (i < b.length && v >= b[i]) i++; return i; };
const rampIndex = (cls, n) => n <= 1 ? 5 : Math.round(cls * 5 / (n - 1));
const metricOf = (b, metric) => metric === 'votos' ? b.v : b.p;

// ---------- Mapa (Canvas 2D) ----------
function MapCanvas({ ano, view, metric, selected, onSelect, hover, onHover, classes }) {
  const wrap = useRef(), cv = useRef();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [, force] = useState(0);
  const tf = useRef({ s: 1, ox: 0, oy: 0, s0: 1, z: 1 });
  const ptrs = useRef(new Map()), gesture = useRef(null), bubbles = useRef([]);
  const props = useRef({}); props.current = { ano, view, metric, selected, hover, classes };

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const asp = (BB[3] - BB[1]) / (BB[2] - BB[0]);
      const h = Math.round(Math.max(260, Math.min(w * Math.max(asp, 0.7) + 40, window.innerWidth >= 960 ? window.innerHeight * 0.72 : w * 1.15)));
      setSize(s => (s.w === w && s.h === h) ? s : { w, h });
    });
    ro.observe(wrap.current);
    const mq = matchMedia('(prefers-color-scheme: dark)'); const t = () => force(x => x + 1);
    mq.addEventListener && mq.addEventListener('change', t);
    return () => { ro.disconnect(); mq.removeEventListener && mq.removeEventListener('change', t); };
  }, []);

  const fit = () => {
    const { w, h } = size; const pad = w < 500 ? 26 : 40;
    const s0 = Math.min((w - 2 * pad) / (BB[2] - BB[0]), (h - 2 * pad) / (BB[3] - BB[1]));
    tf.current = { s0, z: 1, s: s0, ox: (w - (BB[2] - BB[0]) * s0) / 2, oy: (h - (BB[3] - BB[1]) * s0) / 2 };
  };
  useEffect(() => { if (size.w) { fit(); draw(); } }, [size.w, size.h]);
  useEffect(() => { draw(); });

  function draw() {
    const c = cv.current; if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (c.width !== size.w * dpr) { c.width = size.w * dpr; c.height = size.h * dpr; }
    const ctx = c.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const v = n => css.getPropertyValue(n).trim();
    const ramp = [0, 1, 2, 3, 4, 5].map(i => v('--r' + i)), zero = v('--zero'), edge = v('--edge'), ink = v('--ink'), accent = v('--accent'), paper = v('--map-bg'), halo = v('--halo');
    const { ano, view, metric, selected, hover, classes } = props.current;
    const { s, ox, oy } = tf.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size.w, size.h);
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (ox - BB[0] * s), dpr * (oy - BB[1] * s));
    ctx.fillStyle = zero; ctx.fill(OUTLINE, 'evenodd');
    ctx.strokeStyle = edge; ctx.lineWidth = 1 / s; ctx.lineJoin = 'round'; ctx.stroke(OUTLINE);

    // bolhas dos bairros (em pixels de tela)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const small = size.w < 500, rmin = small ? 4 : 5, rmax = small ? 24 : 34;
    const list = view ? view.bairros : bairrosDe(ano).map(b => ({ key: b.key, name: b.name, c: b.c, v: 0, p: 0, eleitores: b.eleitores }));
    const maxV = view ? Math.max(1, ...view.bairros.map(b => b.v)) : 1;
    const n = classes ? classes.b.length + 1 : 0;
    bubbles.current = list.filter(b => b.c).map(b => {
      const r = view ? (b.v > 0 ? rmin + (rmax - rmin) * Math.sqrt(b.v / maxV) : rmin * 0.7) : rmin;
      return { key: b.key, name: b.name, v: b.v, x: ox + (b.c[0] - BB[0]) * s, y: oy + (b.c[1] - BB[1]) * s, r,
        cl: view ? classOf(metricOf(b, metric), classes.b) : -1 };
    }).sort((a, b) => b.r - a.r);
    for (const b of bubbles.current) {
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7);
      if (view && b.cl >= 0) { ctx.globalAlpha = 0.92; ctx.fillStyle = ramp[rampIndex(b.cl, n)]; ctx.fill(); ctx.globalAlpha = 1; }
      else if (!view) { ctx.fillStyle = ink; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.lineWidth = 1.2; ctx.strokeStyle = view ? halo : paper; ctx.stroke();
      if (view && b.cl < 0) { ctx.setLineDash([2, 2]); ctx.strokeStyle = edge; ctx.stroke(); ctx.setLineDash([]); }
    }
    for (const key of [hover, selected]) {
      const b = key && bubbles.current.find(x => x.key === key); if (!b) continue;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 2, 0, 7);
      if (key === selected) { ctx.lineWidth = 5; ctx.strokeStyle = halo; ctx.stroke(); ctx.lineWidth = 2.4; ctx.strokeStyle = accent; ctx.stroke(); }
      else { ctx.lineWidth = 1.8; ctx.strokeStyle = ink; ctx.stroke(); }
    }

    // rótulos (os mais votados primeiro; os que sobrepõem outros são omitidos)
    ctx.font = `600 ${small ? 11 : 12.5}px Geist, system-ui, sans-serif`; ctx.textBaseline = 'middle';
    const order = [...bubbles.current].sort((a, b) => (b.key === selected) - (a.key === selected) || (b.key === hover) - (a.key === hover) || b.v - a.v || b.r - a.r);
    const boxes = [];
    for (const b of order) {
      const label = titleCase(b.name);
      const tw = ctx.measureText(label).width; let tx = b.x + b.r + 4; if (tx + tw > size.w - 4) tx = b.x - b.r - 4 - tw;
      const box = [tx - 3, b.y - 9, tx + tw + 3, b.y + 9];
      const forced = b.key === selected || b.key === hover;
      if (!forced && boxes.some(o => !(box[2] < o[0] || box[0] > o[2] || box[3] < o[1] || box[1] > o[3]))) continue;
      boxes.push(box);
      ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.strokeStyle = paper; ctx.strokeText(label, tx, b.y); ctx.fillStyle = b.key === selected ? accent : ink; ctx.fillText(label, tx, b.y);
    }
  }

  const local = e => { const r = cv.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const pick = (x, y) => {
    let best = null, bd = Infinity;
    for (const b of bubbles.current) { const d = Math.hypot(b.x - x, b.y - y) - b.r; if (d < Math.max(8, 0) && d < bd) { bd = d; best = b.key; } }
    return best;
  };
  const zoomAt = (f, cx, cy) => {
    const t = tf.current; const z = Math.max(1, Math.min(10, t.z * f)); f = z / t.z;
    t.ox = cx - (cx - t.ox) * f; t.oy = cy - (cy - t.oy) * f; t.z = z; t.s = t.s0 * z;
    if (z === 1) fit(); clamp(); force(x => x + 1);
  };
  const clamp = () => {
    const t = tf.current; const w = (BB[2] - BB[0]) * t.s, h = (BB[3] - BB[1]) * t.s;
    t.ox = Math.min(size.w * 0.6, Math.max(size.w * 0.4 - w, t.ox)); t.oy = Math.min(size.h * 0.6, Math.max(size.h * 0.4 - h, t.oy));
  };
  const onDown = e => {
    cv.current.setPointerCapture && cv.current.setPointerCapture(e.pointerId);
    ptrs.current.set(e.pointerId, local(e));
    if (ptrs.current.size === 1) gesture.current = { start: local(e), moved: false, last: local(e) };
    else if (ptrs.current.size === 2) { const [a, b] = [...ptrs.current.values()]; gesture.current = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]), moved: true }; }
  };
  const onMove = e => {
    const p = local(e);
    if (!ptrs.current.has(e.pointerId)) { if (e.pointerType === 'mouse') { const id = pick(...p); if (id !== props.current.hover) onHover(id); } return; }
    ptrs.current.set(e.pointerId, p); const g = gesture.current; if (!g) return;
    if (ptrs.current.size === 2 && g.pinch) {
      const [a, b] = [...ptrs.current.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      zoomAt(d / g.pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); g.pinch = d; return;
    }
    if (!g.moved && Math.hypot(p[0] - g.start[0], p[1] - g.start[1]) > 6) g.moved = true;
    if (g.moved && tf.current.z > 1) { const t = tf.current; t.ox += p[0] - g.last[0]; t.oy += p[1] - g.last[1]; clamp(); force(x => x + 1); }
    g.last = p;
  };
  const onUp = e => {
    const g = gesture.current; const had = ptrs.current.has(e.pointerId); ptrs.current.delete(e.pointerId);
    if (had && g && !g.moved && ptrs.current.size === 0) { const id = pick(...local(e)); onSelect(id && id === props.current.selected ? null : id); }
    if (ptrs.current.size === 0) gesture.current = null;
  };
  const onWheel = e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.01), ...local(e)); };
  useEffect(() => { const c = cv.current; c.addEventListener('wheel', onWheel, { passive: false }); return () => c.removeEventListener('wheel', onWheel); });

  const zoomed = tf.current.z > 1.001;
  return html`<div class="map" ref=${wrap}>
    <canvas ref=${cv} style=${`width:${size.w}px;height:${size.h}px;touch-action:${zoomed ? 'none' : 'pan-y'}`}
      role="img" aria-label=${view ? `Mapa de votos de ${titleCase(view.nome)} por bairro de ${CIDADE}` : `Mapa dos bairros de ${CIDADE}`}
      onPointerDown=${onDown} onPointerMove=${onMove} onPointerUp=${onUp} onPointerCancel=${onUp}
      onPointerLeave=${e => { if (e.pointerType === 'mouse') onHover(null); }}
      onDblClick=${e => zoomAt(2, ...local(e))}></canvas>
    <div class="zoom" role="group" aria-label="Zoom do mapa">
      <button type="button" aria-label="Aproximar" onClick=${() => zoomAt(1.6, size.w / 2, size.h / 2)}>+</button>
      <button type="button" aria-label="Afastar" onClick=${() => zoomAt(1 / 1.6, size.w / 2, size.h / 2)}>−</button>
      ${zoomed && html`<button type="button" class="wide" onClick=${() => { fit(); force(x => x + 1); }}>Ver cidade</button>`}
    </div>
  </div>`;
}

// ---------- Componentes ----------
function Legend({ classes, metric, setMetric, view }) {
  const n = classes ? classes.b.length + 1 : 0;
  const fmt = v => metric === 'votos' ? nf.format(v) : pct(v, 1);
  const items = [];
  if (view && n) for (let i = 0; i < n; i++) {
    const lo = i === 0 ? classes.min : classes.b[i - 1];
    const hi = i === n - 1 ? classes.max : (metric === 'votos' ? classes.b[i] - 1 : classes.b[i]);
    items.push(html`<li><i style=${`background:var(--r${rampIndex(i, n)})`}></i>${lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`}</li>`);
  }
  return html`<div class="legend">
    <div class="seg" role="radiogroup" aria-label="Cor dos círculos">
      <button type="button" role="radio" aria-checked=${metric === 'pct'} onClick=${() => setMetric('pct')}>Cor: % no bairro</button>
      <button type="button" role="radio" aria-checked=${metric === 'votos'} onClick=${() => setMetric('votos')}>Cor: votos</button>
    </div>
    ${view && html`<ul>${items}<li><i style="background:var(--zero)"></i>Sem votos</li></ul>`}
    ${view && html`<p class="hint">O tamanho do círculo é proporcional aos votos do candidato no bairro.</p>`}
  </div>`;
}

function BairroCard({ view, b, pinned, onClear }) {
  if (!view || !b) return html`<p class="hint">${view ? 'Toque ou clique num bairro para ver os números e as escolas.' : ''}</p>`;
  const max = Math.max(1, ...b.locais.map(l => l.v));
  return html`<div class=${'muni' + (pinned ? ' pinned' : '')} aria-live="polite">
    <div class="muni-head"><h3>${titleCase(b.name)}</h3>${pinned && html`<button type="button" class="link" onClick=${onClear}>Fechar</button>`}</div>
    <dl>
      <div><dt>Votos</dt><dd>${nf.format(b.v)}</dd></div>
      <div><dt>Dos votos nominais do bairro</dt><dd>${b.t ? pct(b.p) : '—'}</dd></div>
      <div><dt>Posição no bairro</dt><dd>${b.rank ? `${b.rank}º` : '—'}</dd></div>
    </dl>
    <ul class="locais" aria-label="Votos por local de votação">
      ${b.locais.map(l => html`<li><span class="ln">${localNome(l.nome)}</span><span class="lv">${nf.format(l.v)}</span>
        <span class="bar" aria-hidden="true"><i style=${`width:${(l.v / max * 100).toFixed(1)}%`}></i></span></li>`)}
    </ul>
    <p class="hint">${nf.format(b.eleitores)} eleitores aptos nos locais deste bairro.</p>
  </div>`;
}

function CandidatePicker({ cands, value, onPick }) {
  const [q, setQ] = useState(''); const [open, setOpen] = useState(false);
  const list = useMemo(() => {
    const nq = NORM(q);
    const r = nq ? cands.filter(c => NORM(c.nome + ' ' + c.nr + ' ' + c.partido).includes(nq)) : cands;
    return r.slice(0, 40);
  }, [q, cands]);
  const cur = cands.find(c => c.key === value);
  return html`<div class="picker">
    <label for="cand">Candidato</label>
    <input id="cand" type="search" autocomplete="off" placeholder=${cur ? `${titleCase(cur.nome)} (${cur.nr})` : 'Nome, número ou partido'}
      value=${q} onInput=${e => { setQ(e.target.value); setOpen(true); }} onFocus=${() => setOpen(true)}
      onKeyDown=${e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter' && list[0]) { onPick(list[0].key); setQ(''); setOpen(false); e.target.blur(); } }} />
    ${open && html`<ul class="results" role="listbox">
      ${list.map(c => html`<li role="option" aria-selected=${c.key === value}>
        <button type="button" onMouseDown=${e => e.preventDefault()} onClick=${() => { onPick(c.key); setQ(''); setOpen(false); document.activeElement && document.activeElement.blur(); }}>
          <span class="n">${titleCase(c.nome)}</span><span class="meta">${c.nr}${c.partido ? ' · ' + c.partido : ''}</span><span class="v">${nf.format(c.total)}</span>
        </button></li>`)}
      ${!list.length && html`<li class="empty">Nenhum candidato com “${q}”.</li>`}
    </ul>`}
    ${open && html`<button type="button" class="link close-list" onClick=${() => setOpen(false)}>Fechar lista</button>`}
  </div>`;
}

function Ranking({ view, metric, selected, onSelect }) {
  const [sort, setSort] = useState('votos');
  useEffect(() => setSort(metric), [metric]);
  const rows = useMemo(() => {
    if (!view) return [];
    const r = view.bairros.map(b => ({ ...b }));
    if (sort === 'votos') r.sort((a, b) => b.v - a.v || a.name.localeCompare(b.name)); else if (sort === 'pct') r.sort((a, b) => b.p - a.p || b.v - a.v); else r.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    r.forEach((x, i) => x.pos = i + 1);
    return r;
  }, [view, sort]);
  if (!view) return null;
  const max = Math.max(1e-9, ...rows.map(x => sort === 'pct' ? x.p : x.v));
  return html`<section class="ranking" aria-labelledby="rk">
    <div class="rk-head">
      <h2 id="rk">Bairros</h2>
      <select aria-label="Ordenar bairros" value=${sort} onChange=${e => setSort(e.target.value)}>
        <option value="votos">Mais votos</option><option value="pct">Maior percentual</option><option value="nome">Nome</option>
      </select>
    </div>
    <ol>
      ${rows.map(x => html`<li key=${x.key} class=${x.key === selected ? 'on' : ''}>
        <button type="button" onClick=${() => onSelect(x.key)}>
          <span class="pos">${sort === 'nome' ? '' : x.pos}</span>
          <span class="nm">${titleCase(x.name)}</span>
          <span class="vv">${nf.format(x.v)}</span>
          <span class="pp">${x.v ? pct(x.p) : '—'}</span>
          <span class="bar" aria-hidden="true"><i style=${`width:${((sort === 'pct' ? x.p : x.v) / max * 100).toFixed(1)}%`}></i></span>
        </button></li>`)}
    </ol>
  </section>`;
}

function Stats({ view, semBairros }) {
  if (!view) return null;
  if (semBairros) return html`<dl class="stats"><div><dt>Votos em ${CIDADE}</dt><dd>${nf.format(view.total)}</dd></div></dl>`;
  const com = view.bairros.filter(b => b.v > 0);
  const top = [...com].sort((a, b) => b.v - a.v)[0];
  return html`<dl class="stats">
    <div><dt>Votos em ${CIDADE}</dt><dd>${nf.format(view.total)}</dd></div>
    <div><dt>Dos votos nominais para ${sentence(view.cargoNome).toLowerCase()}</dt><dd>${view.totCidade ? pct(view.total / view.totCidade) : '—'}</dd></div>
    <div><dt>Bairros com voto</dt><dd>${com.length} de ${view.bairros.length}</dd></div>
    <div><dt>Votos no maior reduto${top ? ` (${titleCase(top.name)})` : ''}</dt><dd>${top && view.total ? pct(top.v / view.total, 1) : '—'}</dd></div>
  </dl>`;
}

function Fonte({ item }) {
  if (!item) return null;
  const quando = item.atualizadoEm && item.fonte === 'api' ? new Date(item.atualizadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
  return html`<section class="source compact">
    <p>${item.fonte === 'api'
      ? html`<strong>API de resultados do TSE</strong> · ${item.final ? 'apuração concluída' : 'apuração em andamento'}${quando ? ` · atualizado em ${quando}` : ''}`
      : html`<strong>Dados Abertos do TSE</strong> · votação por seção eleitoral${item.fonte === 'csv+api' ? ' · completado com a API de resultados' : ''} · ${item.final ? 'resultado final' : 'resultado parcial'}`}</p>
  </section>`;
}

const rotuloEleicao = e => `${e.ano} · ${e.turno}º turno${e.final ? '' : ' (parcial)'}`;

// ---------- App ----------
function App() {
  const [indice, setIndice] = useState(null), [erro, setErro] = useState('');
  const [eleicao, setEleicao] = useState(null), [cargo, setCargo] = useState(null), [candKey, setCandKey] = useState(null);
  const [ds, setDs] = useState(null), [carregando, setCarregando] = useState(false);
  const [metric, setMetric] = useState(ls.get('mvb.metric') || 'pct');
  const [selected, setSelected] = useState(null), [hover, setHover] = useState(null);
  const mapRef = useRef();

  // lista as eleições sozinho, a partir do índice gerado junto com os dados (commitado)
  useEffect(() => {
    (async () => {
      const ler = async base => {
        try {
          const r = await fetch(base + '/index.json', { cache: 'no-cache' });
          if (!r.ok) return [];
          return ((await r.json()).eleicoes || []).map(e => ({ ...e, base, id: e.ano + '|' + e.turno }));
        } catch (e) { return []; }
      };
      const lista = (await ler('data/eleicoes')).sort((x, y) => (y.ano - x.ano) || (x.turno - y.turno));
      if (!lista.length) { setErro('Nenhuma eleição disponível ainda.'); return; }
      setIndice(lista);
      const last = ls.get('mvb.eleicao');
      setEleicao(last && lista.some(e => e.id === last) ? last : lista[0].id);
    })();
  }, []);

  const item = indice && indice.find(e => e.id === eleicao);
  // carrega os votos da eleição escolhida e a tabela de locais de votação do ano
  useEffect(() => {
    if (!item) return;
    let vivo = true; setCarregando(true); setDs(null); setErro('');
    (async () => {
      try {
        const ler = async u => { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u); return r.json(); };
        const [d, t] = await Promise.all([ler(`${item.base}/${item.arquivo}`), TABELAS[item.ano] ? null : ler(`data/secoes-${item.ano}.json`).catch(() => null)]);
        if (t) TABELAS[item.ano] = t;
        if (vivo) { setDs(d); setCarregando(false); }
      } catch (e) { if (vivo) { setErro('Não foi possível carregar os dados desta eleição.'); setCarregando(false); } }
    })();
    return () => { vivo = false; };
  }, [item && item.base + item.arquivo]);

  const cargos = useMemo(() => {
    if (!ds) return [];
    const m = new Map(); ds.cands.forEach(c => m.set(c.cargo, c.cargoNome));
    return [...m].sort((a, b) => (CARGO_ORDER[a[0]] ?? 99) - (CARGO_ORDER[b[0]] ?? 99));
  }, [ds]);
  useEffect(() => {
    if (!cargos.length) return;
    const last = ls.get('mvb.cargo');
    setCargo(c => cargos.some(x => x[0] === c) ? c : (cargos.some(x => x[0] === last) ? last : cargos[0][0]));
  }, [cargos]);
  const cands = useMemo(() => ds && cargo
    ? ds.cands.filter(c => c.cargo === cargo).map(c => ({ ...c, partido: c.partido || partidoDe(ds, c.ano, c.nr) })).sort((a, b) => b.total - a.total) : [], [ds, cargo]);
  useEffect(() => { setCandKey(k => cands.some(c => c.key === k) ? k : null); }, [cands]);
  const view = useMemo(() => {
    const c = ds && cands.find(x => x.key === candKey);
    return c ? buildView(ds, c) : null;
  }, [ds, cands, candKey]);
  useEffect(() => { ls.set('mvb.metric', metric); }, [metric]);
  useEffect(() => { if (eleicao) ls.set('mvb.eleicao', eleicao); }, [eleicao]);
  useEffect(() => { if (cargo) ls.set('mvb.cargo', cargo); }, [cargo]);

  const classes = useMemo(() => view ? quantBreaks(view.bairros.map(b => metricOf(b, metric))) : null, [view, metric]);
  const selectFromList = key => { setSelected(key); if (window.innerWidth < 960 && mapRef.current) mapRef.current.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); };
  const shownKey = hover || selected;
  const shown = view && view.bairros.find(b => b.key === shownKey);
  const hasData = !!ds;
  const semBairros = !!(ds && ds.semBairros);

  return html`<div class=${'app' + (hasData ? '' : ' nodata')}>
    <header class="top">
      <p class="brand">Mapa do voto <span>${CIDADE}</span></p>
    </header>

    ${indice && html`<section class="filters" aria-label="Filtros">
      <label class="field">Eleição
        <select value=${eleicao} onChange=${e => { setEleicao(e.target.value); setSelected(null); setCandKey(null); }}>
          ${indice.map(e => html`<option value=${e.id}>${rotuloEleicao(e)}</option>`)}
        </select></label>
      ${hasData && html`<div class="chips" role="radiogroup" aria-label="Cargo">
        ${cargos.map(([cd, nm]) => html`<button type="button" role="radio" aria-checked=${cd === cargo} onClick=${() => { setCargo(cd); setSelected(null); }}>${sentence(nm)}</button>`)}
      </div>
      <${CandidatePicker} cands=${cands} value=${candKey} onPick=${k => { setCandKey(k); setSelected(null); }} />`}
    </section>`}

    <section class="stage" ref=${mapRef}>
      ${view ? html`<div class="who">
          <h1>${titleCase(view.nome)}</h1>
          <p>${view.nr}${view.partido ? ' · ' + view.partido : ''} · ${sentence(view.cargoNome)} · ${view.ano}${view.turno !== '1' ? ` (${view.turno}º turno)` : ''}</p>
          <p class="sub">${view.posicao}º mais votado em ${CIDADE} entre ${view.nCands} candidatos${view.sit ? ' · ' + sentence(view.sit) : ''}</p>
        </div>`
      : html`<div class="who empty"><h1>${hasData ? 'Escolha um candidato' : 'Votos por bairro'}</h1>
          <p>${erro ? erro : carregando || !indice ? 'Carregando os resultados…' : hasData ? 'Busque pelo nome, número ou partido.' : `Veja em quais bairros de ${CIDADE} cada candidato foi votado.`}</p></div>`}
      ${semBairros && html`<p class="aviso" role="note">O TSE ainda não publicou o arquivo por seção desta eleição, então os votos por bairro não estão disponíveis. Por enquanto só aparece o total de ${CIDADE}.</p>`}
      <${MapCanvas} ano=${item ? item.ano : '2024'} view=${view} metric=${metric} selected=${selected} onSelect=${setSelected} hover=${hover} onHover=${setHover} classes=${classes} />
      ${view && !semBairros && html`<${Legend} classes=${classes} metric=${metric} setMetric=${setMetric} view=${view} />`}
      ${!semBairros && html`<${BairroCard} view=${view} b=${shown} pinned=${!hover && !!selected} onClear=${() => setSelected(null)} />`}
    </section>

    <aside class="side">
      <${Stats} view=${view} semBairros=${semBairros} />
      ${!semBairros && html`<${Ranking} view=${view} metric=${metric} selected=${selected} onSelect=${selectFromList} />`}
      <${Fonte} item=${item} />
      <p class="credits">Os votos de cada seção são somados no bairro do local de votação, segundo o cadastro do TSE. Isso mostra onde o voto foi depositado, não onde o eleitor mora. Fontes: TSE, API de resultados (ciclo atual) e Portal de Dados Abertos (votação por seção e eleitorado por local de votação); contorno municipal do IBGE.</p>
    </aside>
  </div>`;
}
render(html`<${App} />`, document.getElementById('root'));

}
