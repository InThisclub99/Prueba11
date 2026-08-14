module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    const { name, phone, email, service, message } = req.body || {};

    if (!name || !phone || !email || !service || !message) {
        return res.status(400).json({ error: 'Completa todos los campos.' });
    }

    const webhook = process.env.DISCORD_WEBHOOK;

    if (!webhook) {
        return res.status(500).json({ error: 'Discord webhook no configurado.' });
    }

    const payload = {
        embeds: [
            {
                title: 'Nuevo contacto desde Vitali',
                color: 0xC4842D,
                description: 'Se recibió una nueva solicitud desde la landing page.',
                fields: [
                    { name: 'Nombre', value: String(name || 'No proporcionado'), inline: true },
                    { name: 'Teléfono', value: String(phone || 'No proporcionado'), inline: true },
                    { name: 'Correo', value: String(email || 'No proporcionado'), inline: false },
                    { name: 'Servicio', value: String(service || 'No proporcionado'), inline: false },
                    { name: 'Mensaje', value: String(message || 'No proporcionado'), inline: false }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Vitali • Landing page'
                }
            }
        ]
    };

    try {
        const response = await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const detail = await response.text();
            console.error('Discord error:', detail);
            return res.status(502).json({ error: 'No se pudo enviar a Discord.' });
        }

        return res.status(200).json({ success: true, message: 'Solicitud enviada correctamente.' });
    } catch (error) {
        console.error('Error sending to Discord:', error);
        return res.status(500).json({ error: 'Error interno al enviar el mensaje.' });
    }
};
