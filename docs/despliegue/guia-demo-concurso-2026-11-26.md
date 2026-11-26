# Guía para levantar Quantify Core en la PC del concurso

**Fecha de referencia:** 26/11/2026 · **Plataforma:** Windows + Docker Desktop · **Alcance:** laboratorio local, datos sintéticos.

Esta guía prepara el entorno Docker que permite mostrar la web, la API, PostgreSQL, Keycloak y el monitoreo local. No es un despliegue público ni convierte las pantallas de demostración en funciones conectadas.

## Importante para este repositorio

Al preparar esta guía, la copia local de `develop` estaba **17 commits por delante de `origin/develop`**, con 9 archivos modificados y 3 archivos nuevos sin confirmar. Un `git clone` desde GitHub **no incluirá** esos cambios locales.

Antes de salir a la presentación:

1. Confirma cuál versión vas a mostrar con el equipo.
2. Preferentemente integra/publica esa versión mediante el flujo de revisión acordado y comprueba el SHA que usarás en la PC nueva.
3. Si no alcanzan a publicarla, transfiere de forma controlada la copia de trabajo que contiene esos cambios. Revisa antes el contenido de la transferencia.
4. **No transfieras** archivos `.env`, `.env.local`, contraseñas, tokens ni credenciales. Tampoco supongas que una copia Git incluye los volúmenes de Docker.

Una instalación nueva crea bases vacías: el esquema se migra, pero **no se cargan hábitos de demostración en PostgreSQL**. La portada y pantallas `/hoy` usan fixtures locales; `/conexion` lee la API con una sesión real únicamente si preparas una cuenta Keycloak y su perfil.

## Qué se mostrará y qué no

| Componente | Dónde verlo | Qué representa |
|---|---|---|
| Web compilada | `http://localhost:5173/` | Aplicación React servida por Nginx. La demo visual usa fixtures. |
| PWA | `http://localhost:5173/instalar` | Shell público instalable/offline; no cachea identidad ni datos personales. |
| Lectura conectada | `http://localhost:5173/conexion` | Perfil y hábitos de la API con login Keycloak; requiere usuario de prueba y perfil aprovisionado. |
| API | `http://localhost:3000/api/v1/health/ready` | Salud del proceso y PostgreSQL. |
| Keycloak | `http://localhost:8180/` | Identidad local de laboratorio. |
| PostgreSQL | `127.0.0.1:55432` | Datos de negocio local; el navegador no se conecta directamente. |
| Grafana | `http://localhost:3300/` | Panel técnico **Quantify Core - local review**. |
| Prometheus | `http://localhost:9090/` | Métricas técnicas locales. |
| Alertmanager | `http://localhost:9093/` | Alertas del laboratorio, solo en loopback. |

Loki y el endpoint de métricas de API se mantienen internos a Docker. El receptor de alertas solo está en `127.0.0.1:9194`; no contacta a personas.

**No forman parte de este Compose:** Flutter, Wear OS, FastAPI, Redis, workers y MongoDB persistente. El prototipo móvil se ejecuta por separado y no debe presentarse como conectado al backend en esta rama. La simulación opcional de telemetría con MongoDB es un laboratorio diferente.

## 1. Preparar la PC antes del evento

Solicita con anticipación permisos de instalación y acceso a Internet. La primera construcción descarga imágenes y dependencias; no la dejes para el inicio de la exposición.

- Windows con Docker Desktop instalado y motor de contenedores Linux iniciado.
- Git para obtener la versión acordada.
- Node.js 24.x en el host para los comandos de monitoreo. La versión probada en el proyecto es Node 24.14.1. No hace falta instalar PostgreSQL, Keycloak, Grafana, Prometheus, Loki ni los paquetes de React/NestJS en Windows.
- Chrome o Edge actualizado para la web y la PWA.
- Puertos locales libres: `5173`, `3000`, `8180`, `55432`, `3300`, `9090`, `9093` y `9194`.
- Conexión a Internet para preparar las imágenes la primera vez. Para presentar sin Internet, haz antes una prueba completa con la PC conectada y no borres las imágenes.
- Alimentación conectada y suspensión automática desactivada durante la presentación.

Las versiones y recursos mínimos de PC no se han certificado para cualquier equipo. Si Docker Desktop no puede iniciarse por políticas institucionales, avisa al organizador antes del concurso.

## 2. Obtener la versión correcta

Abre PowerShell. Si la versión acordada ya está publicada en `develop`:

```powershell
git clone https://github.com/AngelJdev/Quantify-Core.git
Set-Location .\Quantify-Core
git switch develop
git pull --ff-only origin develop
git status --short --branch
git log -1 --oneline
```

Confirma que el último commit corresponde a la versión que se ensayó. Si se eligió una rama de trabajo, usa exactamente esa rama y su revisión acordada en lugar de asumir que `develop` la contiene.

Desde la raíz del repositorio, verifica Docker:

```powershell
docker version
docker compose version
node --version
```

`docker version` debe mostrar tanto Client como Server; el Server confirma que Docker Desktop está iniciado. Node debe ser `v24.x`.

## 3. Crear configuración privada en la PC nueva

En una copia realmente nueva, ejecuta desde la raíz:

```powershell
docker run --rm --mount "type=bind,source=$($PWD.Path),target=/workspace" --workdir /workspace node:24.14.1-bookworm-slim node scripts/dev-base.mjs init
```

El comando crea cuatro archivos `.env.local` con valores aleatorios privados y **no imprime las claves**. No los abras durante la presentación, no los envíes por chat y no los agregues a Git. Si la configuración ya existe, no ejecutes `init` otra vez ni la sobrescribas.

En la misma terminal, prepara el alias que reutilizarán los comandos:

```powershell
$qcCompose = @("--env-file", "infrastructure/docker/.env.local", "-f", "infrastructure/docker/compose.yaml")
docker compose @qcCompose --profile "*" config --quiet
```

Si `config --quiet` termina sin error, Compose pudo validar la configuración sin mostrar secretos.

## 4. Iniciar PostgreSQL y Keycloak; aplicar migraciones

```powershell
docker compose @qcCompose up -d postgres keycloak
docker compose @qcCompose ps
docker compose @qcCompose --profile tools run --rm --build migrate
```

Continúa solo si `migrate` termina correctamente. Esta tarea prepara las tablas y el rol restringido de API; no crea usuarios de Keycloak ni datos de hábitos de demostración.

## 5. Iniciar Grafana y el resto del monitoreo

Desde la raíz, en una terminal donde Node 24 esté disponible:

```powershell
node scripts/observability.mjs init
node scripts/observability.mjs config
node scripts/observability.mjs up
node scripts/observability.mjs status
```

`init` crea `infrastructure/observability/.env.local` con una contraseña aleatoria de Grafana. Consérvala localmente. El usuario es `quantify-operator`; consulta la contraseña en ese archivo de forma privada al iniciar sesión. No la pongas en una captura, diapositiva, grabación, mensaje o documento compartido.

`up` inicia/reconstruye API con la configuración de monitoreo y añade Prometheus, Grafana, Loki, Alertmanager y el receptor técnico. **No ejecuta migraciones**: por eso se hizo el paso anterior.

## 6. Iniciar la web compilada

Usa Nginx con el frontend compilado, no Vite de desarrollo:

```powershell
docker compose @qcCompose --profile web stop web
docker compose @qcCompose --profile web-static up -d --build web-static
docker compose @qcCompose ps
node scripts/observability.mjs status
```

Espera a que PostgreSQL, API y `web-static` estén saludables. Keycloak puede tardar un poco más en el primer arranque.

## 7. Comprobar el entorno antes de exponer

```powershell
Invoke-RestMethod "http://localhost:3000/api/v1/health/ready"
Invoke-RestMethod "http://localhost:8180/realms/quantify/.well-known/openid-configuration"
```

La primera consulta debe responder con `status: ok`. La segunda debe devolver el documento de descubrimiento OIDC de Keycloak. Luego abre y verifica:

1. `http://localhost:5173/` — portada y navegación de demostración.
2. `http://localhost:5173/instalar` — información de instalación PWA.
3. `http://localhost:3300/` — inicia sesión en Grafana y abre **Quantify Core - local review**.
4. `http://localhost:9090/targets` — comprueba que Prometheus ve sus objetivos.
5. Si muestras `/conexion`, sigue el paso opcional siguiente y pruébalo antes del evento.

Genera actividad técnica abriendo la web y consultando el endpoint de salud; espera un intervalo de scrape para que aparezcan puntos. Un panel sin muestras no significa que exista un fallo de negocio. No ejecutes `node scripts/verify-observability.mjs` durante la exposición: esa verificación detiene/reinicia servicios para probar fallos controlados.

## 8. Opcional: preparar acceso real en `/conexion`

Hazlo antes del ensayo y solo con una cuenta sintética. Las credenciales administrativas iniciales están en `infrastructure/docker/.env.local`; la contraseña nunca debe aparecer en la exposición.

1. Abre `http://localhost:8180/admin/` e inicia sesión con las credenciales privadas de la configuración local.
2. En el realm `quantify`, crea un usuario de prueba habilitado, establece una contraseña y asígnale el rol de realm `user`.
3. Copia el ID/subject del usuario y, desde la raíz, aprovisiona su perfil:

```powershell
docker compose @qcCompose --profile tools run --rm --build -e PROFILE_SUBJECT=ID_DEL_USUARIO -e PROFILE_TIME_ZONE=America/Mexico_City profile
```

4. Abre `http://localhost:5173/conexion` e inicia sesión con esa cuenta.

El aprovisionamiento enlaza un usuario de Keycloak con un perfil; no crea la cuenta ni registra hábitos. Si la lista aparece vacía, puede ser el resultado esperado. No uses cuentas ni datos personales reales.

## 9. Arranque rápido el día del concurso

Después de preparar la configuración y las imágenes, si la PC se reinició:

```powershell
Set-Location "C:\ruta\a\Quantify-Core"
$qcCompose = @("--env-file", "infrastructure/docker/.env.local", "-f", "infrastructure/docker/compose.yaml")
node scripts/observability.mjs up
docker compose @qcCompose --profile web-static up -d --build web-static
node scripts/observability.mjs status
docker compose @qcCompose ps
```

Verifica `health/ready` y abre Grafana antes de que llegue el jurado. Si cambió el código, confirma que la copia de trabajo corresponde a la versión aprobada; reconstruye la imagen web con `--build`. Mantén Docker Desktop abierto durante la demo.

## 10. Cierre seguro

Al terminar, detén los servicios sin borrar las bases ni la configuración:

```powershell
node scripts/observability.mjs stop
docker compose @qcCompose --profile "*" stop
```

`stop` conserva los volúmenes locales. No ejecutes `docker compose down --volumes`, no elimines volúmenes y no restaures Docker Desktop a valores de fábrica: eso puede borrar las bases. Guardar un volumen no es lo mismo que tener respaldo.

## Diagnóstico rápido

| Síntoma | Acción segura |
|---|---|
| Docker no muestra Server | Abre Docker Desktop, espera a que el motor Linux esté iniciado y repite `docker version`. |
| `config` dice que falta un `.env.local` | Confirma que estás en la raíz y que corriste `init` una sola vez. No copies credenciales de otro entorno. |
| Un puerto está ocupado | Cierra la otra modalidad web o pide apoyo de TI. No mates procesos desconocidos ni cambies puertos sin revisar callbacks/CORS. |
| API `health/ready` no responde | Ejecuta `docker compose @qcCompose ps` y revisa `docker compose @qcCompose logs --tail 80 api postgres keycloak`. Confirma que `migrate` terminó. |
| `/conexion` responde 403 | Revisa que el usuario esté en el realm `quantify`, tenga rol `user` y su subject tenga perfil. No sustituyas el error por fixtures. |
| Grafana no abre | Ejecuta `node scripts/observability.mjs status`; confirma que el servicio está activo y usa la contraseña privada del `.env.local`. |
| Grafana abre pero no hay gráficas | Revisa `http://localhost:9090/targets`, el estado de API y genera algunas consultas HTTP. No declares métricas inexistentes como datos cero. |
| La clave no funciona después de reiniciar | Conserva la configuración y volúmenes emparejados. Regenerar `.env.local` no cambia contraseñas de bases ya inicializadas. |

No uses datos de usuarios reales en capturas o paneles. No publiques los puertos del laboratorio en la red del concurso: los servicios están limitados a `localhost` y usan HTTP/Keycloak `start-dev`, no configuración productiva.

## Referencias del repositorio

- [Instalación local completa](../Installation/README.md)
- [Compose y perfiles Docker](../../infrastructure/docker/README.md)
- [Runbook de observabilidad](runbook-observabilidad.md)
- [Evidencia Docker local](../evidencias/docker-2026-11-20/README.md)
- [README de la API](../../services/api/README.md)
- [README de aplicaciones](../../apps/README.md)
