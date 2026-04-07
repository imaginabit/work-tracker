# Work Tracker - Especificación

## Concepto y Visión

Una herramienta de gestión horaria que transforma el trabajo en un lienzo visual. Cada hora del día es un pequeño cuadrado donde documentar qué hiciste y en qué tarea. La sensación es de **control y claridad** — como un bullet journal digital diseñado para desarrolladores. Minimalista pero cálida, con personalidad propio que motiva a documentar.

## Design Language

- **Estética**: Warm minimalism — espacios amplios, tipografía legible, acentos de color que dan vida sin abrumar. Inspiración en Notion meets Linear.
- **Paleta**:
  - Background: `#FAFAF9` (warm off-white)
  - Surface: `#FFFFFF`
  - Border: `#E7E5E4`
  - Text primary: `#1C1917`
  - Text secondary: `#78716C`
  - Accent: `#059669` (emerald — productividad)
  - Accent secondary: `#7C3AED` (violet — tareas)
  - Warning: `#DC2626` (deadlines cerca)
  - Success: `#16A34A`
- **Tipografía**:
  - Headings: `Inter` (weight 600-700)
  - Body: `Inter` (weight 400-500)
  - Mono para horas: `JetBrains Mono`
- **Espaciado**: Sistema de 4px — 4, 8, 12, 16, 24, 32, 48, 64
- **Motion**: Transiciones suaves 200ms ease-out. Hover states con scale sutil (1.02). Drag & drop con spring physics feel.
- **Iconos**: Lucide React

## Layout y Estructura

### Página Principal — Horario Semanal
- Header con navegación y fecha actual
- Grid de 7 columnas (L-D) × 12 filas (8:00-20:00)
- Cada celda editable con click — modal/inline para describir qué hiciste
- Indicador visual de la tarea asignada (color + nombre)
- Navegación entre semanas

### Página de Tareas — Dashboard
- Lista de tareas con nombre, deadline, tiempo estimado vs invertido
- **Filtro por cliente** — dropdown + botón para crear cliente inline
- Barra de progreso visual
- Badges por estado (en progreso, cerca de deadline, completada)
- Formulario rápido para añadir tarea

### Página de Detalle de Tarea
- Nombre, descripción, deadline, **cliente asignado**
- Lista de sesiones de trabajo registradas (fecha + horas)
- Tiempo total invertido vs estimado
- % completado
- Estados y requisitos check list

## Features & Interactions

### Horario Semanal
- Click en celda vacía → abre modal para asignar tarea + descripción de lo hecho
- Click en celda con datos → edita inline o abre modal
- Hover en celda → preview de la tarea completa
- Drag & drop entre celdas para reorganizar
- Filtro por tarea para ver toda la semana de una tarea

### Gestión de Tareas
- Crear tarea: nombre, descripción, deadline, tiempo estimado (horas), requisitos
- Marcar requisitos como completados
- Ver tiempo total invertido vs estimado
- Eliminar tarea (con confirmación)
- Estados: backlog, en progreso, completada, archivada

### Persistencia
- LocalStorage para MVP (fácil de migrar a backend después)
- Datos estructurados: tasks[], timeEntries[]

## Component Inventory

### TimeSlot (celda de hora)
- Estados: empty, filled, hover
- Muestra: hora, nombre de tarea (truncado), color indicator
- Click: abre TimeEntryModal

### TaskCard
- Muestra: nombre, deadline, progreso, badges
- Hover: eleva con shadow
- Click: navega a detalle

### TimeEntryModal
- Dropdown para seleccionar tarea
- Textarea para descripción de lo hecho
- Hora de inicio/fin (auto-sugeridas)
- Guardar / Cancelar

### ProgressBar
- Barra con porcentaje animado
- Color cambia según progreso (rojo < 25%, amarillo < 75%, verde ≥ 75%)

### Navbar
- Links: Horario | Tareas
- Indicador de semana actual
- Badge con tareas pendientes cerca de deadline

## Multi-Usuario

- Cada usuario se registra con su nombre (sin password para MVP)
- Selector de usuario en el header — al crear usuario se auto-selecciona
- Todas las tareas son visibles para todos los usuarios (compartidas)
- Cada time_entry pertenece a un usuario — las horas las registra cada uno independientemente
- En el Schedule: las horas del usuario actual aparecen destacadas (borde color + opacidad completa); las de otros usuarios se ven en opacidad reducida con su nombre
- En detalle de tarea: cada sesión muestra el nombre del usuario que la registró

## Technical Approach

- **Framework**: React + Vite
- **Routing**: React Router v6
- **Estado**: useState + useContext (sin Redux por ahora)
- **Persistencia**: localStorage con fallback a vacío
- **Styling**: CSS Modules o vanilla CSS con variables custom
- **Drag & Drop**: @dnd-kit/core (opcional, Nice-to-have)

## Data Model

```typescript
interface User {
  id: string;
  name: string;
  color: string; // hex color
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  color: string; // hex color
  createdAt: string;
}

interface Task {
  id: string;
  clientId: string | null;
  name: string;
  description: string;
  deadline: string; // ISO date
  estimatedHours: number;
  requirements: string[];
  status: 'backlog' | 'in_progress' | 'completed' | 'archived';
  createdAt: string;
}

interface TimeEntry {
  id: string;
  userId: string;      // quién registró la hora
  taskId: string;
  date: string; // YYYY-MM-DD
  startHour: number;
  endHour: number;
  description: string;
}
```