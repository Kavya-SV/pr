# BayesRCA — Probabilistic Root Cause Analysis System

A modern, responsive web application for automated incident diagnostics using a 3-tier **Bayesian Belief Network (DAG)**.

---

## 🚀 Features

### 1. Dashboard — Incident Input
- Clean interactive checklist of **10 observable incident symptoms**:
  - High CPU
  - High Memory
  - DB Slow
  - High Request Rate
  - Packet Loss
  - Dependency Error
  - High Latency
  - 5xx Errors
  - Request Timeout
  - User Complaints
- Live symptom selection counter and keyboard shortcut (`Ctrl` + `Enter`).
- Quick scenario preset selectors: *Traffic Surge*, *Database Deadlock*, *Memory Leak*, *Downstream Outage*, *Network Degradation*.

### 2. Exact Bayesian Inference Engine
- Implements mathematically grounded exact inference over a multi-layered causal DAG:
  $$\text{Layer 1: Root Causes (Hypotheses)} \longrightarrow \text{Layer 2: Intermediate Propagation} \longrightarrow \text{Layer 3: Observable Evidence}$$
- Computes posterior conditional probabilities $P(\text{RootCause}_i \mid \text{Evidence})$ using Noisy-OR parametrization and marginalization.
- **Percentages are dynamically computed** (not hardcoded) based on the exact combination of symptoms selected.

### 3. Interactive Bayesian Network Visualization (DAG)
- Rich SVG-based DAG visualization displaying all 3 layers.
- Active causal edges animate with pulsing particle dashes along the propagation paths.
- Selected evidence nodes highlight in glowing emerald with verified badges.
- Zoom & pan toolbar controls (Zoom In, Zoom Out, Reset).

### 4. Root Cause Probability Ranking
- Displays ranked posterior probabilities with prior comparisons $P(H)$ and color-coded severity meters (Critical, Elevated, Moderate, Low).
- Shows that probabilities are independent posterior hypotheses (can overlap or sum to arbitrary totals depending on multi-fault conditions).

### 5. "Why this probability?" (Explainable AI Breakdown)
- Clearly explains the causal attribution for each root cause:
  $$\text{Evidence contributing to this probability} \longrightarrow [\checkmark \text{High CPU}, \checkmark \text{High Latency}, \dots]$$

### 6. Selected Evidence Summary
- Shows a concise, traceable summary of all observed symptoms inputted by the user.

### 7. Actionable Recommended Investigation Steps
- Prioritized checklist of concrete engineering triage steps for the highest-ranked root cause.
- Convenient **"Copy Checklist"** button to paste recommendations directly into Slack, Jira, or incident war rooms.
- Framed strictly as **actionable recommendations and investigation guidance** (MTTD reduction).

### 8. Dashboard Incident Statistics
- **Total Incidents Analyzed**
- **High Severity Incidents**
- **Average Diagnosis / Analysis Time** (not resolution time)

### 9. Workflow & Persistence
- **`← New Incident Analysis`** button to return to the input screen seamlessly.
- **Incident Run History Log** drawer to review previous diagnostic runs.
- **Export Incident Report** as structured Markdown (`.md`).

---

## 🛠️ Running Locally

The application runs directly in any modern browser without heavy build steps.

To start the local development server:

```bash
# Python
python -m http.server 3000

# Or Node.js
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.
