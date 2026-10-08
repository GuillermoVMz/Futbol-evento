const API_URL = "http://localhost:4000/api/eventos";

export const getEventos = async () => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener los eventos");
  }
  return await response.json();
};
