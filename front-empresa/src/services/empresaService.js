import axios from 'axios';

// Asegurate de poner el puerto correcto donde corre tu backend de Node/PostgreSQL
const API_URL = 'http://localhost:3000/api/empresas'; 

export const obtenerEmpresas = async () => {
    const respuesta = await axios.get(API_URL);
    return respuesta.data;
};

export const obtenerEmpresaPorId = async (id) => {
    const respuesta = await axios.get(`${API_URL}/${id}`);
    return respuesta.data;
};

export const crearEmpresa = async (id,empresa) => {
    const respuesta = await axios.post(API_URL, empresa);
    return respuesta.data;
};

export const actualizarEmpresa = async (id, empresa) => {
    const respuesta = await axios.put(`${API_URL}/${id}`, empresa);
    return respuesta.data;
};

export const eliminarEmpresa = async (id) => {
    const respuesta = await axios.delete(`${API_URL}/${id}`);
    return respuesta.data;
};