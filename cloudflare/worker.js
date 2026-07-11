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

const UPGRADE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pixel Color Picker Pro</title>
  <style>
    @font-face {
      font-family: 'Fusion Pixel 12px';
      src: url('/fusion-pixel-12px-proportional-zh_hant.ttf.woff2') format('woff2');
      font-display: swap;
    }
    :root {
      color-scheme: light;
      --ink: #332d36;
      --soft: #6f6570;
      --line: #332d36;
      --pink: #ff6b9d;
      --mint: #69d9bf;
      --cream: #fff0a8;
      --paper: #fff9fc;
      --panel: #fffdf6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
      background:
        linear-gradient(rgba(63,52,64,.055) 1px, transparent 1px),
        linear-gradient(90deg, rgba(63,52,64,.055) 1px, transparent 1px), var(--paper);
      background-size: 24px 24px; color: var(--ink);
      font-family: 'Fusion Pixel 12px', SimSun, ui-monospace, monospace;
    }
    input, button { font-family: inherit; }
    main { width: min(860px,100%); border: 3px solid var(--line); background: white; box-shadow: 8px 8px 0 rgba(51,45,54,.16); }
    header { padding: 24px; border-bottom: 3px solid var(--line); background: var(--pink); color: white; }
    h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.15; }
    header p { margin: 0; max-width: 58ch; line-height: 1.5; }
    section { padding: 24px; }
    .plan-summary { display: grid; gap: 10px; margin-bottom: 22px; }
    .plan-summary strong { font-size: 22px; }
    ul { margin: 8px 0 0; padding-left: 20px; color: var(--soft); line-height: 1.7; }
    .payment-panel { display: grid; gap: 14px; padding: 18px; border: 2px solid var(--line); background: var(--panel); }
    .panel-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; align-items: center; }
    .panel-head h2 { margin: 0; font-size: 20px; }
    .price { display: inline-block; padding: 7px 10px; border: 2px solid var(--line); background: var(--cream); font-weight: 700; }
    .panel-copy { margin: 0; color: var(--soft); line-height: 1.65; }
    label { display: grid; gap: 8px; font-weight: 700; }
    input { width: 100%; padding: 12px; border: 2px solid var(--line); color: var(--ink); font: inherit; }
    .primary-action { min-height: 44px; width: 100%; border: 2px solid var(--line); background: var(--mint); color: var(--ink); font: inherit; font-weight: 700; cursor: pointer; box-shadow: 3px 3px 0 rgba(51,45,54,.18); }
    .primary-action:disabled { opacity: .55; cursor: wait; }
    .status { min-height: 20px; color: var(--soft); line-height: 1.5; white-space: pre-wrap; }
    .limited-free-banner { padding: 10px 24px; background: var(--mint); color: var(--ink); font-weight: 700; border-bottom: 3px solid var(--line); }
  </style>
</head>
<body>
  <main>
    <div class="limited-free-banner" id="limitedFreeBanner" hidden></div>
    <header>
      <h1>Pixel Color Picker Pro</h1>
      <p data-i18n="hero">Unlock unlimited palettes, Pro themes, custom themes, and future advanced tools.</p>
    </header>
    <section>
      <div class="plan-summary">
        <strong data-i18n="plan">Lifetime Pro</strong>
        <ul>
          <li data-i18n="feature1">One-time payment</li>
          <li data-i18n="feature2">Your payment email is recorded automatically</li>
          <li data-i18n="feature3">Enter that email in the extension PRO settings to unlock</li>
        </ul>
      </div>
      <div class="payment-panel" id="paypalPanel">
        <div class="panel-head">
          <h2 data-i18n="paypalPanelTitle">Pay with PayPal</h2>
          <span class="price">$9.99 USD</span>
        </div>
        <p class="panel-copy" data-i18n="paypalCopy">After payment, open the extension PRO settings, enter your payment email, and click Unlock Pro. No license code needed.</p>
        <label>
          <span data-i18n="emailLabel">Email for your license</span>
          <input id="email" type="email" autocomplete="email" placeholder="you@example.com">
        </label>
        <button class="primary-action" id="buy" data-i18n="paypalButton">Buy Pro with PayPal</button>
        <div class="status" id="status"></div>
      </div>
    </section>
  </main>
  <script>
    const statusNode=document.getElementById('status'),buyButton=document.getElementById('buy'),emailInput=document.getElementById('email');
    const translations={
      en:{hero:'Unlock unlimited palettes, Pro themes, custom themes, and future advanced tools.',plan:'Lifetime Pro',feature1:'One-time payment',feature2:'Your payment email is recorded automatically',feature3:'Enter that email in the extension PRO settings to unlock',paypalPanelTitle:'Pay with PayPal',paypalCopy:'After payment, open the extension PRO settings, enter your payment email, and click Unlock Pro. No license code needed.',emailLabel:'Email for your license',paypalButton:'Buy Pro with PayPal',emailRequired:'Enter the email address used for payment.',limitedFreeBanner:'Limited-time free \u00b7 {d} days left',creatingOrder:'Creating PayPal order...',createFailed:'Unable to create order',approvalMissing:'PayPal approval link missing.'},
      'zh-CN':{hero:'\u89e3\u9501\u65e0\u9650\u8272\u5361\u3001Pro \u4e3b\u9898\u3001\u81ea\u5b9a\u4e49\u4e3b\u9898\u548c\u540e\u7eed\u9ad8\u7ea7\u529f\u80fd\u3002',plan:'\u7ec8\u8eab Pro',feature1:'\u4e00\u6b21\u4e70\u65ad',feature2:'\u4ed8\u6b3e\u540e\u7cfb\u7edf\u4f1a\u81ea\u52a8\u8bb0\u5f55\u4f60\u7684\u90ae\u7bb1',feature3:'\u5728\u6269\u5c55\u7684 PRO \u8bbe\u7f6e\u91cc\u8f93\u5165\u8be5\u90ae\u7bb1\u5373\u53ef\u89e3\u9501',paypalPanelTitle:'\u4f7f\u7528 PayPal \u8d2d\u4e70',paypalCopy:'\u4ed8\u6b3e\u6210\u529f\u540e\uff0c\u5728\u6269\u5c55\u7684 PRO \u8bbe\u7f6e\u91cc\u8f93\u5165\u4ed8\u6b3e\u90ae\u7bb1\uff0c\u70b9\u51fb\u300c\u89e3\u9501 Pro\u300d\u5373\u53ef\uff0c\u65e0\u9700\u6388\u6743\u7801\u3002',emailLabel:'\u4ed8\u6b3e\u90ae\u7bb1',paypalButton:'\u4f7f\u7528 PayPal \u8d2d\u4e70 Pro',emailRequired:'\u8bf7\u8f93\u5165\u4ed8\u6b3e\u65f6\u4f7f\u7528\u7684\u90ae\u7bb1\u3002',limitedFreeBanner:'\u9650\u65f6\u514d\u8d39\u4e2d\uff08\u8fd8\u5269 {d} \u5929\uff09',creatingOrder:'\u6b63\u5728\u5efa\u7acb PayPal \u8ba2\u5355...',createFailed:'\u65e0\u6cd5\u5efa\u7acb\u8ba2\u5355',approvalMissing:'\u7f3a\u5c11 PayPal \u4ed8\u6b3e\u8df3\u8f6c\u94fe\u63a5\u3002'}
    };
    const getLanguage=()=>{const p=new URLSearchParams(location.search).get('lang')||'',l=navigator.language||'';return(p||l).toLowerCase().startsWith('zh')?'zh-CN':'en'};
    const lang=getLanguage(),t=k=>translations[lang][k]||translations.en[k]||k;
    const applyLanguage=()=>{document.documentElement.lang=lang;document.querySelectorAll('[data-i18n]').forEach(n=>{n.textContent=t(n.dataset.i18n)})};
    const setStatus=m=>statusNode.textContent=m;
    applyLanguage();
    buyButton.addEventListener('click',async()=>{
      const email=emailInput.value.trim();if(!email||!email.includes('@'))return void setStatus(t('emailRequired'));
      buyButton.disabled=true;setStatus(t('creatingOrder'));
      try{const r=await fetch('/api/paypal/create-order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})}),data=await r.json();if(!r.ok)throw new Error(data.error||t('createFailed'));const u=data.approvalUrl||'';if(!u)throw new Error(t('approvalMissing'));location.href=u}catch(e){setStatus(e.message);buyButton.disabled=false}
    });
    (function(){const b=document.getElementById('limitedFreeBanner'),until=new Date('2026-07-25T23:59:59').getTime();if(b&&Date.now()<=until){const d=Math.max(0,Math.floor((until-Date.now())/86400000));b.hidden=false;b.textContent=t('limitedFreeBanner').replace('{d}',d)}else if(b)b.hidden=true})();
  </script>
</body>
</html>`;

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
            cancel_url: `${origin}/v2-upgrade`
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

  const licenseId = crypto.randomUUID();
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

  const finalLicenseId = existing?.license_key || licenseId;
  if (!existing) {
    await env.DB.prepare(`
      INSERT INTO licenses
        (license_key, email, status, paypal_order_id, paypal_capture_id, created_at)
      VALUES (?, ?, 'active', ?, ?, ?)
    `).bind(finalLicenseId, email, orderId, captureId, now).run();
  }

  const emailResult = await sendLicenseEmail(env, email);

  return json({
    ok: true,
    email,
    emailSent: emailResult.sent,
    emailError: emailResult.error || '',
    message: 'Payment received. Unlock Pro in the extension with your payment email.'
  });
}

async function licenseStatus(request, env) {
  const url = new URL(request.url);
  const email = normalizeEmail(url.searchParams.get('email'));

  if (!email) {
    return json({ error: 'email is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const row = await env.DB.prepare(`
    SELECT email, status FROM licenses WHERE email = ? ORDER BY created_at DESC
  `).bind(email).first();
  if (row) {
    await env.DB.prepare(`
      UPDATE licenses SET last_checked_at = ? WHERE email = ?
    `).bind(now, email).run();
  }

  if (!row || row.status !== 'active') {
    return json({ valid: false, licenseStatus: 'free' });
  }

  return json({
    valid: true,
    licenseStatus: 'pro',
    licenseEmail: row.email
  });
}

async function createManualLicense(request, env) {
  const body = await readJson(request);
  const adminKey = String(body.adminKey || '').trim();
  if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = normalizeEmail(body.email);
  if (!isEmail(email)) {
    return json({ error: 'A valid email is required' }, { status: 400 });
  }

  const note = String(body.note || 'manual-support').trim().slice(0, 120);
  const licenseId = crypto.randomUUID();
  const now = new Date().toISOString();
  const orderId = `manual-${Date.now()}`;

  await env.DB.prepare(`
    INSERT INTO licenses
      (license_key, email, status, paypal_order_id, paypal_capture_id, created_at)
    VALUES (?, ?, 'active', ?, ?, ?)
  `).bind(licenseId, email, orderId, note, now).run();

  const emailResult = await sendLicenseEmail(env, email);

  return json({
    ok: true,
    email,
    emailSent: emailResult.sent,
    emailError: emailResult.error || ''
  });
}

async function sendLicenseEmail(env, email) {
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
        'Open the extension, go to PRO settings, enter the email you paid with, and click Unlock Pro. No license code needed.'
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

async function serveAsset(request, env) {
  const response = await env.ASSETS.fetch(request, { cf: { cacheTtl: 0 } });
  const url = new URL(request.url);
  if (url.pathname === '/upgrade.html' || url.pathname === '/') {
    const headers = new Headers(response.headers);
    headers.set('cache-control', 'no-store, max-age=0');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
  return response;
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
      if (url.pathname === '/api/license/status' && request.method === 'GET') {
        return licenseStatus(request, env);
      }
      if (url.pathname === '/api/license/manual' && request.method === 'POST') {
        return createManualLicense(request, env);
      }

      // upgrade page: serve inline HTML on fresh paths to bypass ALL CDN cache
      if (url.pathname === '/upgrade.html' || url.pathname === '/upgrade' || url.pathname === '/' || url.pathname === '/v2-upgrade') {
        return new Response(UPGRADE_HTML, {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0',
            'pragma': 'no-cache',
            'expires': '0'
          },
          cf: { cacheTtl: 0, cacheEverything: false }
        });
      }

      return serveAsset(request, env);
    } catch (error) {
      return json({ error: error.message || 'Server error' }, { status: 500 });
    }
  }
};
