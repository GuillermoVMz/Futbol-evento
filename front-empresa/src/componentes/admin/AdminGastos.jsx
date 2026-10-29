import React, { useEffect, useState } from "react";
import { Table, Button, Form, Input, InputNumber, DatePicker, Space, Popconfirm, Statistic, message } from "antd";
import { obtenerGastos, crearGasto, eliminarGasto } from "../../services/adminService";

const formatearFecha = (f) => String(f).split("-").reverse().join("/");

export default function AdminGastos() {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm();

  const cargar = async () => {
    try {
      setGastos(await obtenerGastos());
    } catch {
      message.error("No se pudieron cargar los gastos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async (valores) => {
    setGuardando(true);
    try {
      await crearGasto({
        concepto: valores.concepto,
        monto: valores.monto,
        fecha: valores.fecha ? valores.fecha.format("YYYY-MM-DD") : undefined, // vacío = hoy
      });
      form.resetFields();
      cargar();
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo guardar el gasto");
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (id) => {
    try {
      await eliminarGasto(id);
      cargar();
    } catch {
      message.error("No se pudo eliminar el gasto");
    }
  };

  const total = gastos.reduce((suma, g) => suma + g.monto, 0);

  const columnas = [
    { title: "Fecha", dataIndex: "fecha", render: formatearFecha },
    { title: "Concepto", dataIndex: "concepto" },
    { title: "Monto", dataIndex: "monto", render: (m) => `$${Number(m).toLocaleString()}` },
    {
      title: "",
      render: (_, g) => (
        <Popconfirm title="¿Eliminar este gasto?" okText="Eliminar" cancelText="No" onConfirm={() => borrar(g.id_gasto)}>
          <Button size="small" danger>Eliminar</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Form form={form} layout="inline" onFinish={guardar} style={{ marginBottom: 16, rowGap: 8 }}>
        <Form.Item name="concepto" rules={[{ required: true, message: "Concepto" }]}>
          <Input placeholder="Concepto (ej: Luz, Sueldos)" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="monto" rules={[{ required: true, message: "Monto" }]}>
          <InputNumber min={0} placeholder="Monto ($)" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="fecha">
          <DatePicker format="DD/MM/YYYY" placeholder="Fecha (hoy)" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={guardando}>
          Agregar gasto
        </Button>
      </Form>

      <Space style={{ marginBottom: 16 }}>
        <Statistic title="Total registrado" value={`$${total.toLocaleString()}`} />
      </Space>

      <Table
        dataSource={gastos}
        columns={columnas}
        rowKey="id_gasto"
        loading={cargando}
        pagination={{ pageSize: 8 }}
        locale={{ emptyText: "Todavía no registraste gastos" }}
      />
    </>
  );
}
