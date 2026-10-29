// AI Ops Tycoon: pure, deterministic game engine shared by the player app, the live board and selftest.js.
// Same events for everyone, so the leaderboard is fair and the debrief can compare strategies.

const MODES = {
  HUMAN:  { lvl: 0, icon: "🧑", short: "Human" },
  ASSIST: { lvl: 1, icon: "🧑‍💻", short: "Assist" },
  REVIEW: { lvl: 2, icon: "🤝", short: "Review" },
  AUTO:   { lvl: 3, icon: "🤖", short: "Auto" },
};
const MODE_KEYS = Object.keys(MODES);
const TIME = { HUMAN: 1, ASSIST: 0.7, REVIEW: 0.35, AUTO: 0.1 }; // share of manual hours people still spend
const CAPACITY = 400;   // 4 people x 100 h per quarter
const QUARTERS = 6;
const CREDITS_PER_Q = 4;
const ACT_CODES = { 3: "VERIFY", 5: "GOVERN" }; // facilitator reveals these on slides to unlock Act 2 and Act 3

// h = manual hours/quarter, stakes 0..1, ideal = best autonomy today, fit = what players see.
const WS = [
  { id: "chat",     t: "Customer chat",            h: 160, stakes: 0.3, ideal: "AUTO",   fit: "High",   from: 1 },
  { id: "refund",   t: "Refunds & claims",         h: 120, stakes: 0.7, ideal: "REVIEW", fit: "Medium", from: 1, grow: true },
  { id: "report",   t: "Market insight reports",   h: 60,  stakes: 0.5, ideal: "REVIEW", fit: "High",   from: 1 },
  { id: "supplier", t: "Supplier negotiations",    h: 80,  stakes: 0.9, ideal: "ASSIST", fit: "Low",    from: 1 },
  { id: "campaign", t: "Personalised campaigns",   h: 100, stakes: 0.6, ideal: "REVIEW", fit: "High",   from: 3 },
  { id: "procure",  t: "Autonomous procurement",   h: 120, stakes: 0.8, ideal: "REVIEW", fit: "Medium", from: 5, grow: true },
];

const INVEST = {
  guard:  { t: "Guardrails",        d: "Grounding, PII filters, audit logs. Softens every incident.", cost: 2, max: 3 },
  qa:     { t: "Review capacity",   d: "Trained reviewers so 'Review' stays real, not rubber-stamping.", cost: 2, max: 3 },
  up:     { t: "Upskilling",        d: "AI fluency for your team: faster Assist/Review, better morale.", cost: 2, max: 3 },
  agent:  { t: "Agent upgrade",     d: "Better models and tools: higher AI quality on Review/Auto.", cost: 3, max: 2 },
};
const CHANGE_COST = 1; // one change-management push per quarter

const NEWS = {
  1: { h: "Welcome, Head of Operations", b: "The board wants 25% more output by Q6 and zero public AI incidents. You have 4 people and 4 credits a quarter." },
  2: { h: "Peak season is coming", b: "Customer chat volume will jump 50% this quarter. Rumour: a competitor's chatbot just made headlines for the wrong reasons." },
  3: { h: "New workstream + new rules", b: "Marketing hands you personalised campaigns. Personal-data protection rules are now actively enforced." },
  4: { h: "A new model generation lands", b: "Agent upgrades cost 1 credit less this quarter. Teams that already know the tools will adopt it fastest." },
  5: { h: "Procurement goes agentic + an audit", b: "An agent can now place supplier orders. The regulator announces an AI audit of high-stakes processes this quarter." },
  6: { h: "The final quarter", b: "Competitors are hiring aggressively. Teams with low morale tend to lose people right now." },
};

function newGame() {
  return { q: 1, value: 0, trust: 70, morale: 70, credits: CREDITS_PER_Q, lostCap: 0, change: 0,
           inv: { guard: 0, qa: 0, up: 0, agent: 0 }, modes: {}, log: [] };
}

const active = (q) => WS.filter((w) => w.from <= q);
const agentCost = (q) => INVEST.agent.cost - (q === 4 ? 1 : 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Hours the team needs this quarter for a set of modes (used live in the UI and in runQuarter).
function hoursNeeded(g, modes, buy = {}) {
  const up = Math.min(2, g.inv.up + (buy.up || 0));
  return Math.round(active(g.q).reduce((s, w) => {
    const m = modes[w.id], vol = g.q === 2 && w.id === "chat" ? 1.5 : 1;
    return s + w.h * vol * TIME[m] * (m === "ASSIST" || m === "REVIEW" ? 1 - 0.1 * up : 1);
  }, 0));
}
const capacity = (g) => CAPACITY - g.lostCap - (g.q === 6 && g.morale < 55 ? 100 : 0);

// Apply one quarter. dec = { modes: {id: MODE}, buy: {guard,qa,up,agent}, change: bool }. Returns new state + report.
function runQuarter(g0, dec) {
  const g = JSON.parse(JSON.stringify(g0)), q = g.q, rep = { q, events: [], inc: [], tips: [] };
  const spend = Object.entries(dec.buy || {}).reduce((s, [k, n]) => s + n * (k === "agent" ? agentCost(q) : INVEST[k].cost), 0) + (dec.change ? CHANGE_COST : 0);
  if (spend > g.credits) throw new Error("over budget");
  for (const [k, n] of Object.entries(dec.buy || {})) g.inv[k] = Math.min(INVEST[k].max, g.inv[k] + n);
  g.credits -= spend;
  if (dec.change) g.change++;
  g.modes = { ...g.modes, ...dec.modes };
  const ws = active(q), lvl = (w) => MODES[g.modes[w.id]].lvl;
  const idealOf = (w) => MODES[w.ideal].lvl + (w.grow && g.inv.agent >= 2 ? 1 : 0);
  let moraleD = 0, trustD = 0, valueBonus = 0;

  const cap = capacity(g), need = hoursNeeded(g, g.modes);
  if (q === 6 && g.morale < 55) rep.events.push("🏃 Two experienced people were poached by a competitor: −100 h this quarter.");
  const completion = Math.min(1, cap / Math.max(1, need));
  if (need > cap) { moraleD -= Math.min(20, Math.round(25 * (need / cap - 1))); rep.tips.push(`Your team was overloaded (${need} h needed vs ${cap} h). Overload burns morale and leaves work unfinished.`); }

  // Review only works if someone has time to really review it; beyond capacity it becomes rubber-stamping.
  const reviewLoad = ws.filter((w) => g.modes[w.id] === "REVIEW").reduce((s, w) => s + w.h, 0);
  const reviewCap = 120 + 90 * g.inv.qa, rubber = reviewLoad > reviewCap ? reviewCap / reviewLoad : 1;
  if (rubber < 1) rep.tips.push(`Reviewers had to check ${reviewLoad} h of AI output with capacity for ${reviewCap} h. They started rubber-stamping (automation bias).`);

  let qSum = 0, value = 0;
  for (const w of ws) {
    const m = g.modes[w.id], gap = lvl(w) - idealOf(w);
    let quality = Math.max(0.2, 1 - 0.25 * Math.abs(gap));
    if (lvl(w) >= 2) quality = Math.min(1, quality * (1 + 0.08 * g.inv.agent));
    let exposure = w.stakes * Math.max(0, gap);
    if (m === "REVIEW" && rubber < 1) { quality *= 0.7 + 0.3 * rubber; exposure += w.stakes * (1 - rubber); }
    if (exposure >= 0.5) {
      const hit = Math.round(Math.min(25, 30 * exposure) * (1 - 0.3 * g.inv.guard));
      trustD -= hit; quality *= 0.5;
      rep.inc.push({ id: "unchecked-" + w.id, t: `Unchecked AI error in ${w.t}`, hit });
    }
    qSum += quality;
    value += w.h * (q === 2 && w.id === "chat" ? 1.5 : 1) * quality * completion;
  }
  const avgQ = qSum / ws.length;
  if (avgQ >= 0.85) trustD += 4;

  // Freed human hours go to innovation projects: the real payoff of orchestration.
  const free = Math.max(0, cap - need), innovation = Math.round(free * 0.6 * (1 + 0.25 * g.inv.up));
  if (free > 0) rep.events.push(`💡 ${free} freed hours went into innovation projects: +${innovation} value.`);

  // Scripted events.
  if (q === 2 && g.modes.chat === "AUTO" && g.inv.guard < 1) { trustD -= 15; rep.inc.push({ id: "hallucination", t: "Your chatbot invented a refund policy that doesn't exist", hit: 15 }); }
  if (q === 3 && MODES[g.modes.campaign].lvl >= 2 && g.inv.guard < 2) { trustD -= 20; rep.inc.push({ id: "privacy", t: "A campaign used customer data without valid consent", hit: 20 }); }
  if (q === 4) {
    if (g.inv.up >= 1) { valueBonus += 40; rep.events.push("🚀 Your upskilled team adopted the new tools in days: +40 value."); }
    else { moraleD -= 5; rep.events.push("😩 Tool fatigue: nobody had time to learn the new tools. −5 morale."); }
  }
  if (q === 5) {
    const fail = g.inv.guard < 2 || ws.some((w) => w.stakes >= 0.8 && g.modes[w.id] === "AUTO");
    if (fail) { trustD -= 15; valueBonus -= 40; rep.inc.push({ id: "audit", t: "Audit finding: no audit trail or human owner on a high-stakes process", hit: 15 }); }
    else rep.events.push("✅ The regulator's audit passed cleanly: logs and human owners were in place.");
  }

  // Morale: people need to see a future for themselves in an automated unit.
  const avgLvl = ws.reduce((s, w) => s + lvl(w), 0) / ws.length;
  if (avgLvl >= 1.8 && g.change < Math.ceil(q / 2)) { moraleD -= 5; rep.tips.push("Heavy automation without change management: people worry about their jobs (−5 morale)."); }
  moraleD += 4 * (dec.buy?.up || 0) + (dec.change ? 6 : 0);

  g.value += Math.round(value) + innovation + valueBonus;
  g.trust = clamp(g.trust + trustD, 0, 100);
  g.morale = clamp(g.morale + moraleD, 0, 100);
  if (g.morale < 40) { g.lostCap += 100; rep.events.push("🚪 Morale fell below 40: one person resigned. −100 h capacity from now on."); }
  Object.assign(rep, { value: Math.round(value) + innovation + valueBonus, trustD, moraleD, need, cap, avgQ: Math.round(avgQ * 100), rubber: rubber < 1 });
  g.log.push(rep);
  g.q++;
  g.credits += g.trust < 40 ? 2 : CREDITS_PER_Q;
  if (g.trust < 40 && g.q <= QUARTERS) rep.events.push("🧊 Trust is below 40: leadership halved your AI budget next quarter.");
  return g;
}

const score = (g) => Math.round(g.value * (g.trust / 100) * (0.5 + g.morale / 200));

if (typeof module !== "undefined") module.exports = { MODES, MODE_KEYS, WS, INVEST, QUARTERS, CAPACITY, ACT_CODES, newGame, active, runQuarter, hoursNeeded, capacity, agentCost, score };
