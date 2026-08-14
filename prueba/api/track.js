module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    const headers = req.headers || {};
    const forwarded = headers['x-forwarded-for'];
    const cfIp = headers['cf-connecting-ip'];
    const realIp = headers['x-real-ip'];
    const ip = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : cfIp || realIp || 'unknown';

    const userAgent = headers['user-agent'] || 'No disponible';
    const referrer = headers.referer || 'Directo';
    const acceptLanguage = headers['accept-language'] || 'No disponible';
    const secFetch = headers['sec-fetch-dest'] || 'No disponible';
    const secChUa = headers['sec-ch-ua'] || 'No disponible';

    const ua = userAgent.toLowerCase();

    let device = 'Desconocido';
    let os = 'Desconocido';
    let browser = 'Desconocido';

    if (/android/i.test(ua)) {
        device = 'Android';
        os = 'Android';
    } else if (/iphone|ipad|ipod/i.test(ua)) {
        device = /ipad/i.test(ua) ? 'iPad' : 'iPhone';
        os = 'iOS';
    } else if (/windows/i.test(ua)) {
        device = 'PC / Windows';
        os = 'Windows';
    } else if (/macintosh|mac os/i.test(ua)) {
        device = 'Mac';
        os = 'macOS';
    } else if (/linux/i.test(ua)) {
        device = 'PC / Linux';
        os = 'Linux';
    }

    if (/edg|edge/i.test(ua)) browser = 'Microsoft Edge';
    else if (/chrome|crios/i.test(ua) && !/edg|opr|opera/i.test(ua)) browser = 'Google Chrome';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome|android/i.test(ua)) browser = 'Safari';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';

    const botPatterns = [
        'bot', 'crawler', 'spider', 'slurp', 'bingpreview', 'duckduckbot',
        'facebookexternalhit', 'headless', 'playwright', 'puppeteer', 'phantom',
        'wget', 'curl', 'python-requests', 'go-http-client'
    ];

    const lowerUa = userAgent.toLowerCase();
    const riskSignals = [];
    if (botPatterns.some(pattern => lowerUa.includes(pattern))) riskSignals.push('User-Agent sospechoso');
    if (!headers['accept-language']) riskSignals.push('Sin Accept-Language');
    if (!headers['sec-fetch-dest']) riskSignals.push('Sin sec-fetch-dest');
    if (!headers['sec-ch-ua']) riskSignals.push('Sin sec-ch-ua');
    if ((referrer === 'Directo' && !acceptLanguage) || acceptLanguage === 'No disponible') riskSignals.push('Visita sospechosa');

    const isBot = riskSignals.length > 0 || botPatterns.some(pattern => lowerUa.includes(pattern));
    const riskLevel = riskSignals.length >= 2 ? 'Alta' : riskSignals.length === 1 ? 'Media' : 'Baja';

    const shouldAlert = riskLevel === 'Alta' || riskLevel === 'Media';

    const payload = {
        embeds: [
            {
                title: riskLevel === 'Alta'
                    ? '⚠️ Visita de riesgo alto'
                    : riskLevel === 'Media'
                        ? '🟠 Visita de riesgo medio'
                        : 'ℹ️ Visita de riesgo bajo',
                color: riskLevel === 'Alta' ? 0xD4543A : riskLevel === 'Media' ? 0xE8A84C : 0x2D6B5A,
                description: riskLevel === 'Alta'
                    ? 'Se registró tráfico sospechoso con indicadores relevantes.'
                    : riskLevel === 'Media'
                        ? 'Se registró tráfico con señales de riesgo moderado.'
                        : 'Visita normal registrada para monitoreo.',
                fields: [
                    { name: 'IP', value: String(ip || 'unknown'), inline: true },
                    { name: 'Tipo', value: isBot ? 'Bot / sospechoso' : 'Humano', inline: true },
                    { name: 'Nivel de riesgo', value: riskLevel, inline: true },
                    { name: 'Dispositivo', value: String(device), inline: true },
                    { name: 'Sistema operativo', value: String(os), inline: true },
                    { name: 'Navegador', value: String(browser), inline: true },
                    { name: 'User-Agent', value: String(userAgent).slice(0, 250) || 'No disponible', inline: false },
                    { name: 'Referer', value: String(referrer || 'Directo'), inline: false },
                    { name: 'Idioma', value: String(acceptLanguage || 'No disponible'), inline: true },
                    { name: 'sec-fetch-dest', value: String(secFetch || 'No disponible'), inline: true },
                    { name: 'Signals', value: riskSignals.length ? riskSignals.join(' • ') : 'Sin señales sospechosas', inline: false }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Vitali • Traffic monitor'
                }
            }
        ]
    };

    const webhook = process.env.DISCORD_WEBHOOK;

    if (webhook && shouldAlert) {
        try {
            await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Error sending visit to Discord:', error);
        }
    }

    return res.status(200).json({
        ip,
        isBot,
        riskLevel,
        device,
        os,
        browser,
        userAgent,
        referrer,
        acceptLanguage,
        source: 'landing-page-visit'
    });
};
