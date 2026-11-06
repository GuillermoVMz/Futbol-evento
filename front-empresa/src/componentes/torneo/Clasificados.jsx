import React from "react";
import { Tag, Typography, theme } from "antd";
import { colorEquipo } from "./colores";

// Quiénes pasan a las llaves, una tabla por grupo. Se acomodan una al lado de la otra hasta que no haya
// espacio y el resto baja a la línea siguiente.
export default function Clasificados({ grupos, clasificanPorGrupo, hayLlaves }) {
  const { token } = theme.useToken();
  const borde = `1px solid ${token.colorBorderSecondary}`;

  return (
    <div style={{ marginBottom: 24 }}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Clasificados por grupo
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 12 }}>
        Pasan a las llaves los primeros {clasificanPorGrupo} de cada grupo.
      </Typography.Text>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {grupos.map((g) => {
          const jugados = g.partidos.filter((p) => p.jugado).length;
          const completo = g.partidos.length > 0 && jugados === g.partidos.length;
          const estado =
            hayLlaves || completo
              ? { texto: "Definidos", color: "green" }
              : jugados > 0
                ? { texto: "Provisorio", color: "orange" }
                : { texto: "Sin jugar", color: "default" };

          return (
            <div
              key={g.grupo}
              style={{
                width: 230,
                border: borde,
                borderRadius: token.borderRadiusLG,
                overflow: "hidden",
                background: token.colorBgContainer,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: token.colorFillTertiary,
                  fontWeight: 700,
                }}
              >
                <span>Grupo {g.grupo}</span>
                <Tag color={estado.color} style={{ margin: 0 }}>
                  {estado.texto}
                </Tag>
              </div>

              {Array.from({ length: clasificanPorGrupo }, (_, i) => {
                const fila = jugados > 0 ? g.tabla[i] : null; // sin partidos jugados todavía no hay nadie definido
                return (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderTop: borde }}
                  >
                    <strong style={{ width: 22 }}>{i + 1}°</strong>
                    {fila ? (
                      <>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: colorEquipo(fila.nombre, fila.color),
                          }}
                        />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {fila.nombre}
                        </span>
                      </>
                    ) : (
                      <Typography.Text type="secondary" italic>
                        Por definir
                      </Typography.Text>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
