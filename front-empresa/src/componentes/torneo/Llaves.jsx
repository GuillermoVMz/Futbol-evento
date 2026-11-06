import React from "react";
import { Typography, theme } from "antd";
import { ganadorLado, fechaHoraPartido } from "./utils";
import { colorEquipo, textoSobre } from "./colores";
import { armarEstructura } from "./estructuraLlaves";

const ANCHO_TARJETA = 196;
const ALTO_FILA = 30;
const ALTO_SLOT = 104;
const ANCHO_CONECTOR = 28;
const ALTO_TITULO = 32;

// Una fila = un equipo, pintada con su color; a la derecha, el resultado final (sin ida y vuelta)
function FilaEquipo({ nombre, color, goles, penales, estado, libre, token }) {
  const sinEquipo = !nombre;
  const fondo = sinEquipo ? token.colorFillSecondary : colorEquipo(nombre, color);
  const texto = sinEquipo ? token.colorTextTertiary : textoSobre(fondo);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        height: ALTO_FILA,
        padding: "0 6px 0 10px",
        background: fondo,
        color: texto,
        opacity: estado === "pierde" ? 0.5 : 1,
        textAlign: "left",
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.3,
          textTransform: sinEquipo ? "none" : "uppercase",
          fontStyle: sinEquipo ? "italic" : "normal",
        }}
      >
        {nombre ?? (libre ? "—" : "Por definir")}
      </span>
      {goles != null && (
        <span
          style={{
            minWidth: 24,
            padding: "1px 5px",
            textAlign: "center",
            borderRadius: 3,
            background: "#fff",
            color: "#111",
            fontWeight: 800,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {goles}
          {penales != null && <small style={{ fontWeight: 600, fontSize: 10, marginLeft: 2 }}>({penales})</small>}
        </span>
      )}
    </div>
  );
}

function TarjetaPartido({ p, onPartido }) {
  const { token } = theme.useToken();
  const gana = ganadorLado(p);
  const pasaDirecto = p.jugado && (p.id_equipo_local == null || p.id_equipo_visitante == null);
  const editable = onPartido && p.id_equipo_local != null && p.id_equipo_visitante != null;
  const linea = `1px solid ${token.colorBorderSecondary}`;
  const mostrarGoles = p.jugado && !pasaDirecto;

  return (
    <div
      onClick={editable ? () => onPartido(p) : undefined}
      title={editable ? "Tocá para cargar o corregir el resultado" : undefined}
      style={{
        width: ANCHO_TARJETA,
        border: linea,
        borderRadius: 6,
        overflow: "hidden",
        background: token.colorBgContainer,
        boxShadow: "0 1px 3px rgba(0,0,0,.18)",
        cursor: editable ? "pointer" : "default",
      }}
    >
      <FilaEquipo
        nombre={p.equipo_local}
        color={p.color_local}
        goles={mostrarGoles ? p.goles_local : null}
        penales={p.penales_local}
        estado={gana === "visitante" ? "pierde" : "normal"}
        libre={pasaDirecto}
        token={token}
      />
      <FilaEquipo
        nombre={p.equipo_visitante}
        color={p.color_visitante}
        goles={mostrarGoles ? p.goles_visitante : null}
        penales={p.penales_visitante}
        estado={gana === "local" ? "pierde" : "normal"}
        libre={pasaDirecto}
        token={token}
      />
      {/* Siempre se dibuja, así todas las tarjetas miden lo mismo y los cruces quedan alineados */}
      <div
        style={{
          padding: "1px 8px",
          fontSize: 10.5,
          minHeight: 18,
          lineHeight: "16px",
          textAlign: "center",
          color: token.colorTextTertiary,
        }}
      >
        {pasaDirecto ? "Pasa directo" : (fechaHoraPartido(p) ?? "\u00A0")}
      </div>
    </div>
  );
}

function Titulo({ children }) {
  return (
    <div
      style={{
        height: ALTO_TITULO,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

// Columna de una ronda: cada partido ocupa el mismo alto, así la ronda siguiente queda justo en el medio
function Columna({ titulo, partidos, onPartido }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: ANCHO_TARJETA }}>
      <Titulo>{titulo}</Titulo>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {partidos.map((p) => (
          <div key={p.id_partido} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TarjetaPartido p={p} onPartido={onPartido} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Líneas que unen cada par de partidos con el de la ronda siguiente.
// lado "izq": va a la derecha de una columna de la mitad izquierda; "der": a la izquierda de una de la mitad derecha.
function Conector({ slots, lado, linea }) {
  const trazo = `2px solid ${linea}`;
  const izq = lado === "izq";

  return (
    <div style={{ display: "flex", flexDirection: "column", width: ANCHO_CONECTOR }}>
      <div style={{ height: ALTO_TITULO }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {Array.from({ length: slots === 1 ? 1 : slots / 2 }, (_, i) => (
          <div key={i} style={{ flex: 1, position: "relative" }}>
            {slots === 1 ? (
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: trazo }} />
            ) : (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: "25%",
                    bottom: "25%",
                    left: izq ? 0 : "50%",
                    right: izq ? "50%" : 0,
                    borderTop: trazo,
                    borderBottom: trazo,
                    ...(izq ? { borderRight: trazo } : { borderLeft: trazo }),
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: izq ? "50%" : 0,
                    right: izq ? 0 : "50%",
                    borderTop: trazo,
                  }}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ColumnaFinal({ final, campeon, onPartido, token }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: ANCHO_TARJETA }}>
      <Titulo>{final.nombre}</Titulo>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Arriba y abajo ocupan lo mismo, así la tarjeta de la final queda exactamente en el centro */}
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 10 }}>
          <span style={{ fontSize: 44, lineHeight: 1 }}>🏆</span>
        </div>
        <TarjetaPartido p={final.partido} onPartido={onPartido} />
        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 10 }}>
          {campeon ? (
            <span
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                fontWeight: 700,
                fontSize: 13,
                background: colorEquipo(campeon.nombre, campeon.color),
                color: textoSobre(colorEquipo(campeon.nombre, campeon.color)),
              }}
            >
              Campeón: {campeon.nombre}
            </span>
          ) : (
            <Typography.Text style={{ fontSize: 12, color: token.colorTextTertiary }}>Campeón por definir</Typography.Text>
          )}
        </div>
      </div>
    </div>
  );
}

// Cuadro de eliminación: las primeras rondas en los costados, convergiendo a la final en el centro.
// En cada cruce solo se muestra el resultado final del partido.
export default function Llaves({ rondas, campeon, onPartido }) {
  const { token } = theme.useToken();
  const estructura = armarEstructura(rondas);
  if (!estructura) return null;

  const { izquierda, derecha, final } = estructura;
  const linea = token.colorBorder;
  const primera = izquierda[0]?.partidos.length ?? 1;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          width: "max-content",
          margin: "0 auto",
          minHeight: Math.max(300, ALTO_TITULO + ALTO_SLOT * primera),
        }}
      >
        {izquierda.map((col) => (
          <React.Fragment key={`i-${col.ronda}`}>
            <Columna titulo={col.nombre} partidos={col.partidos} onPartido={onPartido} />
            <Conector slots={col.partidos.length} lado="izq" linea={linea} />
          </React.Fragment>
        ))}

        <ColumnaFinal final={final} campeon={campeon} onPartido={onPartido} token={token} />

        {derecha.map((col) => (
          <React.Fragment key={`d-${col.ronda}`}>
            <Conector slots={col.partidos.length} lado="der" linea={linea} />
            <Columna titulo={col.nombre} partidos={col.partidos} onPartido={onPartido} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
