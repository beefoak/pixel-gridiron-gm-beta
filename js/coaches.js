'use strict';
// ================= Coaching staffs (BETA) =================
// Every team has a head coach (HC), offensive coordinator (OC) and defensive coordinator (DC).
// Coordinators bring a play style; all coaches have ratings and personality quirks that change over a career.
// After each season the coaching carousel fires, retires and hires - and poaches hot coordinators for HC jobs.

const COACH_ROLES = ['HC', 'OC', 'DC'];
const cOrd = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const ROLE_NAMES = { HC: 'HEAD COACH', OC: 'OFFENSIVE COORDINATOR', DC: 'DEFENSIVE COORDINATOR' };
const COACH_RATINGS = [['off', 'OFFENSE'], ['def', 'DEFENSE'], ['dev', 'DEVELOPMENT'], ['mot', 'MOTIVATION'], ['gm', 'GAME MGMT']];
const OFF_STYLES = {
  'AIR RAID': { blurb: 'Throws all over the field: more passes and deep shots, fewer easy completions.', pass: 0.08, deep: 0.05, comp: -0.025, run: -0.1, to: 1.08 },
  'WEST COAST': { blurb: 'Short, timing-based passing: a high completion rate and few deep shots.', pass: 0.06, deep: -0.07, comp: 0.03, run: 0 },
  'GROUND & POUND': { blurb: 'Runs first and often. Wears defenses down and protects the ball.', pass: -0.12, deep: 0, comp: 0.01, run: 0.35, to: 0.9 },
  'SPREAD OPTION': { blurb: 'Spreads the defense out and uses a mobile QB as a runner.', pass: -0.03, deep: 0.02, comp: 0.01, run: 0.15, qbRun: 0.08 },
  'PRO STYLE': { blurb: 'Balanced and multiple. No weaknesses, no extremes.', pass: 0, deep: 0, comp: 0.012, run: 0.1 },
};
const DEF_STYLES = {
  'BLITZ HEAVY': { blurb: 'Sends pressure constantly: more sacks, but gives up big plays.', sack: 1.3, deepAllow: 0.05, comp: 0, runDef: 0, int: 1 },
  'COVER 2': { blurb: 'Two deep safeties take away deep balls and create picks; softer underneath.', sack: 0.95, deepAllow: -0.06, comp: 0.005, runDef: -0.1, int: 1.2 },
  'RUN STUFFER': { blurb: 'Loads the box to stop the run. Vulnerable to good passing teams.', sack: 1, deepAllow: 0.02, comp: 0.012, runDef: 0.35, int: 1 },
  'MAN PRESS': { blurb: 'Aggressive man coverage: tight windows and pass breakups.', sack: 1.05, deepAllow: 0.02, comp: -0.025, runDef: 0, int: 1.05 },
  "BEND DON'T BREAK": { blurb: 'Gives up yards between the 20s, then tightens up in the red zone.', sack: 0.95, deepAllow: -0.03, comp: 0.012, runDef: -0.05, int: 1.05, rz: 0.1 },
};
// Personality quirks have levels 1-3. Good ones can grow with success; bad ones can be outgrown (or coached out at a clinic).
const QUIRKS = {
  gambler: { name: 'Gambler', blurb: 'Goes for it on fourth down far more often.' },
  analytics: { name: 'Analytics Guy', blurb: 'Smarter fourth-down calls.' },
  players: { name: "Players' Coach", blurb: 'Players love him: steady morale boost.' },
  disciplinarian: { name: 'Disciplinarian', blurb: 'Fewer turnovers, a small drain on morale.' },
  qbwhisperer: { name: 'QB Whisperer', blurb: 'Quarterbacks develop faster and play sharper.' },
  teacher: { name: 'Teacher', blurb: 'Young players develop faster.' },
  biggame: { name: 'Big-Game Coach', blurb: 'His teams play better in the playoffs.' },
  clock: { name: 'Clock Manager', blurb: 'Sharp late-game and two-minute football.' },
  bigname: { name: 'Big Name', blurb: 'His reputation grows quickly - other teams notice.' },
  conservative: { name: 'Conservative', neg: true, blurb: 'Punts and kicks whenever he can.' },
  hothead: { name: 'Hothead', neg: true, blurb: 'Blows up at players during losing streaks.' },
  stubborn: { name: 'Stubborn', neg: true, blurb: 'Sticks to his scheme even when it fails, and refuses to change it.' },
};
const QUIRK_CLASH = { gambler: 'conservative', conservative: 'gambler', players: 'hothead', hothead: 'players' };

// ---------- creation ----------
function makeCoach(L, role, q, age) {
  L.nextCid = (L.nextCid || 0) + 1;
  q = q === undefined ? clamp(R.gauss(62, 8), 40, 90) : q;
  age = age === undefined ? R.int(36, 62) : age;
  const side = role === 'OC' ? 'off' : role === 'DC' ? 'def' : R.chance(0.5) ? 'off' : 'def';
  const r = (b) => Math.round(clamp(b + R.gauss(0, 5), 25, 97));
  const c = {
    id: 'c' + L.nextCid, fn: R.pick(FIRST_NAMES), ln: R.pick(LAST_NAMES), age, skin: R.int(0, 4), role, tid: -1, side,
    off: r(side === 'off' ? q + 4 : q - 14), def: r(side === 'def' ? q + 4 : q - 14), dev: r(q - 4), mot: r(q - 2), gm: r(role === 'HC' ? q : q - 8),
    offStyle: R.pick(Object.keys(OFF_STYLES)), defStyle: R.pick(Object.keys(DEF_STYLES)),
    quirks: {}, rep: Math.round(clamp(q - 12 + R.gauss(0, 6), 5, 90)), hist: [], contract: null, clinic: 0, titles: 0, cw: 0, cl: 0, ct: 0,
  };
  c.pot = Math.round(clamp(Math.max(c.off, c.def) + (age < 45 ? R.int(4, 14) : R.int(0, 5)), 50, 99));
  const keys = Object.keys(QUIRKS);
  for (let i = 0, n = R.chance(0.35) ? 2 : 1; i < n; i++) addQuirk(c, R.pick(keys), R.int(1, 2));
  L.coaches[c.id] = c;
  return c;
}
function addQuirk(c, k, lvl) { if (QUIRK_CLASH[k] && c.quirks[QUIRK_CLASH[k]]) return; c.quirks[k] = clamp(lvl, 1, 3); }
function qLvl(c, k) { return c && c.quirks ? c.quirks[k] || 0 : 0; }
function coachOvr(c, role) {
  role = role || c.role;
  if (role === 'OC') return Math.round(c.off * 0.75 + c.dev * 0.15 + c.mot * 0.1);
  if (role === 'DC') return Math.round(c.def * 0.75 + c.dev * 0.15 + c.mot * 0.1);
  return Math.round(Math.max(c.off, c.def) * 0.3 + Math.min(c.off, c.def) * 0.15 + c.dev * 0.15 + c.mot * 0.2 + c.gm * 0.2);
}
function coachAsk(c, role) {
  const o = coachOvr(c, role), base = role === 'HC' ? 1 + Math.max(0, o - 50) * 0.15 : 0.4 + Math.max(0, o - 50) * 0.05;
  return Math.round((base * (1 + c.rep / 400)) * 20) / 20;
}
function coachName(c) { return c ? c.fn + ' ' + c.ln : 'Vacant'; }
function staffOf(L, tid) { const s = L.teams[tid].staff || {}; return { HC: L.coaches[s.HC], OC: L.coaches[s.OC], DC: L.coaches[s.DC] }; }
function assignCoach(L, c, tid, role, yrs) {
  const t = L.teams[tid];
  L.coachPool = L.coachPool.filter(id => id !== c.id);
  c.tid = tid; c.role = role; t.staff[role] = c.id;
  c.contract = { sal: coachAsk(c, role), exp: L.year + (yrs || (role === 'HC' ? 3 : 2)) };
}
function releaseCoach(L, c) {
  if (c.tid >= 0) { const t = L.teams[c.tid]; for (const r of COACH_ROLES) if (t.staff[r] === c.id) t.staff[r] = null; }
  c.tid = -1; c.contract = null;
  if (!L.coachPool.includes(c.id)) L.coachPool.push(c.id);
}

function initCoaches(L) {
  L.coaches = {}; L.coachPool = []; L.carousel = null;
  for (const t of L.teams) {
    t.staff = { HC: null, OC: null, DC: null };
    for (const role of COACH_ROLES) {
      const c = makeCoach(L, role, clamp(R.gauss(role === 'HC' ? 66 : 63, 7), 45, 90), role === 'HC' ? R.int(40, 66) : R.int(34, 60));
      assignCoach(L, c, t.id, role, R.int(0, 3));
      if (role === 'HC') { const yrs = R.int(0, 6); c.cw = Math.round(yrs * R.rand(6, 11)); c.cl = yrs * 17 - c.cw; }
    }
  }
  refillCoachPool(L);
}
function migrateCoaches(L) {
  if (!L.coaches) initCoaches(L);
  L.coachPool = L.coachPool || [];
  for (const t of L.teams) t.staff = t.staff || { HC: null, OC: null, DC: null };
}
function refillCoachPool(L) {
  const live = L.coachPool.filter(id => L.coaches[id]);
  L.coachPool = live;
  const need = { HC: 8, OC: 12, DC: 12 };
  for (const id of live) need[L.coaches[id].role] = (need[L.coaches[id].role] || 0) - 1;
  for (const role of COACH_ROLES) for (let i = 0; i < need[role]; i++) {
    const young = R.chance(0.7);
    const c = makeCoach(L, role, clamp(R.gauss(young ? 57 : 62, 7), 40, 82), young ? R.int(31, 46) : R.int(47, 63));
    L.coachPool.push(c.id);
  }
}

// ---------- in-game effects ----------
const NO_COACH = { off: 52, def: 52, dev: 50, mot: 50, gm: 50, quirks: {}, offStyle: 'PRO STYLE', defStyle: 'COVER 2' };
function coachMods(L, team, playoff) {
  const s = team.staff || {}, hc = L.coaches && L.coaches[s.HC] || NO_COACH, oc = L.coaches && L.coaches[s.OC] || NO_COACH, dc = L.coaches && L.coaches[s.DC] || NO_COACH;
  const os = OFF_STYLES[oc.offStyle] || OFF_STYLES['PRO STYLE'], ds = DEF_STYLES[dc.defStyle] || DEF_STYLES['COVER 2'];
  const offR = oc.off * 0.7 + hc.off * 0.3 - 70, defR = dc.def * 0.7 + hc.def * 0.3 - 70;
  const m = {
    pass: os.pass, deep: os.deep, comp: os.comp + offR * 0.0008, run: os.run + offR * 0.0065, qbRun: os.qbRun || 0, to: os.to || 1,
    sack: ds.sack, deepAllow: ds.deepAllow, dcomp: ds.comp - defR * 0.0008, runDef: ds.runDef + defR * 0.0065, int: ds.int, rz: ds.rz || 0,
    go4: qLvl(hc, 'gambler') * 0.12 + qLvl(hc, 'analytics') * 0.05, noGo: qLvl(hc, 'conservative') * 0.2,
    hurry: (hc.gm - 70) * 0.0008 + qLvl(hc, 'clock') * 0.015, po: 0,
  };
  m.to *= 1 - qLvl(hc, 'disciplinarian') * 0.06;
  m.comp += (qLvl(oc, 'qbwhisperer') + qLvl(hc, 'qbwhisperer')) * 0.005;
  m.comp -= qLvl(oc, 'stubborn') * 0.004; m.dcomp += qLvl(dc, 'stubborn') * 0.004;
  if (playoff) { const b = qLvl(hc, 'biggame') * 0.012 + (hc.mot - 70) * 0.0004; m.comp += b; m.dcomp -= b; m.run += b * 6; }
  return m;
}
// Weekly: the head coach sets the locker-room tone, and the user's staff gets paid out of the operations budget.
function coachMoraleWeek(L) {
  if (!L.coaches || typeof bumpTeamMorale !== 'function') return;
  for (const t of L.teams) {
    const hc = L.coaches[t.staff && t.staff.HC]; if (!hc) continue;
    let d = (hc.mot - 70) * 0.012 + qLvl(hc, 'players') * 0.15 - qLvl(hc, 'disciplinarian') * 0.08;
    if (qLvl(hc, 'hothead') && (t.rec.strk || 0) <= -2) d -= qLvl(hc, 'hothead') * 0.5;
    if (Math.abs(d) >= 0.05) bumpTeamMorale(L, t.id, d, t.id === L.userTeam && L.week % 4 === 2 && Math.abs(d) >= 0.3 ? (d > 0 ? `Plays hard for coach ${hc.ln}` : `Tired of coach ${hc.ln}`) : null);
  }
  if (L.ops && L.phase === 'regular' && typeof opsSpend === 'function') opsSpend(L, staffPayroll(L, L.userTeam) / 18, 'coaching');
}
function staffPayroll(L, tid) { const s = staffOf(L, tid); return COACH_ROLES.reduce((a, r) => a + (s[r] && s[r].contract ? s[r].contract.sal : 0), 0); }
// Offseason development bonus from the staff (called after each player's normal progression).
function coachDevelop(L, p) {
  if (!L.coaches || p.tid < 0 || p.age > 27) return 0;
  const s = staffOf(L, p.tid), hc = s.HC || NO_COACH;
  const off = ['QB', 'RB', 'WR', 'TE', 'OL'].includes(p.pos), co = (off ? s.OC : s.DC) || NO_COACH;
  let b = (hc.dev * 0.5 + co.dev * 0.5 - 65) * 0.05 + (qLvl(hc, 'teacher') + qLvl(co, 'teacher')) * 0.4;
  if (p.pos === 'QB') b += (qLvl(hc, 'qbwhisperer') + qLvl(s.OC, 'qbwhisperer')) * 0.8;
  b = clamp(b, -1.5, 3);
  if (Math.abs(b) < 0.2) return 0;
  const before = p.ovr;
  for (const k in OVR_WEIGHTS[p.pos]) p.attrs[k] += b * R.rand(0.6, 1.4);
  clampAttrs(p); p.ovr = calcOvr(p); p.pot = Math.max(p.pot, p.ovr);
  return p.ovr - before;
}

// ---------- user actions ----------
function coachHire(L, cid, role) {
  const c = L.coaches[cid], t = L.teams[L.userTeam];
  if (!c || c.tid !== -1) return 'That coach is no longer available.';
  if (t.staff[role]) return `Fire your ${role} first.`;
  assignCoach(L, c, t.id, role);
  news(L, `The ${t.name} hire ${coachName(c)} as ${ROLE_NAMES[role].toLowerCase()} (${fmtM(c.contract.sal)}/yr through ${c.contract.exp}).`, t.id);
  return null;
}
function coachBuyout(L, c) { return c.contract ? Math.round(c.contract.sal * 0.5 * Math.max(1, c.contract.exp - L.year + (L.phase === 'regular' ? 1 : 0)) * 10) / 10 : 0; }
function coachFire(L, role) {
  const t = L.teams[L.userTeam], c = L.coaches[t.staff[role]]; if (!c) return 'No one to fire.';
  if (L.phase === 'playoffs') return 'Not during the playoffs.';
  const cost = coachBuyout(L, c);
  if (L.ops) opsSpend(L, cost, 'coaching');
  releaseCoach(L, c);
  if (typeof bumpTeamMorale === 'function' && role === 'HC') bumpTeamMorale(L, t.id, qLvl(c, 'hothead') ? 2 : qLvl(c, 'players') ? -4 : -1, `Coach ${c.ln} was fired`);
  news(L, `The ${t.name} fired ${role} ${coachName(c)}${cost ? ` (buyout ${fmtM(cost)})` : ''}.`, t.id);
  return null;
}
function coachClinic(L, cid) {
  const c = L.coaches[cid]; if (!c || c.tid !== L.userTeam) return 'Not on your staff.';
  if (c.clinic === L.year) return `${c.ln} already went to a clinic this year.`;
  const cost = c.role === 'HC' ? 1 : 0.5;
  if (L.ops && L.ops.cash < cost) return `Not enough operations cash (${fmtM(cost)}).`;
  if (L.ops) opsSpend(L, cost, 'coaching');
  c.clinic = L.year;
  const main = c.role === 'OC' ? ['off'] : c.role === 'DC' ? ['def'] : [c.side, 'gm'];
  const gains = [];
  for (const k of main) { const g = c[k] < c.pot + 2 ? R.int(1, 3) : R.int(0, 1); c[k] = Math.min(99, c[k] + g); if (g) gains.push(`${k.toUpperCase()} +${g}`); }
  const extra = R.pick(['dev', 'mot', 'gm']); if (R.chance(0.6)) { c[extra] = Math.min(99, c[extra] + 1); gains.push(`${extra.toUpperCase()} +1`); }
  const bad = Object.keys(c.quirks).filter(k => QUIRKS[k].neg);
  if (bad.length && R.chance(0.35)) { const k = R.pick(bad); c.quirks[k]--; if (!c.quirks[k]) delete c.quirks[k]; gains.push(`worked on being ${QUIRKS[k].name.toLowerCase()}`); }
  return `${coachName(c)} came back from the clinic: ${gains.join(', ') || 'no real change'}.`;
}
function coachSetStyle(L, role, style) {
  const c = staffOf(L, L.userTeam)[role]; if (!c) return 'No coordinator in that role.';
  if (['regular', 'playoffs'].includes(L.phase)) return 'Schemes can only be changed in the offseason.';
  if (qLvl(c, 'stubborn')) return `${coachName(c)} is stubborn and refuses to change his scheme.`;
  if (role === 'OC' && OFF_STYLES[style]) c.offStyle = style;
  else if (role === 'DC' && DEF_STYLES[style]) c.defStyle = style;
  return null;
}
// If you start a season with a vacancy, the team promotes the best cheap option.
function coachSeasonStart(L) {
  if (!L.coaches) return;
  const t = L.teams[L.userTeam];
  for (const role of COACH_ROLES) if (!t.staff[role]) {
    const c = L.coachPool.map(id => L.coaches[id]).sort((a, b) => coachOvr(b, role) / coachAsk(b, role) - coachOvr(a, role) / coachAsk(a, role))[0];
    if (c) { assignCoach(L, c, t.id, role, 1); news(L, `With no ${role} hired, the team promoted ${coachName(c)} on a 1-year deal.`, t.id); }
  }
}

// ---------- end of season: careers and the carousel ----------
function coachGrow(L, c) {
  c.age++;
  const keys = c.role === 'OC' ? ['off'] : c.role === 'DC' ? ['def'] : [c.side, 'gm'];
  const good = c.lastPerf && (c.lastPerf.wp >= 0.6 || c.lastPerf.champ || (c.role === 'OC' && c.lastPerf.off <= 8) || (c.role === 'DC' && c.lastPerf.def <= 8));
  for (const k of [...keys, 'dev', 'mot']) {
    let d = c.age < 50 ? R.gauss(0.8, 1) : c.age > 62 ? -R.rand(0, 1.5) : R.gauss(0.2, 0.8);
    if (good) d += 0.5;
    if (d > 0 && c[k] >= c.pot) d *= 0.2;
    c[k] = Math.round(clamp(c[k] + d, 25, 99));
  }
  for (const k of Object.keys(c.quirks)) {
    if (QUIRKS[k].neg) { if (R.chance(0.12 + (good ? 0.08 : 0) + (c.age > 50 ? 0.06 : 0))) { c.quirks[k]--; if (!c.quirks[k]) delete c.quirks[k]; } }
    else if (good && c.quirks[k] < 3 && R.chance(0.25)) c.quirks[k]++;
  }
  if (R.chance(0.07)) { const k = R.pick(Object.keys(QUIRKS)); if (!c.quirks[k]) addQuirk(c, k, 1); }
}
function coachSeasonEnd(L) {
  if (!L.coaches) return;
  const season = L.year, moves = [], u = L.userTeam;
  const log = (type, text, tids) => moves.push({ type, text, tids: tids || [] });
  const byPf = L.teams.slice().sort((a, b) => b.rec.pf - a.rec.pf).map(t => t.id), byPa = L.teams.slice().sort((a, b) => a.rec.pa - b.rec.pa).map(t => t.id);
  const offRk = (tid) => byPf.indexOf(tid) + 1, defRk = (tid) => byPa.indexOf(tid) + 1;
  const lastCh = L.champions[L.champions.length - 1], champ = lastCh && lastCh.year === season ? lastCh.champ : -1;
  const ppg = (t) => t.rec.pf / Math.max(1, t.rec.w + t.rec.l + t.rec.t), oppg = (t) => t.rec.pa / Math.max(1, t.rec.w + t.rec.l + t.rec.t);

  // 1. record the season and reputations
  for (const t of L.teams) for (const role of COACH_ROLES) {
    const c = L.coaches[t.staff[role]]; if (!c) continue;
    const r = t.rec, wp = recPct(r), result = playoffResult(L, t.id);
    c.hist.push({ y: season, tid: t.id, abbr: t.abbr, role, w: r.w, l: r.l, t: r.t, res: result, off: offRk(t.id), def: defRk(t.id) });
    if (c.hist.length > 40) c.hist.shift();
    if (role === 'HC') { c.cw += r.w; c.cl += r.l; c.ct += r.t; }
    if (t.id === champ) c.titles++;
    const perf = role === 'HC' ? wp * 100 + (t.id === champ ? 15 : result === 'Missed Playoffs' ? -5 : 5) : role === 'OC' ? (33 - offRk(t.id)) * 3 : (33 - defRk(t.id)) * 3;
    const hot = (role === 'OC' && ppg(t) >= 29) || (role === 'DC' && oppg(t) <= 16);
    c.rep = Math.round(clamp(c.rep * 0.55 + perf * 0.45 + (t.id === champ ? 12 : 0) + (hot ? 6 : 0) + qLvl(c, 'bigname') * 3, 0, 100));
    c.lastPerf = { wp, off: offRk(t.id), def: defRk(t.id), champ: t.id === champ, hot, result };
  }
  const hcScore = (c) => {
    let s = coachOvr(c, 'HC') * 0.7 + c.rep * 0.45 + R.rand(0, 8) - (c.age > 62 ? 6 : 0);
    const lp = c.lastPerf;
    if (lp && c.role !== 'HC') { if (lp.champ) s += 14; if (lp.hot) s += 7; if ((c.role === 'OC' ? lp.off : lp.def) <= 3) s += 8; else if ((c.role === 'OC' ? lp.off : lp.def) <= 8) s += 3; }
    return s;
  };
  // 2. AI firings (and coaches who walk away when their deal is up)
  for (const t of L.teams) {
    if (t.id === u) continue;
    const hc = L.coaches[t.staff.HC];
    if (hc) {
      const wp = recPct(t.rec), tenure = hc.hist.filter(h => h.tid === t.id && h.role === 'HC').length;
      const prevWp = t.history.length >= 2 ? (t.history[t.history.length - 2].w / 17) : 0.5;
      let fire = wp < 0.25 ? 0.75 : wp < 0.35 ? 0.45 : wp < 0.5 && tenure >= 3 && prevWp < 0.5 ? 0.3 : 0;
      if (tenure <= 1) fire *= 0.4;
      if (hc.lastPerf && hc.lastPerf.champ) fire = 0;
      if (R.chance(fire)) { log('fired', `${t.abbr} fired head coach ${coachName(hc)} after a ${t.rec.w}-${t.rec.l}${t.rec.t ? '-' + t.rec.t : ''} season.`, [t.id]); releaseCoach(L, hc); }
    }
    for (const role of ['OC', 'DC']) {
      const c = L.coaches[t.staff[role]]; if (!c) continue;
      const rk = role === 'OC' ? offRk(t.id) : defRk(t.id);
      if (rk >= 28 && R.chance(0.3)) { log('fired', `${t.abbr} fired ${role} ${coachName(c)} (${cOrd(rk)} in ${role === 'OC' ? 'points scored' : 'points allowed'}).`, [t.id]); releaseCoach(L, c); }
    }
  }
  // 3. aging and retirement
  for (const c of Object.values(L.coaches)) {
    coachGrow(L, c);
    if (c.age >= 66 && R.chance(clamp((c.age - 64) * 0.12, 0, 0.9))) {
      if (c.tid >= 0) log('retired', `${L.teams[c.tid].abbr} ${c.role} ${coachName(c)} retired at ${c.age}${c.titles ? ` with ${c.titles} Megacup title${c.titles > 1 ? 's' : ''}` : ''}.`, [c.tid]);
      releaseCoach(L, c); L.coachPool = L.coachPool.filter(id => id !== c.id); delete L.coaches[c.id];
    }
  }
  // 4. contracts
  for (const t of L.teams) for (const role of COACH_ROLES) {
    const c = L.coaches[t.staff[role]]; if (!c || !c.contract || c.contract.exp > season) continue;
    if (t.id === u) { c.contract = { sal: coachAsk(c, role), exp: season + (role === 'HC' ? 3 : 2) }; news(L, `${role} ${coachName(c)} re-signed through ${c.contract.exp} at ${fmtM(c.contract.sal)}/yr.`, u); continue; }
    if (c.rep >= 40 || R.chance(0.5)) c.contract = { sal: coachAsk(c, role), exp: season + R.int(2, 4) };
    else { log('left', `${t.abbr} let ${role} ${coachName(c)} go when his contract ran out.`, [t.id]); releaseCoach(L, c); }
  }
  // 5. head coach vacancies - hot coordinators get poached here
  const open = L.teams.filter(t => t.id !== u && !t.staff.HC).sort((a, b) => recPct(a.rec) - recPct(b.rec));
  for (const t of open) {
    const cands = [...L.coachPool.map(id => L.coaches[id]), ...L.teams.filter(x => x.id !== t.id).flatMap(x => ['OC', 'DC'].map(r => L.coaches[x.staff[r]]))].filter(Boolean);
    const scored = cands.map(c => ({ c, s: hcScore(c) })).sort((a, b) => b.s - a.s);
    const pick = scored[0] && scored[0].c; if (!pick) continue;
    const from = pick.tid, fromRole = pick.role;
    if (from >= 0) {
      const lp = pick.lastPerf || {};
      const why = lp.champ ? 'after winning the Megacup' : lp.hot ? `after a record-setting ${fromRole === 'OC' ? 'offense' : 'defense'}` : `after ranking ${cOrd(fromRole === 'OC' ? lp.off : lp.def)} in ${fromRole === 'OC' ? 'scoring' : 'points allowed'}`;
      log(from === u ? 'poached' : 'promoted', `${t.abbr} hired ${L.teams[from].abbr} ${fromRole} ${coachName(pick)} as head coach ${why}.`, [t.id, from]);
      L.teams[from].staff[fromRole] = null;
      if (from === u) { L.coachLoss = { year: season, name: coachName(pick), role: fromRole, to: t.id }; news(L, `Your ${ROLE_NAMES[fromRole].toLowerCase()} ${coachName(pick)} left to become head coach of the ${t.city} ${t.name}. Hire a replacement on the COACHES tab.`, u); }
    } else log('hired', `${t.abbr} hired ${coachName(pick)} as head coach.`, [t.id]);
    assignCoach(L, pick, t.id, 'HC', R.int(3, 5));
  }
  // 6. AI coordinator vacancies - new head coaches bring their own guys from the pool
  for (const t of L.teams) {
    if (t.id === u) continue;
    for (const role of ['OC', 'DC']) {
      if (t.staff[role]) continue;
      if (!L.coachPool.length) refillCoachPool(L);
      const c = L.coachPool.map(id => L.coaches[id]).sort((a, b) => coachOvr(b, role) + R.rand(0, 6) - coachOvr(a, role) - R.rand(0, 6))[0];
      if (c) { assignCoach(L, c, t.id, role); if (coachOvr(c, role) >= 70) log('hired', `${t.abbr} hired ${coachName(c)} as ${role}.`, [t.id]); }
    }
  }
  refillCoachPool(L);
  for (const c of Object.values(L.coaches)) c.lastPerf = null;
  L.carousel = { year: season, moves };
  const mine = moves.filter(m => m.tids.includes(u));
  news(L, `Coaching carousel: ${moves.filter(m => m.type === 'fired').length} firings, ${moves.filter(m => m.type === 'promoted' || m.type === 'poached').length} coordinators promoted to head coach.${mine.length ? ' ' + mine.map(m => m.text).join(' ') : ''}`, u);
}
