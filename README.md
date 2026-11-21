# GymHub — Frontend

Aplicación web de GymHub, la plataforma de gestión de gimnasio del Proyecto 2 de Ingeniería de Software (UCA, ciclo 02/2026, Sección 02), equipo Los Ñ 5.0. Está hecha con Next.js 16, React 19, Zustand y Tailwind CSS.

**La documentación completa del sistema está en el repositorio del backend:** [DaniloII09/gymhub](https://github.com/DaniloII09/gymhub#readme) (guía de uso, arquitectura, API, despliegue, historias y problemas conocidos).

## Ambiente desplegado

| Componente | URL |
|---|---|
| Frontend | [https://PENDIENTE.vercel.app] |
| Documentación de la API (Swagger) | [https://PENDIENTE.onrender.com/api/docs] |

Los usuarios de prueba se entregan en Moodle, no en este repositorio.

## Correr en local

Requisitos: Node.js 24 y el backend corriendo (ver [instalación local](https://github.com/DaniloII09/gymhub/blob/main/docs/05-instalacion-local.md)).

```
cp .env.example .env.local
npm install
npm run dev      # http://localhost:3001
npm test         # pruebas con Vitest
```

| Variable | Descripción | Ejemplo |
|---|---|---|
| `API_URL` | URL base de la API con el prefijo `/api/v1` | `http://localhost:3000/api/v1` |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Vigencia de la cookie del refresh token | `7` |

## Integrantes

Danilo Iraheta, Luis Guzmán, Jaime Magaña, Juan Carlos Amaya y Christian Merino. Roles e historias de cada uno en el [README del backend](https://github.com/DaniloII09/gymhub#integrantes).
