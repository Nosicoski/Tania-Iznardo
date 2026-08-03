/**
 * Servidor mínimo para el envío de mails de la demo.
 *
 * La API key de Resend NO puede vivir en el front: quedaría en el bundle y,
 * además, Resend no acepta llamadas desde el navegador. Por eso este proceso
 * aparte, que expone un solo endpoint y lo consume Angular vía proxy.
 *
 *   node servidor/mail.mjs      (o: npm run mail)
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { armarHtml, armarIcs, asunto } from './plantilla.mjs';

cargarEnv();

const PUERTO = Number(process.env.MAIL_PORT ?? 3001);
const CLAVE = process.env.RESEND_API_KEY ?? '';
// Sin dominio verificado en Resend solo sirve onboarding@resend.dev, y ese
// remitente únicamente puede escribirle al mail de la cuenta de Resend.
const DESDE = process.env.MAIL_FROM ?? 'Tania Iznardo <onboarding@resend.dev>';

createServer(async (pedido, respuesta) => {
  respuesta.setHeader('Access-Control-Allow-Origin', '*');
  respuesta.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (pedido.method === 'OPTIONS') {
    return responder(respuesta, 204, {});
  }
  if (pedido.method !== 'POST' || !pedido.url?.startsWith('/api/turno-confirmado')) {
    return responder(respuesta, 404, { error: 'No existe' });
  }
  if (!CLAVE) {
    return responder(respuesta, 500, { error: 'Falta RESEND_API_KEY en el .env' });
  }

  let turno;
  try {
    turno = JSON.parse(await cuerpo(pedido));
  } catch {
    return responder(respuesta, 400, { error: 'JSON inválido' });
  }

  const falta = validar(turno);
  if (falta) {
    return responder(respuesta, 400, { error: falta });
  }

  try {
    const enviado = await enviar(turno);
    console.log(`✓ Mail enviado a ${turno.email} (id ${enviado.id})`);
    return responder(respuesta, 200, { ok: true, id: enviado.id });
  } catch (error) {
    console.error('✗ Falló el envío:', error.message);
    return responder(respuesta, 502, { error: error.message });
  }
}).listen(PUERTO, () => {
  console.log(`Servidor de mails escuchando en http://localhost:${PUERTO}`);
  console.log(`Remitente: ${DESDE}`);
  if (DESDE.includes('onboarding@resend.dev')) {
    console.log(
      'Aviso: con onboarding@resend.dev, Resend solo entrega al mail de tu propia cuenta.'
    );
  }
});

async function enviar(turno) {
  const cancelarUrl = `${turno.baseUrl.replace(/\/$/, '')}/cancelar?r=${encodeURIComponent(turno.reservaId)}`;
  const ics = armarIcs(turno);

  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLAVE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: DESDE,
      to: [turno.email],
      subject: asunto(turno),
      html: armarHtml(turno, cancelarUrl),
      attachments: [
        {
          filename: 'turno-tania-iznardo.ics',
          content: Buffer.from(ics, 'utf8').toString('base64'),
        },
      ],
    }),
  });

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(explicar(respuesta.status, datos));
  }
  return datos;
}

/** Traduce los errores típicos de Resend a algo accionable en consola. */
function explicar(estado, datos) {
  const mensaje = datos?.message ?? `Resend respondió ${estado}`;
  if (estado === 403 && /testing emails|own email/i.test(mensaje)) {
    return (
      'Resend solo permite enviar al mail de tu cuenta mientras uses ' +
      'onboarding@resend.dev. Verificá un dominio en resend.com/domains y ' +
      'poné MAIL_FROM con esa dirección para escribirle a cualquier paciente.'
    );
  }
  if (estado === 401) {
    return 'La RESEND_API_KEY es inválida o fue revocada.';
  }
  return mensaje;
}

function validar(turno) {
  if (!turno || typeof turno !== 'object') {
    return 'Cuerpo vacío';
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(turno.email ?? '')) {
    return 'Email inválido';
  }
  if (!Array.isArray(turno.tramos) || !turno.tramos.length) {
    return 'El turno no tiene servicios';
  }
  if (!turno.inicioISO || !turno.finISO || !turno.reservaId || !turno.baseUrl) {
    return 'Faltan datos del turno';
  }
  return null;
}

function cuerpo(pedido) {
  return new Promise((resolver, rechazar) => {
    let texto = '';
    pedido.on('data', (parte) => {
      texto += parte;
      // Un turno son pocos KB: cortamos cualquier cosa desmedida.
      if (texto.length > 64_000) {
        rechazar(new Error('Cuerpo demasiado grande'));
        pedido.destroy();
      }
    });
    pedido.on('end', () => resolver(texto));
    pedido.on('error', rechazar);
  });
}

function responder(respuesta, estado, datos) {
  respuesta.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' });
  respuesta.end(JSON.stringify(datos));
}

/** Lee el .env de la raíz sin dependencias (KEY=valor, # para comentarios). */
function cargarEnv() {
  let contenido;
  try {
    contenido = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  } catch {
    return;
  }
  for (const linea of contenido.split('\n')) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) {
      continue;
    }
    const corte = limpia.indexOf('=');
    if (corte === -1) {
      continue;
    }
    const clave = limpia.slice(0, corte).trim();
    const valor = limpia.slice(corte + 1).trim().replace(/^["']|["']$/g, '');
    process.env[clave] ??= valor;
  }
}
