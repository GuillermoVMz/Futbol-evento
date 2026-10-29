import React, { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getMisTorneos, crearTorneo, eliminarTorneo } from "../../services/torneoService";
import GestionTorneo from "./GestionTorneo";
import CampoImagen from "./CampoImagen";
import { FORMATOS, ESTADOS } from "../torneo/utils";

export default function AdminTorneos() {
  const [torneos, setTorneos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [gestionando, setGestionando] = useState(null);
  const [form] = Form.useForm();
  const formato = Form.useWatch("formato", form);

  const cargar = async () => {
    try {
      setTorneos(await getMisTorneos());
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudieron cargar tus torneos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNuevo = () => {
    form.resetFields();
    form.setFieldsValue({ formato: "eliminacion", cantidad_grupos: 2, clasifican_por_grupo: 2 });
    setCreando(true);
  };

  const guardar = async (v) => {
    setGuardando(true);
    try {
      const datos = { nombre: v.nombre, formato: v.formato, imagen_url: v.imagen_url || null };
      if (v.formato === "grupos") {
        datos.cantidad_grupos = v.cantidad_grupos;
        datos.clasifican_por_grupo = v.clasifican_por_grupo;
      }
      const nuevo = await crearTorneo(datos);
      message.success("Torneo creado");
      setCreando(false);
      await cargar();
      setGestionando(nuevo); // se abre directo para inscribir equipos
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo crear el torneo");
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (id) => {
    try {
      await eliminarTorneo(id);
      message.success("Torneo eliminado");
      cargar();
    } catch {
      message.error("No se pudo eliminar el torneo");
    }
  };

  const columnas = [
    { title: "Torneo", dataIndex: "nombre" },
    { title: "Formato", dataIndex: "formato", render: (f) => FORMATOS[f] ?? f },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (e) => <Tag color={ESTADOS[e]?.color}>{ESTADOS[e]?.texto ?? e}</Tag>,
    },
    { title: "Equipos", dataIndex: "equipos" },
    {
      title: "Acciones",
      render: (_, t) => (
        <Space>
          <Button size="small" type="primary" onClick={() => setGestionando(t)}>Gestionar</Button>
          <Popconfirm
            title="¿Eliminar este torneo?"
            description="Se borran sus equipos inscriptos, el fixture y los resultados."
            okText="Eliminar" okButtonProps={{ danger: true }} cancelText="No"
            onConfirm={() => borrar(t.id_torneo)}
          >
            <Button size="small" danger>Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={abrirNuevo} style={{ marginBottom: 16 }}>
        Nuevo torneo
      </Button>

      <Table
        dataSource={torneos}
        columns={columnas}
        rowKey="id_torneo"
        loading={cargando}
        pagination={{ pageSize: 8 }}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Todavía no creaste torneos" }}
      />

      <Modal open={creando} title="Nuevo torneo" okText="Crear" cancelText="Cancelar" confirmLoading={guardando}
        onOk={() => form.submit()} onCancel={() => setCreando(false)} forceRender>
        <Form form={form} layout="vertical" onFinish={guardar}>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: "Ingresá el nombre" }]}>
            <Input placeholder="Ej: Torneo Clausura F5" maxLength={150} />
          </Form.Item>
          <Form.Item name="formato" label="Formato" rules={[{ required: true }]}>
            <Select options={Object.entries(FORMATOS).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="imagen_url" label="Imagen del torneo (opcional)" extra="Se muestra en la tarjeta y como fondo al abrir el torneo.">
            <CampoImagen />
          </Form.Item>
          {formato === "grupos" && (
            <Space size="large" align="start">
              <Form.Item name="cantidad_grupos" label="Cantidad de grupos" rules={[{ required: true }]}>
                <InputNumber min={1} max={8} precision={0} />
              </Form.Item>
              <Form.Item name="clasifican_por_grupo" label="Clasifican por grupo" rules={[{ required: true }]}>
                <InputNumber min={1} max={4} precision={0} />
              </Form.Item>
            </Space>
          )}
        </Form>
      </Modal>

      <Modal
        open={gestionando !== null}
        title={gestionando ? `Gestionar: ${gestionando.nombre}` : ""}
        footer={null}
        width={980}
        destroyOnHidden
        onCancel={() => {
          setGestionando(null);
          cargar();
        }}
      >
        {gestionando && <GestionTorneo id={gestionando.id_torneo} />}
      </Modal>
    </>
  );
}
