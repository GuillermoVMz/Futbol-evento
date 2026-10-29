import React from "react";
import { Typography, theme } from "antd";
import { ganadorLado, fechaHoraPartido } from "./utils";

function Fila({ nombre, goles, penales, gana, perdio, libre, token }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        padding: "6px 10px",
        fontWeight: gana ? 700 : 400,
        color: perdio ? token.colorTextTertiary : token.colorText,
        background: gana ? token.colorSuccessBg : "transparent",
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontStyle: nombre ? "normal" : "italic",
          color: nombre ? undefined : token.colorTextTertiary,
        }}
      >
        {nombre ?? (libre ? "—" : "Por definir")}
      </span>
      <span>
        {goles ?? ""}
        {penales != null ? ` (${penales})` : ""}
      </span>
    </div>
  );
}

function TarjetaPartido({ p, onPartido }) {
  const { token } = theme.useToken();
  const gana = ganadorLado(p);
  const pasaDirecto = p.jugado && (p.id_equipo_local == null || p.id_equipo_visitante == null);
  const editable = onPartido && p.id_equipo_local != null && p.id_equipo_visitante != null;
  const linea = `1px solid ${token.colorBorderSecondary}`;

  return (
    <div
      onClick={editable ? () => onPartido(p) : undefined}
      style={{
        border: linea,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
        overflow: "hidden",
        cursor: editable ? "pointer" : "default",
      }}
    >
      <Fila
        nombre={p.equipo_local}
        goles={p.jugado && !pasaDirecto ? p.goles_local : null}
        penales={p.penales_local}
        gana={gana === "local"}
        perdio={gana === "visitante"}
        libre={pasaDirecto}
        token={token}
      />
      <div style={{ height: 1, background: token.colorBorderSecondary }} />
      <Fila
        nombre={p.equipo_visitante}
        goles={p.jugado && !pasaDirecto ? p.goles_visitante : null}
        penales={p.penales_visitante}
        gana={gana === "visitante"}
        perdio={gana === "local"}
        libre={pasaDirecto}
        token={token}
      />
      {/* Siempre se dibuja, así todas las tarjetas miden lo mismo y los cruces quedan alineados */}
      <div
        style={{
          padding: "2px 10px",
          fontSize: 11,
          minHeight: 20,
          borderTop: linea,
          color: token.colorTextTertiary,
        }}
      >
        {pasaDirecto ? "Pasa directo" : (fechaHoraPartido(p) ?? "\u00A0")}
      </div>
    </div>
  );
}

// Cuadro de eliminación: una columna por ronda. El ganador de cada cruce aparece en la columna siguiente.
export default function Llaves({ rondas, onPartido }) {
  return (
    <div style={{ display: "flex", gap: 28, overflowX: "auto", padding: "8px 4px 16px" }}>
      {rondas.map((r) => (
        <div key={r.ronda} style={{ display: "flex", flexDirection: "column", minWidth: 230, flex: 1 }}>
          <Typography.Text strong style={{ textAlign: "center", marginBottom: 12 }}>
            {r.nombre}
          </Typography.Text>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", flex: 1, gap: 16 }}>
            {r.partidos.map((p) => (
              <TarjetaPartido key={p.id_partido} p={p} onPartido={onPartido} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
