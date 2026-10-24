import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, Space, Select, message } from "antd";
import { obtenerReservasEmpresa, cambiarEstadoReserva } from "../../services/reservaService";

const COLORES = { confirmada: "green", pagada: "blue", cancelada: "red" };
const formatearFecha = (f) => String(f).split("-").reverse().join("/");
const hhmm = (t) => String(t).slice(0, 5);

export default function AdminReservas() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todas");

  const cargar = async () => {
    try {
      setReservas(await obtenerReservasEmpresa());
    } catch {
      message.error("No se pudieron cargar las reservas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const cambiarEstado = async (id, estado) => {
    try {
      await cambiarEstadoReserva(id, estado);
      message.success("Reserva actualizada");
      cargar();
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo actualizar");
    }
  };

  const columnas = [
    { title: "Cliente", dataIndex: "nombre_cliente" },
    { title: "Teléfono", dataIndex: "telefono" },
    { title: "Cancha", render: (_, r) => `${r.cancha} (${r.tipo})` },
    { title: "Fecha", dataIndex: "fecha", render: formatearFecha },
    { title: "Turno", render: (_, r) => `${hhmm(r.horario_in)} - ${hhmm(r.horario_fin)}` },
    { title: "Precio", dataIndex: "precio", render: (p) => `$${Number(p).toLocaleString()}` },
    {
      title: "Pago",
      dataIndex: "medio_pago",
      render: (m) => <Tag>{m === "transferencia" ? "Transferencia" : "Efectivo"}</Tag>,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (e) => <Tag color={COLORES[e]}>{e.toUpperCase()}</Tag>,
    },
    {
      title: "Acciones",
      render: (_, r) => (
        <Space>
          {r.estado === "confirmada" && (
            <Button size="small" type="primary" onClick={() => cambiarEstado(r.id_reserva, "pagada")}>
              Marcar pagada
            </Button>
          )}
          {r.estado !== "cancelada" && (
            <Popconfirm title="¿Cancelar esta reserva?" okText="Sí" cancelText="No" onConfirm={() => cambiarEstado(r.id_reserva, "cancelada")}>
              <Button size="small" danger>
                Cancelar
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const datos = filtro === "todas" ? reservas : reservas.filter((r) => r.estado === filtro);

  return (
    <>
      <Select
        value={filtro}
        onChange={setFiltro}
        style={{ width: 180, marginBottom: 16 }}
        options={[
          { value: "todas", label: "Todas" },
          { value: "confirmada", label: "Confirmadas (por cobrar)" },
          { value: "pagada", label: "Pagadas" },
          { value: "cancelada", label: "Canceladas" },
        ]}
      />
      <Table
        dataSource={datos}
        columns={columnas}
        rowKey="id_reserva"
        loading={cargando}
        pagination={{ pageSize: 8 }}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Todavía no hay reservas" }}
      />
    </>
  );
}
