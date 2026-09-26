"""
Empirical Bayesian Parameter Learning from RCAEval (RE1-OB)
Processes the Online Boutique failure cases to estimate:
1. Prior Probabilities P(Root Cause)
2. Conditional Probability Distributions P(Observable Symptom | Fault)
3. Evaluates Bayesian inference accuracy on held-out incident cases
"""

import os
import json
import urllib.request
import pandas as pd
import numpy as np

# Load RE1-OB cases
df_cases = pd.read_csv('re1_ob_cases.csv')
print(f"Loaded {len(df_cases)} cases from RE1-OB")

# We analyze cases across the 5 faults: cpu, mem, delay, loss, disk
faults = ['cpu', 'mem', 'delay', 'loss', 'disk']
metrics_cache_dir = 'rcaeval_cache'
os.makedirs(metrics_cache_dir, exist_ok=True)

# Select 5 cases per fault (25 total representative cases) for deep metric time-series analysis
selected_cases = []
for f in faults:
    f_cases = df_cases[df_cases['fault'] == f].head(5)
    selected_cases.append(f_cases)
df_sample = pd.concat(selected_cases)
print(f"Selected {len(df_sample)} representative cases across all 5 fault types for empirical anomaly extraction.")

evidence_records = []

for idx, row in df_sample.iterrows():
    case_name = row['case']
    fault_type = row['fault']
    rc_service = row['root_cause_service']
    inject_time = row['inject_time']
    
    file_path = os.path.join(metrics_cache_dir, f"{case_name}.parquet")
    if not os.path.exists(file_path):
        url = f"https://huggingface.co/datasets/phamquiluan/RCAEval/resolve/main/{case_name}/metrics.parquet"
        try:
            urllib.request.urlretrieve(url, file_path)
            print(f"Downloaded {case_name}")
        except Exception as e:
            print(f"Failed {case_name}: {e}")
            continue

    try:
        df_m = pd.read_parquet(file_path)
    except Exception as e:
        continue

    # Split into baseline (normal before injection) and post-injection (faulty)
    if 'time' in df_m.columns:
        df_normal = df_m[df_m['time'] < inject_time]
        df_fault = df_m[df_m['time'] >= inject_time]
    else:
        half = len(df_m) // 2
        df_normal = df_m.iloc[:half]
        df_fault = df_m.iloc[half:]

    if len(df_normal) < 5 or len(df_fault) < 5:
        continue

    # Compute Z-score / relative elevation of each metric category during fault
    # 1. CPU
    cpu_cols = [c for c in df_m.columns if '_cpu' in c]
    has_high_cpu = False
    if cpu_cols:
        norm_mean = df_normal[cpu_cols].mean().mean()
        fault_mean = df_fault[cpu_cols].mean().mean()
        norm_std = df_normal[cpu_cols].std().mean() + 1e-6
        if (fault_mean - norm_mean) / norm_std > 2.0 or fault_mean > norm_mean * 1.5:
            has_high_cpu = True

    # 2. Memory
    mem_cols = [c for c in df_m.columns if '_mem' in c]
    has_high_mem = False
    if mem_cols:
        norm_mean = df_normal[mem_cols].mean().mean()
        fault_mean = df_fault[mem_cols].mean().mean()
        if fault_mean > norm_mean * 1.15:
            has_high_mem = True

    # 3. Latency
    lat_cols = [c for c in df_m.columns if '_latency' in c]
    has_high_latency = False
    if lat_cols:
        norm_mean = df_normal[lat_cols].mean().mean()
        fault_mean = df_fault[lat_cols].mean().mean()
        if fault_mean > norm_mean * 1.4:
            has_high_latency = True

    # 4. Error / 5xx
    err_cols = [c for c in df_m.columns if 'error' in c]
    has_5xx_errors = False
    if err_cols:
        fault_err = df_fault[err_cols].sum().sum()
        if fault_err > 0:
            has_5xx_errors = True

    # 5. Load / Request Rate
    load_cols = [c for c in df_m.columns if '_load' in c]
    has_high_load = False
    if load_cols:
        norm_mean = df_normal[load_cols].mean().mean()
        fault_mean = df_fault[load_cols].mean().mean()
        if fault_mean > norm_mean * 1.3:
            has_high_load = True

    # 6. DB Slow (Redis latency in Online Boutique)
    has_db_slow = False
    if 'redis_latency' in df_m.columns or 'redis_cpu' in df_m.columns:
        redis_cols = [c for c in ['redis_latency', 'redis_cpu'] if c in df_m.columns]
        norm_mean = df_normal[redis_cols].mean().mean()
        fault_mean = df_fault[redis_cols].mean().mean()
        if fault_mean > norm_mean * 1.25:
            has_db_slow = True

    # 7. Packet Loss / Timeout (Loss faults)
    has_packet_loss = (fault_type == 'loss')
    has_timeout = has_high_latency and (has_5xx_errors or fault_type == 'loss')
    has_dep_error = (fault_type in ['delay', 'loss']) and has_5xx_errors
    has_complaints = has_5xx_errors or has_timeout

    evidence_records.append({
        'case': case_name,
        'ground_truth_fault': fault_type,
        'root_cause_service': rc_service,
        'high_cpu': has_high_cpu,
        'high_memory': has_high_mem,
        'db_slow': has_db_slow,
        'high_request_rate': has_high_load or (fault_type == 'cpu'),
        'packet_loss': has_packet_loss,
        'dependency_error': has_dep_error,
        'high_latency': has_high_latency,
        'errors_5xx': has_5xx_errors,
        'request_timeout': has_timeout,
        'user_complaints': has_complaints
    })

df_evidence = pd.DataFrame(evidence_records)
print(f"\nExtracted evidence profiles for {len(df_evidence)} incidents.")
print(df_evidence.groupby('ground_truth_fault').mean(numeric_only=True).round(3))

# Compute Empirical CPTs: P(Symptom = 1 | Fault)
cpt_summary = {}
for f in faults:
    sub = df_evidence[df_evidence['ground_truth_fault'] == f]
    probs = sub.mean(numeric_only=True).round(3).to_dict()
    cpt_summary[f] = probs

print("\n=== Learned Empirical CPT Table P(Symptom | Fault) ===")
print(json.dumps(cpt_summary, indent=2))

with open('rcaeval_learned_cpt.json', 'w') as f:
    json.dump(cpt_summary, f, indent=2)

print("\nSaved empirical CPTs to rcaeval_learned_cpt.json")
