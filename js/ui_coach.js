'use strict';
// ================= Coaches tab (BETA) =================
function coachLink(c) { return c ? `<a class="plink" data-act="coach" data-id="${c.id}">${esc(coachName(c))}</a>` : '<span class="dim">Vacant</span>'; }
function quirkChips(c) {
  const ks = Object.keys(c.quirks || {});
  if (!ks.length) return '<span class="dim small">No notable quirks</span>';
  return ks.map(k => `<span class="quirk ${QUIRKS[k].neg ? 'neg' : 'pos'}" title="${esc(QUIRKS[k].blurb)}">${esc(QUIRKS[k].name)} ${'★'.repeat(c.quirks[k])}</span>`).join(' ');
}
function coachBars(c) {
  return COACH_RATINGS.map(([k, n]) => `<div class="abar"><span>${n}</span><div class="bar"><i class="${ovrCls(c[k])}" style="width:${c[k]}%"></i></div><b>${c[k]}</b></div>`).join('');
}
function coachStyleLine(c, role) {
  if (role === 'OC') return `<b>${esc(c.offStyle)}</b> <span class="dim small">${esc(OFF_STYLES[c.offStyle].blurb)}</span>`;
  if (role === 'DC') return `<b>${esc(c.defStyle)}</b> <span class="dim small">${esc(DEF_STYLES[c.defStyle].blurb)}</span>`;
  return `<span class="dim small">${c.side === 'off' ? 'Offensive' : 'Defensive'} background · prefers ${esc(c.offStyle)} / ${esc(c.defStyle)}</span>`;
}
function hcRecord(c) { return c.cw + c.cl + c.ct ? `${c.cw}-${c.cl}${c.ct ? '-' + c.ct : ''} as HC` : 'No HC record'; }

function staffCard(role, c) {
  const u = TM(G.userTeam), off = !['regular', 'playoffs'].includes(G.phase);
  if (!c) return `<div class="coach-card vacant"><div class="px small">${ROLE_NAMES[role]}</div><p class="bad">VACANT</p><p class="dim small">Hire from the candidates below. If the season starts with this job open, the team promotes a cheap assistant on a 1-year deal.</p><button class="btn tiny" data-act="coachRole" data-v="${role}">SEE ${role} CANDIDATES</button></div>`;
  const styles = role === 'OC' ? Object.keys(OFF_STYLES) : role === 'DC' ? Object.keys(DEF_STYLES) : null;
  const cur = role === 'OC' ? c.offStyle : c.defStyle;
  return `<div class="coach-card"><div class="coach-top"><img class="pface sm" src="${Faces.portrait(c, u, 2)}" alt="">
    <div><div class="px small gold">${ROLE_NAMES[role]}</div><div class="px">${coachLink(c)}</div><div class="dim small">Age ${c.age} · ${role} OVR <b>${coachOvr(c, role)}</b> · REP ${c.rep} · ${hcRecord(c)}${c.titles ? ` · <span class="gold">🏆×${c.titles}</span>` : ''}</div></div></div>
    <div class="small">${coachStyleLine(c, role)}</div>
    ${styles ? `<div class="small">Scheme <select data-change="coachStyle" data-role="${role}" ${off && !qLvl(c, 'stubborn') ? '' : 'disabled'}>${styles.map(s => `<option ${s === cur ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select> <span class="dim">${off ? (qLvl(c, 'stubborn') ? 'stubborn - won\'t change' : 'offseason: can change') : 'locked during the season'}</span></div>` : ''}
    <div class="coach-bars">${coachBars(c)}</div>
    <div>${quirkChips(c)}</div>
    <div class="small dim">Contract ${fmtM(c.contract ? c.contract.sal : 0)}/yr through ${c.contract ? c.contract.exp : '-'} · buyout ${fmtM(coachBuyout(G, c))}</div>
    <div class="pact"><button class="btn tiny alt" data-act="coachClinic" data-id="${c.id}" ${c.clinic === G.year ? 'disabled' : ''} title="Raises his main ratings 1-3 and may tame a bad quirk. Once per year.">${c.clinic === G.year ? 'CLINIC DONE' : `CLINIC ${fmtM(role === 'HC' ? 1 : 0.5)}`}</button><button class="btn tiny danger" data-act="coachFire" data-v="${role}" ${G.phase === 'playoffs' ? 'disabled' : ''}>FIRE</button></div></div>`;
}

function vCoaches() {
  const u = TM(G.userTeam), S = staffOf(G, u.id);
  let h = `<div class="beta-note">β BETA: coaching staffs are new and still being balanced. Coaching salaries are paid from the operations budget, not the salary cap.</div>`;
  if (G.coachLoss && G.coachLoss.year >= G.year - 1) h += `<div class="beta-note bad-note">Your ${G.coachLoss.role} ${esc(G.coachLoss.name)} left to become head coach of the ${esc(TM(G.coachLoss.to).city)} ${esc(TM(G.coachLoss.to).name)}.</div>`;
  h += panel(`YOUR STAFF <span class="dim small">payroll ${fmtM(staffPayroll(G, u.id))}/yr · ops cash ${fmtM(G.ops ? G.ops.cash : 0)}</span>`,
    `<div class="coach-grid">${COACH_ROLES.map(r => staffCard(r, S[r])).join('')}</div>
    <p class="dim small">OC and DC ratings and schemes shape every play: pass/run mix, deep shots, completion rate, pass rush, coverage and run defense. The head coach adds game management, fourth-down personality, motivation (weekly morale) and, with the coordinators, offseason development for players 27 and under. Ratings grow while coaches are young and successful; good quirks can grow (★) and bad ones can be outgrown.</p>`);
  // candidates
  const role = UI.coachRole || (COACH_ROLES.find(r => !S[r]) || 'OC');
  const pool = G.coachPool.map(id => G.coaches[id]).filter(Boolean).sort((a, b) => coachOvr(b, role) - coachOvr(a, role));
  const vacant = !S[role];
  h += panel(`AVAILABLE COACHES <span class="dim small">${vacant ? `you can hire a ${role}` : `your ${role} job is filled - fire him first to hire`}</span>`,
    `<div class="filters">${COACH_ROLES.map(r => `<button class="chip ${role === r ? 'on' : ''}" data-act="coachRole" data-v="${r}">${r}${!S[r] ? ' (OPEN)' : ''}</button>`).join('')}</div>
    <div class="scroll tall"><table class="tbl"><tr><th>NAME</th><th>AGE</th><th>${role} OVR</th><th>OFF</th><th>DEF</th><th>DEV</th><th>MOT</th><th>GM</th><th>SCHEME</th><th>QUIRKS</th><th>REP</th><th>ASKING</th><th></th></tr>
    ${pool.map(c => `<tr><td>${coachLink(c)}${c.hist.length ? `<div class="dim small">last: ${c.hist[c.hist.length - 1].role} ${c.hist[c.hist.length - 1].abbr} ${c.hist[c.hist.length - 1].y}</div>` : ''}</td><td>${c.age}</td><td>${ovrB(coachOvr(c, role))}</td><td>${c.off}</td><td>${c.def}</td><td>${c.dev}</td><td>${c.mot}</td><td>${c.gm}</td><td class="small">${esc(role === 'DC' ? c.defStyle : role === 'OC' ? c.offStyle : c.side === 'off' ? 'Offense' : 'Defense')}</td><td>${quirkChips(c)}</td><td>${c.rep}</td><td>${fmtM(coachAsk(c, role))}</td><td>${vacant ? `<button class="btn tiny" data-act="coachHire" data-id="${c.id}" data-v="${role}">HIRE</button>` : ''}</td></tr>`).join('')}</table></div>`);
  // carousel
  const C = G.carousel;
  if (C && C.moves.length) {
    const tag = { fired: ['FIRED', 'bad'], promoted: ['PROMOTED', 'good'], poached: ['POACHED', 'bad'], hired: ['HIRED', 'dim'], retired: ['RETIRED', 'dim'], left: ['LEFT', 'dim'] };
    h += panel(`${C.year} COACHING CAROUSEL`, `<table class="tbl">${C.moves.map(m => `<tr class="${m.tids.includes(u.id) ? 'me-row' : ''}"><td><span class="${tag[m.type][1]} px small">${tag[m.type][0]}</span></td><td>${m.tids.map(t => helm(t, 16)).join('')}</td><td>${esc(m.text)}</td></tr>`).join('')}</table>`);
  }
  // league
  h += panel('LEAGUE COACHING STAFFS', `<div class="scroll tall"><table class="tbl"><tr><th>TEAM</th><th>HEAD COACH</th><th>OVR</th><th>CAREER</th><th>OC · SCHEME</th><th>DC · SCHEME</th></tr>${G.teams.map(t => { const s = staffOf(G, t.id); return `<tr class="${t.id === u.id ? 'me-row' : ''}"><td>${teamLink(t.id)}</td><td>${coachLink(s.HC)}</td><td>${s.HC ? ovrB(coachOvr(s.HC, 'HC')) : ''}</td><td class="dim small">${s.HC ? hcRecord(s.HC) : ''}</td><td>${coachLink(s.OC)} <span class="dim small">${s.OC ? esc(s.OC.offStyle) : ''}</span></td><td>${coachLink(s.DC)} <span class="dim small">${s.DC ? esc(s.DC.defStyle) : ''}</span></td></tr>`; }).join('')}</table></div>`);
  return h;
}

function coachModal(cid) {
  const c = G.coaches[cid]; if (!c) return;
  const t = c.tid >= 0 ? TM(c.tid) : null;
  let h = `<div class="pcard" style="--c1:${t ? t.c1 : '#444'}"><img class="pface" src="${Faces.portrait(c, t)}" alt=""><div class="pinfo">
    <div class="px pname">${esc(coachName(c))}</div><div>${t ? `${ROLE_NAMES[c.role]} · ${teamLink(t.id, true)}` : 'Available'}</div>
    <div class="dim">Age ${c.age} · REP ${c.rep} · ${hcRecord(c)}${c.titles ? ` · ${c.titles} Megacup title${c.titles > 1 ? 's' : ''}` : ''}</div>
    <div class="small">${coachStyleLine(c, c.tid >= 0 ? c.role : (c.side === 'off' ? 'OC' : 'DC'))}</div><div>${quirkChips(c)}</div></div></div>
    <div class="grid2"><div>${coachBars(c)}<p class="dim small">Potential ~${c.pot}. HC ${coachOvr(c, 'HC')} · OC ${coachOvr(c, 'OC')} · DC ${coachOvr(c, 'DC')}</p></div>
    <div>${Object.keys(c.quirks).map(k => `<p class="small"><b class="${QUIRKS[k].neg ? 'bad' : 'good'}">${esc(QUIRKS[k].name)} ${'★'.repeat(c.quirks[k])}</b> ${esc(QUIRKS[k].blurb)}</p>`).join('')}</div></div>`;
  if (c.hist.length) h += `<h4 class="px">CAREER</h4><div class="scroll"><table class="tbl"><tr><th>YEAR</th><th>TEAM</th><th>ROLE</th><th>RECORD</th><th>RESULT</th><th>OFF RK</th><th>DEF RK</th></tr>${c.hist.slice().reverse().map(e => `<tr><td>${e.y}</td><td>${esc(e.abbr)}</td><td>${e.role}</td><td>${e.w}-${e.l}${e.t ? '-' + e.t : ''}</td><td class="small">${esc(e.res)}</td><td class="${e.off <= 8 ? 'good' : e.off >= 25 ? 'bad' : 'dim'}">${ordinal(e.off)}</td><td class="${e.def <= 8 ? 'good' : e.def >= 25 ? 'bad' : 'dim'}">${ordinal(e.def)}</td></tr>`).join('')}</table></div>`;
  openModal(h, true);
}

function onCoachClick(act, el) {
  const done = (err, ok) => { if (err) toast(err); else { persist(); render(); if (ok) toast(ok); } return true; };
  switch (act) {
    case 'coach': coachModal(el.dataset.id); return true;
    case 'coachRole': UI.coachRole = el.dataset.v; UI.tab = 'coaches'; closeModal(); render(); return true;
    case 'coachHire': return done(coachHire(G, el.dataset.id, el.dataset.v), 'Coach hired.');
    case 'coachFire': {
      const c = staffOf(G, G.userTeam)[el.dataset.v]; if (!c) return true;
      if (!confirm(`Fire ${el.dataset.v} ${coachName(c)}? Buyout: ${fmtM(coachBuyout(G, c))} from the operations budget.`)) return true;
      UI.coachRole = el.dataset.v;
      return done(coachFire(G, el.dataset.v), `${coachName(c)} was fired.`);
    }
    case 'coachClinic': { const msg = coachClinic(G, el.dataset.id); persist(); render(); toast(msg); return true; }
  }
  return false;
}
function onCoachChange(k, el) {
  if (k !== 'coachStyle') return false;
  const err = coachSetStyle(G, el.dataset.role, el.value);
  if (err) toast(err); persist(); render();
  return true;
}
