import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Spin, Tag, Typography, message } from "antd";
import { getTorneo } from "../services/torneoService";
import ContenidoTorneo from "./torneo/ContenidoTorneo";
import InscripcionEquipo from "./torneo/InscripcionEquipo";
import { FORMATOS, estadoVisible, formatearFecha, formatearPlata } from "./torneo/utils";

export default function DetalleTorneo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [fallo, setFallo] = useState(null); // imagen que no cargó

  const cargar = () =>
    getTorneo(id)
      .then(setDatos)
      .catch(() => {
        message.error("El torneo no existe");
        navigate("/", { replace: true });
      });

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!datos) return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;

  const { torneo } = datos;
  const estado = estadoVisible(torneo, datos.equipos.length);
  const conFondo = Boolean(torneo.imagen_url) && fallo !== torneo.imagen_url;

  // Con imagen: la elige el organizador y se usa de fondo del encabezado, con una capa oscura para que se lea
  const estiloEncabezado = conFondo
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.7)), url(${JSON.stringify(torneo.imagen_url)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 12,
        padding: "clamp(24px, 6vw, 48px) clamp(16px, 4vw, 28px)",
        marginBottom: 24,
      }
    : { marginBottom: 20 };

  return (
    <div>
      <Button onClick={() => navigate("/")} style={{ marginBottom: 16 }}>
        Volver a Eventos
      </Button>

      <div style={estiloEncabezado}>
        {/* Imagen invisible solo para detectar si el link no carga */}
        {torneo.imagen_url && (
          <img src={torneo.imagen_url} alt="" onError={() => setFallo(torneo.imagen_url)} style={{ display: "none" }} />
        )}
        <Typography.Title
          level={2}
          style={{ marginTop: 0, marginBottom: 8, ...(conFondo ? { color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,.6)" } : {}) }}
        >
          {torneo.nombre}
        </Typography.Title>
        <div>
          <Tag color={estado.color}>{estado.texto}</Tag>
          <Tag>{FORMATOS[torneo.formato] ?? torneo.formato}</Tag>
          {torneo.fecha_evento && <Tag>📅 {formatearFecha(torneo.fecha_evento)}</Tag>}
          <Tag color="gold">Inscripción: {formatearPlata(torneo.precio_inscripcion)}</Tag>
          <Typography.Text
            type={conFondo ? undefined : "secondary"}
            style={conFondo ? { color: "rgba(255,255,255,.9)", textShadow: "0 1px 4px rgba(0,0,0,.6)" } : undefined}
          >
            Organiza {torneo.complejo}
          </Typography.Text>
        </div>
      </div>

      <InscripcionEquipo torneo={torneo} cantidad={datos.equipos.length} onCambio={cargar} />

      <ContenidoTorneo datos={datos} />
    </div>
  );
}
