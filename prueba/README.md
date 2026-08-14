# Vitali landing page

Este proyecto incluye una landing page estática para Vitali y un endpoint para enviar formularios de contacto a Discord.

## Requisitos
- Node.js 18+
- Cuenta en Vercel

## Despliegue en Vercel
1. Sube este proyecto a GitHub.
2. En Vercel, importa el repositorio.
3. Usa la configuración por defecto.
4. Agrega la variable de entorno:
   - `DISCORD_WEBHOOK` = tu URL del webhook de Discord
5. Haz deploy.

## Formulario
El formulario de contacto en `index.html` hace un POST a `/api/contact`.

La API en `api/contact.js` recibe los datos y envía el mensaje a Discord usando el webhook configurado.

## Variables de entorno
```bash
DISCORD_WEBHOOK=https://discord.com/api/webhooks/tu_webhook_aqui
```
