/* ============================================================
   FitLog Lite — Lógica del dominio y StorageManager
   HTML5 + CSS3 + JavaScript ES6+ Vanilla (sin dependencias)
   ============================================================ */

'use strict';

/* ============================================================
   SECCIÓN A — Modelos (Clases ES6)
   ============================================================ */

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

class Ejercicio {
  constructor({ id, nombre, grupoMuscular = '' }) {
    this.id = id || generarId();
    this.nombre = nombre;
    this.grupoMuscular = grupoMuscular;
  }
}

class Rutina {
  constructor({ id, nombre, ejercicioIds = [] }) {
    this.id = id || generarId();
    this.nombre = nombre;
    this.ejercicioIds = ejercicioIds;
  }
}

class Serie {
  constructor({ id, numeroSerie, peso = 0, repeticiones = 0, descanso = 0 }) {
    this.id = id || generarId();
    this.numeroSerie = numeroSerie;
    this.peso = peso;
    this.repeticiones = repeticiones;
    this.descanso = descanso;
  }
}

class Entrenamiento {
  constructor({ id, fecha, duracionMinutos = 0, notas = '', ejerciciosRealizados = [], fechaInicio = null }) {
    this.id = id || generarId();
    this.fecha = fecha || new Date().toISOString();
    this.fechaInicio = fechaInicio || Date.now();
    this.duracionMinutos = duracionMinutos;
    this.notas = notas;
    // [{ ejercicioId, nombre, series: [Serie] }]
    this.ejerciciosRealizados = ejerciciosRealizados;
  }
}

/* ============================================================
   SECCIÓN B — StorageManager (DAO)
   Persistencia 100% client-side en localStorage (RN-01, RF-10)
   ============================================================ */

class StorageManager {
  static KEYS = {
    ejercicios: 'fitlog.ejercicios',
    rutinas: 'fitlog.rutinas',
    historial: 'fitlog.historial',
    activo: 'fitlog.activo',
  };

  static SEED = {
    ejercicios: [
      { id: 'seed-press-banca', nombre: 'Press de Banca', grupoMuscular: 'Pecho' },
      { id: 'seed-sentadilla', nombre: 'Sentadilla', grupoMuscular: 'Piernas' },
      { id: 'seed-peso-muerto', nombre: 'Peso Muerto', grupoMuscular: 'Espalda' },
    ],
    rutinas: [
      {
        id: 'seed-rutina-fullbody',
        nombre: 'Full Body Básico',
        ejercicioIds: ['seed-press-banca', 'seed-sentadilla', 'seed-peso-muerto'],
      },
    ],
  };

  /** Lee una clave y parsea JSON. Devuelve null si falta o está corrupto. */
  static #leer(clave) {
    try {
      const raw = localStorage.getItem(clave);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static #escribir(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  }

  /** Carga todo el estado; si está vacío o corrupto aplica seed (RN-02). */
  static cargar() {
    let ejercicios = this.#leer(this.KEYS.ejercicios);
    let rutinas = this.#leer(this.KEYS.rutinas);
    let historial = this.#leer(this.KEYS.historial);
    const activo = this.#leer(this.KEYS.activo);

    const corrupto =
      !Array.isArray(ejercicios) ||
      !Array.isArray(rutinas) ||
      !Array.isArray(historial) ||
      (activo !== null && typeof activo !== 'object');

    if (corrupto) {
      ejercicios = this.SEED.ejercicios.map((e) => new Ejercicio(e));
      rutinas = this.SEED.rutinas.map((r) => new Rutina(r));
      historial = [];
      this.guardarEjercicios(ejercicios);
      this.guardarRutinas(rutinas);
      this.guardarHistorial(historial);
      if (activo !== null) this.limpiarActivo();
    }

    return {
      ejercicios: ejercicios.map((e) => new Ejercicio(e)),
      rutinas: rutinas.map((r) => new Rutina(r)),
      historial: historial.map((h) => new Entrenamiento(h)),
      activo: activo ? new Entrenamiento(activo) : null,
    };
  }

  static guardarEjercicios(lista) { this.#escribir(this.KEYS.ejercicios, lista); }
  static guardarRutinas(lista) { this.#escribir(this.KEYS.rutinas, lista); }
  static guardarHistorial(lista) { this.#escribir(this.KEYS.historial, lista); }

  static getActivo() {
    const a = this.#leer(this.KEYS.activo);
    return a ? new Entrenamiento(a) : null;
  }

  static setActivo(entrenamiento) { this.#escribir(this.KEYS.activo, entrenamiento); }
  static limpiarActivo() { localStorage.removeItem(this.KEYS.activo); }

  /** Exporta todos los datos como string JSON (RF-11). */
  static exportarJSON() {
    const datos = {
      version: 1,
      exportadoEn: new Date().toISOString(),
      ejercicios: this.#leer(this.KEYS.ejercicios) ?? [],
      rutinas: this.#leer(this.KEYS.rutinas) ?? [],
      historial: this.#leer(this.KEYS.historial) ?? [],
    };
    return JSON.stringify(datos, null, 2);
  }

  /** Importa desde string JSON con validación básica (RF-11). Lanza Error si es inválido. */
  static importarJSON(texto) {
    let datos;
    try {
      datos = JSON.parse(texto);
    } catch {
      throw new Error('El archivo no es un JSON válido.');
    }
    if (
      !datos ||
      !Array.isArray(datos.ejercicios) ||
      !Array.isArray(datos.rutinas) ||
      !Array.isArray(datos.historial)
    ) {
      throw new Error('El archivo no tiene el formato de respaldo de FitLog Lite.');
    }
    const ejercicios = datos.ejercicios.map((e) => new Ejercicio(e));
    const rutinas = datos.rutinas.map((r) => new Rutina(r));
    const historial = datos.historial.map((h) => new Entrenamiento(h));

    this.guardarEjercicios(ejercicios);
    this.guardarRutinas(rutinas);
    this.guardarHistorial(historial);
    return { ejercicios, rutinas, historial };
  }

  /** Restaura datos seed y limpia el entrenamiento activo (RN-02). */
  static restablecerSeed() {
    const ejercicios = this.SEED.ejercicios.map((e) => new Ejercicio(e));
    const rutinas = this.SEED.rutinas.map((r) => new Rutina(r));
    this.guardarEjercicios(ejercicios);
    this.guardarRutinas(rutinas);
    this.guardarHistorial([]);
    this.limpiarActivo();
    return { ejercicios, rutinas, historial: [] };
  }
}

/* ============================================================
   SECCIÓN C — Validaciones (RN-04)
   ============================================================ */

const Validaciones = {
  nombreNoVacio(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
  },
  numeroNoNegativo(valor) {
    const n = Number(valor);
    return Number.isFinite(n) && n >= 0;
  },
};

/* ============================================================
   SECCIÓN D — Estado global + helpers de UI
   ============================================================ */

const estado = {
  ejercicios: [],
  rutinas: [],
  historial: [],
  activo: null,
  vistaActual: 'entrenar',
};

// Estado local de la vista Entrenar: rutina seleccionada para ver detalle
// (se asigna tras definir VistaEntrenar)

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function formatearFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/* --- Modal genérico con confirmación --- */
const Modal = {
  abrir(titulo, contenidoHTML, alConfirmar) {
    $('#modal-titulo').textContent = titulo;
    $('#modal-contenido').innerHTML = contenidoHTML;
    $('#modal-overlay').classList.remove('hidden');
    this._alConfirmar = alConfirmar;
  },
  cerrar() {
    $('#modal-overlay').classList.add('hidden');
    this._alConfirmar = null;
  },
};

/* ============================================================
   SECCIÓN E — Lógica por vista
   ============================================================ */

/* ---------- E0: Temporizador de descanso (uno por ejercicio) ---------- */

const DescansoTimer = {
  ejercicioIdx: null,
  restante: 0,
  inicial: 0,
  corriendo: false,
  terminado: false,
  intervalId: null,

  /** Segundos de descanso de la última serie del ejercicio (0 si no hay series). */
  descansoDe(idx) {
    const ej = estado.activo?.ejerciciosRealizados[idx];
    if (!ej || ej.series.length === 0) return 0;
    return Math.max(0, Math.floor(Number(ej.series[ej.series.length - 1].descanso) || 0));
  },

  formatear(seg) {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  alternar(idx) {
    if (this.corriendo && this.ejercicioIdx === idx) this.pausar();
    else this.iniciar(idx);
  },

  iniciar(idx) {
    if (this.corriendo) this.pausar();
    if (this.ejercicioIdx !== idx || this.terminado || this.restante <= 0) {
      this.ejercicioIdx = idx;
      this.inicial = this.descansoDe(idx);
      this.restante = this.inicial;
      this.terminado = false;
    }
    if (this.restante <= 0) {
      this.actualizarDOM();
      UI.toast('Configura un descanso mayor a 0 s.');
      return;
    }
    this.corriendo = true;
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.actualizarDOM();
  },

  pausar() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.corriendo = false;
    this.actualizarDOM();
  },

  reiniciar(idx) {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.corriendo = false;
    this.ejercicioIdx = idx;
    this.inicial = this.descansoDe(idx);
    this.restante = this.inicial;
    this.terminado = false;
    this.actualizarDOM();
  },

  detener() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.corriendo = false;
    this.ejercicioIdx = null;
    this.restante = 0;
    this.inicial = 0;
    this.terminado = false;
  },

  tick() {
    this.restante--;
    if (this.restante <= 0) {
      this.restante = 0;
      this.corriendo = false;
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.terminado = true;
      this.beep();
    }
    this.actualizarDOM();
  },

  /** Sincroniza el tiempo con el descanso de la serie editada (si su timer no corre). */
  resincronizar(serieId) {
    const idx = estado.activo?.ejerciciosRealizados.findIndex((ej) =>
      ej.series.some((s) => s.id === serieId)
    );
    if (idx === undefined || idx === -1) return;
    if (this.corriendo && this.ejercicioIdx === idx) return;
    if (this.ejercicioIdx === idx) {
      this.inicial = this.descansoDe(idx);
      this.restante = this.inicial;
      this.terminado = false;
    }
    this.actualizarDOM(idx);
  },

  /** Re-sincroniza los nodos del DOM tras un re-render de la vista. */
  adjuntar() {
    if (this.ejercicioIdx === null) return;
    this.actualizarDOM();
  },

  actualizarDOM(idxOverride) {
    const cont = document.getElementById('lista-ejercicios-activos');
    if (!cont) return;
    const idx = idxOverride ?? this.ejercicioIdx;
    if (idx === null || idx === undefined) return;
    const block = cont.querySelector(`[data-timer-idx="${idx}"]`);
    if (!block) return;
    const display = block.querySelector('.rest-timer-display');
    if (!display) return;
    const activo = this.ejercicioIdx === idx;
    display.textContent = this.formatear(activo ? this.restante : this.descansoDe(idx));
    block.classList.toggle('finished', activo && this.terminado);
    const btn = block.querySelector('[data-timer-toggle]');
    if (btn) btn.textContent = activo && this.corriendo ? '⏸' : '▶';
  },

  /** Beep de fin de descanso con Web Audio API (sin assets, funciona offline). */
  beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = 880;
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.start(t);
      o.stop(t + 0.55);
      o.onended = () => ctx.close();
    } catch {
      /* audio no disponible */
    }
  },
};

/* ---------- E1: Vista Entrenar ---------- */

const VistaEntrenar = {
  render() {
    const editando = estado.activo !== null && this.modoEditor;
    $('#panel-iniciar').classList.toggle('hidden', editando);
    $('#panel-activo').classList.toggle('hidden', !editando);

    if (editando) this.renderActivo();
    else this.renderListaRutinas();
  },

  renderListaRutinas() {
    this.renderPendiente();

    const cont = $('#lista-rutinas-inicio');
    if (estado.rutinas.length === 0) {
      cont.innerHTML = '<p class="empty-state">No hay rutinas. Crea una en la pestaña Rutinas o inicia en blanco.</p>';
      return;
    }
    cont.innerHTML = estado.rutinas
      .map((r) => {
        const nombres = r.ejercicioIds
          .map((id) => estado.ejercicios.find((e) => e.id === id)?.nombre)
          .filter(Boolean)
          .join(' · ');
        return `
          <div class="card card-tap" data-rutina-inicio="${r.id}">
            <div class="card-title">${escapeHTML(r.nombre)}</div>
            <div class="card-sub">${escapeHTML(nombres || 'Sin ejercicios')}</div>
          </div>`;
      })
      .join('');
  },

  /** Muestra el entrenamiento pendiente (borrador) si existe. */
  renderPendiente() {
    const cont = $('#draft-pendiente');
    if (!estado.activo) {
      cont.innerHTML = '';
      return;
    }
    const a = estado.activo;
    const totalSeries = a.ejerciciosRealizados.reduce((acc, e) => acc + e.series.length, 0);
    cont.innerHTML = `
      <div class="card card-tap card-pendiente" data-retomar-borrador>
        <div class="card-title">
          <span>⏳ Entrenamiento pendiente</span>
          <span class="chip chip-accent">Borrador</span>
        </div>
        <div class="card-sub">
          ${formatearFecha(a.fecha)} · ${a.ejerciciosRealizados.length} ejercicio(s) · ${totalSeries} serie(s)
          — Toca para continuar
        </div>
      </div>`;
  },

  /** Reanuda el borrador pendiente en el editor. */
  retomarBorrador() {
    if (!estado.activo) return;
    this.modoEditor = true;
    this.render();
  },

  /** Abre el editor creando un borrador nuevo desde una rutina. */
  abrirRutina(rutinaId) {
    const rutina = estado.rutinas.find((r) => r.id === rutinaId);
    if (!rutina) return;
    const crear = () => {
      const ejerciciosRealizados = rutina.ejercicioIds
        .map((id) => estado.ejercicios.find((e) => e.id === id))
        .filter(Boolean)
        .map((e) => ({
          ejercicioId: e.id,
          nombre: e.nombre,
          series: this.seriesDesdeHistorial(e.id),
        }));
      this.crearBorrador(ejerciciosRealizados);
    };
    this.conBorradorExistente(crear, `la rutina "${rutina.nombre}"`);
  },

  /** Abre el editor con un borrador vacío. */
  abrirEnBlanco() {
    this.conBorradorExistente(() => this.crearBorrador([]), 'un entrenamiento en blanco');
  },

  /**
   * Si ya hay un borrador pendiente, pide confirmación antes de reemplazarlo
   * (solo puede existir un entrenamiento pendiente a la vez).
   */
  conBorradorExistente(accion, descripcion) {
    if (!estado.activo) {
      accion();
      return;
    }
    Modal.abrir(
      'Entrenamiento pendiente',
      `<p class="hint">Ya tienes un entrenamiento pendiente sin finalizar. Si abres ${descripcion}, se descartará el borrador actual. ¿Continuar?</p>`,
      () => {
        Modal.cerrar();
        accion();
      }
    );
  },

  crearBorrador(ejerciciosRealizados) {
    DescansoTimer.detener();
    estado.activo = new Entrenamiento({ ejerciciosRealizados });
    this.modoEditor = true;
    StorageManager.setActivo(estado.activo);
    this.render();
  },

  /** Guarda el borrador y vuelve a la lista de entrenamientos. */
  guardar() {
    if (!estado.activo) return;
    DescansoTimer.detener();
    StorageManager.setActivo(estado.activo);
    this.modoEditor = false;
    this.render();
    UI.toast('Progreso guardado ✔');
  },

  /**
   * Devuelve las series del último entrenamiento finalizado que incluyó
   * este ejercicio, como valores por defecto para repetir la sesión.
   */
  seriesDesdeHistorial(ejercicioId) {
    const ordenados = [...estado.historial].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    for (const ent of ordenados) {
      const ej = ent.ejerciciosRealizados.find((x) => x.ejercicioId === ejercicioId);
      if (ej && ej.series.length > 0) {
        return ej.series.map(
          (s, i) =>
            new Serie({
              numeroSerie: i + 1,
              peso: s.peso,
              repeticiones: s.repeticiones,
              descanso: s.descanso ?? 0,
            })
        );
      }
    }
    return [];
  },

  renderActivo() {
    const a = estado.activo;
    $('#activo-fecha').textContent = formatearFecha(a.fecha);
    $('#activo-estado').textContent = 'En edición';

    const cont = $('#lista-ejercicios-activos');
    if (a.ejerciciosRealizados.length === 0) {
      cont.innerHTML = '<p class="empty-state">Sin ejercicios todavía. Agrega el primero ↓</p>';
      return;
    }
    cont.innerHTML = a.ejerciciosRealizados
      .map((ej, idx, arr) => {
        const min = !!ej.minimizado;
        const ultima = ej.series[ej.series.length - 1];
        const resumen =
          ej.series.length === 0
            ? 'Sin series'
            : `${ej.series.length} serie(s) · ${ultima.peso} kg × ${ultima.repeticiones} reps`;
        const seriesHTML = ej.series
          .map(
            (s) => `
            <div class="series-row" data-serie="${s.id}">
              <span class="series-num">${s.numeroSerie}</span>
              <label class="series-field">
                <input class="input input-num" type="number" inputmode="decimal" min="0" step="0.5"
                  value="${s.peso}" data-campo="peso" data-serie-id="${s.id}" aria-label="Peso kg">
                <span class="series-unit">kg</span>
              </label>
              <div class="reps-cell">
                <div class="reps-stepper">
                  <button class="stepper-btn" type="button" data-reps-dec="${s.id}" aria-label="Restar una repetición">−</button>
                  <input class="input input-num" type="number" inputmode="numeric" min="0" step="1"
                    value="${s.repeticiones}" data-campo="repeticiones" data-serie-id="${s.id}" aria-label="Repeticiones">
                  <button class="stepper-btn" type="button" data-reps-inc="${s.id}" aria-label="Sumar una repetición">+</button>
                </div>
                <span class="series-unit">reps</span>
              </div>
              <button class="series-eliminar" data-eliminar-serie="${s.id}" aria-label="Eliminar serie">✕</button>
              <label class="series-field series-rest">
                <span class="series-unit">Descanso</span>
                <input class="input input-num" type="number" inputmode="numeric" min="0" step="5"
                  value="${s.descanso ?? 0}" data-campo="descanso" data-serie-id="${s.id}" aria-label="Descanso en segundos">
                <span class="series-unit">s</span>
              </label>
            </div>`
          )
          .join('');
        const grupo = estado.ejercicios.find((e) => e.id === ej.ejercicioId)?.grupoMuscular || '';
        const mostrarTimer = !min || DescansoTimer.ejercicioIdx === idx;
        return `
          <div class="exercise-block ${min ? 'minimized' : ''}" data-ejercicio-idx="${idx}">
            <div class="card-title exercise-head ${min ? 'min' : ''}">
              <button class="exercise-toggle" type="button" data-toggle-min="${idx}"
                aria-label="Minimizar o expandir el ejercicio" aria-expanded="${!min}">
                <span class="exercise-chevron">▾</span>
                <span>${escapeHTML(ej.nombre)}${grupo ? ` <span class="chip">${escapeHTML(grupo)}</span>` : ''}</span>
              </button>
              <span class="exercise-moves">
                <button class="move-btn" type="button" data-ej-subir="${idx}" ${idx === 0 ? 'disabled' : ''} aria-label="Subir ejercicio">↑</button>
                <button class="move-btn" type="button" data-ej-bajar="${idx}" ${idx === arr.length - 1 ? 'disabled' : ''} aria-label="Bajar ejercicio">↓</button>
              </span>
            </div>
            ${min ? `<div class="exercise-summary">${escapeHTML(resumen)}</div>` : seriesHTML}
            ${mostrarTimer
              ? `<div class="rest-timer" data-timer-idx="${idx}">
              <span class="rest-timer-label">Descanso</span>
              <span class="rest-timer-display">${DescansoTimer.formatear(DescansoTimer.descansoDe(idx))}</span>
              <button class="rest-timer-btn" type="button" data-timer-toggle="${idx}" aria-label="Iniciar o pausar el descanso">▶</button>
              <button class="rest-timer-reset" type="button" data-timer-reset="${idx}" aria-label="Reiniciar el descanso">↺</button>
            </div>`
              : ''}
            ${min ? '' : `<button class="btn-add-serie" data-add-serie="${idx}">+ Agregar serie</button>`}
          </div>`;
      })
      .join('');
    DescansoTimer.adjuntar();
  },

  /** Minimiza/expande un bloque de ejercicio (estado persistido en el borrador). */
  alternarMinimizado(idx) {
    const ej = estado.activo?.ejerciciosRealizados[idx];
    if (!ej) return;
    ej.minimizado = !ej.minimizado;
    StorageManager.setActivo(estado.activo);
    this.renderActivo();
  },

  /** Mueve un ejercicio arriba/abajo dentro del entrenamiento activo. */
  moverEjercicio(idx, dir) {
    const arr = estado.activo?.ejerciciosRealizados;
    if (!arr) return;
    const j = dir === 'subir' ? idx - 1 : idx + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    if (DescansoTimer.ejercicioIdx === idx) DescansoTimer.ejercicioIdx = j;
    else if (DescansoTimer.ejercicioIdx === j) DescansoTimer.ejercicioIdx = idx;
    StorageManager.setActivo(estado.activo);
    this.renderActivo();
  },

  agregarEjercicio() {
    const disponibles = estado.ejercicios;
    if (disponibles.length === 0) {
      UI.toast('Primero crea ejercicios en la pestaña Ejercicios.');
      return;
    }
    const opciones = disponibles
      .map((e) => `<label class="check-item"><input type="radio" name="ejercicio-agregar" value="${e.id}"> ${escapeHTML(e.nombre)}${e.grupoMuscular ? ` <span class="chip">${escapeHTML(e.grupoMuscular)}</span>` : ''}</label>`)
      .join('');
    Modal.abrir('Agregar ejercicio', `<div class="check-list">${opciones}</div>`, () => {
      const sel = document.querySelector('input[name="ejercicio-agregar"]:checked');
      if (!sel) {
        UI.toast('Selecciona un ejercicio.');
        return;
      }
      const ej = estado.ejercicios.find((e) => e.id === sel.value);
      estado.activo.ejerciciosRealizados.push({
        ejercicioId: ej.id,
        nombre: ej.nombre,
        series: this.seriesDesdeHistorial(ej.id),
      });
      StorageManager.setActivo(estado.activo);
      Modal.cerrar();
      this.render();
    });
  },

  agregarSerie(idx) {
    const ej = estado.activo.ejerciciosRealizados[idx];
    const numero = ej.series.length + 1;
    // Hereda peso, reps y descanso de la última serie de este ejercicio
    const ultima = ej.series[ej.series.length - 1];
    ej.series.push(
      new Serie({
        numeroSerie: numero,
        peso: ultima ? ultima.peso : 0,
        repeticiones: ultima ? ultima.repeticiones : 0,
        descanso: ultima ? ultima.descanso ?? 0 : 0,
      })
    );
    StorageManager.setActivo(estado.activo);
    this.renderActivo();
  },

  actualizarSerie(serieId, campo, valor) {
    for (const ej of estado.activo.ejerciciosRealizados) {
      const s = ej.series.find((x) => x.id === serieId);
      if (s) {
        const n = Number(valor);
        if (Validaciones.numeroNoNegativo(n)) s[campo] = n;
        StorageManager.setActivo(estado.activo);
        return;
      }
    }
  },

  ajustarReps(serieId, delta) {
    for (const ej of estado.activo.ejerciciosRealizados) {
      const s = ej.series.find((x) => x.id === serieId);
      if (s) {
        const n = Math.max(0, (Number(s.repeticiones) || 0) + delta);
        if (!Validaciones.numeroNoNegativo(n)) return;
        s.repeticiones = n;
        StorageManager.setActivo(estado.activo);
        const inp = document.querySelector(
          `#lista-ejercicios-activos input[data-campo="repeticiones"][data-serie-id="${serieId}"]`
        );
        if (inp) inp.value = n;
        return;
      }
    }
  },

  eliminarSerie(serieId) {
    for (const ej of estado.activo.ejerciciosRealizados) {
      const i = ej.series.findIndex((x) => x.id === serieId);
      if (i !== -1) {
        ej.series.splice(i, 1);
        ej.series.forEach((s, n) => (s.numeroSerie = n + 1));
        StorageManager.setActivo(estado.activo);
        this.renderActivo();
        return;
      }
    }
  },

  finalizar() {
    if (!estado.activo) return;
    const totalSeries = estado.activo.ejerciciosRealizados.reduce((acc, e) => acc + e.series.length, 0);
    if (totalSeries === 0) {
      UI.toast('Agrega al menos una serie antes de finalizar.');
      return;
    }
    Modal.abrir(
      'Finalizar entrenamiento',
      `<p class="hint">Se guardará en el historial con <strong>${totalSeries}</strong> serie(s) y dejará de estar pendiente. ¿Continuar?</p>`,
      () => {
        const ent = estado.activo;
        ent.duracionMinutos = 0;
        delete ent.fechaInicio;

        DescansoTimer.detener();
        estado.historial.unshift(ent);
        estado.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        StorageManager.guardarHistorial(estado.historial);
        StorageManager.limpiarActivo();
        estado.activo = null;
        this.modoEditor = false;
        Modal.cerrar();
        UI.toast('Entrenamiento finalizado ✔');
        this.render();
      }
    );
  },
};

/* ---------- E2: Vista Ejercicios ---------- */

const VistaEjercicios = {
  render() {
    const cont = $('#lista-ejercicios');
    if (estado.ejercicios.length === 0) {
      cont.innerHTML = '<p class="empty-state">No hay ejercicios. Agrega el primero arriba.</p>';
      return;
    }
    cont.innerHTML = estado.ejercicios
      .map(
        (e) => `
        <div class="card">
          <div class="card-title">
            <span>${escapeHTML(e.nombre)}</span>
            <button class="btn btn-danger btn-small" data-eliminar-ejercicio="${e.id}">Eliminar</button>
          </div>
          ${e.grupoMuscular ? `<div class="card-sub">${escapeHTML(e.grupoMuscular)}</div>` : ''}
        </div>`
      )
      .join('');
  },

  agregar(nombre, grupoMuscular) {
    const err = $('#error-ejercicio');
    if (!Validaciones.nombreNoVacio(nombre)) {
      err.textContent = 'El nombre del ejercicio no puede estar vacío.';
      err.classList.remove('hidden');
      return false;
    }
    err.classList.add('hidden');
    estado.ejercicios.push(new Ejercicio({ nombre: nombre.trim(), grupoMuscular: grupoMuscular.trim() }));
    StorageManager.guardarEjercicios(estado.ejercicios);
    this.render();
    return true;
  },

  eliminar(id) {
    const usadoEnRutina = estado.rutinas.some((r) => r.ejercicioIds.includes(id));
    const texto = usadoEnRutina
      ? 'Este ejercicio se usa en una o más rutinas (se quitarán de ellas). ¿Eliminar?'
      : '¿Eliminar este ejercicio?';
    Modal.abrir('Eliminar ejercicio', `<p class="hint">${texto}</p>`, () => {
      estado.ejercicios = estado.ejercicios.filter((e) => e.id !== id);
      estado.rutinas.forEach((r) => {
        r.ejercicioIds = r.ejercicioIds.filter((eid) => eid !== id);
      });
      StorageManager.guardarEjercicios(estado.ejercicios);
      StorageManager.guardarRutinas(estado.rutinas);
      Modal.cerrar();
      this.render();
      VistaRutinas.render();
      VistaEntrenar.render();
    });
  },
};

/* ---------- E3: Vista Rutinas ---------- */

const VistaRutinas = {
  seleccionados: [], // ids en orden de selección
  editandoId: null, // id de la rutina en edición, o null

  render() {
    // Selector de ejercicios
    const sel = $('#selector-ejercicios-rutina');
    if (estado.ejercicios.length === 0) {
      sel.innerHTML = '<p class="empty-state">No hay ejercicios. Crea algunos en la pestaña Ejercicios.</p>';
    } else {
      sel.innerHTML = estado.ejercicios
        .map((e) => {
          const pos = this.seleccionados.indexOf(e.id);
          return `
            <label class="check-item">
              <input type="checkbox" data-check-ejercicio="${e.id}" ${pos !== -1 ? 'checked' : ''}>
              ${escapeHTML(e.nombre)}
              ${e.grupoMuscular ? `<span class="chip">${escapeHTML(e.grupoMuscular)}</span>` : ''}
              ${pos !== -1 ? `<span class="orden">${pos + 1}</span>` : ''}
            </label>`;
        })
        .join('');
    }

    // Lista de orden (reordenable) de la selección actual
    const ordenCont = $('#orden-rutina');
    const items = this.seleccionados
      .map((id) => estado.ejercicios.find((e) => e.id === id))
      .filter(Boolean);
    ordenCont.innerHTML = items.length
      ? `<p class="hint">Orden en la rutina:</p>` +
        items
          .map(
            (e, i) => `
          <div class="orden-item">
            <span class="orden-num">${i + 1}</span>
            <span class="orden-nombre">${escapeHTML(e.nombre)}</span>
            <button class="move-btn" type="button" data-orden-subir="${e.id}" ${i === 0 ? 'disabled' : ''} aria-label="Subir ejercicio">↑</button>
            <button class="move-btn" type="button" data-orden-bajar="${e.id}" ${i === items.length - 1 ? 'disabled' : ''} aria-label="Bajar ejercicio">↓</button>
          </div>`
          )
          .join('')
      : '';

    // Formulario: texto según modo crear/editar
    const rutinaEditando = this.editandoId ? estado.rutinas.find((r) => r.id === this.editandoId) : null;
    if (this.editandoId && !rutinaEditando) {
      this.editandoId = null; // la rutina fue eliminada mientras tanto
      this.seleccionados = [];
    }
    const hint = $('#hint-rutinas');
    if (hint) {
      hint.textContent = rutinaEditando
        ? `Editando "${rutinaEditando.nombre}" — reordena con ↑↓ y guarda los cambios.`
        : 'Selecciona los ejercicios en el orden deseado:';
    }
    $('#btn-crear-rutina').textContent = rutinaEditando ? 'Guardar cambios' : 'Crear rutina';

    // Botón Cancelar visible solo mientras hay un borrador o edición en curso
    $('#btn-cancelar-rutina').classList.toggle('hidden', !this.hayBorrador());

    // Lista de rutinas
    const cont = $('#lista-rutinas');
    if (estado.rutinas.length === 0) {
      cont.innerHTML = '<p class="empty-state">No hay rutinas creadas.</p>';
      return;
    }
    cont.innerHTML = estado.rutinas
      .map((r) => {
        const nombres = r.ejercicioIds
          .map((id) => estado.ejercicios.find((e) => e.id === id)?.nombre)
          .filter(Boolean)
          .join(' · ');
        return `
          <div class="card">
            <div class="card-title">
              <span>${escapeHTML(r.nombre)}</span>
              <span class="card-actions">
                <button class="btn btn-ghost btn-small" data-editar-rutina="${r.id}">Editar</button>
                <button class="btn btn-danger btn-small" data-eliminar-rutina="${r.id}">Eliminar</button>
              </span>
            </div>
            <div class="card-sub">${escapeHTML(nombres || 'Sin ejercicios')}</div>
          </div>`;
      })
      .join('');
  },

  toggleEjercicio(id, checked) {
    if (checked) {
      if (!this.seleccionados.includes(id)) this.seleccionados.push(id);
    } else {
      this.seleccionados = this.seleccionados.filter((x) => x !== id);
    }
    this.render();
  },

  /** Mueve un ejercicio de la selección arriba/abajo en el orden de la rutina. */
  moverSeleccionado(id, dir) {
    const i = this.seleccionados.indexOf(id);
    const j = dir === 'subir' ? i - 1 : i + 1;
    if (i === -1 || j < 0 || j >= this.seleccionados.length) return;
    [this.seleccionados[i], this.seleccionados[j]] = [this.seleccionados[j], this.seleccionados[i]];
    this.render();
  },

  /** Carga una rutina existente en el formulario para editarla. */
  editar(id) {
    const r = estado.rutinas.find((x) => x.id === id);
    if (!r) return;
    this.editandoId = id;
    this.seleccionados = r.ejercicioIds.filter((eid) => estado.ejercicios.some((e) => e.id === eid));
    const input = $('#input-nombre-rutina');
    input.value = r.nombre;
    $('#error-rutina').classList.add('hidden');
    this.render();
    input.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  },

  /** ¿Hay un borrador de rutina en curso (nombre, ejercicios o edición)? */
  hayBorrador() {
    return (
      this.editandoId !== null ||
      this.seleccionados.length > 0 ||
      ($('#input-nombre-rutina')?.value?.trim().length ?? 0) > 0
    );
  },

  /** Descarta el borrador actual y limpia el formulario (volver atrás). */
  cancelar() {
    this.seleccionados = [];
    this.editandoId = null;
    const input = $('#input-nombre-rutina');
    if (input) input.value = '';
    $('#error-rutina').classList.add('hidden');
    this.render();
  },

  crear(nombre) {
    const err = $('#error-rutina');
    if (!Validaciones.nombreNoVacio(nombre)) {
      err.textContent = 'El nombre de la rutina no puede estar vacío.';
      err.classList.remove('hidden');
      return;
    }
    if (this.seleccionados.length === 0) {
      err.textContent = 'Selecciona al menos un ejercicio.';
      err.classList.remove('hidden');
      return;
    }
    err.classList.add('hidden');
    const ids = this.seleccionados.filter((eid) => estado.ejercicios.some((e) => e.id === eid));
    if (this.editandoId) {
      const r = estado.rutinas.find((x) => x.id === this.editandoId);
      if (r) {
        r.nombre = nombre.trim();
        r.ejercicioIds = ids;
      }
    } else {
      estado.rutinas.push(new Rutina({ nombre: nombre.trim(), ejercicioIds: ids }));
    }
    StorageManager.guardarRutinas(estado.rutinas);
    this.editandoId = null;
    this.seleccionados = [];
    $('#input-nombre-rutina').value = '';
    this.render();
    VistaEntrenar.render();
  },

  eliminar(id) {
    Modal.abrir('Eliminar rutina', '<p class="hint">¿Eliminar esta rutina? El historial no se verá afectado.</p>', () => {
      estado.rutinas = estado.rutinas.filter((r) => r.id !== id);
      StorageManager.guardarRutinas(estado.rutinas);
      Modal.cerrar();
      this.render();
      VistaEntrenar.render();
    });
  },
};

/* ---------- E4: Vista Historial ---------- */

const VistaHistorial = {
  render() {
    $('#panel-historial-lista').classList.remove('hidden');
    $('#panel-historial-detalle').classList.add('hidden');

    const cont = $('#lista-historial');
    if (estado.historial.length === 0) {
      cont.innerHTML = '<p class="empty-state">Aún no hay entrenamientos guardados.</p>';
      return;
    }
    cont.innerHTML = estado.historial
      .map((h) => {
        const totalSeries = h.ejerciciosRealizados.reduce((acc, e) => acc + e.series.length, 0);
        return `
          <div class="card card-tap" data-historial-id="${h.id}">
            <div class="card-title">${formatearFecha(h.fecha)}</div>
            <div class="card-sub">${h.ejerciciosRealizados.length} ejercicio(s) · ${totalSeries} serie(s)${h.notas ? ` · 📝 ${escapeHTML(h.notas)}` : ''}</div>
          </div>`;
      })
      .join('');
  },

  verDetalle(id) {
    const h = estado.historial.find((x) => x.id === id);
    if (!h) return;

    const ejerciciosHTML = h.ejerciciosRealizados
      .map((ej) => {
        const seriesHTML = ej.series
          .map(
            (s) => `
            <div class="detalle-serie">
              <span>Serie ${s.numeroSerie}</span>
              <span><strong>${s.peso}</strong> kg × <strong>${s.repeticiones}</strong> reps</span>
              <span>· ${s.descanso ?? 0}s descanso</span>
            </div>`
          )
          .join('');
        return `
          <div class="detalle-ejercicio">
            <div class="card-title">${escapeHTML(ej.nombre)}</div>
            ${seriesHTML || '<p class="card-sub">Sin series registradas</p>'}
          </div>`;
      })
      .join('');

    $('#detalle-entrenamiento').innerHTML = `
      <div class="card">
        <div class="card-title">${formatearFecha(h.fecha)}</div>
        <div class="card-sub">${h.notas ? `Notas: ${escapeHTML(h.notas)}` : 'Entrenamiento finalizado'}</div>
      </div>
      ${ejerciciosHTML}`;

    $('#panel-historial-lista').classList.add('hidden');
    $('#panel-historial-detalle').classList.remove('hidden');
  },

  volver() {
    this.render();
  },
};

/* ---------- E5: Vista Ajustes ---------- */

const VistaAjustes = {
  exportar() {
    const json = StorageManager.exportarJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    UI.toast('Datos exportados ✔');
  },

  importar(file) {
    const lector = new FileReader();
    lector.onload = () => {
      Modal.abrir(
        'Importar datos',
        `<p class="hint">Se reemplazarán todos tus datos actuales por los del archivo <strong>${escapeHTML(file.name)}</strong>. ¿Continuar?</p>`,
        () => {
          try {
            const res = StorageManager.importarJSON(String(lector.result));
            estado.ejercicios = res.ejercicios;
            estado.rutinas = res.rutinas;
            estado.historial = res.historial;
            estado.activo = StorageManager.getActivo();
            Modal.cerrar();
            UI.renderTodo();
            UI.toast('Datos importados ✔');
          } catch (err) {
            Modal.cerrar();
            UI.toast(err.message || 'Error al importar.');
          }
        }
      );
    };
    lector.readAsText(file);
  },

  restablecer() {
    Modal.abrir(
      'Restablecer datos',
      '<p class="hint">Se borrarán todos tus ejercicios, rutinas e historial, y se cargarán los datos por defecto. ¿Continuar?</p>',
      () => {
        const res = StorageManager.restablecerSeed();
        estado.ejercicios = res.ejercicios;
        estado.rutinas = res.rutinas;
        estado.historial = res.historial;
        estado.activo = null;
        Modal.cerrar();
        UI.renderTodo();
        UI.toast('Datos restablecidos ✔');
      }
    );
  },
};

/* ============================================================
   Router y orquestación de UI
   ============================================================ */

const UI = {
  irA(vista) {
    if (estado.vistaActual === 'entrenar' && vista !== 'entrenar') DescansoTimer.detener();
    estado.vistaActual = vista;
    $$('.view').forEach((v) => v.classList.toggle('active', v.dataset.view === vista));
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.target === vista));

    // Al volver al historial, mostrar siempre la lista
    if (vista === 'historial') VistaHistorial.render();
    else this.renderVista(vista);
  },

  renderVista(vista) {
    switch (vista) {
      case 'entrenar': VistaEntrenar.render(); break;
      case 'ejercicios': VistaEjercicios.render(); break;
      case 'rutinas': VistaRutinas.render(); break;
      case 'historial': VistaHistorial.render(); break;
      case 'ajustes': break; // estático
    }
  },

  renderTodo() {
    this.renderVista('entrenar');
    this.renderVista('ejercicios');
    this.renderVista('rutinas');
    this.renderVista('historial');
  },

  toast(msg) {
    // Feedback mínimo sin dependencias
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText =
        'position:fixed;bottom:calc(64px + env(safe-area-inset-bottom,0px) + 12px);left:50%;transform:translateX(-50%);background:#1e2330;color:#e8ecf4;border:1px solid #2a3040;padding:10px 18px;border-radius:999px;font-size:14px;z-index:300;transition:opacity .3s;max-width:90%;text-align:center;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      t.style.opacity = '0';
    }, 2200);
  },
};

/* ============================================================
   Bootstrap + Event listeners
   ============================================================ */

function init() {
  const datos = StorageManager.cargar();
  estado.ejercicios = datos.ejercicios;
  estado.rutinas = datos.rutinas;
  estado.historial = datos.historial;
  estado.activo = datos.activo;

  UI.renderTodo();

  /* --- Tabs --- */
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => UI.irA(tab.dataset.target));
  });

  /* --- Entrenar: abrir rutina o borrador pendiente --- */
  $('#lista-rutinas-inicio').addEventListener('click', (ev) => {
    const card = ev.target.closest('[data-rutina-inicio]');
    if (card) VistaEntrenar.abrirRutina(card.dataset.rutinaInicio);
  });
  $('#draft-pendiente').addEventListener('click', (ev) => {
    if (ev.target.closest('[data-retomar-borrador]')) VistaEntrenar.retomarBorrador();
  });
  $('#btn-iniciar-vacio').addEventListener('click', () => VistaEntrenar.abrirEnBlanco());

  /* --- Entrenar: editor de progreso --- */
  $('#btn-agregar-ejercicio-activo').addEventListener('click', () => VistaEntrenar.agregarEjercicio());
  $('#btn-guardar').addEventListener('click', () => VistaEntrenar.guardar());
  $('#btn-finalizar').addEventListener('click', () => VistaEntrenar.finalizar());

  $('#lista-ejercicios-activos').addEventListener('click', (ev) => {
    const add = ev.target.closest('[data-add-serie]');
    if (add) return VistaEntrenar.agregarSerie(Number(add.dataset.addSerie));
    const del = ev.target.closest('[data-eliminar-serie]');
    if (del) return VistaEntrenar.eliminarSerie(del.dataset.eliminarSerie);
    const dec = ev.target.closest('[data-reps-dec]');
    if (dec) return VistaEntrenar.ajustarReps(dec.dataset.repsDec, -1);
    const inc = ev.target.closest('[data-reps-inc]');
    if (inc) return VistaEntrenar.ajustarReps(inc.dataset.repsInc, 1);
    const toggle = ev.target.closest('[data-timer-toggle]');
    if (toggle) return DescansoTimer.alternar(Number(toggle.dataset.timerToggle));
    const reset = ev.target.closest('[data-timer-reset]');
    if (reset) return DescansoTimer.reiniciar(Number(reset.dataset.timerReset));
    const min = ev.target.closest('[data-toggle-min]');
    if (min) return VistaEntrenar.alternarMinimizado(Number(min.dataset.toggleMin));
    const subir = ev.target.closest('[data-ej-subir]');
    if (subir) return VistaEntrenar.moverEjercicio(Number(subir.dataset.ejSubir), 'subir');
    const bajar = ev.target.closest('[data-ej-bajar]');
    if (bajar) return VistaEntrenar.moverEjercicio(Number(bajar.dataset.ejBajar), 'bajar');
  });

  $('#lista-ejercicios-activos').addEventListener('change', (ev) => {
    const inp = ev.target.closest('[data-campo]');
    if (!inp) return;
    VistaEntrenar.actualizarSerie(inp.dataset.serieId, inp.dataset.campo, inp.value);
    if (inp.dataset.campo === 'descanso') DescansoTimer.resincronizar(inp.dataset.serieId);
  });

  /* --- Ejercicios --- */
  $('#form-ejercicio').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = VistaEjercicios.agregar($('#input-nombre-ejercicio').value, $('#input-grupo-muscular').value);
    if (ok) {
      $('#input-nombre-ejercicio').value = '';
      $('#input-grupo-muscular').value = '';
      VistaRutinas.render(); // el selector puede haber cambiado
      VistaEntrenar.render();
    }
  });

  $('#lista-ejercicios').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-eliminar-ejercicio]');
    if (btn) VistaEjercicios.eliminar(btn.dataset.eliminarEjercicio);
  });

  /* --- Rutinas --- */
  $('#selector-ejercicios-rutina').addEventListener('change', (ev) => {
    const chk = ev.target.closest('[data-check-ejercicio]');
    if (chk) VistaRutinas.toggleEjercicio(chk.dataset.checkEjercicio, chk.checked);
  });
  $('#orden-rutina').addEventListener('click', (ev) => {
    const subir = ev.target.closest('[data-orden-subir]');
    if (subir) return VistaRutinas.moverSeleccionado(subir.dataset.ordenSubir, 'subir');
    const bajar = ev.target.closest('[data-orden-bajar]');
    if (bajar) return VistaRutinas.moverSeleccionado(bajar.dataset.ordenBajar, 'bajar');
  });
  $('#btn-crear-rutina').addEventListener('click', () => VistaRutinas.crear($('#input-nombre-rutina').value));
  $('#btn-cancelar-rutina').addEventListener('click', () => VistaRutinas.cancelar());
  $('#input-nombre-rutina').addEventListener('input', () => {
    $('#btn-cancelar-rutina').classList.toggle('hidden', !VistaRutinas.hayBorrador());
  });

  $('#lista-rutinas').addEventListener('click', (ev) => {
    const editar = ev.target.closest('[data-editar-rutina]');
    if (editar) return VistaRutinas.editar(editar.dataset.editarRutina);
    const btn = ev.target.closest('[data-eliminar-rutina]');
    if (btn) VistaRutinas.eliminar(btn.dataset.eliminarRutina);
  });

  /* --- Historial --- */
  $('#lista-historial').addEventListener('click', (ev) => {
    const card = ev.target.closest('[data-historial-id]');
    if (card) VistaHistorial.verDetalle(card.dataset.historialId);
  });
  $('#btn-volver-historial').addEventListener('click', () => VistaHistorial.volver());

  /* --- Ajustes --- */
  $('#btn-exportar').addEventListener('click', () => VistaAjustes.exportar());
  $('#btn-importar').addEventListener('click', () => $('#input-importar').click());
  $('#input-importar').addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    if (file) VistaAjustes.importar(file);
    ev.target.value = '';
  });
  $('#btn-reset').addEventListener('click', () => VistaAjustes.restablecer());

  /* --- Modal --- */
  $('#modal-cancelar').addEventListener('click', () => Modal.cerrar());
  $('#modal-confirmar').addEventListener('click', () => {
    if (Modal._alConfirmar) Modal._alConfirmar();
  });
  $('#modal-overlay').addEventListener('click', (ev) => {
    if (ev.target === $('#modal-overlay')) Modal.cerrar();
  });
}

// Estado local de la vista Entrenar: true = editor abierto, false = lista
VistaEntrenar.modoEditor = false;
document.addEventListener('DOMContentLoaded', init);

/* --- Registro del Service Worker (PWA offline) --- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service Worker no registrado:', err);
    });
  });
}
