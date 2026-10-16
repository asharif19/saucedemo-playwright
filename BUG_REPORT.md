# Bug Report: exploratory check with `problem_user`

Environment: https://www.saucedemo.com/, Chromium (Playwright 1.64 bundled build), Windows 11, 2026-10-16.
Account: `problem_user` / `secret_sauce`.

## Area explored and why

I chose the **checkout flow** as the risk area. It is the revenue path, it chains several screens, and
the information step is the only place where the user types free text, which makes it a likely place
for input-handling defects. While getting there I also exercised **product sorting** and
**add to cart**, since the cart is a prerequisite for checkout.

Both defects below are reproduced automatically in `tests/exploratory/problem-user.spec.ts`
(`npm run test:exploratory`). Those tests assert the observed buggy behaviour and pass while the defect
exists; a failure means the defect was fixed or the reproduction no longer holds.

---

## BUG-001: Last name typed at checkout is written into the First Name field, blocking checkout

**Severity:** High (purchase cannot be completed)  **Priority:** P1
**Reproducibility:** 100% (manual, and automated on every suite run)

### Steps to reproduce

1. Log in as `problem_user` / `secret_sauce`.
2. Click "Add to cart" on Sauce Labs Backpack, open the cart, click "Checkout".
3. On "Checkout: Your Information" type `Ada` in First Name, `Lovelace` in Last Name, `1815` in Zip/Postal Code.
4. Observe the field values, then click "Continue".

### Expected result

First Name shows `Ada`, Last Name shows `Lovelace`, Zip shows `1815`, and Continue navigates to
"Checkout: Overview" (`/checkout-step-two.html`).

### Actual result

- First Name shows `Lovelace` (the last-name keystrokes replaced it).
- Last Name stays empty.
- Zip shows `1815`.
- Continue shows the error "Error: Last Name is required" and the user remains on
  `/checkout-step-one.html`. There is no way to complete the purchase.

### Evidence

Automated reproduction: `tests/exploratory/problem-user.spec.ts` › BUG-001. Observed values from the
run used to write this report:

```
firstName = "Lovelace"   lastName = ""   postalCode = "1815"
URL after Continue = /checkout-step-one.html
error = "Error: Last Name is required"
```

### Notes for the developer

The behaviour is consistent with the Last Name input's change handler updating the first-name state
key. The same test passes for `standard_user`, so the defect is scoped to the `problem_user`
persona's code path.

---

## BUG-002: Price sorting has no effect on the inventory page

**Severity:** Medium (feature inert, no data loss)  **Priority:** P2
**Reproducibility:** 100%

### Steps to reproduce

1. Log in as `problem_user`.
2. On the Products page, change the sort dropdown to "Price (low to high)".

### Expected result

The dropdown shows the selected option and the list re-orders to `$7.99, $9.99, $15.99, $15.99, $29.99, $49.99`.

### Actual result

The dropdown snaps back to "Name (A to Z)" and the order stays
`$29.99, $9.99, $15.99, $49.99, $7.99, $15.99`. The same happens for every other sort option.

### Evidence

Automated reproduction: `tests/exploratory/problem-user.spec.ts` › BUG-002.

---

## Other observations (not filed as separate defects)

| Observation | Detail |
|---|---|
| Broken product images | All six product cards render the same `sl-404` placeholder image instead of the product photo. Cosmetic but very visible. |
| Inert add-to-cart buttons | "Add to cart" on Sauce Labs Fleece Jacket (and some other items) does nothing: badge stays at its previous count and the button never changes to "Remove". Backpack works. This would deserve its own ticket if the persona were a real customer segment. |

## Conclusion

The area checked (checkout, with sorting and cart as prerequisites) contains at least one blocking,
fully reproducible defect for `problem_user` (BUG-001). All of the above behave correctly for
`standard_user`, which is covered by the core suite (A1 to A6).
