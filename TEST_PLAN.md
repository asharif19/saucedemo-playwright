# Test Plan

Application under test: https://www.saucedemo.com/
Primary browser: Chromium (Firefox and WebKit optional via `CROSS_BROWSER=1`).
Users: `standard_user` for A1 to A6, `locked_out_user` for A2, `problem_user` for A7. Password `secret_sauce`.

## Scope and approach

- Every scenario is an independent Playwright test with its own browser context. No test depends on
  another and the suite runs fully parallel.
- Assertions target user-visible outcomes and parsed values (prices, totals, quantities), not URLs or
  raw strings alone. URL checks are used in addition to, never instead of, content checks.
- Priorities follow the assignment: A1 to A6 are Core, A7 is QA reasoning.

## Scenario mapping

| ID | Scenario | Purpose | Risk if broken | Expected result | Test (file › name) | Status |
|---|---|---|---|---|---|---|
| A1 | Successful login | Prove the happy path into the store works | Nobody can shop | Inventory page at `/inventory.html` with title "Products", product list visible, 6 items, cart link present | `auth/login.spec.ts` › standard_user logs in and sees the inventory page with the full product list | Automated, passing |
| A2 | Rejected login (locked out) | Prove access control rejects a locked account | Locked accounts could still buy | Error "Sorry, this user has been locked out." shown, URL stays `/`, product list and cart link absent | `auth/login.spec.ts` › locked_out_user is rejected with a visible error and stays on the login page | Automated, passing |
| A2 | Rejected login (wrong password) | Second invalid path with a different error | Credential mismatch accepted | "Username and password do not match" error, no inventory | `auth/login.spec.ts` › wrong password is rejected with a credential mismatch error | Automated, passing |
| A2 | Deep link without session | Authenticated routes refuse anonymous access | Session bypass by URL | Redirect to `/` with "You can only access '/inventory.html' when you are logged in." | `auth/login.spec.ts` › visiting the inventory URL without logging in redirects to login | Automated, passing |
| A3 | Product sorting (low to high) | Verify the price sort produces numerically ascending prices | Customers mis-ordered by price, lost trust | Select shows `lohi`; parsed prices are ascending and are a permutation of the original prices | `inventory/sorting.spec.ts` › sorting by price low to high orders every displayed price ascending | Automated, passing |
| A3 | Product sorting (high to low) | Symmetric check of the other price order | Same as above | Parsed prices equal the descending sort of the original list | `inventory/sorting.spec.ts` › sorting by price high to low orders every displayed price descending | Automated, passing |
| A4 | Cart behaviour | Add two specific products and verify badge and cart contents | Wrong items or prices carried into checkout | Badge reads 1 then 2; cart shows exactly Backpack ($29.99, qty 1) and Bike Light ($9.99, qty 1) | `cart/cart.spec.ts` › adding two products updates the badge and the cart lists correct names, prices and quantities | Automated, passing |
| A4 | Cart removal | Removing from the cart page updates badge and lines | Stale cart contents | One line left, badge reads 1, remaining line matches the kept product | `cart/cart.spec.ts` › removing a product from the cart page updates the badge and the remaining lines | Automated, passing |
| A5 | Checkout | Complete checkout and verify totals and confirmation | Customers charged wrong amounts | Item total = sum of cart lines, tax = 8% of item total, total = item total + tax (all compared numerically to 2 dp); "Thank you for your order!" shown; badge cleared | `checkout/checkout.spec.ts` › completing checkout shows a correct item total, tax and final total, then confirms the order | Automated, passing |
| A5 | Checkout validation | Required-field validation on the information step | Orders without customer details | "First Name is required" error, URL stays on step one | `checkout/checkout.spec.ts` › checkout information step rejects submission when the first name is missing | Automated, passing |
| A6 | Logout | Logout ends the session | Shared-device exposure | Back on `/`, login form empty, cart link gone, `session-username` cookie absent, deep link refused | `session/session.spec.ts` › logging out returns to the login page and blocks access to authenticated pages | Automated, passing |
| A6 | Isolation (dirty test) | A test that leaves cart items must not affect others | Order-dependent flakiness | Test ends with 2 items in cart and no cleanup | `session/session.spec.ts` › a test that leaves items in the cart does not affect other tests | Automated, passing |
| A6 | Isolation (clean start) | Each test starts with a predictable state | Hidden coupling between tests | Badge hidden, sort is `az`, names alphabetical, all buttons read "Add to cart", `localStorage` cart empty | `session/session.spec.ts` › every test starts with a fresh session, empty cart and default sort order | Automated, passing |
| A7 | Exploratory (`problem_user`) | Explore checkout and sorting with the problem account | Defects reach customers | Documented in `BUG_REPORT.md`: BUG-001 checkout blocked, BUG-002 sort inert | `exploratory/problem-user.spec.ts` › BUG-001 reproduction, BUG-002 reproduction | Automated as defect reproductions (pass while the bug exists), defects reported |

## Isolation strategy

Playwright creates a fresh browser context per test, which clears cookies and `localStorage`.
SauceDemo keeps its cart in `localStorage` and the session in a cookie, so nothing persists between
tests without any explicit cleanup. The two A6 isolation tests prove this: one pollutes the cart and
ends, the other asserts a clean start, and `fullyParallel: true` means their order is not guaranteed.
Running `npx playwright test --repeat-each 3` exercises the same guarantee repeatedly.

## Evidence on failure

HTML report (`playwright-report/`), trace (`retain-on-failure`) and screenshot (`only-on-failure`) are
configured in `playwright.config.ts`. One retry locally, two on CI. Multi-screen flows (A5, A6) are
broken into `test.step` blocks so the report pinpoints the failing step. The GitHub Actions workflow
uploads the report as an artifact on every run.

## Out of scope

Visual regression, accessibility audit, performance, and the remaining SauceDemo personas
(`performance_glitch_user`, `error_user`, `visual_user`).
