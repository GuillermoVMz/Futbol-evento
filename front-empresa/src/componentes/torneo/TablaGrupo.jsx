import React from "react";
import { Table, Tag } from "antd";
import { colorEquipo } from "./colores";

const centro = { align: "center", width: 52 };

// Tabla de posiciones de un grupo. Los clasificados llevan la posición en verde.
export default function TablaGrupo({ tabla }) {
  const columnas = [
    {
      title: "#",
      width: 48,
      align: "center",
      render: (_, f, i) => <Tag color={f.clasifica ? "green" : "default"}>{i + 1}</Tag>,
    },
    {
      title: "Equipo",
      dataIndex: "nombre",
      render: (nombre, f) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span
            style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: colorEquipo(nombre, f.color) }}
          />
          {nombre}
        </span>
      ),
    },
    { title: "PJ", dataIndex: "pj", ...centro },
    { title: "PG", dataIndex: "pg", ...centro },
    { title: "PE", dataIndex: "pe", ...centro },
    { title: "PP", dataIndex: "pp", ...centro },
    { title: "GF", dataIndex: "gf", ...centro },
    { title: "GC", dataIndex: "gc", ...centro },
    { title: "DG", dataIndex: "dg", ...centro, render: (v) => (v > 0 ? `+${v}` : v) },
    { title: "Pts", dataIndex: "pts", ...centro, render: (v) => <strong>{v}</strong> },
  ];

  return (
    <Table
      size="small"
      pagination={false}
      dataSource={tabla}
      columns={columnas}
      rowKey="id_equipo"
      scroll={{ x: "max-content" }}
    />
  );
}
