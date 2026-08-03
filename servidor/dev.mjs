/**
 * Levanta el front y el servidor de mails juntos (`npm run dev`).
 *
 * Son dos procesos porque la API key de Resend no puede vivir en el bundle,
 * pero acordarse de arrancar los dos a mano es fácil de olvidar: cuando falta
 * el de mails, el proxy de Angular devuelve un 500 sin explicación al
 * confirmar el turno. Acá arrancan y se apagan de a dos.
 */
import { spawn } from 'node:child_process';

const procesos = [];
let cerrando = false;

function arrancar(nombre, comando, argumentos) {
  const proceso = spawn(comando, argumentos, { stdio: 'inherit', shell: true });
  proceso.on('exit', (codigo) => {
    if (cerrando) {
      return;
    }
    console.log(`\n[${nombre}] terminó (código ${codigo}); apagando el resto.`);
    apagar(codigo ?? 0);
  });
  procesos.push(proceso);
  return proceso;
}

function apagar(codigo) {
  if (cerrando) {
    return;
  }
  cerrando = true;
  for (const proceso of procesos) {
    if (proceso.exitCode === null) {
      proceso.kill('SIGTERM');
    }
  }
  process.exit(codigo);
}

process.on('SIGINT', () => apagar(0));
process.on('SIGTERM', () => apagar(0));

// El de mails primero: así ya está escuchando cuando el front pueda pedirle algo.
arrancar('mails', process.execPath, ['servidor/mail.mjs']);
arrancar('front', 'npx', ['ng', 'serve', ...process.argv.slice(2)]);
