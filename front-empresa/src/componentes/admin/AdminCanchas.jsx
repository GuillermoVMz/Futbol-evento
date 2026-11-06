import React, { useEffect, useState } from "react";
import {
  Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Switch, Space,
  TimePicker, Popconfirm, Divider, Empty, message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  obtenerMisCanchas, crearEmpresa, actualizarEmpresa,
  obtenerHorarios, agregarHorario, eliminarHorario,
} from "../../services/empresaService";

const TIPOS = ["Fútbol 5", "Fútbol 7", "Fútbol 11"];
const hhmm = (t) => String(t).slice(0, 5);
const pad = (n) => String(n).padStart(2, "0");

// ---------- Horarios de una cancha ----------
function ModalHorarios({ cancha, onCerrar }) {
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [rango, setRango] = useState(null);
  const [desde, setDesde] = useState(16);
  const [hasta, setHasta] = useState(17);

  // El cierre se completa solo: una hora después del inicio (se puede subir para cargar varios turnos seguidos)
  const cambiarDesde = (v) => {
    setDesde(v);
    if (v != null) setHasta(v + 1);
  };

  const cargar = async () => {
    try {
      setHorarios(await obtenerHorarios(cancha.id_cancha));
    } catch {
      message.error("No se pudieron cargar los horarios");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agregar = async (inicio, fin) => {
    try {
      await agregarHorario(cancha.id_cancha, { hora_inicio: inicio, hora_fin: fin });
      return true;
    } catch (err) {
      message.error(`${inicio} - ${fin}: ${err.response?.data?.mensaje || "no se pudo agregar"}`);
      return false;
    }
  };

  const agregarPersonalizado = async () => {
    if (!rango) return message.warning("Elegí la hora de inicio y de fin");
    const ok = await agregar(rango[0].format("HH:mm"), rango[1].format("HH:mm"));
    if (ok) {
      setRango(null);
      cargar();
    }
  };

  // Crea un turno de 1 hora por cada hora entre "desde" y "hasta"
  const generar = async () => {
    if (desde == null || hasta == null || !(hasta > desde)) {
      return message.warning("Elegí la hora de inicio; el cierre debe ser posterior");
    }
    let creados = 0;
    for (let h = desde; h < hasta; h++) {
      if (await agregar(`${pad(h)}:00`, `${pad(h + 1)}:00`)) creados++;
    }
    if (creados) message.success(`${creados} turno(s) agregado(s)`);
    cargar();
  };

  const quitar = async (id) => {
    try {
      await eliminarHorario(cancha.id_cancha, id);
      cargar();
    } catch {
      message.error("No se pudo eliminar el horario");
    }
  };

  return (
    <Modal open title={`Horarios — ${cancha.nombre}`} onCancel={onCerrar} footer={null} width={560}>
      <p style={{ marginBottom: 8 }}>
        Turnos que los jugadores pueden reservar (se repiten todos los días):
      </p>
      {horarios.length === 0 && !cargando ? (
        <Empty description="Todavía no cargaste horarios: nadie podrá reservar esta cancha" />
      ) : (
        <Space wrap>
          {horarios.map((h) => (
            <Popconfirm key={h.id_horario} title="¿Quitar este turno?" okText="Quitar" cancelText="No" onConfirm={() => quitar(h.id_horario)}>
              <Tag color="green" closable onClose={(e) => e.preventDefault()} style={{ fontSize: 14, padding: "2px 8px" }}>
                {hhmm(h.hora_inicio)} - {hhmm(h.hora_fin)}
              </Tag>
            </Popconfirm>
          ))}
        </Space>
      )}

      <Divider>Agregar turnos de 1 hora</Divider>
      <Space>
        Desde las
        <InputNumber min={0} max={22} value={desde} onChange={cambiarDesde} />
        hasta las
        <InputNumber min={(desde ?? 0) + 1} max={23} value={hasta} onChange={setHasta} />
        hs
        <Button type="primary" onClick={generar}>Agregar</Button>
      </Space>

      <Divider>Agregar un turno personalizado</Divider>
      <Space>
        <TimePicker.RangePicker format="HH:mm" minuteStep={15} value={rango} onChange={setRango} />
        <Button onClick={agregarPersonalizado}>Agregar</Button>
      </Space>
    </Modal>
  );
}

// ---------- Listado y alta/edición de canchas ----------
export default function AdminCanchas() {
  const [canchas, setCanchas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nueva, {..} = editar
  const [guardando, setGuardando] = useState(false);
  const [conHorarios, setConHorarios] = useState(null);
  const [form] = Form.useForm();

  const cargar = async () => {
    try {
      setCanchas(await obtenerMisCanchas());
    } catch {
      message.error("No se pudieron cargar tus canchas");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrir = (cancha) => {
    form.resetFields();
    form.setFieldsValue(cancha ?? { tipo: "Fútbol 5", techada: false });
    setEditando(cancha ?? {});
  };

  const guardar = async (valores) => {
    setGuardando(true);
    try {
      if (editando.id_cancha) await actualizarEmpresa(editando.id_cancha, valores);
      else await crearEmpresa(valores);
      message.success("Cancha guardada");
      setEditando(null);
      cargar();
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo guardar la cancha");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarActiva = async (cancha, activo) => {
    try {
      await actualizarEmpresa(cancha.id_cancha, { activo });
      cargar();
    } catch {
      message.error("No se pudo cambiar el estado");
    }
  };

  const columnas = [
    { title: "Nombre", dataIndex: "nombre" },
    { title: "Modalidad", dataIndex: "tipo", render: (t) => <Tag color="blue">{t}</Tag> },
    { title: "Precio/Hora", dataIndex: "precio_hora", render: (p) => `$${Number(p).toLocaleString()}` },
    { title: "Techada", dataIndex: "techada", render: (t) => (t ? <Tag color="green">Sí</Tag> : "No") },
    {
      title: "Visible",
      dataIndex: "activo",
      render: (a, c) => <Switch checked={a} onChange={(v) => cambiarActiva(c, v)} />,
    },
    {
      title: "Acciones",
      render: (_, c) => (
        <Space>
          <Button size="small" onClick={() => setConHorarios(c)}>Horarios</Button>
          <Button size="small" onClick={() => abrir(c)}>Editar</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => abrir()} style={{ marginBottom: 16 }}>
        Nueva cancha
      </Button>

      <Table
        dataSource={canchas}
        columns={columnas}
        rowKey="id_cancha"
        loading={cargando}
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Todavía no cargaste canchas" }}
      />

      <Modal
        open={editando !== null}
        title={editando?.id_cancha ? "Editar cancha" : "Nueva cancha"}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onOk={() => form.submit()}
        onCancel={() => setEditando(null)}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={guardar}>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: "Ingresá el nombre" }]}>
            <Input placeholder="Ej: Cancha 1" />
          </Form.Item>
          <Form.Item name="tipo" label="Modalidad" rules={[{ required: true }]}>
            <Select options={TIPOS.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="precio_hora" label="Precio por hora ($)" rules={[{ required: true, message: "Ingresá el precio" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="techada" label="Techada" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {conHorarios && <ModalHorarios cancha={conHorarios} onCerrar={() => setConHorarios(null)} />}
    </>
  );
}
