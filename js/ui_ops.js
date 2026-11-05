'use strict';
// ================= Operations tab (BETA) =================
function fanMeterHtml(v, big) {
  const [lbl, cls] = fanMood(v);
  const col = v >= 65 ? 'var(--good)' : v >= 45 ? '#8fb3ff' : v >= 30 ? 'var(--acc)' : 'var(--bad)';
  return `<div class="fanmeter ${big ? 'big' : ''}"><div class="fm-bar"><i style="width:${Math.round(v)}%;background:${col}"></i></div><span class="px ${cls}">${Math.round(v)} · ${lbl}</span></div>`;
}
function vOps() {
  const O = G.ops; if (!O) return panel('OPERATIONS', '<p class="dim">Not available.</p>');
  const fp = fairPrices(G), S = O.season;
  let h = `<div class="beta-note">β BETA: stadium operations are new and still being balanced. Operations money is separate from the salary cap.</div>`;
  if (O.event) h += `<div class="warn">⚠ <b>${esc(O.event.title)}</b> needs your response. <button class="btn tiny" data-act="opsEvent">RESPOND</button></div>`;
  h += `<div class="grid2">`;
  // fans
  const recent = O.fanLog.slice(0, 8);
  h += panel('FAN HAPPINESS', fanMeterHtml(O.fans, true) +
    `<p class="dim small">Driven by winning, prices, the stadium experience and how you handle events. Happy fans buy more tickets, food and jerseys, and make your home crowd louder (crowd boost ×${crowdFactor(G).toFixed(2)}).</p>` +
    (recent.length ? `<table class="tbl">${recent.map(e => `<tr><td class="dim small">${e.w ? 'Wk ' + e.w : e.y}</td><td class="${e.d > 0 ? 'good' : 'bad'} r">${e.d > 0 ? '+' : ''}${e.d}</td><td class="small">${esc(e.why)}</td></tr>`).join('')}</table>` : '<p class="dim">No changes yet.</p>'));
  // money
  const rev = Object.values(S.rev).reduce((a, b) => a + b, 0), exp = Object.values(S.exp).reduce((a, b) => a + b, 0);
  const row = (l, v, neg) => `<tr><td>${l}</td><td class="r ${neg ? 'bad' : ''}">${neg ? '-' : ''}${fmtM(v)}</td></tr>`;
  const lh = O.lastHome;
  h += panel(`FINANCES · CASH <span class="${O.cash < 0 ? 'bad' : 'good'}">${fmtM(O.cash)}</span>`,
    `<div class="grid2"><table class="tbl"><tr><th>${G.year} REVENUE</th><th></th></tr>${row('Season tickets', S.rev.season)}${row('Game tickets', S.rev.tickets)}${row('Concessions', S.rev.food)}${row('Parking', S.rev.parking)}${row('Merchandise', S.rev.merch)}${S.rev.other ? row('Other', S.rev.other) : ''}<tr><td><b>Total</b></td><td class="r"><b>${fmtM(rev)}</b></td></tr></table>
    <table class="tbl"><tr><th>EXPENSES</th><th></th></tr>${row('Maintenance', S.exp.maint, 1)}${row('Upgrades', S.exp.upgrades, 1)}${row('Game-day staff', S.exp.gameday, 1)}${row('Food & jersey costs', S.exp.goods, 1)}${row('Events', S.exp.events, 1)}<tr><td><b>Profit</b></td><td class="r ${rev - exp >= 0 ? 'good' : 'bad'}"><b>${fmtM(rev - exp)}</b></td></tr></table></div>` +
    `<p class="small">Season ticket holders: <b>${O.sth.toLocaleString()}</b> · Capacity ${opsCapacity(G).toLocaleString()}${S.games ? ` · Avg attendance ${Math.round(S.att / S.games).toLocaleString()}` : ''}</p>` +
    (lh ? `<p class="small dim">Last home game (${lh.playoff ? 'playoffs' : 'week ' + lh.w} vs ${TM(lh.opp).abbr}): ${lh.att.toLocaleString()} fans (${Math.round(lh.att / lh.cap * 100)}%) · tickets ${fmtM(lh.tick)} · food ${fmtM(lh.food)} · parking ${fmtM(lh.park)}</p>` : ''));
  h += `</div>`;
  // pricing
  const gate = projectedGate(G);
  const pr = (k, label, unit, note) => {
    const idx = O.prices[k] / fp[k]; const [l, c] = priceLabel(idx);
    return `<tr><td><b>${label}</b><div class="dim small">${note}</div></td><td>$<input class="price-in" type="number" data-change="opsPrice" data-k="${k}" value="${O.prices[k]}" min="1"> <span class="dim small">${unit}</span></td><td class="dim small">fair ~$${fp[k]}</td><td class="${c} px small">${l}</td></tr>`;
  };
  h += panel('PRICING', `<table class="tbl">${pr('season', 'Season tickets', 'per seat / season', G.phase === 'regular' || G.phase === 'playoffs' ? 'Applies when next season starts' : `Projected: ${projectedSTH(G).toLocaleString()} sold`)}
    ${pr('ticket', 'Single-game tickets', 'each', `Projected crowd ${Math.round(gate.att / gate.cap * 100)}% (${gate.att.toLocaleString()})`)}
    ${pr('food', 'Concessions', 'avg item', 'Higher prices = fewer sales and grumpier fans')}
    ${pr('jersey', 'Jerseys', 'each', `Demand ~${jerseyDemand(G).reduce((a, d) => a + d.demand, 0).toLocaleString()} / week`)}</table>
    <p class="dim small">Fair prices rise with fan happiness and your record. Pricing above fair brings in more per fan but fewer fans, and wears down happiness every home game.</p>`);
  // stadium
  const cards = FACILITIES.map(([k]) => {
    const f = O.stadium[k], F = FAC[k], c = upgradeCost(G, k);
    const cc = f.cond >= 70 ? 'o-great' : f.cond >= 50 ? 'o-good' : f.cond >= 35 ? 'o-avg' : 'o-bad';
    return `<div class="fac"><div class="px small">${F.name} <span class="gold">LV ${f.lvl}/5</span></div><div class="dim small">${F.blurb}</div>
      <div class="rbar"><span>COND</span><div class="bar"><i class="${cc}" style="width:${Math.round(f.cond)}%"></i></div><b>${Math.round(f.cond)}</b></div>
      <div class="small">Upkeep <select data-change="opsMaint" data-k="${k}">${MAINT_LEVELS.map((m, i) => `<option value="${i}" ${f.maint === i ? 'selected' : ''}>${m}${i ? ' $' + Math.round(MAINT_COST[i] * 1000) + 'K/wk' : ''}</option>`).join('')}</select>
      ${c === null ? '<span class="good small">MAXED</span>' : `<button class="btn tiny ${O.cash >= c ? '' : 'alt'}" data-act="opsUpgrade" data-k="${k}" ${O.cash >= c ? '' : 'disabled'}>UPGRADE ${fmtM(c)}</button>`}</div></div>`;
  }).join('');
  h += panel(`STADIUM <span class="dim small">avg condition ${Math.round(avgCond(G))} · upkeep ${fmtM(maintPerWeek(G))}/week</span>`, `<p class="dim small">Facilities wear down with every home game. Upkeep slows it (PREMIUM slowly repairs). Upgrades restore condition to 100 and add a level. Run-down facilities make embarrassing events more likely.</p><div class="facs">${cards}</div>`);
  // jerseys
  const J = O.jersey, plan = jerseyPlan(G);
  h += panel(`JERSEY SALES <span class="dim small">production ${jerseyCapacity(G).toLocaleString()}/week</span>`,
    `<div class="pact"><button class="chip ${J.auto ? 'on' : ''}" data-act="opsJAuto" data-v="1">AUTO (FOLLOW DEMAND)</button><button class="chip ${J.auto ? '' : 'on'}" data-act="opsJAuto" data-v="0">MANUAL ALLOCATION</button></div>
    <p class="dim small">Each week the team store produces jerseys and splits production across your most popular players. Sold-out players lose sales, overstocked ones tie up money, and stock of players who leave goes to the clearance rack at 25%.</p>
    <div class="scroll"><table class="tbl"><tr><th>PLAYER</th><th>POP</th><th>DEMAND/WK</th><th>MAKING/WK</th><th>IN STOCK</th><th>SOLD (SEASON)</th><th>ALLOCATION</th></tr>${plan.map(r => {
      const st = J.stock[r.p.id] || 0; const flag = st < r.demand * 0.5 && ['regular', 'playoffs'].includes(G.phase) ? '<span class="bad small"> LOW</span>' : st > r.demand * 6 ? '<span class="gold small"> HIGH</span>' : '';
      return `<tr><td>${r.p.pos} ${pLink(r.p)}</td><td>${r.pop}</td><td>${r.demand.toLocaleString()}</td><td>${r.make.toLocaleString()}</td><td>${st.toLocaleString()}${flag}</td><td>${(J.sold[r.p.id] || 0).toLocaleString()}</td>
      <td>${J.auto ? '<span class="dim small">auto</span>' : `<select data-change="opsJAlloc" data-id="${r.p.id}">${[0, 1, 2, 3, 4, 5].map(n => `<option ${r.weight === n ? 'selected' : ''}>${n}</option>`).join('')}</select>`}</td></tr>`;
    }).join('')}</table></div>`);
  // events + history
  h += `<div class="grid2">`;
  h += panel('EVENT LOG', O.eventLog.length ? `<table class="tbl">${O.eventLog.slice(0, 12).map(e => `<tr><td class="dim small">${e.y}${e.w ? ' wk ' + e.w : ''}</td><td><b>${esc(e.title)}</b><div class="small">${esc(e.choice)}</div><div class="dim small">${esc(e.fx)}${e.extra ? ' · ' + esc(e.extra) : ''}</div></td></tr>`).join('')}</table>` : '<p class="dim">Nothing has happened yet. Something will.</p>');
  h += panel('PAST SEASONS', O.hist.length ? `<table class="tbl"><tr><th>YEAR</th><th>FANS</th><th>AVG CROWD</th><th>REVENUE</th><th>PROFIT</th></tr>${O.hist.slice().reverse().map(x => { const r = Object.values(x.rev).reduce((a, b) => a + b, 0), e = Object.values(x.exp).reduce((a, b) => a + b, 0); return `<tr><td>${x.year}</td><td>${x.fans}</td><td>${x.att.toLocaleString()}</td><td>${fmtM(r)}</td><td class="${r - e >= 0 ? 'good' : 'bad'}">${fmtM(r - e)}</td></tr>`; }).join('')}</table>` : '<p class="dim">Your first season is underway.</p>');
  h += `</div>`;
  return h;
}

function opsEventModal() {
  const ev = G.ops && G.ops.event; if (!ev) return;
  const e = OPS_EVENTS.find(x => x.id === ev.id);
  const p = ev.ctx && ev.ctx.pid !== undefined ? G.players[ev.ctx.pid] : null;
  openModal(`<h3 class="px">⚠ ${esc(ev.title.toUpperCase())}</h3>
    <p>${esc(ev.text)}</p>${p ? `<p class="small dim">${p.pos} ${pLink(p)} · ${ovrB(p.ovr)} · popularity ${playerPopularity(G, p)}</p>` : ''}
    <div class="small">FAN HAPPINESS ${fanMeterHtml(G.ops.fans)}</div><p class="small">Operations cash: <b>${fmtM(G.ops.cash)}</b></p>
    <div class="ev-choices">${e.choices.map((c, i) => { const fx = eventChoiceFx(G, ev, i); return `<button class="btn ev-choice" data-act="opsChoose" data-v="${i}"><b>${esc(c.label)}</b><span class="small">${esc(fxSummary(G, fx, ev) || 'no immediate effect')}${c.risk ? ' · risky' : ''}</span></button>`; }).join('')}</div>
    <p class="dim small">You have to respond before the season can continue.</p>`);
}
function showNewOpsEvent() {
  if (!G || !G.ops || !G.ops.newEvent) return;
  G.ops.newEvent = 0;
  if (G.ops.event && $('#modal').classList.contains('hidden')) opsEventModal();
  else render();
}
function onOpsClick(act, el) {
  switch (act) {
    case 'opsEvent': opsEventModal(); return true;
    case 'opsChoose': {
      const r = opsRespond(G, +el.dataset.v); persist(); closeModal(); render();
      if (r) toast(`${r.choice}: ${r.fx || 'done'}.${r.extra ? ' ' + r.extra : ''}`);
      return true;
    }
    case 'opsUpgrade': { const err = opsUpgrade(G, el.dataset.k); if (err) toast(err); else { persist(); toast('Upgrade complete!'); } render(); return true; }
    case 'opsJAuto': G.ops.jersey.auto = el.dataset.v === '1'; if (!G.ops.jersey.auto) for (const r of jerseyDemand(G)) if (G.ops.jersey.alloc[r.p.id] === undefined) G.ops.jersey.alloc[r.p.id] = clamp(Math.round(r.demand / Math.max(1, jerseyCapacity(G)) * 12), 0, 5); persist(); render(); return true;
  }
  return false;
}
function onOpsChange(k, el) {
  switch (k) {
    case 'opsPrice': opsSetPrice(G, el.dataset.k, +el.value); persist(); render(); return true;
    case 'opsMaint': G.ops.stadium[el.dataset.k].maint = +el.value; persist(); render(); return true;
    case 'opsJAlloc': G.ops.jersey.alloc[+el.dataset.id] = +el.value; persist(); render(); return true;
  }
  return false;
}
