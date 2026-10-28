// All simulation content lives here, shared by the participant app (index.html) and the presenter board (live.html).

// Autonomy levels, from least to most AI autonomy. Used by Mission 1 and 3.
const MODES = {
  HUMAN:  { lvl: 0, icon: "🧑", label: "Human only",            short: "Human" },
  ASSIST: { lvl: 1, icon: "🧑‍💻", label: "Human leads, AI assists", short: "Assist" },
  REVIEW: { lvl: 2, icon: "🤝", label: "AI drafts, human reviews", short: "Review" },
  AUTO:   { lvl: 3, icon: "🤖", label: "AI runs it, human spot-checks", short: "Auto" },
};

// ---------- Mission 1: Task Triage ----------
const TRIAGE_OPTIONS = ["HUMAN", "REVIEW", "AUTO"]; // three lanes keep it fast on a phone
const TRIAGE = [
  { t: "Turn a 60-minute meeting recording into notes and action items", a: "AUTO",
    why: "High volume, low stakes, easy to check. Skim the action items before sending." },
  { t: "Translate the internal FAQ page into three languages", a: "AUTO",
    why: "Modern AI translates well. A native speaker spot-checks a sample, not every line." },
  { t: "Tag and route 2,000 incoming customer emails by topic", a: "AUTO",
    why: "Classic AI work: repetitive and measurable. Audit a sample weekly for drift." },
  { t: "Generate 20 caption options for next week's social posts", a: "AUTO",
    why: "Divergent ideation is an AI strength. You pick; the brand voice stays yours." },
  { t: "Write a proposal for a strategic client renewal", a: "REVIEW",
    why: "AI drafts structure and boilerplate fast; only you know the relationship and the real stakes." },
  { t: "Build the quarterly sales analysis from CRM data", a: "REVIEW",
    why: "AI crunches and charts quickly, but numbers must be verified against the source before leadership sees them." },
  { t: "Summarise a vendor contract and flag risky clauses", a: "REVIEW",
    why: "AI finds clauses quickly but can miss or invent them. A human owns the legal judgment." },
  { t: "Shortlist candidates from 300 job applications", a: "REVIEW",
    why: "AI can rank against clear criteria, but bias risk is high. Humans review the shortlist and audit who got filtered out." },
  { t: "Write the code for an internal reporting dashboard", a: "REVIEW",
    why: "AI writes most of the code; a human tests it, reviews it and owns what goes to production." },
  { t: "Tell an employee their role is being eliminated", a: "HUMAN",
    why: "Empathy, dignity and trust. AI may help you prepare, but the conversation is human." },
  { t: "Negotiate a pricing dispute with a long-standing key partner", a: "HUMAN",
    why: "Relationship and reading the room. Use AI before the meeting to model scenarios, not during." },
  { t: "Decide which of three product lines to discontinue", a: "HUMAN",
    why: "AI can supply the analysis, but accountability for a strategic decision cannot be delegated." },
];

// ---------- Mission 2: AI Output Audit ----------
const AUDIT_SOURCE = [
  ["Tickets", "12,400", "15,500"],
  ["Avg. first response", "4.0 h", "6.5 h"],
  ["CSAT", "82%", "74%"],
  ["Top complaint", "—", "Late delivery, 38% (mostly Surabaya warehouse)"],
  ["Chatbot pilot", "—", "Handled 18% of tickets, chatbot CSAT 61%"],
  ["Team", "22 agents", "3 resigned in Q3"],
  ["Legal escalation", "—", "1 VIP case (customer name + phone in ticket)"],
];
const AUDIT = [
  { s: "Ticket volume rose 25% from Q2 to Q3, reaching 15,500 tickets.", bad: false,
    why: "Correct: 12,400 → 15,500 is +25%." },
  { s: "Average first-response time improved to 6.5 hours.", bad: true, tag: "Misread data",
    why: "It got worse: 4.0 h → 6.5 h. AI often gets direction wrong while getting the number right." },
  { s: "Customer satisfaction dropped 8 points to 74%.", bad: false,
    why: "Correct: 82% → 74%." },
  { s: "Late delivery was the leading complaint at 38% of tickets, concentrated around the Surabaya warehouse.", bad: false,
    why: "Matches the source." },
  { s: "A 2024 Gartner study found that 92% of retailers who deploy chatbots see CSAT rise within one quarter.", bad: true, tag: "Invented source",
    why: "Nothing in your data supports this, and the citation is unverifiable. Treat any citation you did not supply as suspect until you have checked it." },
  { s: "Since the chatbot already resolves 18% of tickets, scaling it to 100% will clearly restore CSAT.", bad: true, tag: "Overconfident leap",
    why: "The chatbot's own CSAT is 61%, below average. 'Clearly' hides a weak inference." },
  { s: "Three agents resigned in Q3, which likely contributed to slower responses.", bad: false,
    why: "Reasonable and properly hedged ('likely')." },
  { s: "Older agents seem slower to adopt new tools and should be prioritised for replacement.", bad: true, tag: "Bias",
    why: "There is no age data in the source. This is a stereotype, and it is a discrimination risk if you act on it." },
  { s: "The escalated case of Budi Santoso (0812-5550-1234) should be shown to the board as an example.", bad: true, tag: "Privacy leak",
    why: "The customer's personal data does not belong in a board memo. Anonymise it." },
  { s: "We recommend a joint fix with Logistics at the Surabaya warehouse, the root of 38% of complaints.", bad: false,
    why: "Grounded in the data and actionable." },
  { s: "Hiring 5 more agents will cut response time by exactly 50% next quarter.", bad: true, tag: "False precision",
    why: "Nothing in the data supports 'exactly 50%'. Precise-sounding numbers are not evidence." },
  { s: "We suggest re-testing the chatbot on simple order-status queries, with a human handoff for complaints.", bad: false,
    why: "A sensible human-in-the-loop design." },
];

// ---------- Mission 3: Workflow Orchestrator ----------
// h = hours if fully manual; ideal = best autonomy level; stakes 0..1 = harm if AI gets it wrong unchecked.
const WF_BUDGET = 120;
const WF_TIME = { HUMAN: 1, ASSIST: 0.7, REVIEW: 0.35, AUTO: 0.1 }; // share of manual hours still spent by people
const WORKFLOW = [
  { t: "Write job descriptions", h: 16, ideal: "REVIEW", stakes: 0.3,
    why: "AI drafts quickly; check that the requirements are real and the language is inclusive." },
  { t: "Screen 600 applications", h: 100, ideal: "REVIEW", stakes: 0.9,
    why: "Huge volume, so let AI rank against clear criteria. High stakes, so humans review the shortlist and audit for bias." },
  { t: "Schedule interviews", h: 20, ideal: "AUTO", stakes: 0.1,
    why: "Pure logistics. Let AI run it and handle exceptions as they come." },
  { t: "Answer candidate questions", h: 30, ideal: "AUTO", stakes: 0.3,
    why: "An AI assistant grounded in an approved FAQ, with escalation to a human for anything off-script." },
  { t: "Run interviews", h: 60, ideal: "ASSIST", stakes: 0.7,
    why: "Humans connect and judge. AI prepares question banks and structures the notes." },
  { t: "Make the final hiring decisions", h: 10, ideal: "HUMAN", stakes: 1,
    why: "Accountability for people decisions stays with people." },
  { t: "Prepare offer letters & onboarding plans", h: 14, ideal: "REVIEW", stakes: 0.5,
    why: "AI personalises templates; HR checks the salary and legal terms." },
];

// Pure scoring for Mission 3: plan = array of mode keys, one per WORKFLOW step.
function scoreWorkflow(plan) {
  let hours = 0, manual = 0, q = 0, risk = 0, riskMax = 0;
  WORKFLOW.forEach((st, i) => {
    const m = plan[i], gap = MODES[m].lvl - MODES[st.ideal].lvl;
    hours += st.h * WF_TIME[m]; manual += st.h;
    q += Math.max(0, 1 - 0.3 * Math.abs(gap));
    risk += st.stakes * Math.max(0, gap); riskMax += st.stakes; // one level too autonomous on every step = 100
  });
  return {
    hours: Math.round(hours),
    saved: Math.round(100 * (1 - hours / manual)),
    quality: Math.round(100 * q / WORKFLOW.length),
    risk: Math.min(100, Math.round(100 * risk / riskMax)),
    onTime: hours <= WF_BUDGET,
  };
}

// ---------- Mission 4: Pledge ----------
const PLEDGE_DELEGATE = [
  "Meeting notes & follow-ups", "First drafts of emails and reports", "Data cleaning & first-pass analysis",
  "Research summaries", "Slide outlines", "Translation", "Brainstorming options", "Routine customer replies",
];
const PLEDGE_SKILL = [
  "Critical judgment", "Empathy & relationships", "Ethical reasoning", "Creative framing",
  "Systems thinking", "Storytelling & influence", "Coaching others",
];
const PLEDGE_GUARD = [
  "Verify every number against its source", "Never paste confidential data into public AI",
  "Disclose when AI helped", "Name a human owner for every AI output",
];

// Orchestrator archetype from total autonomy bias (chosen minus ideal) and accuracy (0..1).
function archetype(bias, acc) {
  if (bias >= 3) return { k: "Accelerator", d: "You lean towards automating, which brings speed. Your growth edge: add checkpoints where the stakes are high." };
  if (bias <= -3) return { k: "Guardian", d: "You protect quality and trust. Your growth edge: hand more low-stakes work to AI and free up your time." };
  if (acc >= 0.7) return { k: "Conductor", d: "You match the level of AI autonomy to the stakes. That is orchestration." };
  return { k: "Explorer", d: "Your instincts are forming. Practise asking 'what is the cost if this is wrong?' before you delegate." };
}

if (typeof module !== "undefined") module.exports = { MODES, TRIAGE, AUDIT, WORKFLOW, WF_BUDGET, scoreWorkflow, archetype };
