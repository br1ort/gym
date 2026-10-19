# FitLog Lite (App de Entrenamiento Personal)

## Contexto
Aplicación móvil web simple, ultraligera y funcional para dispositivos iOS (iPhone), que permite registrar y consultar entrenamientos de gimnasio en tiempo real de forma **offline**.

Desarrollada por **bigpickle** mediante la terminal de **OpenCode**.

## Objetivo del Proyecto
Crear una **Progressive Web App (PWA)** utilizando exclusivamente **HTML5, CSS3 y JavaScript ES6+ Vanilla**, sin frameworks ni dependencias pesadas. La persistencia de datos residirá 100% en el cliente mediante la API de `localStorage`.

---

## Arquitectura y Stack Tecnológico
- **Frontend**: HTML5 semántico, CSS3 (variables nativas, Flexbox y Grid) y JavaScript Vanilla (ES6+).
- **Persistencia**: `localStorage` nativo del navegador (JSON serializado).
- **Target**: Navegador Mobile Safari (iOS) configurado como PWA (*Add to Home Screen*).
- **Estructura del Repositorio**:
  ```text
  /
  ├── README.md         # Contexto general y guía de ejecución
  ├── rf.md             # Requerimientos Funcionales y Diagrama de Clases
  ├── reglas.md         # Reglas de negocio y criterios de diseño
  ├── index.html        # Estructura principal y plantillas de UI
  ├── styles.css        # Estilos visuales optimizados para iOS
  └── app.js            # Lógica del dominio y StorageManager
  ```

---

## Guía de Ejecución
No hay dependencias ni proceso de build. Para ejecutar la app en local:

```bash
python3 -m http.server 8000
```

Luego abrir `http://localhost:8000` en el navegador (o en el iPhone usando la IP local de la máquina, vía misma red Wi-Fi).

### Instalación como PWA en iOS (Safari)
1. Abrir la URL en **Safari** en el iPhone.
2. Tocar el botón **Compartir**.
3. Seleccionar **Agregar a pantalla de inicio**.
4. Confirmar el nombre y tocar **Agregar**.

La app funcionará en modo pantalla completa y sin conexión una vez cargada.

---

## Instrucciones de Uso para OpenCode (bigpickle)
1. Analizar los requerimientos en `rf.md` y las reglas en `reglas.md`.
2. Mantener la lógica modular en `app.js` usando Clases de JavaScript ES6.
3. Asegurar una interfaz táctil con respuesta inmediata (*mobile-first*).
