# PayPal Pro Plan

## Recommended Rollout

Launch the extension as free first. Keep the current Pro buttons and locked feature messages, but leave the purchase URL unset until the PayPal flow is ready.

This avoids blocking the first Chrome Web Store review on payment infrastructure while still preserving the upgrade path in the product.

## Current Pro Gating

Implemented locally:
- Free users can create up to 5 palettes.
- Some theme presets are marked as Pro.
- Custom themes are marked as Pro.
- The UI has upgrade buttons in popup and options.
- `settings.licenseStatus` supports `free` and `pro`.
- `settings.proPurchaseUrl` can open a checkout page later.

Important limitation:
The current license status is local extension state. It is fine for UI preparation, but it is not secure enough for real paid access.

## Production Payment Architecture

Use a small backend between the extension and PayPal.

Flow:
1. User clicks Upgrade Pro.
2. Extension opens your checkout or account page.
3. Website starts PayPal checkout or subscription.
4. PayPal sends webhook events to your backend.
5. Backend verifies the webhook and records the entitlement.
6. User enters an email or license key in the extension, or signs in.
7. Extension asks the backend whether the user has Pro.
8. Backend returns a signed entitlement.
9. Extension stores the entitlement and unlocks Pro.

Do not put PayPal client secrets or webhook secrets in the extension.

## PayPal Account Setup

Needed:
- PayPal business account
- Live checkout app in PayPal Developer Dashboard
- Sandbox app for testing
- Webhook endpoint on your backend
- Product and plan if using subscriptions
- Return and cancel URLs on your website

For a simple one-time Pro license, use PayPal Checkout.

For recurring Pro access, use PayPal Subscriptions.

## Backend Minimum

Endpoints:
- `POST /paypal/webhook`
- `POST /license/activate`
- `GET /license/status`

Database records:
- customer email
- PayPal customer or subscription id
- plan type
- status
- created date
- updated date
- optional license key

Webhook events to handle:
- checkout completed or order approved for one-time purchases
- subscription activated
- subscription cancelled
- subscription payment failed
- refund or dispute events

## Extension Changes Later

Add:
- A license/account section in settings
- A purchase URL in default settings or remote config
- A license activation field
- A periodic license refresh
- Clear messages for active, expired, cancelled, and failed-payment states

Keep:
- Free mode fully usable.
- Paid features disabled unless the backend confirms entitlement.

