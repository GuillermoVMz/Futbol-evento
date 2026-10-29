import React from "react";
import { Button, Tag, Typography, theme } from "antd";
import { ganadorLado, fechaHoraPartido } from "./utils";

// Partidos de la fase de grupos. Si llega onPartido (panel del organizador) muestra el botón para cargar el resultado.
export default function ListaPartidos({ partidos, onPartido }) {
  const { token } = theme.useToken();

  return (
    <div style={{ marginTop: 12 }}>
      {partidos.map((p) => {
        const gana = ganadorLado(p);
        const peso = (lado) => (gana === lado ? 700 : 400);
        return (
          <div
            key={p.id_partido}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 0",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              flexWrap: "wrap",
            }}
          >
            <Tag style={{ marginInlineEnd: 0 }}>Fecha {p.ronda}</Tag>
            <span style={{ flex: 1, textAlign: "right", fontWeight: peso("local"), minWidth: 90 }}>{p.equipo_local}</span>
            <span style={{ minWidth: 52, textAlign: "center", fontWeight: 600 }}>
              {p.jugado ? `${p.goles_local} - ${p.goles_visitante}` : "vs"}
            </span>
            <span style={{ flex: 1, fontWeight: peso("visitante"), minWidth: 90 }}>{p.equipo_visitante}</span>
            {fechaHoraPartido(p) && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {fechaHoraPartido(p)}
              </Typography.Text>
            )}
            {onPartido && (
              <Button size="small" type="link" onClick={() => onPartido(p)}>
                {p.jugado ? "Editar" : "Cargar resultado"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
