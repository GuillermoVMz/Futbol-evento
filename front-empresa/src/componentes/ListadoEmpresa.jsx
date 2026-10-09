import React, { useEffect, useState } from "react";
import { Table, Spin, message, Tag, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { obtenerEmpresas } from "../services/empresaService";

export default function ListadoEmpresa() {
  const [canchas, setCanchas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarCanchas = async () => {
      try {
        // Aunque se llame obtenerEmpresas, sabemos que trae la tabla 'canchas'
        const data = await obtenerEmpresas();
        setCanchas(data);
      } catch (error) {
        console.error("Error al conectar con el backend:", error);
        message.error("No se pudieron cargar los datos de las canchas");
      } finally {
        setCargando(false);
      }
    };
    cargarCanchas();
  }, []);

  // Configuramos las columnas de Ant Design para que coincidan con tu SQL
  const columnas = [
    {
      title: "Nombre de Cancha",
      dataIndex: "nombre",
      key: "nombre",
      fontWeight: "bold",
    },
    {
      title: "Modalidad",
      dataIndex: "tipo",
      key: "tipo",
      render: (tipo) => <Tag color="blue">{tipo}</Tag>,
    },
    {
      title: "Precio por Hora",
      dataIndex: "precio_hora",
      key: "precio_hora",
      render: (precio) => `$${Number(precio).toLocaleString()}`,
    },
    {
      title: "Techada",
      dataIndex: "techada",
      key: "techada",
      render: (techada) =>
        techada ? <Tag color="orange">Sí</Tag> : <Tag color="default">No</Tag>,
    },
  ];

  if (cargando) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}
    >
      <h2 style={{ marginBottom: "20px", color: "#141414" }}>
        Disponibilidad de Canchas y Precios
      </h2>
      <Table
        dataSource={canchas}
        columns={columnas}
        rowKey="id_cancha"
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
}
