# Reglas de Negocio y Lineamientos de UI/UX

## Reglas de Negocio (RN)
1. **RN-01 (Sin Backend)**: Todo el funcionamiento debe ser estrictamente del lado del cliente. No se realizarán llamadas a APIs externas.
2. **RN-02 (Aislado de Errores)**: Si `localStorage` está vacío o corrupto, la app debe inicializarse automáticamente con un conjunto de datos por defecto (ej. 3 ejercicios básicos y 1 rutina de ejemplo).
3. **RN-03 (Entrenamiento Activo)**: Solo puede existir un entrenamiento activo a la vez. Si el usuario cierra o recarga la pestaña, el progreso no finalizado debe conservarse en el estado actual.
4. **RN-04 (Validaciones Simples)**:
   - Los nombres de ejercicios y rutinas no pueden estar vacíos.
   - Los valores de peso y repeticiones deben ser mayores o iguales a cero.

---

## Lineamientos de UI/UX para iOS
1. **Diseño Mobile-First**: Los botones de acción principal (como *Agregar Serie* o *Finalizar Entrenamiento*) deben ser amplios (mínimo 44px de alto) para facilitar el toque táctil.
2. **Prevención de Zoom Automático**: Las entradas de texto y números (`<input>`) deben tener un tamaño de fuente base de al menos `16px` para evitar que Safari en iOS haga zoom automático al enfocarlas.
3. **PWA Ready**: El archivo `index.html` debe incluir las meta-etiquetas correspondientes para el modo de pantalla completa en iOS:
   ```html
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
   <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
   ```