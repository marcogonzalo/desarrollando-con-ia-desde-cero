# Plan de Implementación: Extensión de Detección de Sitios Web Sospechosos

## Descripción del Proyecto

Desarrollar una extensión de navegador para proteger a usuarios no técnicos de sitios web sospechosos en tiempo real. La extensión identificará riesgos como phishing y malware, ofreciendo alertas claras y consejos prácticos con un enfoque en la simplicidad, la accesibilidad y la educación en ciberseguridad.

* **Audiencia Objetivo**: Particulares y pequeñas empresas con conocimientos técnicos limitados.
* **Tecnologías Propuestas**:
  * **Frontend**: HTML5, TypeScript, Vite y ShadCN para los componentes de interfaz.
  * **API de Detección**: Google Safe Browsing API.
  * **APIs de Navegador**: APIs estándar de extensiones (`chrome.tabs`, `chrome.storage`, `chrome.webRequest`, `chrome.notifications`).
  * **Testing**: Jest o un framework similar para pruebas unitarias.
* **Características del MVP**:
    1. **Verificación de URLs en tiempo real**: Integración con Google Safe Browsing para identificar amenazas conocidas.
    2. **Análisis de patrones de URL**: Detección adicional de URLs sospechosas como capa de seguridad.
    3. **Alertas visuales**: Notificaciones y cambio de icono (rojo, amarillo, verde).
    4. **Consejos prácticos**: Recomendaciones accionables según la amenaza.
    5. **Interfaz minimalista**: Interruptor de activación y panel de configuración.
    6. **Compatibilidad**: Soporte inicial para Google Chrome.
* **Buenas Prácticas**:
  * **Desarrollo**: Test-Driven Development (TDD), código limpio, modular y tipado.
  * **Accesibilidad**: Asegurar que la interfaz sea usable por todos (WCAG).
  * **Seguridad**: Privacidad por diseño, minimizando la recolección de datos.
  * **DevOps**: Integración y Despliegue Continuo (CI/CD).
  * **Control de Versiones**: Git con un flujo de trabajo claro.

## Fases del Plan de Implementación

### Fase 1: Fundación y Estructura del Proyecto (1 semana) ✅ COMPLETADA

* [x] **Tarea 1.1**: Configurar el entorno de desarrollo (Node.js, TypeScript, linters, formatters). ✅
* [x] **Tarea 1.2**: Inicializar el repositorio Git, definir la estructura de carpetas (`/src`, `/dist`, `/assets`, `/tests`). ✅
* [x] **Tarea 1.3**: Configurar el compilador de TypeScript (`tsconfig.json`) y el empaquetador (Vite). ✅
* [x] **Tarea 1.4**: Instalar y configurar ShadCN. ✅
* [x] **Tarea 1.5**: Crear el `manifest.json` inicial con permisos básicos. ✅
* [x] **Tarea 1.6**: Configurar el framework de testing (Jest) para trabajar con TypeScript. ✅
* [x] **Tarea 1.7**: Desarrollar la interfaz del popup utilizando componentes de ShadCN. ✅
* [x] **Tarea 1.8**: Escribir tests y la lógica del popup (TypeScript) para gestionar el estado (on/off) en `chrome.storage`. ✅

**Estado de la Fase 1**: Todas las tareas completadas exitosamente. La extensión tiene:

* Entorno de desarrollo completamente configurado con TypeScript, Vite, ESLint, Prettier.
* Estructura de proyecto organizada con carpetas `/src`, `/dist`, `/assets`, `/tests`
* Configuración de build funcional que genera archivos listos para Chrome
* ShadCN integrado con componentes UI funcionales (Switch)
* Manifest.json configurado con permisos necesarios
* Framework de testing Jest configurado y funcionando
* Interfaz de popup desarrollada con React + ShadCN + Tailwind CSS
* Sistema de almacenamiento de estado implementado con chrome.storage
* Extensión cargable y funcional en Chrome con modo oscuro por defecto

### Fase 2: Detección de URL con Google Safe Browsing (1-2 semanas)

* [ ] **Tarea 2.1**: Obtener una clave de API para Google Safe Browsing y configurar su gestión segura.
* [ ] **Tarea 2.2**: Escribir tests para la lógica de integración con la API de Safe Browsing (request, response, error handling).
* [ ] **Tarea 2.3**: Implementar el script de fondo (`background.ts`) para verificar URLs con la API en cada navegación.
* [ ] **Tarea 2.4**: Escribir tests para la detección de patrones de URL sospechosos como capa adicional (ej. dominios `.zip`, IDN homographs).
* [ ] **Tarea 2.5**: Implementar la lógica de detección de patrones de URL.
* [ ] **Tarea 2.6**: Implementar el cambio de icono y las notificaciones del sistema basados en la respuesta de la API y el análisis de patrones.

### Fase 3: Detección Basada en Contenido y Consejos (1-2 semanas)

* [ ] **Tarea 3.1**: Escribir tests para la lógica de análisis de contenido del DOM.
* [ ] **Tarea 3.2**: Implementar un script de contenido (`content.ts`) que analice elementos básicos de la página (ej. iframes sospechosos, formularios inseguros).
* [ ] **Tarea 3.3**: Diseñar e implementar una página de advertencia utilizando componentes de ShadCN.
* [ ] **Tarea 3.4**: Implementar la lógica para mostrar consejos prácticos y específicos en la página de advertencia según la amenaza detectada.
* [ ] **Tarea 3.5**: Realizar una auditoría de accesibilidad básica en los componentes de la interfaz.

### Fase 4: Refinamiento y Preparación del Lanzamiento (1 semana)

* [ ] **Tarea 4.1**: Desarrollar una página de opciones para configuraciones básicas (ej. activar/desactivar análisis de patrones).
* [ ] **Tarea 4.2**: Realizar pruebas de extremo a extremo, optimizando el rendimiento de las llamadas a la API.
* [ ] **Tarea 4.3**: Recopilar feedback de un grupo reducido de usuarios de prueba.
* [ ] **Tarea 4.4**: Preparar los recursos gráficos y textos para la Chrome Web Store.
* [ ] **Tarea 4.5**: Empaquetar la extensión y realizar una prueba de instalación final.

## Despliegue

### Despliegue del MVP

1. **Empaquetado**: Crear un fichero `.zip` con el código fuente listo para producción desde la carpeta `/dist`.
2. **Publicación**: Subir el paquete a la Chrome Web Store a través de la consola de desarrollador.
3. **Revisión**: Completar el formulario de la tienda, prestando especial atención a los permisos solicitados y su justificación.

### Estrategia de Actualizaciones y Despliegue Continuo

* **CI/CD**: Configurar un pipeline (ej. GitHub Actions) que en cada `push` a `main` ejecute los tests, construya el paquete y (opcionalmente) lo publique en la tienda.
* **Actualización de Amenazas**: La `blacklist.json` en el CDN se actualizará de forma independiente, permitiendo una respuesta rápida a nuevas amenazas sin tener que publicar una nueva versión de la extensión.
