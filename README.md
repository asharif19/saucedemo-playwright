# SauceDemo Automation Suite

Browser automation suite for [SauceDemo](https://www.saucedemo.com/) built with **TypeScript** and **Playwright Test**.
Submitted for the LAUIH QA Automation Engineer technical assignment.

| Document | Purpose |
|---|---|
| [TEST_PLAN.md](./TEST_PLAN.md) | Scenario-to-test mapping, risks, expected results, automation status |
| [BUG_REPORT.md](./BUG_REPORT.md) | Exploratory findings for `problem_user` (A7) |

## Prerequisites

- Node.js 18 or newer (developed on Node 24, Playwright 1.64)
- npm (ships with Node)
- Internet access to `https://www.saucedemo.com`

## Installation

```bash
npm ci
npx playwright install --with-deps
```

`--with-deps` installs OS libraries on Linux CI images. On Windows and macOS `npx playwright install` is sufficient.

## Running the suite

| Command | What it does |
|---|---|
| `npm test` | Runs the whole suite headless on Chromium |
| `npm run test:headed` | Same, with a visible browser |
| `npm run test:ui` | Opens the Playwright UI mode for interactive runs |
| `npm run test:debug` | Runs with the Playwright Inspector attached |
| `npm run test:exploratory` | Runs only the `problem_user` exploratory tests (A7) |
| `npm run report` | Opens the HTML report from the last run |
| `npm run typecheck` | `tsc --noEmit` over tests and sources |
| `npm run lint` | ESLint with `typescript-eslint` (bans `any`) |

Useful variations:

```bash
npx playwright test tests/checkout            # one folder
npx playwright test --grep @smoke             # tagged subset
npx playwright test --repeat-each 3           # stability check
CROSS_BROWSER=1 npm test                      # adds Firefox + WebKit projects
```

On PowerShell set environment variables with `$env:CROSS_BROWSER = "1"` before running `npm test`.

### Expected result

Playwright reports `15 passed`. Two of those are **expected failures** (shown with an `x` in the list
reporter and under "Expected" in the HTML report). They live in `tests/exploratory/` and
assert the correct behaviour against `problem_user`, where known defects exist (see `BUG_REPORT.md`).
They are marked with `test.fail()` so the run stays green while the defects remain tracked in code. If a
defect is fixed, Playwright flags the test as an unexpected pass, which is the cue to remove the marker.

## Project structure

```
.
├── playwright.config.ts        baseURL, timeouts, reporters, trace/screenshot policy, projects
├── tsconfig.json               strict TypeScript + path aliases (@pages, @fixtures, @data, @utils)
├── eslint.config.mjs           lint rules (no-explicit-any is an error)
├── src/
│   ├── pages/                  page objects: LoginPage, InventoryPage, CartPage, CheckoutPage, BasePage
│   ├── components/             HeaderComponent (cart link/badge, burger menu, logout)
│   ├── fixtures/test.ts        custom `test` with page-object fixtures and `authenticatedPage`
│   ├── data/                   users, products, checkout customer, tax rate
│   └── utils/money.ts          parseMoney, roundMoney, sum, isSortedAscending
└── tests/
    ├── auth/login.spec.ts          A1, A2
    ├── inventory/sorting.spec.ts   A3
    ├── cart/cart.spec.ts           A4
    ├── checkout/checkout.spec.ts   A5
    ├── session/session.spec.ts     A6
    └── exploratory/problem-user.spec.ts   A7
```

## Design choices

**Page objects expose locators, not assertions.** Each page object holds `Locator` fields and small
intent-level actions (`login`, `addToCart`, `getOrderSummary`). Assertions stay in the tests so a reader
sees the expected outcome where the scenario is described, and locators are defined once.

**Fixtures over `beforeEach`.** `src/fixtures/test.ts` extends Playwright's `test` with one fixture per
page object and an `authenticatedPage` fixture that logs in as `user` (default `standard_user`). A spec
can switch users with `test.use({ user: users.problem })`. Every test receives a fresh browser context
from Playwright, which is what guarantees isolation: cookies and `localStorage` (where SauceDemo keeps
its cart) never survive across tests.

**No shared `storageState`.** Login on SauceDemo takes well under a second. Reusing a saved session
would save little and would make isolation depend on correct cleanup. Keeping the login per test keeps
isolation explicit and the suite trivially parallel-safe.

**Locators.** `testIdAttribute` is set to `data-test`, the stable attribute SauceDemo ships, so
`page.getByTestId('inventory-item-price')` is used for data elements. User-facing locators
(`getByRole('button', { name: 'Login' })`, `getByPlaceholder('Username')`) are used for interactive
controls. No CSS class chains or XPath.

**Numbers are parsed, not string-compared.** `parseMoney` turns `"Item total: $53.97"` into `53.97`
and throws on anything unparseable. Sorting is verified by comparing the parsed array against a
numerically sorted copy, and checkout totals are recomputed from the cart lines (`sum`, 8% `TAX_RATE`)
and compared with `toBeCloseTo`. The overview is also checked for internal consistency
(`itemTotal + tax == total`) so the assertion does not rest on the tax assumption alone.

**Synchronisation.** Only web-first assertions (`expect(locator).toHaveText/.toHaveValue/.toBeHidden`)
are used. After a sort, the test waits for the first price to equal the known minimum before reading
the whole list, which proves the re-render happened without any sleep. There is no
`page.waitForTimeout` anywhere in the suite.

**Failure evidence.** `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, one local retry
(two on CI), and an HTML reporter in `playwright-report/`. Video is off to keep runs fast.

**Type safety.** `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` and friends are on. Test data is
declared `as const satisfies Record<string, Product>` so it is both literal-typed and shape-checked.
There is no `any` in the codebase and ESLint enforces that.

**Exploratory defects live in code.** `tests/exploratory/problem-user.spec.ts` encodes the two defects
from `BUG_REPORT.md` as tests that assert the correct behaviour and are marked `test.fail()`. The
suite stays green, the defects remain executable documentation, and a fix is detected automatically.

## Assumptions

- SauceDemo's catalogue of 6 products and their prices are stable; `src/data/products.ts` mirrors them
  and a catalogue change surfaces as a clear assertion failure rather than a silent pass.
- The flat 8% sales tax observed on the overview page is the intended business rule.
- `secret_sauce` is the password for every user (overridable with `SAUCE_PASSWORD`).
- The public site is reachable from the reviewer's machine. There is no offline mode.

## Known limitations

- The suite runs against a public shared site, so network latency is the main source of variance.
  Timeouts are generous (30 s per test, 10 s per action) and one retry is enabled locally.
- Firefox and WebKit are opt-in (`CROSS_BROWSER=1`) and were smoke-checked, not fully validated.
- `problem_user` has more anomalies than the two reported (for example broken product images and
  inert add-to-cart buttons on some items). They are noted in `BUG_REPORT.md` but only the two most
  impactful were turned into tests, in line with the "one reproducible defect" scope of A7.
- No visual regression or accessibility checks are included; both would be natural next steps.
