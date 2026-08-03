# Tania-Iznardo

Reservador de turnos online para [Tania Iznardo Osteopatía](https://taniaiznardoosteopatia.com).
Demo en Angular: los clientes eligen un servicio, una fecha y hora, y dejan sus datos
personales — sin registrarse ni iniciar sesión (flujo inspirado en los reservadores de AgendaPro).

## Flujo

1. **Servicio** (`/servicio`) — listado de especialidades con búsqueda y filtro por categoría.
2. **Fecha y hora** (`/fecha-hora`) — calendario semanal con horarios disponibles (mañana/tarde).
3. **Datos de contacto** (`/datos`) — formulario con validación; sin pago online, se abona en el consultorio.
4. **Confirmación** (`/confirmado`) — resumen del turno y descarga de evento de calendario (.ics).

Las rutas tienen guards: no se puede saltar a un paso sin completar los anteriores.

## Stack

- Angular 22 (componentes standalone, signals, zoneless)
- HTML + CSS puro (tokens de diseño en `src/styles.css`)
- Datos mock en el front (`src/app/datos/` y `src/app/servicios/disponibilidad.ts`) — sin backend

## Paleta

| Rol       | Color     |
| --------- | --------- |
| Primary   | `#34817E` |
| Secondary | `#16302F` |
| Tertiary  | `#F4B740` |
| Neutral   | `#5C6B70` |

Tipografía: [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk).
Los mockups de referencia (desktop 1440 y mobile 390) están en [`MOCKUPS/`](MOCKUPS).

## Desarrollo

```bash
npm install
npm start
```

Abrir `http://localhost:4200`. Build de producción: `npx ng build`.

`npm start` levanta **dos** procesos: el front y el servidor de mails
(`servidor/mail.mjs`, puerto 3001). Hacen falta los dos: la API key de Resend
no puede vivir en el bundle, así que el mail de confirmación sale por ese
proceso y el front le llega vía proxy. Si se corre solo `ng serve`, confirmar
un turno responde 500 al pedir `/api/turno-confirmado`.

Las credenciales van en un `.env` en la raíz (ver [`.env.ejemplo`](.env.ejemplo)).
Para levantar únicamente el front: `npm run start:front`.
