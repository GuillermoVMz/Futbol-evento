import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Tabs, Spin, Typography, message } from "antd";
import {
  DollarOutlined,
  CalendarOutlined,
  FallOutlined,
  RiseOutlined,
  ShopOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { obtenerResumen } from "../services/adminService";
import { useSesion } from "../services/session";
import AdminReservas from "./admin/AdminReservas";
import AdminCanchas from "./admin/AdminCanchas";
import AdminEventos from "./admin/AdminEventos";
import AdminTorneos from "./admin/AdminTorneos";
import AdminGastos from "./admin/AdminGastos";

const plata = (n) => `$${Number(n || 0).toLocaleString()}`;

function Resumen() {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    obtenerResumen()
      .then(setDatos)
      .catch(() => message.error("No se pudo cargar el resumen"));
  }, []);

  if (!datos) return <Spin style={{ display: "block", margin: "40px auto" }} />;

  const tarjetas = [
    { title: "Ingresos cobrados (mes)", value: datos.ingresos_cobrados, icon: <DollarOutlined />, plata: true },
    { title: "Por cobrar (mes)", value: datos.por_cobrar, icon: <ClockCircleOutlined />, plata: true },
    { title: "Gastos (mes)", value: datos.gastos_mes, icon: <FallOutlined />, plata: true },
    {
      title: "Balance (mes)",
      value: datos.balance,
      icon: <RiseOutlined />,
      plata: true,
      color: datos.balance >= 0 ? "#059669" : "#dc2626",
    },
    { title: "Reservas hoy", value: datos.reservas_hoy, icon: <CalendarOutlined /> },
    { title: "Reservas próximas", value: datos.reservas_activas, icon: <CalendarOutlined /> },
    { title: "Canchas activas", value: datos.canchas_activas, icon: <ShopOutlined /> },
  ];

  return (
    <Row gutter={[16, 16]}>
      {tarjetas.map((t) => (
        <Col xs={24} sm={12} md={6} key={t.title}>
          <Card>
            <Statistic
              title={t.title}
              value={t.value}
              prefix={t.icon}
              formatter={() => (
                <span style={t.color ? { color: t.color } : undefined}>
                  {t.plata ? plata(t.value) : t.value}
                </span>
              )}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default function AdminDashboard() {
  const { usuario } = useSesion();

  const items = [
    { key: "resumen", label: "Resumen", children: <Resumen /> },
    { key: "reservas", label: "Reservas", children: <AdminReservas /> },
    { key: "canchas", label: "Canchas y horarios", children: <AdminCanchas /> },
    { key: "eventos", label: "Eventos", children: <AdminEventos /> },
    { key: "torneos", label: "Torneos", children: <AdminTorneos /> },
    { key: "gastos", label: "Gastos", children: <AdminGastos /> },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Panel de Administración</h2>
      <Typography.Text type="secondary">{usuario?.nombre}</Typography.Text>
      {/* destroyOnHidden: al volver a una pestaña se recargan los datos actualizados */}
      <Tabs items={items} destroyOnHidden style={{ marginTop: 16 }} />
    </div>
  );
}
