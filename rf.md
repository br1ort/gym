# Requerimientos Funcionales (RF)

## Módulo 1: Gestión de Ejercicios y Rutinas
- **RF-01**: El usuario debe poder crear, listar y eliminar ejercicios (ej. *Press de Banca*, *Sentadilla*), indicando opcionalmente el grupo muscular.
- **RF-02**: El usuario debe poder crear y eliminar rutinas compuestas por un conjunto ordenado de ejercicios.

## Módulo 2: Registro de Sesión de Entrenamiento
- **RF-03**: El usuario debe poder iniciar un entrenamiento en vivo seleccionado desde una rutina existente o comenzando en blanco.
- **RF-04**: El usuario debe poder registrar series dentro de cada ejercicio, especificando:
  - Peso (kg)
  - Repeticiones
- **RF-05**: El usuario debe poder marcar/desmarcar individualmente cada serie como "Completada".
- **RF-06**: El usuario debe poder agregar ejercicios dinámicamente durante el entrenamiento activo.
- **RF-07**: El usuario debe poder finalizar la sesión y guardar los datos en `localStorage`.

## Módulo 3: Historial y Consulta
- **RF-08**: El usuario debe poder consultar un historial cronológico de entrenamientos finalizados.
- **RF-09**: El usuario debe poder ver el detalle completo de cualquier entrenamiento pasado (ejercicios, series, pesos, reps y fecha).

## Módulo 4: Persistencia y Exportación
- **RF-10**: Toda modificación (ejercicios, rutinas, historial) debe guardarse automáticamente en `localStorage`.
- **RF-11**: La aplicación debe proveer una opción para exportar e importar los datos en formato `.json` a modo de respaldo.

---

# Diagrama de Clases (Estructura de Objetos)

```text
 +-------------------+           +-----------------------+
 |     Ejercicio     |           |        Rutina         |
 +-------------------+           +-----------------------+
 | - id: String      |           | - id: String          |
 | - nombre: String  | 1       * | - nombre: String      |
 | - grupoMuscular:  |-----------| - ejercicios:         |
 |   String          |           |   List<Ejercicio>     |
 +-------------------+           +-----------------------+
           |                                 |
           | 1                               | 1
           |                                 |
           | *                               | *
 +-------------------+           +-----------------------+
 |       Serie       |           |     Entrenamiento     |
 +-------------------+           +-----------------------+
 | - id: String      |           | - id: String          |
 | - numeroSerie: Int|           | - fecha: Date         |
 | - peso: Float     | *       1 | - duracionMinutos: Int|
 | - repeticiones:Int|-----------| - notas: String       |
 | - completada: Bool|           | - ejerciciosRealizados|
 +-------------------+           |   : List<Serie>       |
                                 +-----------------------+
                                             |
                                             | 1
                                             |
                                             | 1
                                 +-----------------------+
                                 |  StorageManager (DAO) |
                                 +-----------------------+
                                 | + guardar()           |
                                 | + cargar()            |
                                 | + exportarJSON()      |
                                 | + importarJSON()      |
                                 +-----------------------+
```