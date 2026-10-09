import React, { useState } from "react";
import { Input, Button, Card, List, Tag, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";

export default function MisReservas() {
  const [telefono, setTelefono] = useState("");
  const [misTurnos, setMisTurnos] = useState([]);
  const [buscado, setBuscado] = useState(false);

  const buscarReservas = () => {
    if (!telefono) return message.warning("Ingresá tu teléfono primero");

    // Simulación: Cuando tu amigo haga la ruta GET /api/reservas/usuario/:telefono, pones el axios acá.
    setMisTurnos([
      {
        id: 1,
        cancha: "Complejo Golazo - Cancha 1",
        fecha: "10/10/2026",
        horario: "19:00 - 20:00",
        estado: "confirmada",
      },
    ]);
    setBuscado(true);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px" }}>Mis Reservas</h2>

      <Card style={{ marginBottom: "20px" }}>
        <p>Ingresá el número de teléfono con el que hiciste la reserva:</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <Input
            placeholder="Ej: 3534112233"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            prefix={<SearchOutlined />}
            size="large"
          />
          <Button type="primary" size="large" onClick={buscarReservas}>
            Buscar
          </Button>
        </div>
      </Card>

      {buscado && (
        <List
          header={<div>Tus turnos próximos:</div>}
          bordered
          dataSource={misTurnos}
          locale={{ emptyText: "No se encontraron reservas con este número" }}
          renderItem={(item) => (
            <List.Item>
              <div style={{ width: "100%" }}>
                <strong>{item.cancha}</strong>
                <p style={{ margin: "5px 0" }}>
                  {item.fecha} a las {item.horario} hs
                </p>
                <Tag color="green">{item.estado.toUpperCase()}</Tag>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
