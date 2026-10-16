# SauceDemo Automation Suite

Browser automation suite for [SauceDemo](https://www.saucedemo.com/) built with **TypeScript** and **Playwright Test**.
Submitted for the LAUIH QA Automation Engineer technical assignment.

| Document | Purpose |
|---|---|
| [TEST_PLAN.md](./TEST_PLAN.md) | Scenario-to-test mapping, risks, expected results, automation status |
| [BUG_REPORT.md](./BUG_REPORT.md) | Exploratory findings for `problem_user` (A7) |

## Prerequisites

- Node.js 20 or newer (Playwright 1.64 requires it; developed on Node 24)
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

Playwright reports `15 passed`. Thirteen are the core scenarios A1 to A6. The other two live in
`tests/exploratory/` and are **defect reproductions** for `problem_user`: each asserts the buggy
behaviour documented in `BUG_REPORT.md` and passes while the defect exists. If one of them fails, either
the defect was fixed (promote the test to the core suite) or the reproduction broke, and both deserve a
human look.

### Continuous integration

`.github/workflows/ci.yml` runs typecheck, lint and the Chromium suite on every push and pull request,
and uploads `playwright-report/` as an artifact. `playwright.config.ts` raises retries to 2 and caps
workers at 2 when `CI` is set.

## Project structure

```
.
├── .github/workflows/ci.yml    GitHub Actions: typecheck, lint, test, upload report
├── playwright.config.ts        baseURL, timeouts, reporters, trace/screenshot policy, projects
├── tsconfig.json               strict TypeScript + path aliases (@pages, @components, @fixtures, @data, @utils)
├── eslint.config.mjs           type-aware lint: no-explicit-any and no-floating-promises are errors
├── src/
│   ├── pages/                  page objects: LoginPage, InventoryPage, CartPage, CheckoutPage, BasePage
│   ├── components/             HeaderComponent (cart link/badge, burger menu, logout)
│   ├── fixtures/test.ts        custom `test` with page-object fixtures and `authenticatedPage`
│   ├── data/                   users, products, checkout customer, tax rate
│   └── utils/money.ts          parseMoney, roundMoney, sum, sortAscending, sortDescending
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
are used. Non-retrying reads such as `locator.all()` or `allTextContents()` are always preceded by a
retrying assertion on the same elements (for example `toHaveCount`), so the read never races the
render. After a sort, the test waits for the first price to equal the known minimum before reading the
whole list. There is no `page.waitForTimeout` anywhere in the suite, and ESLint's
`no-floating-promises` rule makes a forgotten `await` a lint error.

**Failure evidence.** `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, one local retry
(two on CI), and an HTML reporter in `playwright-report/`. Video is off to keep runs fast.

**Type safety.** `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` and friends are on. Test data is
declared `as const satisfies Record<string, Product>` so it is both literal-typed and shape-checked.
There is no `any` in the codebase and ESLint enforces that.

**Exploratory defects live in code.** `tests/exploratory/problem-user.spec.ts` encodes the two defects
from `BUG_REPORT.md` as reproduction tests that assert the observed buggy behaviour. I chose this over
`test.fail()` deliberately: an expected-failure marker would also swallow unrelated failures such as a
login timeout, whereas a reproduction test goes red for exactly two reasons, the bug was fixed or the
reproduction broke. Each test carries an `issue` annotation pointing at the report.

**Long flows use `test.step`.** Checkout and logout are split into named steps so the HTML report and
trace viewer show where a failure happened without reading the code.

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
  impactful were turned into reproduction tests, in line with the "one reproducible defect" scope of A7.
- The reproduction tests pass while the bugs exist, which is intentional but means a casual glance at
  the report does not reveal open defects. The `@exploratory` tag and `issue` annotations make them
  easy to spot and filter.
- No visual regression or accessibility checks are included; both would be natural next steps.
