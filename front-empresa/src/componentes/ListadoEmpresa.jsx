import React, { useEffect, useState } from "react";
import { Table, Spin, message, Tag, Button, Space, Radio, Card } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { obtenerEmpresas } from "../services/empresaService";
import { useEsMovil } from "../hooks/useEsMovil";

export default function ListadoEmpresa() {
  const [canchasOriginales, setCanchasOriginales] = useState([]);
  const [canchasFiltradas, setCanchasFiltradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();
  const esMovil = useEsMovil();

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
        <strong>{c.complejo}</strong>
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
      render: (_, c) => (
        <Button
          type="link"
          icon={<EnvironmentOutlined />}
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion || c.complejo)}`}
          target="_blank"
        >
          Ver Mapa
        </Button>
      ),
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

  const mapa = (c) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion || c.complejo)}`;

  return (
    <div style={{ padding: esMovil ? 0 : "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Disponibilidad de Canchas</h2>

      {/* Botones de Filtro (en el celular se deslizan hacia los costados) */}
      <div style={{ overflowX: "auto", marginBottom: "20px", paddingBottom: 4 }}>
        <Radio.Group onChange={aplicarFiltro} defaultValue="Todas" style={{ whiteSpace: "nowrap" }}>
          <Radio.Button value="Todas">Todas</Radio.Button>
          <Radio.Button value="Fútbol 5">Fútbol 5</Radio.Button>
          <Radio.Button value="Fútbol 7">Fútbol 7</Radio.Button>
          <Radio.Button value="Fútbol 11">Fútbol 11</Radio.Button>
          <Radio.Button value="Techada">Solo Techadas</Radio.Button>
        </Radio.Group>
      </div>

      {esMovil ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
          {canchasFiltradas.map((c) => (
            <Card key={c.id_cancha} size="small">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <strong>{c.complejo}</strong>
                  <div style={{ marginTop: 4 }}>
                    {c.nombre} <Tag color="blue">{c.tipo}</Tag>
                    {c.techada && <Tag color="green">Techada</Tag>}
                  </div>
                </div>
                <strong style={{ whiteSpace: "nowrap" }}>${Number(c.precio_hora).toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button style={{ flex: 1 }} icon={<EnvironmentOutlined />} href={mapa(c)} target="_blank">
                  Ver mapa
                </Button>
                <Button type="primary" style={{ flex: 1 }} onClick={() => navigate(`/reservar/cancha/${c.id_cancha}`)}>
                  Reservar
                </Button>
              </div>
            </Card>
          ))}
          {canchasFiltradas.length === 0 && <p>No hay canchas para ese filtro.</p>}
        </div>
      ) : (
        <Table
          dataSource={canchasFiltradas}
          columns={columnas}
          rowKey="id_cancha"
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
        />
      )}
    </div>
  );
}
