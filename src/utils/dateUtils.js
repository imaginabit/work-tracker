export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric'
  });
}

export function getWeekDays(referenceDate = new Date()) {
  const dateStr = getDateString(referenceDate);
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day === 0 ? 6 : day - 1)));

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export function getWeekString(referenceDate = new Date()) {
  const days = getWeekDays(referenceDate);
  const start = days[0];
  const end = days[6];
  const startStr = start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

export function getDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getHoursInDay(date, timeEntries) {
  return timeEntries.filter(e => e.date === getDateString(date));
}

export function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isWeekend(date) {
  return date.getDay() === 0;
}

export function isDeadlineNear(deadline) {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diff = (deadlineDate - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 3;
}

export function isDeadlineUrgent(deadline) {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diff = (deadlineDate - today) / (1000 * 60 * 60 * 24);
  return diff < 0 || (diff >= 0 && diff <= 1);
}

export function getTaskProgress(task, timeEntries) {
  if (!task.estimatedHours || task.estimatedHours <= 0) return 0;
  const totalHours = timeEntries
    .filter(e => e.taskId === task.id)
    .reduce((sum, e) => sum + (e.endHour - e.startHour), 0);
  return Math.min(100, Math.round((totalHours / task.estimatedHours) * 100));
}

export function getTotalHours(timeEntries, taskId = null) {
  return timeEntries
    .filter(e => taskId ? e.taskId === taskId : true)
    .reduce((sum, e) => sum + (e.endHour - e.startHour), 0);
}

export function formatHours(hours) {
  if (hours === 1) return '1 hora';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(1)} horas`;
}

export function formatHour(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}