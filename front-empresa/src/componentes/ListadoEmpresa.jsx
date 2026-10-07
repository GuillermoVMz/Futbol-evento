// src/componentes/ListadoEmpresa.jsx
import { useState, useEffect } from "react";
import { Table, Typography, Tag, Spin, message, Card } from "antd";

const { Title } = Typography;

export default function ListadoEmpresa() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Aquí puedes ajustar la ruta a tu API según corresponda
    const cargarDatos = async () => {
      try {
        const respuesta = await fetch("http://localhost:3000/api/empresas"); // O la ruta de canchas/reservas
        if (!respuesta.ok) throw new Error("Error en la red");

        const json = await respuesta.json();
        setDatos(json);
      } catch (error) {
        message.error("No se pudieron cargar los datos de las canchas");
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  // Configuración de las nuevas columnas solicitadas
  const columnas = [
    {
      title: "Jugadores Faltantes",
      dataIndex: "jugadoresFaltantes", // Asegúrate de que tu base de datos devuelva este campo
      key: "jugadoresFaltantes",
      render: (cantidad) => (
        <Tag color={cantidad > 0 ? "blue" : "default"}>
          {cantidad > 0 ? `Faltan ${cantidad}` : "Completo"}
        </Tag>
      ),
    },
    {
      title: "Dirección",
      dataIndex: "direccion",
      key: "direccion",
    },
    {
      title: "Horario",
      dataIndex: "horario",
      key: "horario",
    },
    {
      title: "Precio",
      dataIndex: "precio",
      key: "precio",
      render: (precio) => `$${precio}`, // Muestra el precio formateado
    },
    {
      title: "Estado",
      dataIndex: "estado", // Ej: 'Disponible' o 'Reservado'
      key: "estado",
      render: (estado) => {
        const esReservado = estado === "Reservado";
        return (
          <Tag color={esReservado ? "red" : "green"}>
            {esReservado ? "Reservado" : "Disponible"}
          </Tag>
        );
      },
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
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Disponibilidad de Canchas y Partidos
        </Title>
      </div>

      <Table
        dataSource={datos}
        columns={columnas}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
}
