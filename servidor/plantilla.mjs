/**
 * Armado del mail de confirmación: el HTML que ve el paciente, el .ics que se
 * adjunta y el link de Google Calendar. Sin dependencias: los clientes de mail
 * no entienden CSS moderno, así que va todo en tablas con estilos en línea.
 */

const PRIMARIO = '#34817E';
const SECUNDARIO = '#16302F';
const NEUTRO = '#5C6B70';
const BORDE = '#E4E9E9';
const FONDO = '#F5F7F7';

/** Recordatorios de la demo: falta confirmarlos con el consultorio. */
const PREPARATIVOS = [
  'Llegá 10 minutos antes para completar tu ficha con tranquilidad.',
  'Traé ropa cómoda: calzas o short y remera.',
  'Si tenés estudios recientes (radiografías, resonancias), traelos.',
  'DNI y, si corresponde, la credencial de tu obra social.',
];

export function asunto(turno) {
  const servicio = turno.tramos[0]?.servicio ?? 'Tu turno';
  return `Turno confirmado: ${servicio} · ${turno.fechaTexto} ${turno.horaInicio} hs`;
}

/**
 * Marca de tiempo UTC del formato iCalendar (20260808T180000Z). Se usa tanto
 * en el .ics como en el link de Google: en UTC no hay ambigüedad de zona.
 */
function marcaUtc(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Link "Agregar al calendario" de Google: funciona sin backend ni cuenta. */
export function linkGoogleCalendar(turno) {
  const titulo = turno.tramos.map((t) => t.servicio).join(' + ');
  const detalle = [
    `Profesional: ${turno.tramos.map((t) => t.profesional).join(', ')}`,
    'Llegá 10 minutos antes. Se abona en el consultorio.',
  ].join('\n');
  const parametros = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${titulo} · Tania Iznardo Osteopatía`,
    dates: `${marcaUtc(turno.inicioISO)}/${marcaUtc(turno.finISO)}`,
    details: detalle,
    location: turno.direccion,
  });
  return `https://calendar.google.com/calendar/render?${parametros}`;
}

/** Un VEVENT por servicio, igual que el botón de la pantalla de confirmación. */
export function armarIcs(turno) {
  const eventos = turno.tramos.flatMap((tramo, i) => [
    'BEGIN:VEVENT',
    `UID:${turno.reservaId}-${i}@taniaiznardoosteopatia.com`,
    `DTSTAMP:${marcaUtc(turno.inicioISO)}`,
    `DTSTART:${marcaUtc(tramo.inicioISO)}`,
    `DTEND:${marcaUtc(tramo.finISO)}`,
    `SUMMARY:${tramo.servicio} · ${tramo.profesional}`,
    `LOCATION:${turno.direccion}`,
    'DESCRIPTION:Recordá llegar 10 minutos antes. Se abona en el consultorio.',
    'END:VEVENT',
  ]);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tania Iznardo Osteopatia//Turnos//ES',
    'METHOD:PUBLISH',
    ...eventos,
    'END:VCALENDAR',
  ].join('\r\n');
}

function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Fila "etiqueta / valor" del bloque de detalle. */
function fila(etiqueta, valor, resaltado = false) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDE};font-size:14px;color:${NEUTRO};">
        ${escapar(etiqueta)}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDE};font-size:14px;font-weight:700;text-align:right;color:${resaltado ? PRIMARIO : SECUNDARIO};">
        ${valor}
      </td>
    </tr>`;
}

export function armarHtml(turno, cancelarUrl) {
  const varios = turno.tramos.length > 1;

  const servicios = turno.tramos
    .map(
      (t) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDE};font-size:14px;color:${SECUNDARIO};">
          <strong>${escapar(t.servicio)}</strong><br />
          <span style="font-size:12.5px;color:${NEUTRO};">
            con ${escapar(t.profesional)} · ${escapar(t.duracion)}
          </span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDE};font-size:14px;text-align:right;white-space:nowrap;">
          <strong style="color:${PRIMARIO};">${escapar(t.hora)} hs</strong><br />
          <span style="font-size:12.5px;color:${NEUTRO};">${escapar(t.precio)}</span>
        </td>
      </tr>`
    )
    .join('');

  const preparativos = PREPARATIVOS.map(
    (item) => `
      <tr>
        <td style="padding:4px 0;font-size:13.5px;color:${NEUTRO};line-height:1.5;">
          <span style="color:${PRIMARIO};font-weight:700;">✓</span>&nbsp; ${escapar(item)}
        </td>
      </tr>`
  ).join('');

  const observaciones = turno.observaciones
    ? `
      <tr>
        <td style="padding:0 32px 20px;">
          <div style="background:${FONDO};border-left:3px solid ${PRIMARIO};border-radius:6px;padding:12px 14px;font-size:13px;color:${NEUTRO};">
            <strong style="color:${SECUNDARIO};">Tus observaciones:</strong><br />
            ${escapar(turno.observaciones)}
          </div>
        </td>
      </tr>`
    : '';

  return `
<div style="background:${FONDO};padding:28px 12px;font-family:'Hanken Grotesk',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;">

    <!-- Cabecera de marca -->
    <tr>
      <td style="background:${SECUNDARIO};padding:22px 32px;">
        <div style="color:#FFFFFF;font-size:17px;font-weight:700;letter-spacing:0.2px;">
          Tania Iznardo
        </div>
        <div style="color:#9FBDBB;font-size:12.5px;margin-top:2px;">Osteopatía</div>
      </td>
    </tr>

    <!-- Confirmación -->
    <tr>
      <td style="padding:32px 32px 8px;text-align:center;">
        <div style="width:56px;height:56px;line-height:56px;border-radius:50%;background:${PRIMARIO};color:#FFFFFF;font-size:26px;margin:0 auto 14px;">
          ✓
        </div>
        <h1 style="margin:0;font-size:23px;color:${SECUNDARIO};">
          ${varios ? '¡Visita confirmada!' : '¡Turno confirmado!'}
        </h1>
        <p style="margin:10px 0 0;font-size:14.5px;color:${NEUTRO};line-height:1.55;">
          Hola ${escapar(turno.paciente)}, te esperamos.<br />
          Recordá llegar 10 minutos antes.
        </p>
      </td>
    </tr>

    <!-- Detalle del turno -->
    <tr>
      <td style="padding:24px 32px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="background:${FONDO};border-radius:12px;padding:4px 18px;">
          <tr><td style="height:6px;" colspan="2"></td></tr>
          ${fila('Cuándo', `${escapar(turno.fechaTexto)}<br /><span style="color:${PRIMARIO};">${escapar(turno.horaInicio)} – ${escapar(turno.horaFin)} hs</span>`)}
          ${servicios}
          ${fila('Dirección', escapar(turno.direccion))}
          ${fila('Total', `${escapar(turno.total)}<br /><span style="font-weight:500;font-size:12.5px;color:${NEUTRO};">se abona en el consultorio</span>`, true)}
          <tr><td style="height:6px;" colspan="2"></td></tr>
        </table>
      </td>
    </tr>

    ${observaciones}

    <!-- Acciones -->
    <tr>
      <td style="padding:14px 32px 6px;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:0 6px;">
              <a href="${escapar(linkGoogleCalendar(turno))}"
                 style="display:inline-block;background:${PRIMARIO};color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:10px;">
                Agregar al calendario
              </a>
            </td>
            <td style="padding:0 6px;">
              <a href="${escapar(cancelarUrl)}"
                 style="display:inline-block;background:#FFFFFF;color:${NEUTRO};text-decoration:none;font-size:14px;font-weight:700;padding:11px 22px;border:1.5px solid ${BORDE};border-radius:10px;">
                Cancelar turno
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:12px 0 0;font-size:12px;color:${NEUTRO};">
          También te adjuntamos el turno como archivo .ics
        </p>
      </td>
    </tr>

    <!-- Prepará tu visita -->
    <tr>
      <td style="padding:22px 32px 6px;">
        <div style="background:#EDF4F4;border-radius:12px;padding:16px 18px;">
          <div style="font-size:14.5px;font-weight:700;color:${SECUNDARIO};margin-bottom:8px;">
            Prepará tu visita
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${preparativos}
          </table>
        </div>
      </td>
    </tr>

    <!-- Pie -->
    <tr>
      <td style="padding:22px 32px 30px;text-align:center;border-top:1px solid ${BORDE};margin-top:20px;">
        <p style="margin:14px 0 0;font-size:12.5px;color:${NEUTRO};line-height:1.6;">
          ${escapar(turno.direccion)}<br />
          Si necesitás reprogramar, respondé este mail.
        </p>
      </td>
    </tr>
  </table>
</div>`;
}
