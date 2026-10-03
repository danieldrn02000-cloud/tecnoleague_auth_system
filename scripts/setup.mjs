import {copyFile, access} from 'node:fs/promises';
for (const folder of ['front','back']) {
  try {await access(`${folder}/.env`); console.log(`${folder}/.env ya existe; se conserva.`);}
  catch {await copyFile(`${folder}/.env.example`,`${folder}/.env`); console.log(`${folder}/.env creado.`);}
}
console.log('Edita back/.env con tu contraseña de PostgreSQL. Conserva el mismo AUTH_BRIDGE_SECRET en back/.env y front/.env; cambia JWT_SECRET antes de desplegar. Crea tecnoleague_entrega en pgAdmin y ejecuta npm run db:generate, npm run db:migrate, npm run db:seed y npm run dev.');
