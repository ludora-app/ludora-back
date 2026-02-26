import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics pour l'analyse des goulots
const loginDuration = new Trend('login_duration', true);
const errorRate = new Rate('errors');
const throttlingErrors = new Counter('throttling_errors'); // 429 Too Many Requests
const timeoutErrors = new Counter('timeout_errors'); // Timeouts
const serverErrors = new Counter('server_errors'); // 5xx
const clientErrors = new Counter('client_errors'); // 4xx (sauf 429)

// Configuration des SLOs
const SLO_P95_DURATION_MS = 300; // 300ms pour p95
const SLO_ERROR_RATE = 0.01; // 1% d'erreur max

const BASE_URL = __ENV.BASE_URL || 'http://ludora-api:2424';
const TEST_TYPE = __ENV.TEST_TYPE || 'smoke'; // 'smoke', 'stress-stages', 'stress-arrival-rate'

// Configuration du smoke test
const smokeTestConfig = {
  duration: '60s', // Smoke test court: 30-60 secondes
  vus: 10, // 5-10 VUs pour un smoke test
};

// Configuration du stress test avec stages
const stressStagesConfig = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp-up: 0 à 100 VUs en 2 min
    { duration: '5m', target: 100 }, // Stabilité: 100 VUs pendant 5 min
    { duration: '2m', target: 200 }, // Augmentation: 100 à 200 VUs en 2 min
    { duration: '5m', target: 200 }, // Stabilité: 200 VUs pendant 5 min
    { duration: '2m', target: 300 }, // Augmentation: 200 à 300 VUs en 2 min
    { duration: '5m', target: 300 }, // Stabilité: 300 VUs pendant 5 min
    { duration: '2m', target: 0 }, // Ramp-down: 300 à 0 VUs en 2 min
  ],
};

// Configuration du stress test avec arrival-rate (RPS constant)
const stressArrivalRateConfig = {
  scenarios: {
    constant_arrival_rate: {
      duration: '10m',
      executor: 'constant-arrival-rate',
      maxVUs: 500, // Maximum de VUs si nécessaire
      preAllocatedVUs: 100, // VUs pré-alloués
      rate: 50, // 50 requêtes par seconde
      timeUnit: '1s',
    },
  },
};

// Sélection de la configuration selon TEST_TYPE
let options = {};

switch (TEST_TYPE) {
  case 'smoke':
    options = smokeTestConfig;
    break;
  case 'stress-stages':
    options = stressStagesConfig;
    break;
  case 'stress-arrival-rate':
    options = stressArrivalRateConfig;
    break;
  default:
    options = smokeTestConfig;
}

// Thresholds alignés avec les SLOs
options.thresholds = {
  // Durée des requêtes HTTP
  http_req_duration: [
    `p(95)<${SLO_P95_DURATION_MS}`, // 95% des requêtes < 300ms
    `p(99)<${SLO_P95_DURATION_MS * 2}`, // 99% des requêtes < 600ms
    'avg<200', // Moyenne < 200ms
  ],
  // Taux d'erreur
  errors: [`rate<${SLO_ERROR_RATE}`], // < 1% d'erreur (custom metric)
  http_req_failed: [`rate<${SLO_ERROR_RATE}`], // < 1% d'erreur
  // Durée spécifique du login
  login_duration: [`p(95)<${SLO_P95_DURATION_MS}`, `p(99)<${SLO_P95_DURATION_MS * 2}`],
  // Vérification que les checks passent
  checks: ['rate>0.99'], // > 99% des checks doivent passer
};

export { options };

export default function () {
  const startTime = Date.now();

  // Make a POST request to login endpoint
  const loginPayload = JSON.stringify({
    email: 'yuji.itadori@hotmail.fr',
    password: 'Yuji398!',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      endpoint: '/auth-b2c/login',
      name: 'Login',
    },
  };

  const response = http.post(`${BASE_URL}/auth-b2c/login`, loginPayload, params);
  const duration = Date.now() - startTime;

  // Enregistrer la durée pour l'analyse
  loginDuration.add(duration);

  // Check if the request was successful
  const checks = check(response, {
    'login status is 201': (r) => r.status === 201,
    'response has access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data?.accessToken;
      } catch {
        return false;
      }
    },
    'response time < 300ms': (r) => r.timings.duration < SLO_P95_DURATION_MS,
  });

  // Enregistrer les erreurs avec catégorisation
  if (!checks || response.status !== 201) {
    errorRate.add(1);

    // Catégoriser les erreurs pour l'analyse
    if (response.status === 429) {
      throttlingErrors.add(1);
    } else if (response.status === 0 || response.timings.duration > 30000) {
      timeoutErrors.add(1);
    } else if (response.status >= 500) {
      serverErrors.add(1);
    } else if (response.status >= 400) {
      clientErrors.add(1);
    }

    // Log détaillé seulement pour les erreurs critiques
    if (response.status === 429 || response.status >= 500) {
      console.log(`Login failed: ${response.status} - ${response.body?.substring(0, 100)}`);
    }
  } else {
    errorRate.add(0);
  }

  // Sleep pour simuler un comportement réaliste (variable selon le type de test)
  if (TEST_TYPE === 'stress-arrival-rate') {
    // Pas de sleep pour arrival-rate, le rate est contrôlé par k6
  } else {
    sleep(Math.random() * 2 + 0.5); // Sleep aléatoire entre 0.5 et 2.5s
  }
}

// Fonction pour l'analyse post-test (à utiliser avec k6 cloud ou résultats)
export function handleSummary(data) {
  const summary = {
    // Métriques principales
    http_req_duration: {
      avg: data.metrics.http_req_duration.values.avg,
      max: data.metrics.http_req_duration.values.max,
      p95: data.metrics.http_req_duration.values['p(95)'],
      p99: data.metrics.http_req_duration.values['p(99)'],
    },
    http_req_failed: {
      fails: data.metrics.http_req_failed.values.fails,
      passes: data.metrics.http_req_failed.values.passes,
      rate: data.metrics.http_req_failed.values.rate,
    },
    login_duration: {
      avg: data.metrics.login_duration?.values?.avg || 0,
      p95: data.metrics.login_duration?.values?.['p(95)'] || 0,
      p99: data.metrics.login_duration?.values?.['p(99)'] || 0,
    },
    // Vérification des SLOs
    slo_compliance: {
      error_rate_ok: (data.metrics.http_req_failed.values.rate || 0) < SLO_ERROR_RATE,
      p95_duration_ok: (data.metrics.http_req_duration.values['p(95)'] || 0) < SLO_P95_DURATION_MS,
    },
    // Statistiques générales
    iterations: data.metrics.iterations.values,
    vus: {
      avg: data.metrics.vus.values.avg,
      max: data.metrics.vus_max.values.max,
    },
  };

  // Analyse détaillée des erreurs
  const throttlingCount = data.metrics.throttling_errors?.values?.count || 0;
  const timeoutCount = data.metrics.timeout_errors?.values?.count || 0;
  const serverErrorCount = data.metrics.server_errors?.values?.count || 0;
  const clientErrorCount = data.metrics.client_errors?.values?.count || 0;

  // Log pour l'analyse des goulots
  console.log('\n=== ANALYSE DES GOULOTS ===');
  console.log(`P95 Duration: ${summary.http_req_duration.p95}ms (SLO: <${SLO_P95_DURATION_MS}ms)`);
  console.log(
    `Error Rate: ${(summary.http_req_failed.rate * 100).toFixed(2)}% (SLO: <${SLO_ERROR_RATE * 100}%)`,
  );
  console.log(`Max VUs: ${summary.vus.max}`);
  console.log(`Total Iterations: ${summary.iterations.count}`);
  console.log('\n=== RÉPARTITION DES ERREURS ===');
  console.log(`Throttling (429): ${throttlingCount} erreurs`);
  console.log(`Timeouts: ${timeoutCount} erreurs`);
  console.log(`Server Errors (5xx): ${serverErrorCount} erreurs`);
  console.log(`Client Errors (4xx): ${clientErrorCount} erreurs`);

  // Alertes spécifiques selon le type d'erreur
  if (!summary.slo_compliance.p95_duration_ok) {
    console.log(
      '\n⚠️  ALERTE: P95 dépasse le SLO - Vérifier: DB queries, pool size, N+1 queries, index manquants',
    );
  }
  if (!summary.slo_compliance.error_rate_ok) {
    if (throttlingCount > 0) {
      console.log(
        '\n🔴 CRITIQUE: Throttling détecté - Augmenter la limite ou désactiver pour les tests',
      );
    }
    if (timeoutCount > 0) {
      console.log('\n🔴 CRITIQUE: Timeouts détectés - Vérifier: DB pool, CPU, réseau');
    }
    if (serverErrorCount > 0) {
      console.log('\n🔴 CRITIQUE: Erreurs serveur - Vérifier: CPU, mémoire, logs serveur');
    }
    if (throttlingCount === 0 && timeoutCount === 0 && serverErrorCount === 0) {
      console.log(
        "\n⚠️  ALERTE: Taux d'erreur dépasse le SLO - Vérifier: CPU, mémoire, cache, logs",
      );
    }
  }

  return {
    stdout: JSON.stringify(summary, null, 2),
  };
}
