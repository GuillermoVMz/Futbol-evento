import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Spin, Tag, message } from "antd";
import { getEventos } from "../services/eventoService";

export default function EventosFutbol() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const data = await getEventos();
        setEventos(data);
      } catch (error) {
        console.error("Error al traer eventos:", error);
        message.error("No se pudieron cargar los eventos de la base de datos");
      } finally {
        setCargando(false);
      }
    };
    cargarEventos();
  }, []);

  if (cargando) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: "20px", color: "#141414" }}>
        Próximos Partidos y Torneos
      </h2>
      <Row gutter={[16, 16]}>
        {eventos.map((evento) => (
          <Col xs={24} sm={12} md={8} key={evento.id}>
            <Card
              hoverable
              title={evento.titulo}
              extra={
                <Tag
                  color={
                    evento.estado === "Inscripciones Abiertas" ? "green" : "red"
                  }
                >
                  {evento.estado}
                </Tag>
              }
            >
              <p>
                <strong>Lugar:</strong> {evento.lugar}
              </p>
              <p>
                <strong>Modalidad:</strong> {evento.modalidad}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(evento.fecha).toLocaleDateString()}
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
    </div>
  );
}
