# Cloudflare + PayPal Setup

This is the semi-automatic Pro flow:

1. The extension opens the Cloudflare upgrade page.
2. The buyer enters an email and pays with PayPal.
3. The Cloudflare Worker captures the PayPal order.
4. The Worker creates a license in D1.
5. The Worker emails the license key with Resend.
6. The buyer activates the license inside the extension.

## What You Need

- Cloudflare account
- PayPal Business account
- PayPal Developer app
- D1 database
- Resend account for email delivery

You can use the free Cloudflare `workers.dev` domain while testing. A paid custom domain can wait.

## Create Cloudflare Files

Copy the example config:

```powershell
Copy-Item cloudflare\wrangler.example.toml cloudflare\wrangler.toml
```

After creating the D1 database, paste the D1 database id into `cloudflare/wrangler.toml`.

## Create D1 Database

```powershell
cd cloudflare
npx wrangler d1 create pixel_color_picker_pro
npx wrangler d1 execute pixel_color_picker_pro --file .\schema.sql --remote
```

## Set Secrets

```powershell
cd cloudflare
npx wrangler secret put PAYPAL_CLIENT_ID
npx wrangler secret put PAYPAL_CLIENT_SECRET
npx wrangler secret put RESEND_API_KEY
```

Use PayPal Sandbox keys first. For production, set `PAYPAL_ENV = "live"` and replace the Cloudflare secrets with PayPal Live credentials.

For Live mode, run these again and paste the Live values from PayPal Developer:

```powershell
npx wrangler secret put PAYPAL_CLIENT_ID
npx wrangler secret put PAYPAL_CLIENT_SECRET
npx wrangler deploy
```

## Email Delivery With Resend

The Worker already sends the license email through Resend when `RESEND_API_KEY` and `MAIL_FROM` are configured.

For testing without buying a domain, you can use Resend's onboarding/test sender if your account allows it. For real customers, use your own domain.

Recommended production setup:

1. Buy or add a domain to Cloudflare, for example `pixelcolorpicker.com`.
2. Create a Resend account at `https://resend.com`.
3. In Resend, go to Domains and add your domain.
4. Resend will show DNS records.
5. Add those DNS records in Cloudflare DNS.
6. Wait until Resend marks the domain as verified.
7. Set `MAIL_FROM` in `cloudflare/wrangler.toml`, for example:

```toml
MAIL_FROM = "Pixel Color Picker <pro@pixelcolorpicker.com>"
```

8. Set the Resend API key:

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

Until email is configured, the payment success page still shows the license key directly.

## Deploy

```powershell
cd cloudflare
npx wrangler deploy
```

Your test URLs will look like:

```txt
https://pixel-color-picker-pro.<your-account>.workers.dev/upgrade.html
https://pixel-color-picker-pro.<your-account>.workers.dev/api/health
```

## PayPal Developer Setup

Create a PayPal REST app in the PayPal Developer Dashboard.

Use these values:

- Client ID: save as `PAYPAL_CLIENT_ID`
- Secret: save as `PAYPAL_CLIENT_SECRET`
- Mode: Sandbox first

The current Worker uses PayPal Orders API:

- `POST /api/paypal/create-order`
- `POST /api/paypal/capture-order`

Webhook handling can be added after the checkout flow is stable. The capture endpoint already creates a license after successful payment capture.

## Extension Work Still Needed

The extension still needs a license activation UI:

- License key input
- Activate button
- Request to `/api/license/activate`
- Save `licenseStatus: "pro"` when valid
- Save `licenseEmail` and `licenseKey`

After the Cloudflare Worker URL is deployed, set the extension purchase URL to:

```txt
https://pixel-color-picker-pro.<your-account>.workers.dev/upgrade.html
```

## Manual WeChat License Delivery

For manual WeChat payments, create an admin key once:

```powershell
npx wrangler secret put ADMIN_KEY
npx wrangler deploy
```

After a buyer emails the payment screenshot, generate and email a license:

```powershell
cd C:\Users\16704\Desktop\color-picker\cloudflare
.\manual-license.ps1 -Email buyer@example.com -Note "wechat-39"
```

The script returns the license key and whether the email was sent. If email delivery fails, copy the license key from the terminal and send it manually.

## Important Safety Notes

- Never put PayPal Secret in the extension.
- Start with Sandbox.
- Keep the first product as one-time lifetime Pro.
- Add PayPal webhooks later for refunds and disputes.
