import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Row, Col, Spin, Tag, Empty, message } from "antd";
import {
  TrophyOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  DribbbleOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { getEventos } from "../services/eventoService";
import { getTorneos } from "../services/torneoService";
import {
  FORMATOS,
  estadoVisible,
  inscripcionAbierta,
  textoCupo,
  formatearFecha,
  formatearPlata,
} from "./torneo/utils";

// URL directa y estable en HD para la foto de la cancha nocturna
const FOTO_CANCHA_NOCTURNA =
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80";

// Imagen alternativa de respaldo por si no hay conexión a internet
const FOTO_CANCHA_ALT =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80";

export default function EventosFutbol() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
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

  // Determina si una URL traída del backend es realmente utilizable
  const esUrlValida = (url) => {
    if (!url || typeof url !== "string") return false;
    const limpia = url.trim();
    if (
      limpia === "" ||
      limpia === "null" ||
      limpia === "undefined" ||
      limpia.length < 15
    ) {
      return false;
    }
    return true;
  };

  if (cargando) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" tip="Cargando eventos y torneos..." />
      </div>
    );
  }

  if (eventos.length === 0 && torneos.length === 0) {
    return <Empty description="Todavía no hay eventos ni torneos cargados" />;
  }

  return (
    <Row gutter={[24, 24]} style={{ padding: "10px 0" }}>
      {/* 🏆 RENDERIZADO DE TORNEOS */}
      {torneos.map((t) => {
        const estado = estadoVisible(t, t.equipos);
        const urlFoto = esUrlValida(t.imagen_url)
          ? t.imagen_url
          : FOTO_CANCHA_NOCTURNA;

        return (
          <Col xs={24} sm={12} md={8} key={`torneo-${t.id_torneo}`}>
            <div
              className="tarjeta-evento-hover"
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid var(--border, #e2e8f0)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Portada en la cabecera */}
              <div
                style={{
                  position: "relative",
                  height: "170px",
                  width: "100%",
                  backgroundColor: "#0f172a",
                  overflow: "hidden",
                }}
              >
                <img
                  src={urlFoto}
                  alt={t.nombre}
                  onError={(e) => {
                    // Si falla la URL dada, asigna la foto alternativa en vez del SVG
                    e.target.onerror = null;
                    e.target.src = FOTO_CANCHA_ALT;
                  }}
                  style={{
                    height: "100%",
                    width: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div style={{ position: "absolute", top: 12, right: 12 }}>
                  <Tag
                    color={estado.color}
                    style={{
                      fontWeight: 600,
                      borderRadius: "20px",
                      padding: "3px 12px",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {estado.texto}
                  </Tag>
                </div>
              </div>

              <div
                style={{
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flexGrow: 1,
                  gap: "14px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "1.2rem",
                      fontWeight: "700",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    🏆 {t.nombre}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      fontSize: "0.88rem",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <HomeOutlined
                        style={{ color: "#059669", fontSize: "15px" }}
                      />
                      <span>
                        <strong>{t.complejo || "Complejo Deportivo"}</strong>
                      </span>
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <EnvironmentOutlined
                        style={{ color: "#059669", fontSize: "15px" }}
                      />
                      <span>{t.direccion || "Villa María, Córdoba"}</span>
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <DribbbleOutlined
                        style={{ color: "#059669", fontSize: "15px" }}
                      />
                      <span>
                        Modalidad:{" "}
                        <strong>{FORMATOS[t.formato] ?? t.formato}</strong>
                      </span>
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <TrophyOutlined
                        style={{ color: "#d97706", fontSize: "15px" }}
                      />
                      <span>
                        Inscripción:{" "}
                        <strong>{formatearPlata(t.precio_inscripcion)}</strong>
                        {Number(t.precio_inscripcion) > 0 ? " por equipo" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid rgba(226,232,240,0.3)",
                    paddingTop: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.8rem",
                      opacity: 0.8,
                      marginBottom: 12,
                    }}
                  >
                    <span>
                      <TeamOutlined style={{ marginRight: 4 }} />
                      {textoCupo(t.equipos, t.cupo_maximo)}
                    </span>
                    <span>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {t.fecha_evento
                        ? formatearFecha(t.fecha_evento)
                        : "A definir"}
                    </span>
                  </div>

                  <Button
                    type="primary"
                    onClick={() => navigate(`/torneos/${t.id_torneo}`)}
                    style={{
                      borderRadius: "10px",
                      fontWeight: 600,
                      height: "42px",
                      backgroundColor: "#059669",
                      borderColor: "#059669",
                    }}
                    block
                    size="large"
                  >
                    {inscripcionAbierta(t, t.equipos)
                      ? "Ver e inscribirse"
                      : "Ver llaves y tablas"}
                  </Button>
                </div>
              </div>
            </div>
          </Col>
        );
      })}

      {/* ⚽ RENDERIZADO DE EVENTOS */}
      {eventos.map((evento) => {
        const urlFoto = esUrlValida(evento.imagen_url)
          ? evento.imagen_url
          : FOTO_CANCHA_NOCTURNA;

        return (
          <Col xs={24} sm={12} md={8} key={`evento-${evento.id}`}>
            <div
              className="tarjeta-evento-hover"
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid var(--border, #e2e8f0)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  height: "170px",
                  width: "100%",
                  backgroundColor: "#0f172a",
                  overflow: "hidden",
                }}
              >
                <img
                  src={urlFoto}
                  alt={evento.titulo}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FOTO_CANCHA_ALT;
                  }}
                  style={{
                    height: "100%",
                    width: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div style={{ position: "absolute", top: 12, right: 12 }}>
                  <Tag
                    color={
                      evento.estado === "Inscripciones Abiertas"
                        ? "green"
                        : "red"
                    }
                    style={{ borderRadius: "20px", fontWeight: 600 }}
                  >
                    {evento.estado}
                  </Tag>
                </div>
              </div>

              <div
                style={{
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  flexGrow: 1,
                }}
              >
                <h3
                  style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}
                >
                  ⚽ {evento.titulo}
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "0.88rem",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <span>
                      <strong>Lugar:</strong> {evento.lugar}
                    </span>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <DribbbleOutlined style={{ color: "#059669" }} />
                    <span>
                      <strong>Modalidad:</strong> {evento.modalidad}
                    </span>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <span>
                      <strong>Fecha:</strong>{" "}
                      {new Date(evento.fecha).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        );
      })}
    </Row>
  );
}
