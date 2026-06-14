const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    ...corsHeaders(),
    ...(init.headers || {})
  }
});

const corsHeaders = () => ({
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type'
});

const paypalBaseUrl = (env) => (
  env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
);

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function getPayPalAccessToken(env) {
  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${paypalBaseUrl(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${credentials}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('PayPal authentication failed');
  }

  const data = await response.json();
  return data.access_token;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function generateLicenseKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `PCP-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 24)}`;
}

async function ensurePendingOrdersTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS pending_orders (
      paypal_order_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `).run();
}

async function createOrder(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  if (!isEmail(email)) {
    return json({ error: 'A valid email is required' }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const accessToken = await getPayPalAccessToken(env);
  const response = await fetch(`${paypalBaseUrl(env)}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        description: env.PRODUCT_NAME || 'Pixel Color Picker Pro',
        custom_id: email,
        amount: {
          currency_code: env.PRODUCT_CURRENCY || 'USD',
          value: env.PRODUCT_PRICE || '9.99'
        }
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: env.PRODUCT_NAME || 'Pixel Color Picker Pro',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: `${origin}/payment-return.html`,
            cancel_url: `${origin}/upgrade.html`
          }
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return json({ error: 'Unable to create PayPal order', details: data }, { status: 502 });
  }

  if (data.id) {
    await ensurePendingOrdersTable(env);
    await env.DB.prepare(`
      INSERT OR REPLACE INTO pending_orders (paypal_order_id, email, created_at)
      VALUES (?, ?, ?)
    `).bind(data.id, email, new Date().toISOString()).run();
  }

  const links = Array.isArray(data.links) ? data.links : [];
  const approvalLink = links.find((link) =>
    link.rel === 'approve' ||
    link.rel === 'payer-action' ||
    /paypal\.com\/checkoutnow/i.test(link.href || '')
  );

  return json({
    ...data,
    approvalUrl: approvalLink?.href || null,
    linkRels: links.map((link) => link.rel).filter(Boolean)
  });
}

async function captureOrder(request, env) {
  const body = await readJson(request);
  const orderId = String(body.orderID || body.orderId || '').trim();
  const fallbackEmail = normalizeEmail(body.email);
  if (!orderId) {
    return json({ error: 'orderID is required' }, { status: 400 });
  }

  const accessToken = await getPayPalAccessToken(env);
  const response = await fetch(`${paypalBaseUrl(env)}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    }
  });

  const data = await response.json();
  if (!response.ok) {
    return json({ error: 'Unable to capture PayPal order', details: data }, { status: 502 });
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  await ensurePendingOrdersTable(env);
  const pendingOrder = await env.DB.prepare(`
    SELECT email FROM pending_orders WHERE paypal_order_id = ?
  `).bind(orderId).first();
  const email = normalizeEmail(pendingOrder?.email || data.purchase_units?.[0]?.custom_id || fallbackEmail || data.payer?.email_address);
  if (!isEmail(email)) {
    return json({ error: 'Payment captured, but no buyer email was found' }, { status: 500 });
  }

  const licenseKey = generateLicenseKey();
  const now = new Date().toISOString();
  const amount = capture?.amount?.value || env.PRODUCT_PRICE || '9.99';
  const currency = capture?.amount?.currency_code || env.PRODUCT_CURRENCY || 'USD';
  const captureId = capture?.id || '';
  const status = capture?.status || data.status || 'COMPLETED';

  await env.DB.prepare(`
    INSERT OR IGNORE INTO payments
      (paypal_order_id, paypal_capture_id, email, amount, currency, status, raw_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(orderId, captureId, email, amount, currency, status, JSON.stringify(data), now).run();

  const existing = await env.DB.prepare(`
    SELECT license_key FROM licenses WHERE paypal_order_id = ?
  `).bind(orderId).first();

  const finalLicenseKey = existing?.license_key || licenseKey;
  if (!existing) {
    await env.DB.prepare(`
      INSERT INTO licenses
        (license_key, email, status, paypal_order_id, paypal_capture_id, created_at)
      VALUES (?, ?, 'active', ?, ?, ?)
    `).bind(finalLicenseKey, email, orderId, captureId, now).run();
  }

  const emailResult = await sendLicenseEmail(env, email, finalLicenseKey);

  return json({
    ok: true,
    email,
    licenseKey: finalLicenseKey,
    emailSent: emailResult.sent,
    emailError: emailResult.error || '',
    message: 'Payment captured. License sent by email.'
  });
}

async function activateLicense(request, env) {
  const body = await readJson(request);
  const licenseKey = String(body.licenseKey || body.license_key || '').trim().toUpperCase();
  const email = normalizeEmail(body.email);
  if (!licenseKey) {
    return json({ error: 'licenseKey is required' }, { status: 400 });
  }

  const row = await env.DB.prepare(`
    SELECT license_key, email, status, activated_at FROM licenses WHERE license_key = ?
  `).bind(licenseKey).first();

  if (!row || row.status !== 'active') {
    return json({ valid: false, licenseStatus: 'free', error: 'License not found or inactive' }, { status: 404 });
  }

  if (email && row.email !== email) {
    return json({ valid: false, licenseStatus: 'free', error: 'Email does not match this license' }, { status: 403 });
  }

  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE licenses
    SET activated_at = COALESCE(activated_at, ?), last_checked_at = ?
    WHERE license_key = ?
  `).bind(now, now, licenseKey).run();

  return json({
    valid: true,
    licenseStatus: 'pro',
    licenseEmail: row.email,
    licenseKey
  });
}

async function licenseStatus(request, env) {
  const url = new URL(request.url);
  const licenseKey = String(url.searchParams.get('licenseKey') || '').trim().toUpperCase();
  if (!licenseKey) {
    return json({ error: 'licenseKey is required' }, { status: 400 });
  }

  const row = await env.DB.prepare(`
    SELECT email, status FROM licenses WHERE license_key = ?
  `).bind(licenseKey).first();

  if (!row || row.status !== 'active') {
    return json({ valid: false, licenseStatus: 'free' });
  }

  await env.DB.prepare(`
    UPDATE licenses SET last_checked_at = ? WHERE license_key = ?
  `).bind(new Date().toISOString(), licenseKey).run();

  return json({
    valid: true,
    licenseStatus: 'pro',
    licenseEmail: row.email
  });
}

async function sendLicenseEmail(env, email, licenseKey) {
  if (!env.RESEND_API_KEY) {
    return { sent: false, error: 'RESEND_API_KEY is not configured' };
  }
  if (!env.MAIL_FROM) {
    return { sent: false, error: 'MAIL_FROM is not configured' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: email,
      subject: 'Your Pixel Color Picker Pro license',
      text: [
        'Thanks for buying Pixel Color Picker Pro.',
        '',
        `Your license key: ${licenseKey}`,
        '',
        'Open the extension settings, paste this key, and activate Pro.'
      ].join('\n')
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      sent: false,
      error: data.message || data.error || `Resend returned HTTP ${response.status}`
    };
  }

  return { sent: true, id: data.id || '' };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (url.pathname === '/api/health') {
        return json({ ok: true, service: 'pixel-color-picker-pro' });
      }
      if (url.pathname === '/api/paypal/create-order' && request.method === 'POST') {
        return createOrder(request, env);
      }
      if (url.pathname === '/api/paypal/capture-order' && request.method === 'POST') {
        return captureOrder(request, env);
      }
      if (url.pathname === '/api/license/activate' && request.method === 'POST') {
        return activateLicense(request, env);
      }
      if (url.pathname === '/api/license/status' && request.method === 'GET') {
        return licenseStatus(request, env);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: error.message || 'Server error' }, { status: 500 });
    }
  }
};
