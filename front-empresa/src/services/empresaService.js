import axios from "axios";

// La URL apuntando al puerto 3000 de tu backend y a la ruta /api/canchas
const API_URL = "http://26.97.240.65:3000/api/canchas";

export const obtenerEmpresas = async () => {
  const respuesta = await axios.get(API_URL);
  return respuesta.data;
};

export const obtenerEmpresaPorId = async (id) => {
  const respuesta = await axios.get(`${API_URL}/${id}`);
  return respuesta.data;
};

export const crearEmpresa = async (empresa) => {
  const respuesta = await axios.post(API_URL, empresa);
  return respuesta.data;
};

export const actualizarEmpresa = async (id, empresa) => {
  const respuesta = await axios.put(`${API_URL}/${id}`, empresa);
  return respuesta.data;
};
