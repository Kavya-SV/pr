/**
 * EMPIRICALLY TRAINED BAYESIAN MODEL PARAMETERS
 * Trained directly on the RCAEval Benchmark (735 cases across Online Boutique, Sock Shop, Train Ticket)
 * ZERO hardcoded numbers. All priors, CPTs, weights, and leak rates are mathematically learned.
 */

export const TRAINED_MODEL_PARAMS = {
  "metadata": {
    "totalCases": 735,
    "trainCases": 586,
    "valCases": 71,
    "testCases": 78,
    "split": "80% Train, 10% Validation, 10% Test",
    "trainTop1Acc": 49.3,
    "trainTop3Acc": 87.2,
    "trainMRR": 0.689,
    "valTop1Acc": 47.9,
    "valTop3Acc": 87.3,
    "valMRR": 0.677,
    "testTop1Acc": 44.9,
    "testTop3Acc": 82.1,
    "testMRR": 0.646
  },
  "priors": {
    "traffic_spike": 0.198,
    "memory_leak": 0.1809,
    "dependency_failure": 0.198,
    "network_failure": 0.2253,
    "db_overload": 0.198
  },
  "cpts": {
    "traffic_spike": {
      "high_cpu": 0.9017,
      "high_memory": 0.3889,
      "db_slow": 0.3547,
      "high_request_rate": 0.1581,
      "packet_loss": 0.0043,
      "dependency_error": 0.1496,
      "high_latency": 0.8162,
      "errors_5xx": 0.3803,
      "request_timeout": 0.5427,
      "user_complaints": 0.8077
    },
    "memory_leak": {
      "high_cpu": 0.9579,
      "high_memory": 0.9486,
      "db_slow": 0.3318,
      "high_request_rate": 0.1636,
      "packet_loss": 0.0047,
      "dependency_error": 0.3318,
      "high_latency": 0.9486,
      "errors_5xx": 0.5841,
      "request_timeout": 0.7523,
      "user_complaints": 0.9299
    },
    "dependency_failure": {
      "high_cpu": 0.4573,
      "high_memory": 0.1239,
      "db_slow": 0.2949,
      "high_request_rate": 0.0812,
      "packet_loss": 0.3632,
      "dependency_error": 0.2094,
      "high_latency": 0.953,
      "errors_5xx": 0.3718,
      "request_timeout": 0.859,
      "user_complaints": 0.9359
    },
    "network_failure": {
      "high_cpu": 0.6203,
      "high_memory": 0.2594,
      "db_slow": 0.2519,
      "high_request_rate": 0.1015,
      "packet_loss": 0.1241,
      "dependency_error": 0.2068,
      "high_latency": 0.9511,
      "errors_5xx": 0.3421,
      "request_timeout": 0.8609,
      "user_complaints": 0.8759
    },
    "db_overload": {
      "high_cpu": 0.8932,
      "high_memory": 0.5171,
      "db_slow": 0.235,
      "high_request_rate": 0.2009,
      "packet_loss": 0.0128,
      "dependency_error": 0.2265,
      "high_latency": 0.859,
      "errors_5xx": 0.312,
      "request_timeout": 0.4231,
      "user_complaints": 0.5769
    }
  },
  "intermediateWeights": {
    "inter_cpu_strain": {
      "traffic_spike": 0.902,
      "memory_leak": 0.958,
      "db_overload": 0.893
    },
    "inter_db_strain": {
      "db_overload": 0.235,
      "traffic_spike": 0.355
    },
    "inter_mem_saturation": {
      "memory_leak": 0.949,
      "traffic_spike": 0.389
    },
    "inter_downstream_strain": {
      "dependency_failure": 0.979,
      "network_failure": 0.951
    },
    "inter_transport_drop": {
      "network_failure": 0.861,
      "traffic_spike": 0.543
    }
  },
  "leakProbabilities": {
    "inter_cpu_strain": 0.033,
    "inter_db_strain": 0.038,
    "inter_mem_saturation": 0.039,
    "inter_downstream_strain": 0.037,
    "inter_transport_drop": 0.037
  },
  "symptomWeights": {
    "high_cpu": {
      "traffic_spike": 0.9017,
      "memory_leak": 0.9579,
      "dependency_failure": 0.4573,
      "network_failure": 0.6203,
      "db_overload": 0.8932
    },
    "high_memory": {
      "traffic_spike": 0.3889,
      "memory_leak": 0.9486,
      "dependency_failure": 0.1239,
      "network_failure": 0.2594,
      "db_overload": 0.5171
    },
    "db_slow": {
      "traffic_spike": 0.3547,
      "memory_leak": 0.3318,
      "dependency_failure": 0.2949,
      "network_failure": 0.2519,
      "db_overload": 0.235
    },
    "high_request_rate": {
      "traffic_spike": 0.1581,
      "memory_leak": 0.1636,
      "dependency_failure": 0.0812,
      "network_failure": 0.1015,
      "db_overload": 0.2009
    },
    "packet_loss": {
      "traffic_spike": 0.0043,
      "memory_leak": 0.0047,
      "dependency_failure": 0.3632,
      "network_failure": 0.1241,
      "db_overload": 0.0128
    },
    "dependency_error": {
      "traffic_spike": 0.1496,
      "memory_leak": 0.3318,
      "dependency_failure": 0.2094,
      "network_failure": 0.2068,
      "db_overload": 0.2265
    },
    "high_latency": {
      "traffic_spike": 0.8162,
      "memory_leak": 0.9486,
      "dependency_failure": 0.953,
      "network_failure": 0.9511,
      "db_overload": 0.859
    },
    "errors_5xx": {
      "traffic_spike": 0.3803,
      "memory_leak": 0.5841,
      "dependency_failure": 0.3718,
      "network_failure": 0.3421,
      "db_overload": 0.312
    },
    "request_timeout": {
      "traffic_spike": 0.5427,
      "memory_leak": 0.7523,
      "dependency_failure": 0.859,
      "network_failure": 0.8609,
      "db_overload": 0.4231
    },
    "user_complaints": {
      "traffic_spike": 0.8077,
      "memory_leak": 0.9299,
      "dependency_failure": 0.9359,
      "network_failure": 0.8759,
      "db_overload": 0.5769
    }
  }
};
