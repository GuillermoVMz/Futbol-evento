import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Space, Popconfirm, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getMisEventos, crearEvento, actualizarEvento, eliminarEvento } from "../../services/eventoService";

const MODALIDADES = ["F5", "F7", "F11"];
const ESTADOS = ["Inscripciones Abiertas", "Cupos Llenos", "Finalizado"];

export default function AdminEventos() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nuevo
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm();

  const cargar = async () => {
    try {
      setEventos(await getMisEventos());
    } catch {
      message.error("No se pudieron cargar tus eventos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrir = (evento) => {
    form.resetFields();
    form.setFieldsValue(
      evento
        ? { ...evento, fecha: dayjs(evento.fecha) }
        : { modalidad: "F5", estado: "Inscripciones Abiertas" },
    );
    setEditando(evento ?? {});
  };

  const guardar = async (valores) => {
    setGuardando(true);
    const datos = { ...valores, fecha: valores.fecha.format("YYYY-MM-DDTHH:mm:ss") };
    try {
      if (editando.id) await actualizarEvento(editando.id, datos);
      else await crearEvento(datos);
      message.success("Evento guardado");
      setEditando(null);
      cargar();
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo guardar el evento");
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (id) => {
    try {
      await eliminarEvento(id);
      message.success("Evento eliminado");
      cargar();
    } catch {
      message.error("No se pudo eliminar el evento");
    }
  };

  const columnas = [
    { title: "Título", dataIndex: "titulo" },
    { title: "Lugar", dataIndex: "lugar" },
    { title: "Modalidad", dataIndex: "modalidad", render: (m) => <Tag color="blue">{m}</Tag> },
    { title: "Fecha", dataIndex: "fecha", render: (f) => dayjs(f).format("DD/MM/YYYY HH:mm") },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (e) => <Tag color={e === "Inscripciones Abiertas" ? "green" : "red"}>{e}</Tag>,
    },
    {
      title: "Acciones",
      render: (_, e) => (
        <Space>
          <Button size="small" onClick={() => abrir(e)}>Editar</Button>
          <Popconfirm title="¿Eliminar este evento?" okText="Eliminar" cancelText="No" onConfirm={() => borrar(e.id)}>
            <Button size="small" danger>Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => abrir()} style={{ marginBottom: 16 }}>
        Nuevo evento
      </Button>

      <Table
        dataSource={eventos}
        columns={columnas}
        rowKey="id"
        loading={cargando}
        pagination={{ pageSize: 8 }}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Todavía no creaste eventos" }}
      />

      <Modal
        open={editando !== null}
        title={editando?.id ? "Editar evento" : "Nuevo evento"}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onOk={() => form.submit()}
        onCancel={() => setEditando(null)}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={guardar}>
          <Form.Item name="titulo" label="Título" rules={[{ required: true, message: "Ingresá el título" }]}>
            <Input placeholder="Ej: Torneo Relámpago" />
          </Form.Item>
          <Form.Item name="lugar" label="Lugar" rules={[{ required: true, message: "Ingresá el lugar" }]}>
            <Input placeholder="Ej: Complejo Norte, Villa María" />
          </Form.Item>
          <Form.Item name="fecha" label="Fecha y hora" rules={[{ required: true, message: "Elegí fecha y hora" }]}>
            <DatePicker showTime={{ format: "HH:mm" }} format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="modalidad" label="Modalidad" rules={[{ required: true }]}>
            <Select options={MODALIDADES.map((m) => ({ value: m, label: m }))} />
          </Form.Item>
          <Form.Item name="estado" label="Estado">
            <Select options={ESTADOS.map((e) => ({ value: e, label: e }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
