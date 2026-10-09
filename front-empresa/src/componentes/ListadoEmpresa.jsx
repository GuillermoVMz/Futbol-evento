import React, { useEffect, useState } from "react";
import { Table, Spin, message, Tag, Button, Space, Radio } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { obtenerEmpresas } from "../services/empresaService";

export default function ListadoEmpresa() {
  const [canchasOriginales, setCanchasOriginales] = useState([]);
  const [canchasFiltradas, setCanchasFiltradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarCanchas = async () => {
      try {
        const data = await obtenerEmpresas();
        setCanchasOriginales(data);
        setCanchasFiltradas(data);
      } catch (error) {
        message.error("Error al cargar las canchas");
      } finally {
        setCargando(false);
      }
    };
    cargarCanchas();
  }, []);

  const aplicarFiltro = (e) => {
    const valor = e.target.value;
    if (valor === "Todas") {
      setCanchasFiltradas(canchasOriginales);
    } else {
      setCanchasFiltradas(
        canchasOriginales.filter(
          (c) => c.tipo === valor || (valor === "Techada" && c.techada),
        ),
      );
    }
  };

  const columnas = [
    {
      title: "Complejo",
      key: "complejo",
      render: (_, c) => (
        <strong>{c.id_empresa === 1 ? "Complejo Golazo" : "Área 51"}</strong>
      ),
    },
    { title: "Nombre", dataIndex: "nombre", key: "nombre" },
    {
      title: "Modalidad",
      dataIndex: "tipo",
      key: "tipo",
      render: (t) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: "Precio/Hora",
      dataIndex: "precio_hora",
      key: "precio_hora",
      render: (p) => `$${Number(p).toLocaleString()}`,
    },
    {
      title: "Ubicación",
      key: "mapa",
      render: (_, c) => {
        // Asignamos zonas simuladas
        const direccion =
          c.id_empresa === 1
            ? "Bulevar España, Villa Maria, Cordoba"
            : "Avenida Universidad, Villa Maria, Cordoba";
        return (
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`}
            target="_blank"
          >
            Ver Mapa
          </Button>
        );
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, cancha) => (
        <Button
          type="primary"
          onClick={() => navigate(`/reservar/cancha/${cancha.id_cancha}`)}
        >
          Reservar
        </Button>
      ),
    },
  ];

  if (cargando)
    return (
      <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
    );

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Disponibilidad de Canchas</h2>

      {/* Botones de Filtro */}
      <Radio.Group
        onChange={aplicarFiltro}
        defaultValue="Todas"
        style={{ marginBottom: "20px" }}
      >
        <Radio.Button value="Todas">Todas</Radio.Button>
        <Radio.Button value="Fútbol 5">Fútbol 5</Radio.Button>
        <Radio.Button value="Fútbol 7">Fútbol 7</Radio.Button>
        <Radio.Button value="Fútbol 11">Fútbol 11</Radio.Button>
        <Radio.Button value="Techada">Solo Techadas</Radio.Button>
      </Radio.Group>

      <Table
        dataSource={canchasFiltradas}
        columns={columnas}
        rowKey="id_cancha"
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
}
