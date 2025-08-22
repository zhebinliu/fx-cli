CLI Plugin Development Task Checklist (Low → High Difficulty)

Project Setup
  1.	Initialize a TypeScript + oclif project
  2.	Configure build tools (tsc/tsup), linting, formatting, and testing framework (vitest/jest)
  3.	Set up basic CI pipeline (run lint, test, and build)

⸻

Configuration Management
  4.	Implement config file read/write (~/.fxk/config.json)
  5.	Support multiple profiles (set/get/use)
  6.	Unit tests: config save, load, and switch profiles

⸻

HTTP Client
  7.	Create a centralized axios wrapper with baseURL, timeout, and User-Agent
  8.	Define unified response & error models (parse errorCode, errorMessage)
  9.	Add logging & debugging flags (--verbose, --debug)

⸻

Authentication Module
  10.	auth login: call /cgi/corpAccessToken/get/V2, cache corpAccessToken and corpId
  11.	auth status: show current profile, token, and expiry time
  12.	auth logout: clear cached tokens
  13.	Token auto-refresh logic (renew before expiry)

⸻

Object Operations Module
  14.	obj create: support standard object API
  15.	obj create --custom: support custom object API
  16.	obj get <id>: fetch a single record
  17.	obj update <id>: update a record
  18.	obj delete <id>: delete a record
  19.	Implement list/search with pagination
  20.	Unit tests covering full CRUD lifecycle (mocked + optional live API)

⸻

Organization & User Module
  21.	dept list: fetch department list
  22.	user list --dept <id>: list users in a department
  23.	user get <id>: fetch user details

⸻

Utilities & Enhancements
  24.	Output formatting: table / JSON options
  25.	Add retry & backoff mechanism (429 / 5xx handling)
  26.	Support idempotency keys (optional)
  27.	Implement pipe command to run a sequence of actions

⸻

Security & Optimization
  28.	Secure credential storage (environment variables / OS keychain support)
  29.	Log sanitization for sensitive values
  30.	Error messages internationalization (EN / CN)

⸻

Delivery & Distribution
  31.	Package CLI as a global npm binary
  32.	Publish to npm registry / private registry
  33.	Write documentation (README + usage examples)
  34.	Integrate into CI/CD pipeline (test, build, publish automation)