import React from "react";
import { Alert, Empty, Space, Tabs, Tag, Typography } from "antd";
import TablaGrupo from "./TablaGrupo";
import ListaPartidos from "./ListaPartidos";
import Llaves from "./Llaves";

// Contenido de un torneo (campeón, tablas de grupos y llaves). Lo usan la vista pública y el panel del organizador.
export default function ContenidoTorneo({ datos, onPartido }) {
  const { torneo, equipos, grupos, llaves, campeon } = datos;

  if (grupos.length === 0 && llaves.length === 0) {
    return (
      <>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Todavía no se sortearon los cruces"
          description={equipos.length ? "Equipos inscriptos hasta ahora:" : "Todavía no hay equipos inscriptos."}
        />
        <Space wrap>
          {equipos.map((e) => (
            <Tag key={e.id_equipo}>{e.nombre}</Tag>
          ))}
        </Space>
      </>
    );
  }

  const items = [];

  if (grupos.length > 0) {
    items.push({
      key: "grupos",
      label: "Fase de grupos",
      children: (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(440px, 100%), 1fr))",
              gap: 28,
            }}
          >
            {grupos.map((g) => (
              <div key={g.grupo}>
                <Typography.Title level={5}>Grupo {g.grupo}</Typography.Title>
                <TablaGrupo tabla={g.tabla} />
                <ListaPartidos partidos={g.partidos} onPartido={onPartido} />
              </div>
            ))}
          </div>
          <Typography.Text type="secondary" style={{ display: "block", marginTop: 16, fontSize: 12 }}>
            PJ: partidos jugados · PG: ganados · PE: empatados · PP: perdidos · GF: goles a favor · GC: goles en
            contra · DG: diferencia de gol · Pts: puntos (ganar 3, empatar 1). En verde, los que clasifican a las
            llaves. Desempate: puntos, diferencia de gol y goles a favor.
          </Typography.Text>
        </>
      ),
    });
  }

  if (torneo.formato === "grupos" || llaves.length > 0) {
    items.push({
      key: "llaves",
      label: "Llaves",
      children:
        llaves.length > 0 ? (
          <Llaves rondas={llaves} onPartido={onPartido} />
        ) : (
          <Empty description="Las llaves se arman cuando termina la fase de grupos" />
        ),
    });
  }

  return (
    <>
      {campeon && (
        <Alert type="success" showIcon style={{ marginBottom: 16 }} message={`🏆 Campeón: ${campeon.nombre}`} />
      )}
      {/* key: al aparecer las llaves la pestaña activa pasa a "Llaves" */}
      <Tabs
        key={llaves.length > 0 ? "con-llaves" : "sin-llaves"}
        defaultActiveKey={llaves.length > 0 ? "llaves" : "grupos"}
        items={items}
      />
    </>
  );
}
