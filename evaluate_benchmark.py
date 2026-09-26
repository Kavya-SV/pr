"""
Benchmark Evaluation of Bayesian Inference against RCAEval (RE1-OB)
Evaluates:
- Top-1 Diagnostic Accuracy
- Top-3 Diagnostic Accuracy
- Mean Reciprocal Rank (MRR)
"""

import json
import pandas as pd
import numpy as np

# Load learned CPT
with open('rcaeval_learned_cpt.json', 'r') as f:
    cpts = json.load(f)

# Mapping RCAEval fault names to our Bayesian Root Cause names
fault_to_rc = {
    'cpu': 'traffic_spike',      # CPU overload / Traffic burst
    'mem': 'memory_leak',        # Memory leak
    'delay': 'dependency_failure', # Downstream microservice delay
    'loss': 'network_failure',   # Network packet loss
    'disk': 'db_overload'        # DB / Disk contention
}

rc_to_fault = {v: k for k, v in fault_to_rc.items()}

# Priors from RCAEval: each fault has equal 20% in the benchmark
prior_rc = {
    'traffic_spike': 0.20,
    'memory_leak': 0.20,
    'db_overload': 0.20,
    'dependency_failure': 0.20,
    'network_failure': 0.20
}

# Run Bayesian evaluation on the extracted evidence records
from learn_rcaeval_cpt import df_evidence

top1_correct = 0
top3_correct = 0
reciprocal_ranks = []
results = []

symptom_keys = [
    'high_cpu', 'high_memory', 'db_slow', 'high_request_rate',
    'packet_loss', 'dependency_error', 'high_latency', 'errors_5xx',
    'request_timeout', 'user_complaints'
]

for idx, row in df_evidence.iterrows():
    gt_fault = row['ground_truth_fault']
    gt_rc = fault_to_rc[gt_fault]

    # Observed evidence dict
    evidence = {k: bool(row[k]) for k in symptom_keys if row[k]}

    # Bayesian Posterior calculation: P(RC | Evidence)
    posteriors = {}
    for rc, fault_name in rc_to_fault.items():
        prior = prior_rc[rc]
        likelihood = 1.0
        cpt_row = cpts[fault_name]
        for sym, is_active in evidence.items():
            p_sym_given_fault = cpt_row.get(sym, 0.05)
            # Laplace smoothing so zero probability doesn't zero out completely
            p_sym_given_fault = max(0.04, min(0.96, p_sym_given_fault))
            likelihood *= p_sym_given_fault if is_active else (1.0 - p_sym_given_fault)
        posteriors[rc] = prior * likelihood

    total_lik = sum(posteriors.values())
    if total_lik > 0:
        for rc in posteriors:
            posteriors[rc] /= total_lik

    # Rank hypotheses
    ranked = sorted(posteriors.items(), key=lambda x: x[1], reverse=True)
    ranked_rcs = [r[0] for r in ranked]

    is_top1 = (ranked_rcs[0] == gt_rc)
    is_top3 = (gt_rc in ranked_rcs[:3])
    rank = ranked_rcs.index(gt_rc) + 1
    rr = 1.0 / rank

    if is_top1: top1_correct += 1
    if is_top3: top3_correct += 1
    reciprocal_ranks.append(rr)

    results.append({
        'case': row['case'],
        'ground_truth': gt_rc,
        'predicted_top1': ranked_rcs[0],
        'top1_confidence': round(ranked[0][1] * 100, 1),
        'rank': rank
    })

n_cases = len(df_evidence)
top1_acc = (top1_correct / n_cases) * 100
top3_acc = (top3_correct / n_cases) * 100
mrr = np.mean(reciprocal_ranks)

benchmark_report = {
    'total_cases_evaluated': n_cases,
    'top1_accuracy': round(top1_acc, 1),
    'top3_accuracy': round(top3_acc, 1),
    'mean_reciprocal_rank': round(mrr, 3),
    'benchmark_dataset': 'RCAEval (RE1-OB: Online Boutique)'
}

print("\n=======================================================")
print("  RCAEVAL BENCHMARK EVALUATION RESULTS (BAYESIAN RCA)   ")
print("=======================================================")
print(f"Total Evaluated Failure Cases: {benchmark_report['total_cases_evaluated']}")
print(f"Top-1 Diagnostic Accuracy:     {benchmark_report['top1_accuracy']}%")
print(f"Top-3 Diagnostic Accuracy:     {benchmark_report['top3_accuracy']}%")
print(f"Mean Reciprocal Rank (MRR):    {benchmark_report['mean_reciprocal_rank']}")
print("=======================================================\n")

with open('rcaeval_benchmark_results.json', 'w') as f:
    json.dump(benchmark_report, f, indent=2)

print("Saved benchmark results to rcaeval_benchmark_results.json")
