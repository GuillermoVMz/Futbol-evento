import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Spin, Tag, Empty, message } from "antd";
import { getEventos } from "../services/eventoService";
import { getTorneos } from "../services/torneoService";
import { FORMATOS, ESTADOS } from "./torneo/utils";
import ImagenPortada from "./ImagenPortada";

// Pantalla de inicio: partidos/eventos y torneos juntos
export default function EventosFutbol() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      // Se piden por separado: si uno falla, el otro igual se muestra
      const [ev, to] = await Promise.allSettled([getEventos(), getTorneos()]);

      if (ev.status === "fulfilled") setEventos(ev.value);
      else {
        console.error("Error al traer eventos:", ev.reason);
        message.error("No se pudieron cargar los eventos de la base de datos");
      }

      if (to.status === "fulfilled") setTorneos(to.value);
      else console.error("Error al traer torneos:", to.reason);

      setCargando(false);
    };
    cargar();
  }, []);

  if (cargando) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (eventos.length === 0 && torneos.length === 0) {
    return <Empty description="Todavía no hay eventos ni torneos cargados" />;
  }

  return (
    <Row gutter={[16, 16]}>
      {torneos.map((t) => (
        <Col xs={24} sm={12} md={8} key={`torneo-${t.id_torneo}`}>
          <Card
            hoverable
            title={`🏆 ${t.nombre}`}
            cover={t.imagen_url ? <ImagenPortada src={t.imagen_url} alt={t.nombre} /> : undefined}
            extra={<Tag color={ESTADOS[t.estado]?.color}>{ESTADOS[t.estado]?.texto ?? t.estado}</Tag>}
          >
            <p>
              <strong>Formato:</strong> {FORMATOS[t.formato] ?? t.formato}
            </p>
            <p>
              <strong>Equipos:</strong> {t.equipos}
            </p>
            <p>
              <strong>Organiza:</strong> {t.complejo}
            </p>

            <Button
              type="primary"
              onClick={() => navigate(`/torneos/${t.id_torneo}`)}
              style={{ marginTop: "10px" }}
              block
            >
              Ver llaves y tablas
            </Button>
          </Card>
        </Col>
      ))}

      {eventos.map((evento) => (
        <Col xs={24} sm={12} md={8} key={`evento-${evento.id}`}>
          <Card
            hoverable
            title={evento.titulo}
            cover={evento.imagen_url ? <ImagenPortada src={evento.imagen_url} alt={evento.titulo} /> : undefined}
            extra={
              <Tag color={evento.estado === "Inscripciones Abiertas" ? "green" : "red"}>{evento.estado}</Tag>
            }
          >
            <p>
              <strong>Lugar:</strong> {evento.lugar}
            </p>
            <p>
              <strong>Modalidad:</strong> {evento.modalidad}
            </p>
            <p>
              <strong>Fecha:</strong> {new Date(evento.fecha).toLocaleDateString()}
            </p>

            <Button
              type="primary"
              onClick={() => navigate(`/eventos/torneo/${evento.id}`)}
              style={{ marginTop: "10px" }}
              block
              disabled={evento.estado !== "Inscripciones Abiertas"}
            >
              Ver e Inscribirse
            </Button>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
