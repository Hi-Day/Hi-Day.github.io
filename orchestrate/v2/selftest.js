const G = require("./game.js");
// Run: node selftest.js — plays scripted strategies and checks the game rewards orchestration.
const assert = require("assert");
const S = {};
function play(name, policy) {
  let g = G.newGame();
  while (g.q <= G.QUARTERS) {
    const d = policy(g); g = G.runQuarter(g, d);
  }
  S[name] = G.score(g);
  const inc = g.log.flatMap(r => r.inc.map(i => i.id)).join(",");
  console.log(name.padEnd(22), "score", String(G.score(g)).padStart(5), "V", g.value, "T", g.trust, "M", g.morale, "| inc:", inc || "-", "| need", g.log.map(r=>r.need+"/"+r.cap).join(" "));
}
const all = (m) => (g) => Object.fromEntries(G.active(g.q).map(w => [w.id, m]));
const ideal = (g) => Object.fromEntries(G.active(g.q).map(w => [w.id, w.ideal]));
// greedy buyer: buy in priority order while affordable
const buyer = (prio, change) => (g) => { let c = g.credits; const buy = {}; let ch = false;
  if (change && c >= 1) { ch = true; c -= 1; }
  for (const k of prio) { const cost = k === "agent" ? G.agentCost(g.q) : G.INVEST[k].cost;
    if (c >= cost && (g.inv[k] + (buy[k]||0)) < G.INVEST[k].max) { buy[k] = (buy[k]||0) + 1; c -= cost; } }
  return { buy, change: ch }; };
const none = () => ({ buy: {}, change: false });
const P = (modes, inv) => (g) => ({ modes: modes(g), ...inv(g) });
play("all human", P(all("HUMAN"), none));
play("all auto", P(all("AUTO"), none));
play("all auto+guard", P(all("AUTO"), buyer(["guard","guard","agent"], false)));
play("all review", P(all("REVIEW"), none));
play("all review+qa", P(all("REVIEW"), buyer(["qa","guard","up"], true)));
play("ideal no invest", P(ideal, none));
play("ideal guard/qa/up+chg", P(ideal, buyer(["guard","qa","up"], true)));
play("ideal guard/up/agent+chg", P(ideal, buyer(["guard","up","agent","qa"], true)));
play("ideal up-first+chg", P(ideal, buyer(["up","guard","qa","agent"], true)));
play("ideal invest, no chg", P(ideal, buyer(["guard","qa","up"], false)));
play("ideal guard only", P(ideal, buyer(["guard"], false)));
play("ideal up/agent no guard", P(ideal, buyer(["up","agent"], true)));
const late = (g) => g.q < 3 ? all("HUMAN")(g) : ideal(g);
play("slow adopter", P(late, buyer(["guard","up","qa"], true)));
const best = S["ideal guard/qa/up+chg"];
for (const k of ["all human", "all auto", "all review", "ideal no invest", "ideal guard only", "slow adopter", "ideal invest, no chg"]) assert(best > S[k], `${k} should lose to the balanced strategy`);
assert(S["all auto"] < S["all human"], "reckless automation must score below doing nothing");
console.log("ok");
