import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  duration: '30s',
  iterations: 1000,
  vus: 100, // Virtual users
};

const BASE_URL = __ENV.BASE_URL || 'http://ludora-api:2424';

export default function () {
  // Make a POST request to login endpoint
  const loginPayload = JSON.stringify({
    email: 'yuji.itadori@hotmail.fr',
    password: 'Yuji398!',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${BASE_URL}/auth-b2c/login`, loginPayload, params);

  // Check if the request was successful
  check(response, {
    'login status is 201': (r) => r.status === 201,
    'response has access token': (r) => {
      const body = JSON.parse(r.body);
      return body.data && body.data.accessToken;
    },
  });

  // Log response for debugging (optional)
  if (response.status !== 201) {
    console.log(`Login failed: ${response.status} - ${response.body}`);
  }

  // Sleep for 1 second to simulate real-world usage
  sleep(1);
}
