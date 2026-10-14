# Trionix Tickets: Sistema de Soporte con Agentes 🎫👥

**Desarrollo Web Backend · Node.js — Parcial Segundo Corte**  
**Estudiante:** Jorge Andrés  
**Institución:** Universidad Simón Bolívar  
**Materia:** Electiva Web Avanzada / Desarrollo Web Backend  
**Docente:** Rafael Pérez Meriño  

---

## 1. Descripción del Proyecto

**Trionix Tickets** es una aplicación web completa desarrollada para la gestión interna de incidencias técnicas en **Trionix Labs**. Permite dar seguimiento al ciclo de vida de los tickets de soporte reportados por clientes, gestionar el equipo de agentes de soporte técnico por especialidad, y realizar la asignación de agentes a tickets con validación de reglas de negocio en múltiples colecciones.

Toda la persistencia de datos reside en **MongoDB**, modelada mediante **Mongoose** con relaciones por referencia (`ObjectId`) resueltas dinámicamente mediante `.populate()` y agregaciones con `$lookup`. El frontend es una SPA reactiva construida en HTML5 semántico, CSS3 moderno y Vanilla JavaScript consumiendo la API REST con `fetch` sin recargar la página.

---

## 2. Tecnologías Obligatorias

- **Entorno de ejecución:** Node.js (ES Modules - `type: "module"`)
- **Framework Web:** Express.js
- **Base de Datos:** MongoDB Atlas (en la nube) con ODM Mongoose
- **Validación de Datos:** Joi (HTTP Request Schemas)
- **Frontend:** HTML5, CSS3 moderno (con sistema de diseño y badges), Vanilla JS (Fetch API)

---

## 3. URL Pública de Despliegue

- **URL Pública (Railway):** `https://trionix-tickets-production.up.railway.app` *(O la URL generada al conectar el repositorio en Railway)*
- **Endpoint de salud:** `/health`
- **Frontend público:** `/`

---

## 4. Variables de Entorno Necesarias

Para ejecutar el proyecto, cree un archivo `.env` en la raíz (basándose en [.env.example](file:///.env.example)):

| Variable | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- |
| `PORT` | Puerto donde escuchará el servidor Express | `8080` (en Railway se inyecta automáticamente) |
| `NODE_ENV` | Entorno de ejecución (`development` o `production`) | `production` |
| `MONGODB_URI` | Cadena de conexión a MongoDB Atlas con credenciales | `mongodb+srv://<usuario>:<password>@cluster0.abcde.mongodb.net/trionix_db?retryWrites=true&w=majority` |

> ⚠️ **Seguridad:** El archivo `.env` está expresamente excluido del control de versiones en el [.gitignore](file:///.gitignore). En Railway se configuran desde la pestaña **Variables**.

---

## 5. Instrucciones para Correr el Proyecto Localmente

### Prerrequisitos
- Node.js v18+ instalado.
- Cuenta de MongoDB Atlas con clúster activo (o instancia de MongoDB local).

### Pasos
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/ElPanaJorge03/trionix-tickets.git
   cd trionix-tickets
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Cree el archivo `.env` a partir de `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Abra `.env` y agregue su cadena real de `MONGODB_URI`.

4. **Poblar la base de datos con datos de prueba iniciales (Seed):**
   ```bash
   npm run seed
   ```
   *Esto creará agentes de diferentes especialidades, tickets con comentarios y asignaciones de ejemplo, e inicializará los índices únicos.*

5. **Iniciar el servidor en modo desarrollo:**
   ```bash
   npm start
   ```
   Acceda a su navegador en: `http://localhost:8080`.

---

## 6. Funcionalidades y Endpoints de la API

### API de Tickets (`/api/tickets`)
- `GET /api/tickets`: Lista todos los tickets (filtros opcionales `?estado=`, `?prioridad=` y búsqueda `?q=`). Devuelve siempre el agente asignado resuelto (`agente: { ... }` o `null`).
- `GET /api/tickets/:id`: Consulta un ticket por su `ObjectId` con agente resuelto. (400 si formato inválido, 404 si no existe).
- `POST /api/tickets`: Crea un ticket nuevo validado con Joi (cliente mín 2, asunto mín 5, prioridad válida). El estado siempre nace `"abierto"`.
- `PUT /api/tickets/:id`: Actualiza campos del ticket con validación Joi y `runValidators: true`.
- `DELETE /api/tickets/:id`: Elimina un ticket por id (retorna 204 si exitoso, 404 si no existe).
- `POST /api/tickets/:id/comentarios`: Agrega un comentario embebido al ticket (`autor` mín 2, `texto` mín 3). Responde 201 con el ticket actualizado.
- `POST /api/tickets/:id/asignar`: **(Corazón del parcial)** Body `{ "agenteId": "<ObjectId>" }`. Valida formatos de ObjectId, existencia del ticket (404), existencia del agente (404), estado activo del agente (400 si inactivo) y actualiza la relación respondiendo 200 con el ticket y el agente poblado.

### API de Agentes (`/api/agentes`)
- `GET /api/agentes`: Lista todos los agentes (filtros opcionales `?especialidad=` y `?activo=`).
- `GET /api/agentes/:id`: Consulta un agente por ID.
- `POST /api/agentes`: Registra un nuevo agente validado con Joi. Captura el error de índice único `11000` de MongoDB devolviendo un 400 legible ("Ya existe un agente registrado con el correo electrónico proporcionado") sin caer en 500.
- `PUT /api/agentes/:id`: Actualiza datos de un agente con `runValidators: true` y control de email duplicado.
- `DELETE /api/agentes/:id`: Elimina un agente solo si **no tiene tickets en estado abierto** asignados. Si tiene tickets abiertos, responde **409 Conflict** indicando la cantidad de tickets pendientes.
- `GET /api/agentes/:id/tickets`: Lista los tickets asignados a dicho agente.

---

## 7. Puntos Bonus Implementados (Hasta +10 sobre 100)

Se han implementado satisfactoriamente los 3 puntos de bonificación:

1. **Bonus 21 — Endpoint `GET /api/agentes/stats`:**
   - Agregación avanzada en MongoDB usando `$lookup` desde la colección de agentes hacia tickets y operadores de proyección (`$project`, `$filter`, `$size`) para calcular en tiempo real cuántos tickets abiertos y resueltos tiene cada agente.
   
2. **Bonus 22 — Búsqueda por texto con `$regex` (`GET /api/tickets?q=texto`):**
   - Búsqueda insensible a mayúsculas/minúsculas sobre los campos `asunto` y `cliente`. Integrada en vivo con debounce en el frontend.

3. **Bonus 23 — Índice compuesto sobre `tickets.agenteId`:**
   - En `models/Ticket.js` se definió el índice compuesto:
     ```javascript
     ticketSchema.index({ agenteId: 1, estado: 1 });
     ```
   - **Justificación técnica:** Siguiendo la regla de oro de indexación en bases de datos ("indexar los campos por los cuales se filtra y busca con mayor frecuencia"):
     - Optimiza drásticamente la consulta `Ticket.countDocuments({ agenteId, estado: 'abierto' })` ejecutada en la regla de negocio del `DELETE /api/agentes/:id`.
     - Acelera las consultas de tickets por agente (`GET /api/agentes/:id/tickets`).
     - Acelera el pipeline de `$lookup` y `$group` en las estadísticas agregadas (`GET /api/agentes/stats`).

---

## 8. Despliegue en Railway (Paso a Paso)

El proyecto está configurado para un despliegue sin fricciones en **Railway**:

1. Iniciar sesión en [railway.com](https://railway.com/) con tu cuenta de GitHub.
2. Hacer clic en **"New Project"** -> **"Deploy from GitHub repo"**.
3. Seleccionar el repositorio `trionix-tickets`.
4. Ir a la pestaña **Variables** del servicio e ingresar:
   - `MONGODB_URI`: Tu cadena de conexión a MongoDB Atlas.
   - `NODE_ENV`: `production`
   - *(Railway inyecta el `PORT` automáticamente y el código lo reconoce con `process.env.PORT || 8080`)*.
5. Ir a **Settings** -> **Networking** -> **Generate Domain** para obtener la URL pública (`https://....up.railway.app`).
6. Si deseas cargar la semilla inicial en Railway, puedes ejecutar una sesión de CLI con `railway run npm run seed` o dejar que se creen los agentes desde la propia interfaz web.

---

## 9. Estructura del Proyecto

```text
trionix-tickets/
├── public/                 ← Frontend estático moderno (HTML/CSS/JS)
│   ├── index.html          ← SPA con pestañas para Tickets y Agentes
│   ├── script.js           ← Lógica de interacción, fetch, filtros y toasts
│   └── style.css           ← Sistema de diseño, badges, modal y responsive
├── models/
│   ├── Ticket.js           ← Esquema Mongoose de Tickets (comentarios embebidos, ref Agente)
│   └── Agente.js           ← Esquema Mongoose de Agentes (índice unique email)
├── routes/
│   ├── tickets.js          ← Endpoints de tickets, comentarios y asignación
│   └── agentes.js          ← Endpoints de agentes, validación 11000 y bonus stats
├── db.js                   ← Conexión asíncrona a MongoDB Atlas
├── seed.js                 ← Script de datos iniciales de prueba
├── app.js                  ← Servidor Express con middlewares y manejo global de errores
├── .env                    ← Variables de entorno locales (ignorado en git)
├── .env.example            ← Plantilla de variables de entorno (incluido en git)
├── .gitignore              ← Exclusión de node_modules, .env y logs
├── package.json            ← Metadatos del proyecto y scripts
└── README.md               ← Documentación técnica completa
```
