import React, { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Segmented, Space, Table, Tag, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  getEmpresas, crearEmpresa, cambiarAprobacion, establecerPasswordEmpresa, eliminarEmpresa,
} from "../../services/superadminService";

// Alta, aprobación y baja de los complejos / organizadores (reemplaza los comandos "aprobar" y "set-password")
export default function TablaComplejos({ onPendientes }) {
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pendientes");
  const [nuevo, setNuevo] = useState(false);
  const [paraPassword, setParaPassword] = useState(null); // complejo al que se le pone contraseña
  const [guardando, setGuardando] = useState(false);
  const [formNuevo] = Form.useForm();
  const [formPassword] = Form.useForm();

  const cargar = async () => {
    try {
      const lista = await getEmpresas();
      setEmpresas(lista);
      onPendientes?.(lista.filter((e) => !e.aprobada).length);
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudieron cargar los complejos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ejecutar = async (accion, exito) => {
    try {
      await accion();
      if (exito) message.success(exito);
      await cargar();
      return true;
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo completar la acción");
      return false;
    }
  };

  const aprobar = (e) =>
    ejecutar(async () => {
      await cambiarAprobacion(e.id_empresa, true);
      if (!e.tiene_password) {
        message.warning("Quedó aprobada, pero todavía no tiene contraseña: asignale una para que pueda ingresar.", 6);
      }
    }, e.tiene_password ? "Cuenta aprobada" : null);

  const guardarNuevo = async (valores) => {
    setGuardando(true);
    if (await ejecutar(() => crearEmpresa(valores), "Complejo creado y aprobado")) {
      setNuevo(false);
      formNuevo.resetFields();
      setFiltro("aprobadas");
    }
    setGuardando(false);
  };

  const guardarPassword = async ({ password }) => {
    setGuardando(true);
    if (await ejecutar(() => establecerPasswordEmpresa(paraPassword.id_empresa, password), "Contraseña actualizada")) {
      setParaPassword(null);
      formPassword.resetFields();
    }
    setGuardando(false);
  };

  const cantidad = {
    pendientes: empresas.filter((e) => !e.aprobada).length,
    aprobadas: empresas.filter((e) => e.aprobada).length,
    todas: empresas.length,
  };
  const visibles =
    filtro === "todas" ? empresas : empresas.filter((e) => (filtro === "aprobadas" ? e.aprobada : !e.aprobada));

  const columnas = [
    {
      title: "Complejo",
      render: (_, e) => (
        <div>
          <strong>{e.nombre_complejo || "(sin nombre)"}</strong>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {e.socios}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    { title: "Email", dataIndex: "email" },
    { title: "Dirección", dataIndex: "direccion", render: (d) => d ?? "—" },
    {
      title: "Estado",
      render: (_, e) => (
        <Space size={4} wrap>
          <Tag color={e.aprobada ? "green" : "orange"}>{e.aprobada ? "Aprobada" : "Pendiente"}</Tag>
          {!e.tiene_password && <Tag color="red">Sin contraseña</Tag>}
        </Space>
      ),
    },
    {
      title: "Cargado",
      render: (_, e) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {e.canchas} canchas · {e.torneos} torneos · {e.eventos} eventos
        </Typography.Text>
      ),
    },
    {
      title: "Acciones",
      render: (_, e) => (
        <Space wrap>
          {e.aprobada ? (
            <Popconfirm
              title="¿Suspender esta cuenta?"
              description="No podrá ingresar y sus canchas, torneos y eventos dejan de verse hasta que la vuelvas a aprobar."
              okText="Suspender"
              okButtonProps={{ danger: true }}
              cancelText="No"
              onConfirm={() => ejecutar(() => cambiarAprobacion(e.id_empresa, false), "Cuenta suspendida")}
            >
              <Button size="small" danger>
                Suspender
              </Button>
            </Popconfirm>
          ) : (
            <Button size="small" type="primary" onClick={() => aprobar(e)}>
              Aprobar
            </Button>
          )}
          <Button size="small" onClick={() => setParaPassword(e)}>
            Contraseña
          </Button>
          {!e.aprobada && (
            <Popconfirm
              title="¿Eliminar esta cuenta?"
              description="Se borra para siempre. Solo se puede si no tiene nada cargado."
              okText="Eliminar"
              okButtonProps={{ danger: true }}
              cancelText="No"
              onConfirm={() => ejecutar(() => eliminarEmpresa(e.id_empresa), "Cuenta eliminada")}
            >
              <Button size="small" danger type="text">
                Eliminar
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", marginBottom: 16 }}>
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "pendientes", label: `Pendientes (${cantidad.pendientes})` },
            { value: "aprobadas", label: `Aprobadas (${cantidad.aprobadas})` },
            { value: "todas", label: `Todas (${cantidad.todas})` },
          ]}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setNuevo(true)}>
          Nuevo complejo
        </Button>
      </div>

      <Table
        dataSource={visibles}
        columns={columnas}
        rowKey="id_empresa"
        loading={cargando}
        pagination={{ pageSize: 8 }}
        scroll={{ x: "max-content" }}
        locale={{
          emptyText: filtro === "pendientes" ? "No hay solicitudes pendientes 🎉" : "No hay complejos para mostrar",
        }}
      />

      <Modal
        open={nuevo}
        title="Nuevo complejo (queda aprobado)"
        okText="Crear"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onOk={() => formNuevo.submit()}
        onCancel={() => setNuevo(false)}
        forceRender
      >
        <Form form={formNuevo} layout="vertical" onFinish={guardarNuevo}>
          <Form.Item name="nombre_complejo" label="Nombre del complejo / organización" rules={[{ required: true, message: "Ingresá el nombre" }]}>
            <Input placeholder="Ej: Complejo Golazo" />
          </Form.Item>
          <Form.Item name="socios" label="Responsable o socios" rules={[{ required: true, message: "Ingresá el responsable" }]}>
            <Input placeholder="Ej: Juan Pérez, Carlos Gómez" />
          </Form.Item>
          <Form.Item name="direccion" label="Dirección" rules={[{ required: true, message: "Ingresá la dirección" }]}>
            <Input placeholder="Ej: Bulevar España 123, Villa María" />
          </Form.Item>
          <Form.Item name="email" label="Email (es el usuario para ingresar)" rules={[{ required: true, type: "email", message: "Ingresá un email válido" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Contraseña inicial" extra="Pasásela al responsable; después puede pedir que se la cambien." rules={[{ required: true, min: 6, message: "Mínimo 6 caracteres" }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={paraPassword !== null}
        title={`Contraseña de ${paraPassword?.nombre_complejo ?? ""}`}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onOk={() => formPassword.submit()}
        onCancel={() => setParaPassword(null)}
        forceRender
      >
        <Typography.Paragraph type="secondary">
          Usuario para ingresar: <strong>{paraPassword?.email}</strong>. Pasale la contraseña nueva al responsable.
        </Typography.Paragraph>
        <Form form={formPassword} layout="vertical" onFinish={guardarPassword}>
          <Form.Item name="password" label="Contraseña nueva" rules={[{ required: true, min: 6, message: "Mínimo 6 caracteres" }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
