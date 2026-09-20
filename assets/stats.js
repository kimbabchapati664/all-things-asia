/* Korean adoption statistics — data + dependency-free SVG charts.
   Sources: e-나라지표 idx_cd=2708, KOSIS DT_11770N001, data.go.kr 15127995,
   Ministry of Health and Welfare Adoption Day press releases. */
(function () {
  const D = {
    years: [2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025],
    dom:   [1770,1694,1564,1641,1461,1332,1388,1306,1314,1462,1548,1125,686,637,683,546,465,378,387,260,226,182,150,154,116],
    intl:  [2436,2365,2287,2258,2101,1899,1264,1250,1125,1013,916,755,236,535,374,334,398,303,317,232,189,142,79,58,24],
    countries: ['United States','Canada','Sweden','Australia','Norway','Italy','Denmark','France','Luxembourg','UK','Germany'],
    country: {
      2017:[274,28,25,24,20,11,6,5,5,0,0], 2018:[188,22,28,14,19,12,7,7,5,0,1],
      2019:[232,23,13,10,12,15,3,5,3,1,0], 2020:[156,19,18,17,7,9,3,2,1,0,0],
      2021:[126,17,14,11,7,7,3,1,3,0,0],   2022:[99,10,9,2,6,4,5,4,3,0,0],
      2023:[48,10,8,3,4,5,0,0,1,0,0],      2024:[41,4,3,5,3,2,0,0,0,0,0]
    },
    // year, domestic boys, domestic girls, overseas boys, overseas girls
    sex: [[2010,479,983,675,338],[2011,482,1066,629,287],[2012,410,715,590,165],[2013,203,483,194,42],
          [2014,223,414,438,97],[2015,222,461,287,87],[2016,191,355,269,65],[2017,150,315,302,96],
          [2018,110,268,221,82],[2019,125,262,233,84],[2020,90,170,192,40],[2021,78,148,133,56],
          [2022,67,115,92,50],[2023,61,89,53,26],[2024,76,78,42,16],[2025,52,64,21,3]],
    ageBands: ['Under 1','1–2','2–3','3–4','4–6','6–12','12+'],
    ageDom:  {2023:[75,48,10,8,8,1,0], 2024:[70,67,5,5,3,4,0], 2025:[33,57,8,3,6,7,2]},
    ageIntl: {2023:[0,64,12,0,3,0,0],  2024:[1,47,8,1,1,0,0],  2025:[0,18,5,1,0,0,0]},
    reasonLabels: ['Born to unmarried parents','Abandoned','Other (incl. protected birth)'],
    reason: {2022:[279,42,3], 2023:[167,54,8], 2024:[172,35,5], 2025:[90,29,21]}
  };
  const PAL = ['#4a3fd4','#0f9d6b','#e08a3c','#2f7fe0','#8b5cf6','#d94f6a','#0f4a31','#77736b','#a6c8f7','#f0e483','#91d8b2'];
  const fmt = n => n.toLocaleString('en-US');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function svgOpen(w, h) { return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;overflow:visible" font-family="Inter,sans-serif">`; }

  function legend(items) {
    return `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;font-size:.82rem;color:var(--ink-2)">` +
      items.map(i => `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:11px;height:11px;border-radius:3px;background:${i.c};display:inline-block"></span>${esc(i.l)}</span>`).join('') + `</div>`;
  }

  /* ---------------- line chart ---------------- */
  function lineChart(el, years, series, opts) {
    opts = opts || {};
    const W = 900, H = 340, L = 54, R = 14, T = 16, B = 34;
    const max = Math.max(...series.flatMap(s => s.v)) * 1.08;
    const x = i => L + (i * (W - L - R)) / (years.length - 1);
    const y = v => H - B - (v / max) * (H - T - B);
    let s = svgOpen(W, H);
    // gridlines
    const ticks = 4;
    for (let t = 0; t <= ticks; t++) {
      const v = (max / ticks) * t, yy = y(v);
      s += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="#e0dacb"/>`;
      s += `<text x="${L - 9}" y="${yy + 4}" text-anchor="end" font-size="11" fill="#77736b">${fmt(Math.round(v))}</text>`;
    }
    years.forEach((yr, i) => {
      if (i % 4 === 0 || i === years.length - 1)
        s += `<text x="${x(i)}" y="${H - B + 18}" text-anchor="middle" font-size="11" fill="#77736b">${yr}</text>`;
    });
    series.forEach((se, si) => {
      const c = se.c || PAL[si];
      const pts = se.v.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      if (opts.area) s += `<polygon points="${L},${y(0)} ${pts} ${x(years.length - 1)},${y(0)}" fill="${c}" opacity=".10"/>`;
      s += `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round"/>`;
      se.v.forEach((v, i) => { s += `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${c}"><title>${years[i]} · ${esc(se.l)}: ${fmt(v)}</title></circle>`; });
    });
    s += '</svg>';
    el.innerHTML = s + legend(series.map((se, si) => ({ l: se.l, c: se.c || PAL[si] })));
  }

  /* ---------------- stacked bars ---------------- */
  function stackedBars(el, cats, keys, rows) {
    // rows: array aligned to cats, each an array aligned to keys
    const W = 900, H = 340, L = 54, R = 14, T = 16, B = 34;
    const totals = rows.map(r => r.reduce((a, b) => a + b, 0));
    const max = Math.max(...totals) * 1.08 || 1;
    const bw = Math.min(56, ((W - L - R) / cats.length) * 0.62);
    const cx = i => L + ((i + 0.5) * (W - L - R)) / cats.length;
    const y = v => H - B - (v / max) * (H - T - B);
    let s = svgOpen(W, H);
    for (let t = 0; t <= 4; t++) {
      const v = (max / 4) * t, yy = y(v);
      s += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="#e0dacb"/>`;
      s += `<text x="${L - 9}" y="${yy + 4}" text-anchor="end" font-size="11" fill="#77736b">${fmt(Math.round(v))}</text>`;
    }
    rows.forEach((r, i) => {
      let acc = 0;
      r.forEach((v, k) => {
        if (v > 0) {
          const y0 = y(acc), y1 = y(acc + v);
          s += `<rect x="${cx(i) - bw / 2}" y="${y1}" width="${bw}" height="${Math.max(0.6, y0 - y1)}" fill="${PAL[k]}"><title>${cats[i]} · ${esc(keys[k])}: ${fmt(v)}</title></rect>`;
          acc += v;
        }
      });
      s += `<text x="${cx(i)}" y="${y(totals[i]) - 7}" text-anchor="middle" font-size="11" fill="#121212" font-weight="600">${fmt(totals[i])}</text>`;
      s += `<text x="${cx(i)}" y="${H - B + 18}" text-anchor="middle" font-size="11" fill="#77736b">${cats[i]}</text>`;
    });
    s += '</svg>';
    el.innerHTML = s + legend(keys.map((k, i) => ({ l: k, c: PAL[i] })));
  }

  function table(el, head, rows) {
    el.innerHTML = `<table class="data"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td>${i === 0 ? esc(c) : (typeof c === 'number' ? fmt(c) : esc(c))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  // ---- 1. trend
  const t1 = document.getElementById('c-trend');
  if (t1) lineChart(t1, D.years, [
    { l: 'Domestic adoption', v: D.dom, c: '#0f9d6b' },
    { l: 'Overseas adoption', v: D.intl, c: '#4a3fd4' }
  ], { area: true });

  // ---- 2. countries (stacked, top countries only)
  const cYears = Object.keys(D.country).map(Number).sort();
  const keep = [0, 1, 2, 3, 4, 5]; // US, Canada, Sweden, Australia, Norway, Italy
  const cKeys = keep.map(i => D.countries[i]).concat(['Other']);
  const cRows = cYears.map(yr => {
    const v = D.country[yr];
    const main = keep.map(i => v[i]);
    const other = v.reduce((a, b) => a + b, 0) - main.reduce((a, b) => a + b, 0);
    return main.concat([other]);
  });
  const c2 = document.getElementById('c-country');
  if (c2) stackedBars(c2, cYears, cKeys, cRows);

  const tc = document.getElementById('t-country');
  if (tc) table(tc, ['Country', ...cYears.map(String)],
    D.countries.map((c, i) => [c, ...cYears.map(yr => D.country[yr][i])])
      .concat([['Total', ...cYears.map(yr => D.country[yr].reduce((a, b) => a + b, 0))]]));

  // ---- 3. sex
  const c3 = document.getElementById('c-sex');
  if (c3) lineChart(c3, D.sex.map(r => r[0]), [
    { l: 'Domestic — girls', v: D.sex.map(r => r[2]), c: '#0f9d6b' },
    { l: 'Domestic — boys', v: D.sex.map(r => r[1]), c: '#7fd3ae' },
    { l: 'Overseas — boys', v: D.sex.map(r => r[3]), c: '#4a3fd4' },
    { l: 'Overseas — girls', v: D.sex.map(r => r[4]), c: '#e08a3c' }
  ]);

  // ---- 4. age table
  const ta = document.getElementById('t-age');
  if (ta) {
    const rows = [];
    [2023, 2024, 2025].forEach(yr => {
      rows.push([`${yr} — domestic`, ...D.ageDom[yr], D.ageDom[yr].reduce((a, b) => a + b, 0)]);
      rows.push([`${yr} — overseas`, ...D.ageIntl[yr], D.ageIntl[yr].reduce((a, b) => a + b, 0)]);
    });
    table(ta, ['Year / type', ...D.ageBands, 'Total'], rows);
  }

  // ---- 5. reason table
  const tr = document.getElementById('t-reason');
  if (tr) {
    const yrs = Object.keys(D.reason).map(Number).sort();
    table(tr, ['Reason', ...yrs.map(String)],
      D.reasonLabels.map((l, i) => [l, ...yrs.map(y => D.reason[y][i])])
        .concat([['Total', ...yrs.map(y => D.reason[y].reduce((a, b) => a + b, 0))]]));
  }
})();
