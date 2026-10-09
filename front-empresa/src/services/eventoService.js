const API_URL = "http://26.97.240.65:3000/api/eventos";

export const getEventos = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener los eventos");
  }
  return await response.json();
};
