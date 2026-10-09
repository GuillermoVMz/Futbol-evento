import React from "react";
import { Card, Row, Col, Statistic, Table, Tag, Button } from "antd";
import { DollarOutlined, CalendarOutlined } from "@ant-design/icons";

export default function AdminDashboard() {
  // Datos simulados (hasta que tu amigo haga la ruta GET /api/reservas)
  const reservasRecientes = [
    {
      id: 1,
      cliente: "Lucas Martínez",
      cancha: "Cancha 1",
      fecha: "2026-10-10",
      turno: "19:00 - 20:00",
      estado: "pendiente",
      precio: 15000,
    },
    {
      id: 2,
      cliente: "Gonzalo Fernández",
      cancha: "Cancha Principal",
      fecha: "2026-10-11",
      turno: "21:00 - 22:00",
      estado: "confirmada",
      precio: 40000,
    },
  ];

  const columnas = [
    { title: "Cliente", dataIndex: "cliente", key: "cliente" },
    { title: "Cancha", dataIndex: "cancha", key: "cancha" },
    { title: "Fecha", dataIndex: "fecha", key: "fecha" },
    { title: "Turno", dataIndex: "turno", key: "turno" },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado) => (
        <Tag color={estado === "confirmada" ? "green" : "orange"}>
          {estado.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Acción",
      key: "accion",
      render: (_, r) => (
        <Button size="small" type="dashed">
          Marcar Pagado
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>Panel de Administración</h2>

      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Ingresos del Mes (Estimado)"
              value={125000}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Reservas Activas"
              value={14}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Últimas Reservas">
        <Table
          dataSource={reservasRecientes}
          columns={columnas}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}
