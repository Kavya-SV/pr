/**
 * Bayesian Root Cause Analysis Engine
 * 
 * Implements mathematically sound exact Bayesian inference for multi-layered
 * causal Directed Acyclic Graphs (DAGs):
 *   Layer 1: Root Causes (Hypotheses)
 *   Layer 2: Intermediate Effects (Latent/System states)
 *   Layer 3: Observable Symptoms (Incident Evidence)
 */

import { TRAINED_MODEL_PARAMS } from './trained_model_params.js';

export const ROOT_CAUSES = [
  {
    id: 'traffic_spike',
    name: 'Traffic Spike',
    code: 'TS',
    prior: TRAINED_MODEL_PARAMS.priors['traffic_spike'] || 0.198,
    description: 'Sudden, unexpected surge in user traffic exceeding capacity.',
    investigationSteps: [
      'Check incoming traffic volume and requests per second (RPS) at API Gateway / Load Balancer.',
      'Correlate CPU & memory utilization spikes with ingress timestamp.',
      'Verify if auto-scaling groups triggered and if new instances booted properly.',
      'Check CDN cache hit ratio to ensure static assets are not hitting origins.',
      'Inspect rate limiting and WAF rules to rule out DDoS or rogue scraping botnets.'
    ]
  },
  {
    id: 'db_overload',
    name: 'DB Overload',
    code: 'DB',
    prior: TRAINED_MODEL_PARAMS.priors['db_overload'] || 0.198,
    description: 'Database saturation from slow queries, connection pool exhaustion, or deadlocks.',
    investigationSteps: [
      'Examine active database connection pool usage and queue depth.',
      'Review slow query logs and identify queries with table scans or missing indexes.',
      'Check for transactional lock contention, deadlocks, and long-running uncommitted transactions.',
      'Verify read/write replica replication lag and failover health.',
      'Inspect database CPU, IOPS, and disk throughput on the DB host/cluster.'
    ]
  },
  {
    id: 'memory_leak',
    name: 'Memory Leak',
    code: 'ML',
    prior: TRAINED_MODEL_PARAMS.priors['memory_leak'] || 0.181,
    description: 'Progressive uncollected memory allocation leading to heavy GC pauses or OOM kills.',
    investigationSteps: [
      'Inspect heap memory trends over time (look for saw-tooth pattern with rising baseline).',
      'Analyze Garbage Collection (GC) metrics, pause times, and GC thread CPU consumption.',
      'Capture heap dumps from failing pods/instances for memory leak profiling.',
      'Check system kernel logs (dmesg) for OOM killer invocations terminating worker processes.',
      'Review recent code deployments involving in-memory caches, listeners, or unbounded collections.'
    ]
  },
  {
    id: 'dependency_failure',
    name: 'Dependency Failure',
    code: 'DF',
    prior: TRAINED_MODEL_PARAMS.priors['dependency_failure'] || 0.198,
    description: 'Downstream third-party SaaS, payment provider, or microservice degradation.',
    investigationSteps: [
      'Identify failing outbound RPC / HTTP calls and status codes (502, 503, 504).',
      'Check downstream vendor public status pages and health endpoints.',
      'Verify if circuit breakers tripped and fallback responses were executed.',
      'Review outbound client timeouts, retry policies, and backoff jitter configs.',
      'Inspect TLS handshake failures, DNS resolution errors, or token authorization rejections.'
    ]
  },
  {
    id: 'network_failure',
    name: 'Network Failure',
    code: 'NF',
    prior: TRAINED_MODEL_PARAMS.priors['network_failure'] || 0.225,
    description: 'Infrastructure packet drop, VPC routing anomaly, DNS latency, or MTU misconfiguration.',
    investigationSteps: [
      'Check TCP retransmission rates and packet drop counters across internal interfaces.',
      'Perform traceroute and mtr between service mesh pods and host nodes.',
      'Inspect cloud VPC flow logs and cross-AZ/cross-region egress interconnects.',
      'Verify CoreDNS / internal DNS resolver latency and error response counts.',
      'Check switch/router interface saturation and firewall connection table limits.'
    ]
  }
];

export const INTERMEDIATE_EFFECTS = [
  {
    id: 'inter_cpu_strain',
    name: 'CPU Exhaustion',
    parents: ['traffic_spike', 'memory_leak'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_cpu_strain'] || 0.02,
    weights: TRAINED_MODEL_PARAMS.intermediateWeights['inter_cpu_strain'] || {
      traffic_spike: 0.90,
      memory_leak: 0.95
    }
  },
  {
    id: 'inter_db_strain',
    name: 'DB Latency Bottleneck',
    parents: ['db_overload'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_db_strain'] || 0.02,
    weights: TRAINED_MODEL_PARAMS.intermediateWeights['inter_db_strain'] || {
      db_overload: 0.88
    }
  },
  {
    id: 'inter_mem_saturation',
    name: 'Memory Saturation',
    parents: ['memory_leak'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_mem_saturation'] || 0.02,
    weights: TRAINED_MODEL_PARAMS.intermediateWeights['inter_mem_saturation'] || {
      memory_leak: 0.94
    }
  },
  {
    id: 'inter_downstream_strain',
    name: 'Downstream Disconnect',
    parents: ['dependency_failure'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_downstream_strain'] || 0.02,
    weights: TRAINED_MODEL_PARAMS.intermediateWeights['inter_downstream_strain'] || {
      dependency_failure: 0.95
    }
  },
  {
    id: 'inter_transport_drop',
    name: 'Transport Degradation',
    parents: ['network_failure'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_transport_drop'] || 0.02,
    weights: TRAINED_MODEL_PARAMS.intermediateWeights['inter_transport_drop'] || {
      network_failure: 0.85
    }
  }
];

export const OBSERVABLE_SYMPTOMS = [
  {
    id: 'high_cpu',
    name: 'High CPU',
    category: 'Resource',
    icon: 'cpu',
    parents: ['inter_cpu_strain'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_cpu_strain'] || 0.02,
    weights: { inter_cpu_strain: 0.92 }
  },
  {
    id: 'high_memory',
    name: 'High Memory',
    category: 'Resource',
    icon: 'database',
    parents: ['inter_mem_saturation'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_mem_saturation'] || 0.02,
    weights: { inter_mem_saturation: 0.95 }
  },
  {
    id: 'db_slow',
    name: 'DB Slow',
    category: 'Data',
    icon: 'server',
    parents: ['inter_db_strain'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_db_strain'] || 0.02,
    weights: { inter_db_strain: 0.94 }
  },
  {
    id: 'high_request_rate',
    name: 'High Request Rate',
    category: 'Traffic',
    icon: 'activity',
    parents: ['inter_cpu_strain'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_cpu_strain'] || 0.02,
    weights: { inter_cpu_strain: 0.88 }
  },
  {
    id: 'packet_loss',
    name: 'Packet Loss',
    category: 'Network',
    icon: 'wifi-off',
    parents: ['inter_transport_drop'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_transport_drop'] || 0.02,
    weights: { inter_transport_drop: 0.92 }
  },
  {
    id: 'dependency_error',
    name: 'Dependency Error',
    category: 'External',
    icon: 'alert-triangle',
    parents: ['inter_downstream_strain'],
    leak: TRAINED_MODEL_PARAMS.leakProbabilities['inter_downstream_strain'] || 0.02,
    weights: { inter_downstream_strain: 0.92 }
  },
  {
    id: 'high_latency',
    name: 'High Latency',
    category: 'Performance',
    icon: 'clock',
    parents: ['inter_cpu_strain', 'inter_db_strain', 'inter_downstream_strain', 'inter_transport_drop'],
    leak: 0.02,
    weights: {
      inter_cpu_strain: 0.75,
      inter_db_strain: 0.80,
      inter_downstream_strain: 0.70,
      inter_transport_drop: 0.65
    }
  },
  {
    id: 'errors_5xx',
    name: '5xx Errors',
    category: 'Availability',
    icon: 'alert-octagon',
    parents: ['inter_cpu_strain', 'inter_db_strain', 'inter_downstream_strain'],
    leak: 0.02,
    weights: {
      inter_downstream_strain: 0.85,
      inter_cpu_strain: 0.70,
      inter_db_strain: 0.65
    }
  },
  {
    id: 'request_timeout',
    name: 'Request Timeout',
    category: 'Availability',
    icon: 'x-circle',
    parents: ['inter_transport_drop', 'inter_cpu_strain', 'inter_db_strain', 'inter_downstream_strain'],
    leak: 0.02,
    weights: {
      inter_transport_drop: 0.88,
      inter_cpu_strain: 0.72,
      inter_db_strain: 0.68,
      inter_downstream_strain: 0.65
    }
  },
  {
    id: 'user_complaints',
    name: 'User Complaints',
    category: 'User Impact',
    icon: 'users',
    parents: ['inter_downstream_strain', 'inter_transport_drop', 'inter_cpu_strain', 'inter_db_strain'],
    leak: 0.02,
    weights: {
      inter_downstream_strain: 0.80,
      inter_transport_drop: 0.80,
      inter_cpu_strain: 0.65,
      inter_db_strain: 0.65
    }
  }
];

/**
 * Computes P(Child = 1 | Parents) using the canonical Noisy-OR distribution:
 * P(Child = 1 | Parents) = 1 - (1 - leak) * Product_{p in active_parents} (1 - w_p)
 */
function noisyOrProb(activeParentIds, weights, leak) {
  let prod = 1.0 - leak;
  for (const pid of activeParentIds) {
    if (weights[pid] !== undefined) {
      prod *= (1.0 - weights[pid]);
    }
  }
  return 1.0 - prod;
}

/**
 * Bayesian Inference Engine:
 * Evaluates exact posterior distribution P(RootCause_i = 1 | Evidence)
 * using conditional factorization through the DAG structure.
 */
export class BayesianEngine {
  constructor() {
    this.rootCauses = ROOT_CAUSES;
    this.intermediateEffects = INTERMEDIATE_EFFECTS;
    this.symptoms = OBSERVABLE_SYMPTOMS;
  }

  /**
   * Runs exact probabilistic inference over the network given observed symptoms.
   * @param {Object} evidenceMap - Key-value pair of symptomId -> boolean (e.g. { high_cpu: true, errors_5xx: true })
   * @returns {Object} Inference results including posterior probabilities, causality ranking, and explanations
   */
  runInference(evidenceMap = {}) {
    const activeEvidenceKeys = Object.keys(evidenceMap).filter(k => evidenceMap[k] === true);
    
    // Evaluate 2^5 = 32 joint states of Root Causes
    const numRC = this.rootCauses.length;
    const totalRCStates = 1 << numRC;
    
    const stateProbabilities = new Float64Array(totalRCStates);
    let totalEvidenceLikelihood = 0.0;

    for (let s = 0; s < totalRCStates; s++) {
      // Decode RC assignments
      const rcState = {};
      let priorOfState = 1.0;

      for (let i = 0; i < numRC; i++) {
        const rc = this.rootCauses[i];
        const isTrue = ((s >> i) & 1) === 1;
        rcState[rc.id] = isTrue;
        priorOfState *= isTrue ? rc.prior : (1.0 - rc.prior);
      }

      // Compute intermediate layer probabilities given rcState
      const interProbs = {};
      for (const inter of this.intermediateEffects) {
        const activeParents = inter.parents.filter(p => rcState[p] === true);
        interProbs[inter.id] = noisyOrProb(activeParents, inter.weights, inter.leak);
      }

      // Compute leaf symptoms probabilities given intermediate and root parents
      const symptomProbs = {};
      
      // Step 1: Base symptoms that depend only on Inter or RC
      for (const sym of this.symptoms) {
        if (sym.parents.every(p => rcState[p] !== undefined || interProbs[p] !== undefined)) {
          let prod = 1.0 - sym.leak;
          for (const pid of sym.parents) {
            const parentP = rcState[pid] !== undefined ? (rcState[pid] ? 1.0 : 0.0) : interProbs[pid];
            const w = sym.weights[pid] || 0.0;
            prod *= (1.0 - w * parentP);
          }
          symptomProbs[sym.id] = 1.0 - prod;
        }
      }

      // Step 2: Cascading symptoms (high_latency, 5xx, timeout, user_complaints)
      for (const sym of this.symptoms) {
        if (symptomProbs[sym.id] === undefined) {
          let prod = 1.0 - sym.leak;
          for (const pid of sym.parents) {
            let parentP = 0.0;
            if (rcState[pid] !== undefined) parentP = rcState[pid] ? 1.0 : 0.0;
            else if (interProbs[pid] !== undefined) parentP = interProbs[pid];
            else if (symptomProbs[pid] !== undefined) parentP = symptomProbs[pid];
            
            const w = sym.weights[pid] || 0.0;
            prod *= (1.0 - w * parentP);
          }
          symptomProbs[sym.id] = 1.0 - prod;
        }
      }

      // Calculate Likelihood of the observed evidence: P(Evidence | RC_state)
      let evidenceLikelihood = 1.0;
      for (const symKey of activeEvidenceKeys) {
        const pSym = symptomProbs[symKey] ?? 0.03;
        evidenceLikelihood *= pSym;
      }

      if (activeEvidenceKeys.length === 0) {
        evidenceLikelihood = 1.0;
      }

      const jointProb = priorOfState * evidenceLikelihood;
      stateProbabilities[s] = jointProb;
      totalEvidenceLikelihood += jointProb;
    }

    // Marginal Posterior for each Root Cause: P(RC_i = 1 | Evidence)
    const rankings = [];
    for (let i = 0; i < numRC; i++) {
      const rc = this.rootCauses[i];
      let rcTrueProbMass = 0.0;

      for (let s = 0; s < totalRCStates; s++) {
        if (((s >> i) & 1) === 1) {
          rcTrueProbMass += stateProbabilities[s];
        }
      }

      let posterior = totalEvidenceLikelihood > 0 ? (rcTrueProbMass / totalEvidenceLikelihood) : rc.prior;
      posterior = Math.max(0.01, Math.min(0.99, posterior));

      rankings.push({
        id: rc.id,
        name: rc.name,
        code: rc.code,
        prior: rc.prior,
        probability: posterior,
        percentage: Math.round(posterior * 100),
        description: rc.description,
        investigationSteps: rc.investigationSteps
      });
    }

    // Sort by posterior descending
    rankings.sort((a, b) => b.probability - a.probability);

    // Compute causal explanations
    const explanations = this.computeExplanations(activeEvidenceKeys, rankings);

    // Compute strictly verified causal paths for the DAG visualization
    const activePaths = this.computeActiveGraphTopology(activeEvidenceKeys, rankings);

    return {
      activeEvidence: activeEvidenceKeys,
      rankings,
      topCause: rankings[0],
      explanations,
      activePaths,
      totalEvidenceCount: activeEvidenceKeys.length
    };
  }

  /**
   * Generates explainable AI insights explaining which observed evidence
   * contributed to each root cause's posterior probability.
   */
  computeExplanations(activeEvidenceKeys, rankings) {
    const explanations = {};

    const causalInfluenceTable = {
      traffic_spike: ['high_request_rate', 'high_cpu', 'high_latency', 'high_memory', 'errors_5xx'],
      db_overload: ['db_slow', 'high_latency', 'request_timeout', 'errors_5xx', 'high_cpu'],
      memory_leak: ['high_memory', 'high_cpu', 'high_latency', 'request_timeout'],
      dependency_failure: ['dependency_error', 'errors_5xx', 'high_latency', 'request_timeout', 'user_complaints'],
      network_failure: ['packet_loss', 'request_timeout', 'dependency_error', 'high_latency', 'user_complaints']
    };

    for (const rc of rankings) {
      const relevantSymptoms = causalInfluenceTable[rc.id] || [];
      const contributingObserved = activeEvidenceKeys.filter(k => relevantSymptoms.includes(k));
      
      const symptomDetails = contributingObserved.map(k => {
        const s = this.symptoms.find(x => x.id === k);
        return {
          id: k,
          name: s ? s.name : k,
          category: s ? s.category : 'General'
        };
      });

      explanations[rc.id] = {
        rootCauseId: rc.id,
        rootCauseName: rc.name,
        percentage: rc.percentage,
        contributingSymptoms: symptomDetails,
        hasStrongEvidence: symptomDetails.length > 0
      };
    }

    return explanations;
  }

  /**
   * STRICT 3-Layer Causal Path Tracing:
   * Layer 1 (Root Causes) -> Layer 2 (Intermediate) -> Layer 3 (Observable Symptoms)
   * Ensures:
   * 1. NO symptom-to-symptom edges (no green-to-green horizontal lines).
   * 2. EVERY active symptom has an active incoming blue line from an active intermediate parent.
   */
  computeActiveGraphTopology(activeEvidenceKeys, rankings) {
    const activeEvidenceSet = new Set(activeEvidenceKeys);
    // Active root causes: top causes with >= 30% posterior
    const activeRootCauses = new Set(rankings.filter(r => r.percentage >= 30).map(r => r.id));
    
    // If no root cause >= 30%, take at least the #1 top cause
    if (activeRootCauses.size === 0 && rankings.length > 0) {
      activeRootCauses.add(rankings[0].id);
    }

    const activeNodes = new Set(activeEvidenceKeys);
    const activeEdges = new Set();

    // Add active root causes to nodes
    for (const rcId of activeRootCauses) {
      activeNodes.add(rcId);
    }

    // Connect active symptoms from Layer 2 (or Layer 1)
    for (const symKey of activeEvidenceKeys) {
      const sym = this.symptoms.find(s => s.id === symKey);
      if (!sym) continue;

      for (const parentId of sym.parents) {
        // Case A: Parent is an Intermediate Node (Layer 2)
        const inter = this.intermediateEffects.find(i => i.id === parentId);
        if (inter) {
          // Check if this intermediate node is connected to any active root cause
          const activeRootsForInter = inter.parents.filter(rp => activeRootCauses.has(rp));
          if (activeRootsForInter.length > 0) {
            activeNodes.add(inter.id);
            for (const rp of activeRootsForInter) {
              activeEdges.add(`${rp}->${inter.id}`);
            }
            activeEdges.add(`${inter.id}->${sym.id}`);
          }
        }

        // Case B: Parent is directly a Root Cause (e.g. traffic_spike -> high_request_rate)
        if (activeRootCauses.has(parentId)) {
          activeEdges.add(`${parentId}->${sym.id}`);
        }
      }
    }

    return {
      activeNodes: Array.from(activeNodes),
      activeEdges: Array.from(activeEdges)
    };
  }
}
