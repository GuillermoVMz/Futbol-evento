import React, { useEffect, useState } from "react";
import { Card, List, Tag, Button, Popconfirm, Spin, message } from "antd";
import { obtenerMisReservas, cancelarMiReserva } from "../services/reservaService";

const COLORES = { confirmada: "green", pagada: "blue", cancelada: "red" };

const formatearFecha = (f) => String(f).split("-").reverse().join("/");
const hhmm = (t) => String(t).slice(0, 5);

export default function MisReservas() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    try {
      setReservas(await obtenerMisReservas());
    } catch {
      message.error("No se pudieron cargar tus reservas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const cancelar = async (id) => {
    try {
      await cancelarMiReserva(id);
      message.success("Reserva cancelada");
      cargar();
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo cancelar la reserva");
    }
  };

  const hoy = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local

  if (cargando) {
    return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px" }}>Mis Reservas</h2>

      <List
        bordered
        dataSource={reservas}
        locale={{ emptyText: "Todavía no hiciste ninguna reserva" }}
        renderItem={(r) => (
          <List.Item>
            <div style={{ width: "100%" }}>
              <strong>
                {r.complejo} - {r.cancha}
              </strong>{" "}
              <Tag color="blue">{r.tipo}</Tag>
              <p style={{ margin: "5px 0" }}>
                {formatearFecha(r.fecha)} de {hhmm(r.horario_in)} a {hhmm(r.horario_fin)} hs · $
                {Number(r.precio).toLocaleString()}
              </p>
              <Tag color={COLORES[r.estado]}>{r.estado.toUpperCase()}</Tag>
              {r.estado === "confirmada" && r.fecha >= hoy && (
                <Popconfirm title="¿Cancelar esta reserva?" okText="Sí, cancelar" cancelText="No" onConfirm={() => cancelar(r.id_reserva)}>
                  <Button size="small" danger type="link">
                    Cancelar
                  </Button>
                </Popconfirm>
              )}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}
