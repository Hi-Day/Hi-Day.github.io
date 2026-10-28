// Run: node selftest.js — sanity checks on the scoring model.
const assert = require("assert");
const { TRIAGE, AUDIT, WORKFLOW, WF_BUDGET, scoreWorkflow, archetype } = require("./data.js");
const ideal = scoreWorkflow(WORKFLOW.map((s) => s.ideal));
const allHuman = scoreWorkflow(WORKFLOW.map(() => "HUMAN"));
const allAuto = scoreWorkflow(WORKFLOW.map(() => "AUTO"));
assert(ideal.onTime && ideal.quality === 100 && ideal.risk === 0, "ideal plan must be perfect and on time");
assert(!allHuman.onTime && allHuman.risk === 0, "all-human must blow the budget");
assert(allAuto.onTime && allAuto.risk > 30 && allAuto.quality < 80, "all-auto must be risky");
assert.equal(AUDIT.filter((a) => a.bad).length, 6);
assert.equal(TRIAGE.length, 12);
assert.equal(archetype(5, 0.9).k, "Accelerator");
assert.equal(archetype(-5, 0.9).k, "Guardian");
assert.equal(archetype(0, 0.9).k, "Conductor");
console.log("ok", { ideal, allHuman, allAuto, budget: WF_BUDGET });
