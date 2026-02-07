import { spawn } from "child_process";

const BASE_URL = "http://localhost:3000";

async function runTest() {
  console.log("Starting verification...");

  // Helper to make requests
  const request = async (url, method, body, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return response;
  };

  // 1. Register a new user
  const username = `testuser_${Date.now()}`;
  const password = "password123";
  console.log(`\n1. Registering user: ${username}`);

  const regRes = await request("/api/auth/register", "POST", {
    username,
    password,
  });
  const regData = await regRes.json();

  if (!regRes.ok) {
    console.error("Registration failed:", regData);
    process.exit(1);
  }

  const sessionToken = regData.token;
  console.log(
    "Session Token received (starts with):",
    sessionToken.substring(0, 10) + "...",
  );

  // 2. Validate Session Token works
  console.log("\n2. Validating Session Token...");
  const validateRes = await request(
    "/api/auth/validate",
    "GET",
    null,
    sessionToken,
  );
  if (validateRes.status === 200) {
    console.log("✅ Session Token is valid.");
  } else {
    console.error(
      "❌ Session Token validation failed:",
      await validateRes.text(),
    );
    process.exit(1);
  }

  // 3. Regenerate API Token (using Session Token)
  console.log("\n3. Regenerating API Token...");
  const regenRes = await request(
    "/api/auth/regenerate-token",
    "POST",
    {},
    sessionToken,
  );
  const regenData = await regenRes.json();

  if (!regenRes.ok) {
    console.error("Regeneration failed:", regenData);
    process.exit(1);
  }

  const apiToken = regenData.token;
  console.log(
    "API Token received (starts with):",
    apiToken.substring(0, 10) + "...",
  );

  // 4. Verify Tokens are Different
  console.log("\n4. Verifying token separation...");
  if (sessionToken !== apiToken) {
    console.log("✅ Session Token and API Token are DIFFERENT.");
  } else {
    console.error(
      "❌ Session Token and API Token are the SAME! Separation failed.",
    );
    process.exit(1);
  }

  // 5. Verify API Token works for auth
  console.log("\n5. Validating API Token...");
  const apiValidateRes = await request(
    "/api/auth/validate",
    "GET",
    null,
    apiToken,
  );
  if (apiValidateRes.status === 200) {
    console.log("✅ API Token is valid for authentication.");
  } else {
    console.error(
      "❌ API Token validation failed:",
      await apiValidateRes.text(),
    );
    process.exit(1);
  }

  // 6. Login again to ensure we get a NEW Session Token, but NOT the API Token
  console.log("\n6. Logging in again...");
  const loginRes = await request("/api/auth/login", "POST", {
    username,
    password,
  });
  const loginData = await loginRes.json();
  const newSessionToken = loginData.token;

  console.log("New Session Token:", newSessionToken.substring(0, 10) + "...");

  if (newSessionToken === apiToken) {
    console.error("❌ Login returned the API Token! This is a security risk.");
    process.exit(1);
  } else {
    console.log("✅ Login did NOT return the API token.");
  }

  console.log("\n🎉 ALL CHECKS PASSED!");
}

runTest().catch(console.error);
