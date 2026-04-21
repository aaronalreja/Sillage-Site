// ─────────────────────────────────────────────────────────────────────────────
// SILLAGE — Serverless API proxy
// Keeps your Anthropic API key secret on the server.
//
// HOW TO ACTIVATE REAL AI:
//   1. Get an API key from console.anthropic.com
//   2. In Vercel dashboard → your project → Settings → Environment Variables
//   3. Add:  Name = ANTHROPIC_API_KEY   Value = sk-ant-xxxxxxx
//   4. Redeploy — done. No code changes needed.
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY2;

  // ── LOCAL MODE (no API key yet) ──────────────────────────────────────────
  // Returns a clear message so the frontend knows to use local responses.
  if (!apiKey) {
    return res.status(200).json({ localMode: true });
  }

  // ── LIVE MODE (API key present) ──────────────────────────────────────────
  try {
    const { system, userPrompt } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || 'Anthropic API error' });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    console.error('SILLAGE API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
