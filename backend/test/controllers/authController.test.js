const assert = require("node:assert/strict");
const { test } = require("node:test");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { login } = require("../../controllers/authController");

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function createRequest(body, queryResult = { rows: [] }) {
  let queryCalls = 0;

  const request = {
    body,
    app: {
      locals: {
        pool: {
          async query(...args) {
            queryCalls += 1;
            request.queryArgs = args;
            return queryResult;
          },
        },
      },
    },
    get queryCalls() {
      return queryCalls;
    },
  };

  return request;
}

test("returns 400 when email or password is missing", async () => {
  const request = createRequest({ email: "staff@example.com" });
  const response = createResponse();

  await login(request, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    message: "Email and password are required",
  });
  assert.equal(request.queryCalls, 0);
});

test("returns 401 when the user does not exist", async () => {
  const request = createRequest({
    email: "unknown@example.com",
    password: "password",
  });
  const response = createResponse();

  await login(request, response);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, {
    message: "Invalid email or password",
  });
  assert.deepEqual(request.queryArgs[1], ["unknown@example.com"]);
});

test("returns 401 when the password is incorrect", async () => {
  const passwordHash = await bcrypt.hash("correct-password", 4);
  const user = {
    id: 1,
    name: "Staff User",
    email: "staff@example.com",
    password_hash: passwordHash,
    role: "staff",
  };
  const request = createRequest(
    { email: user.email, password: "wrong-password" },
    { rows: [user] }
  );
  const response = createResponse();

  await login(request, response);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, {
    message: "Invalid email or password",
  });
});

test("returns 500 when JWT_SECRET is not configured", async () => {
  const passwordHash = await bcrypt.hash("correct-password", 4);
  const user = {
    id: 1,
    name: "Staff User",
    email: "staff@example.com",
    password_hash: passwordHash,
    role: "staff",
  };
  const request = createRequest(
    { email: user.email, password: "correct-password" },
    { rows: [user] }
  );
  const response = createResponse();
  const originalSecret = process.env.JWT_SECRET;
  const originalConsoleError = console.error;

  delete process.env.JWT_SECRET;
  console.error = () => {};

  try {
    await login(request, response);
  } finally {
    console.error = originalConsoleError;
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  }

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    message: "Server configuration error",
  });
});

test("returns a signed token and safe user details for valid credentials", async () => {
  const passwordHash = await bcrypt.hash("correct-password", 4);
  const user = {
    id: 7,
    name: "Staff User",
    email: "staff@example.com",
    password_hash: passwordHash,
    role: "staff",
  };
  const request = createRequest(
    { email: user.email, password: "correct-password" },
    { rows: [user] }
  );
  const response = createResponse();
  const originalSecret = process.env.JWT_SECRET;

  process.env.JWT_SECRET = "test-jwt-secret";

  try {
    await login(request, response);
  } finally {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  }

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.message, "Login successful");
  assert.deepEqual(response.body.user, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  assert.equal(response.body.user.password_hash, undefined);

  const tokenPayload = jwt.verify(response.body.token, "test-jwt-secret");
  assert.equal(tokenPayload.userId, user.id);
  assert.equal(tokenPayload.role, user.role);
});

test("returns 500 when the database query fails", async () => {
  const request = {
    body: { email: "staff@example.com", password: "password" },
    app: {
      locals: {
        pool: {
          async query() {
            throw new Error("database unavailable");
          },
        },
      },
    },
  };
  const response = createResponse();
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await login(request, response);
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    message: "Internal server error",
  });
});
