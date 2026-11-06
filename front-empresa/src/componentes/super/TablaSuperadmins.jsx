import React, { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Space, Table, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useSesion } from "../../services/session";
import { getSuperadmins, crearSuperadmin, eliminarSuperadmin, cambiarMiPassword } from "../../services/superadminService";

const formatearFecha = (f) => (f ? String(f).replace("T", " ").slice(0, 16) : "—");

// Las personas del equipo que pueden entrar a este panel
export default function TablaSuperadmins() {
  const { usuario } = useSesion();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevo, setNuevo] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formNuevo] = Form.useForm();
  const [formPassword] = Form.useForm();

  const cargar = async () => {
    try {
      setLista(await getSuperadmins());
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudieron cargar los super admins");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async (accion, exito, alExito) => {
    setGuardando(true);
    try {
      await accion();
      message.success(exito);
      alExito?.();
      await cargar();
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo completar la acción");
    } finally {
      setGuardando(false);
    }
  };

  const columnas = [
    { title: "Nombre", dataIndex: "nombre" },
    { title: "Email", dataIndex: "email" },
    { title: "Creado", dataIndex: "fecha_creacion", render: formatearFecha },
    {
      title: "",
      render: (_, a) =>
        a.id_superadmin === usuario?.id_superadmin ? (
          <span>Vos</span>
        ) : (
          <Popconfirm
            title={`¿Eliminar a ${a.nombre}?`}
            okText="Eliminar"
            okButtonProps={{ danger: true }}
            cancelText="No"
            onConfirm={() => guardar(() => eliminarSuperadmin(a.id_superadmin), "Super admin eliminado")}
          >
            <Button size="small" danger>
              Eliminar
            </Button>
          </Popconfirm>
        ),
    },
  ];

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setNuevo(true)}>
          Nuevo super admin
        </Button>
        <Button onClick={() => setCambiando(true)}>Cambiar mi contraseña</Button>
      </Space>

      <Table
        dataSource={lista}
        columns={columnas}
        rowKey="id_superadmin"
        loading={cargando}
        pagination={false}
        scroll={{ x: "max-content" }}
      />

      <Modal
        open={nuevo}
        title="Nuevo super admin"
        okText="Crear"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onOk={() => formNuevo.submit()}
        onCancel={() => setNuevo(false)}
        forceRender
      >
        <Form
          form={formNuevo}
          layout="vertical"
          onFinish={(v) =>
            guardar(() => crearSuperadmin(v), "Super admin creado", () => {
              setNuevo(false);
              formNuevo.resetFields();
            })
          }
        >
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: "Ingresá el nombre" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Ingresá un email válido" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Contraseña" rules={[{ required: true, min: 8, message: "Mínimo 8 caracteres" }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={cambiando}
        title="Cambiar mi contraseña"
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onOk={() => formPassword.submit()}
        onCancel={() => setCambiando(false)}
        forceRender
      >
        <Form
          form={formPassword}
          layout="vertical"
          onFinish={(v) =>
            guardar(() => cambiarMiPassword(v.actual, v.nueva), "Contraseña actualizada", () => {
              setCambiando(false);
              formPassword.resetFields();
            })
          }
        >
          <Form.Item name="actual" label="Contraseña actual" rules={[{ required: true, message: "Ingresá tu contraseña actual" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="nueva" label="Contraseña nueva" rules={[{ required: true, min: 8, message: "Mínimo 8 caracteres" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmar"
            label="Repetir contraseña nueva"
            dependencies={["nueva"]}
            rules={[
              { required: true, message: "Repetí la contraseña" },
              ({ getFieldValue }) => ({
                validator: (_, v) =>
                  !v || getFieldValue("nueva") === v ? Promise.resolve() : Promise.reject(new Error("No coinciden")),
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
