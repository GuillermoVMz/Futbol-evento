import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Spin, Tag, message } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { getEventos, urlImagenEvento } from "../services/eventoService";

// Proporción 4:3 para que todas las tarjetas queden parejas, con o sin imagen
const PROPORCION = "4 / 3";

function Portada({ evento }) {
  const url = urlImagenEvento(evento);
  if (url) {
    return (
      <img
        alt={evento.titulo}
        src={url}
        style={{ width: "100%", aspectRatio: PROPORCION, objectFit: "cover", display: "block" }}
      />
    );
  }
  // Sin imagen cargada: un lugar reservado con un trofeo
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: PROPORCION,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(148, 163, 184, 0.15)",
      }}
    >
      <TrophyOutlined style={{ fontSize: 56, color: "#94a3b8" }} />
    </div>
  );
}

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
              cover={<Portada evento={evento} />}
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
