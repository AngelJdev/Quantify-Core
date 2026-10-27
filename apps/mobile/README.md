# Aplicación Móvil — Quantify Core

Aplicación móvil de **Quantify Core V2.0** desarrollada en **Flutter + Dart** para Android e iOS. Su objetivo es permitir a las personas registrar su avance diario, monitorear rachas y consultar indicadores preventivos con una experiencia visual moderna, accesible y coherente con la identidad del proyecto.

> **Estado de la entrega (QUANCORE-29):** Proyecto base ejecutable para Android con arquitectura limpia por capas, rutas centralizadas, componentes visuales en modo oscuro (*Laser Blue* y *Obsidian Slate*) y flujo de navegación interactivo para demostración académica.

---

## 📱 Vistas disponibles en la demostración

La aplicación cuenta con una navegación fluida organizada en pestañas inferiores y botones de acción rápida:

1. **Acceso y Autenticación (`/login`):**
   * Pantalla de bienvenida con identidad corporativa de Quantify.
   * Acceso rápido en modo demo e inicio simulado mediante **Keycloak OIDC con PKCE S256** (cliente `quantify-mobile`).
2. **Pantalla Principal — "Hoy" (`/main` - Tab 1):**
   * Saludo personalizado y fecha del día en formato de negocio.
   * Tarjeta de progreso diario con porcentaje de hábitos cumplidos y contador de mejor racha activa.
   * Tarjetas interactivas de hábitos con botón para marcar o desmarcar cumplimiento en tiempo real.
3. **Catálogo de Hábitos (Tab 2):**
   * Listado de hábitos clasificados por categorías (*Salud*, *Aprendizaje*, *Bienestar*, *Descanso*).
   * Filtros dinámicos por etiquetas y detalle de metas por unidad (minutos, páginas, litros).
4. **Registro de Avance — Check-in Rápido (`/checkin` y botón central `+`):**
   * Selección de hábito y fecha de negocio.
   * Control deslizante para registrar cantidad lograda y campo opcional para evidencias/notas.
   * Indicador visible de la cabecera idempotente (`X-Idempotency-Key`), garantizando trazabilidad contractual sin registros duplicados.
5. **Analítica y Métricas (Tab 3):**
   * Gráfica semanal interactiva de barras mostrando la adherencia por día.
   * Indicador preventivo asistido por IA (arquetipo *"Constancia Matutina"* y estimación de riesgo de desgaste bajo).
   * Resumen de estadísticas históricas (total de check-ins, tasa de éxito y mejor racha).
6. **Perfil y Ajustes (Tab 4):**
   * Datos del usuario de prueba y confirmación de rol.
   * Resumen de conectividad técnica (URL de API NestJS `http://10.0.2.2:3000/api/v1` y realm Keycloak).
   * Interruptores de preferencias: avisos locales, tolerancia offline y vinculación gradual con Wear OS.
   * Cierre de sesión seguro con retorno a la pantalla de acceso.

---

## 🎨 Identidad visual y tokens de diseño

La aplicación adapta los tokens canónicos de [`packages/design-tokens/`](../../packages/design-tokens/README.md) en un tema moderno de Material 3:

* **Colores de marca:** Laser Blue (`#275BC0`), Sky Laser (`#4A7DE8`) y Deep Cobalt (`#183D87`).
* **Fondo y superficies:** Obsidian Slate (`#0B0F17`), Midnight Navy (`#161F2E`) y bordes Steel (`#283548`).
* **Estados y semántica:** Verde Esmeralda (`#10B981`) para rachas y éxito, Ámbar (`#F59E0B`) para pendientes, y Cyan Eléctrico (`#0EA5E9`) para sugerencias de IA.

---

## 🚀 Cómo ejecutar la aplicación

### Prerrequisitos
* Tener instalado **Flutter SDK** (versión 3.13 o superior con canal `stable`).
* Un emulador de Android configurado (Android Studio) o un dispositivo físico conectado con depuración USB habilitada.

### Pasos de ejecución

1. **Abrir la terminal en la carpeta de la app móvil:**
   ```bash
   cd apps/mobile
   ```

2. **Descargar las dependencias necesarias:**
   ```bash
   flutter pub get
   ```

3. **Ejecutar en el emulador o dispositivo:**
   ```bash
   flutter run
   ```

4. **Ejecutar pruebas automatizadas:**
   ```bash
   flutter test
   ```

---

## 📂 Organización del código

El proyecto implementa una arquitectura modular y escalable inspirada en Clean Architecture:

```text
apps/mobile/lib/
├── core/
│   ├── constants/       # URL de API, endpoints y configuración de Keycloak OIDC
│   ├── router/          # Definición centralizada de rutas (/login, /main, /checkin)
│   ├── services/        # Cliente HTTP con manejo de errores y cabeceras idempotentes
│   └── theme/           # Paleta de colores canónicos y temas Material 3 (Dark/Light)
├── features/
│   ├── auth/            # Pantalla de acceso y autenticación demo
│   ├── checkin/         # Formulario de registro de avance con idempotencia
│   ├── habits/          # Modelo de datos de hábito y catálogo clasificado
│   ├── main/            # Navegación principal con barra inferior y botón central
│   ├── metrics/         # Panel de gráficas de adherencia y análisis preventivo IA
│   ├── profile/         # Perfil de usuario, conectividad y preferencias
│   └── today/           # Tablero de hábitos diarios y resumen de rachas
└── main.dart            # Punto de entrada de la aplicación
```

---

## 🔗 Relación con el resto del proyecto

* **API y Contratos:** Consume las rutas contractuales definidas en [`packages/contracts/openapi.json`](../../packages/contracts/openapi.json) (`/me`, `/habits`, `/check-ins`, `/metrics`).
* **Identidad:** Alineado al realm exportado de Keycloak en [`infrastructure/keycloak/`](../../infrastructure/keycloak/README.md) con redirección `com.quantify.app:/oauth2redirect`.
* **Diseño:** Sigue la especificación de pantallas y wireframes de [`docs/GUI/README.md`](../../docs/GUI/README.md).
