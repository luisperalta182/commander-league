# 🗄️ Guía: conectar la base de datos (Supabase)

Por defecto la app funciona en **modo local** (los datos se guardan solo en el
navegador de cada persona). Para tener **cuentas reales y una clasificación
compartida** que todos vean, conecta Supabase. Es gratis y funciona con GitHub Pages.

---

## 1. Crear el proyecto en Supabase

1. Entra a <https://supabase.com> y crea una cuenta (puedes usar tu cuenta de GitHub).
2. Haz clic en **New project**.
3. Llena:
   - **Name**: `masatepe-the-gathering` (o el que quieras).
   - **Database Password**: pon una contraseña fuerte y **guárdala** (la pide más adelante si administras la base; no se usa en la app).
   - **Region**: elige la más cercana a tus jugadores.
4. Clic en **Create new project** y espera 1–2 minutos a que termine de aprovisionar.

---

## 2. Crear las tablas (correr el esquema)

1. En el panel de tu proyecto, ve al menú izquierdo → **SQL Editor**.
2. Clic en **New query**.
3. Abre el archivo [`supabase/schema.sql`](supabase/schema.sql) de este proyecto,
   **copia todo su contenido** y pégalo en el editor.
4. Clic en **Run** (o `Ctrl/Cmd + Enter`).
5. Debe decir *Success*. Esto crea las tablas `profiles` y `match_days` y las
   reglas de seguridad (RLS).

> Para verificar: menú izquierdo → **Table Editor** → deberías ver `profiles` y `match_days`.

---

## 3. Copiar las llaves de conexión

1. Menú izquierdo → **Project Settings** (engranaje) → **API**.
2. Copia estos dos valores:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **Project API keys → `anon` `public`** → una cadena larga que empieza con `eyJ...`

> ⚠️ Usa solo la llave **`anon` / `public`**. Nunca uses la `service_role` en el
> sitio web: esa es secreta y daría acceso total a la base.

---

## 4. (Recomendado) Quitar la confirmación por correo

Por defecto Supabase manda un correo de confirmación al registrarse. Para una
liga privada conviene desactivarlo para que puedan entrar de inmediato:

1. Menú izquierdo → **Authentication** → **Providers** → **Email**.
2. Desactiva **Confirm email**.
3. Guarda.

---

## 5A. Probar en tu computadora (local)

1. En la carpeta del proyecto, copia el archivo `.env.example` y renómbralo a `.env`.
2. Pega tus valores:

   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ... (tu llave anon)
   ```

3. Reinicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Abre la app: la pastilla de abajo a la derecha debe cambiar de
   **"● modo local"** a **"● compartido (supabase)"**. ¡Listo, ya estás conectado!

> El archivo `.env` está en `.gitignore`, así que **no se sube a GitHub** (bien:
> esas llaves no deben quedar en el historial del repo).

---

## 5B. Publicar en GitHub Pages (compartido)

Para que el sitio en línea use Supabase, las llaves se agregan como *secrets*
del repositorio (el workflow [`/.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
ya las inyecta al compilar):

1. En GitHub, ve a tu repo → **Settings** → **Secrets and variables** → **Actions**.
2. Clic en **New repository secret** y crea estos dos:
   - Nombre: `VITE_SUPABASE_URL` — Valor: tu Project URL.
   - Nombre: `VITE_SUPABASE_ANON_KEY` — Valor: tu llave `anon public`.
3. Haz un *push* a la rama `main` (o **Actions** → el workflow → **Run workflow**).
4. Cuando termine el despliegue, el sitio publicado usará la base compartida.

---

## 6. Nombrar al organizador (admin)

- La **primera persona que se registre** queda como organizador automáticamente.
- Para nombrar a alguien manualmente, ve a **SQL Editor** y corre (cambia el correo):

  ```sql
  update public.profiles set is_admin = true where email = 'tu@correo.com';
  ```

---

## Solución de problemas

| Problema | Causa probable / solución |
|----------|---------------------------|
| Sigue diciendo "● modo local" | Faltan las variables, o no reiniciaste `npm run dev` tras crear `.env`. |
| "Invalid API key" | Copiaste la llave equivocada; usa la `anon public`, completa. |
| No llega el correo / no puedo entrar | Desactiva *Confirm email* (paso 4) o revisa spam. |
| Error al registrarse sobre `profiles` | No corriste `schema.sql` (paso 2) o falló; vuelve a ejecutarlo. |
| Los datos no se comparten en línea | Faltan los *secrets* en GitHub (paso 5B) o no se ha vuelto a desplegar. |
