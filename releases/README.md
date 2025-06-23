# `/releases` - Paquetes de Distribución

Esta carpeta contiene los archivos `.zip` empaquetados listos para subir a Chrome Web Store:

**Contenido:**

- `safe-browse-guard-v1.0.0.zip`: Paquete de la versión 1.0.0 listo para producción

**Cómo generar releases:**

```bash
# 1. Construir la extensión
npm run build

# 2. Validar el paquete (opcional)
npm run validate

# 3. Empaquetar para release
npm run package
```

**Estructura del paquete:**

- Incluye todos los archivos de `/dist`
- Excluye archivos de desarrollo y testing
- Optimizado para tamaño mínimo (<1MB)
- Validado contra Chrome Web Store policies
