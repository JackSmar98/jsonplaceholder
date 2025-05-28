// src/utils/activityLog.js
const MAX_ACTIVITIES = 10; // Número máximo de actividades a guardar
const ACTIVITY_LOG_KEY = 'userActivityLog';

export const addActivityToLocalStorage = (activity) => {
  try {
    let activities = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY)) || [];
    // Asegurarse que la actividad tenga un timestamp si no se proveyó
    if (!activity.timestamp) {
      activity.timestamp = new Date().toISOString();
    }
    activities.unshift(activity); // Añadir al principio (más reciente primero)
    if (activities.length > MAX_ACTIVITIES) {
      activities = activities.slice(0, MAX_ACTIVITIES); // Mantener solo las últimas N actividades
    }
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(activities));
  } catch (error) {
    console.error("Error guardando actividad en localStorage:", error);
  }
};

export const getActivitiesFromLocalStorage = () => {
  try {
    const activities = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY)) || [];
    // Asegurarse que todos los objetos tengan timestamp para evitar errores al ordenar o mostrar
    return activities.map(act => ({ ...act, timestamp: act.timestamp || new Date(0).toISOString() }));
  } catch (error) {
    console.error("Error leyendo actividad de localStorage:", error);
    return [];
  }
};

export const clearActivitiesFromLocalStorage = () => {
  try {
    localStorage.removeItem(ACTIVITY_LOG_KEY);
  } catch (error) {
    console.error("Error limpiando actividad de localStorage:", error);
  }
}