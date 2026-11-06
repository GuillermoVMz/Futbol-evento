import React, { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
  Divider,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getMisTorneos,
  crearTorneo,
  eliminarTorneo,
} from "../../services/torneoService";
import GestionTorneo from "./GestionTorneo";
import CampoImagen from "./CampoImagen";
import {
  FORMATOS,
  estadoVisible,
  textoCupo,
  formatearFecha,
  formatearPlata,
} from "../torneo/utils";

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
      message.error(
        err.response?.data?.mensaje || "No se pudieron cargar tus torneos",
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNuevo = () => {
    form.resetFields();
    form.setFieldsValue({
      formato: "grupos",
      cantidad_grupos: 2,
      clasifican_por_grupo: 2,
      tipo_cruces: "posicional_cruzado",
      cupo_maximo: 8,
      precio_inscripcion: 0,
      premios: [],
    });
    setCreando(true);
  };

  const guardar = async (v) => {
    setGuardando(true);
    try {
      const datos = {
        nombre: v.nombre,
        formato: v.formato,
        cupo_maximo: v.cupo_maximo,
        precio_inscripcion: v.precio_inscripcion,
        fecha_evento: v.fecha_evento.format("YYYY-MM-DD"),
        imagen_url: v.imagen_url || null,
        premios: v.premios || [],
        tipo_cruces: v.tipo_cruces || "azar",
      };

      if (v.formato === "grupos") {
        datos.cantidad_grupos = v.cantidad_grupos;
        datos.clasifican_por_grupo = v.clasifican_por_grupo;
      }

      const nuevo = await crearTorneo(datos);
      message.success("Torneo creado");
      setCreando(false);
      await cargar();
      setGestionando(nuevo); // abre directo para gestionar/inscribir
    } catch (err) {
      message.error(
        err.response?.data?.mensaje || "No se pudo crear el torneo",
      );
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
      title: "Fecha",
      dataIndex: "fecha_evento",
      render: (f) => (f ? formatearFecha(f) : "—"),
    },
    {
      title: "Inscripción",
      dataIndex: "precio_inscripcion",
      render: (p) => formatearPlata(p),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (_, t) => (
        <Tag color={estadoVisible(t, t.equipos).color}>
          {estadoVisible(t, t.equipos).texto}
        </Tag>
      ),
    },
    { title: "Equipos", render: (_, t) => textoCupo(t.equipos, t.cupo_maximo) },
    {
      title: "Acciones",
      render: (_, t) => (
        <Space>
          <Button size="small" type="primary" onClick={() => setGestionando(t)}>
            Gestionar
          </Button>
          <Popconfirm
            title="¿Eliminar este torneo?"
            description="Se borran sus equipos inscriptos, el fixture y los resultados."
            okText="Eliminar"
            okButtonProps={{ danger: true }}
            cancelText="No"
            onConfirm={() => borrar(t.id_torneo)}
          >
            <Button size="small" danger>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={abrirNuevo}
        style={{ marginBottom: 16 }}
      >
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

      <Modal
        open={creando}
        title="Nuevo torneo"
        okText="Crear"
        cancelText="Cancelar"
        confirmLoading={guardando}
        onOk={() => form.submit()}
        onCancel={() => setCreando(false)}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={guardar}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: "Ingresá el nombre" }]}
          >
            <Input placeholder="Ej: Torneo Clausura F5" maxLength={150} />
          </Form.Item>

          <Form.Item
            name="formato"
            label="Formato"
            rules={[{ required: true }]}
          >
            <Select
              options={Object.entries(FORMATOS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="cupo_maximo"
            label="Cupo máximo de equipos"
            extra="Cuando se llena, las inscripciones se cierran solas."
            rules={[{ required: true, message: "Indicá el cupo máximo" }]}
          >
            <InputNumber
              min={2}
              max={200}
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="fecha_evento"
            label="Fecha del torneo"
            extra="Las inscripciones se cierran solas después de ese día."
            rules={[{ required: true, message: "Elegí la fecha del torneo" }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              disabledDate={(d) => d && d.endOf("day").valueOf() < Date.now()}
            />
          </Form.Item>

          <Form.Item
            name="precio_inscripcion"
            label="Precio de inscripción por equipo ($)"
            extra="Lo que paga cada equipo vía Mercado Pago. Los jugadores no pueden cambiarlo."
            rules={[
              { required: true, message: "Indicá el precio (0 si es gratis)" },
            ]}
          >
            <InputNumber
              min={0}
              precision={0}
              step={1000}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="imagen_url"
            label="Imagen del torneo (opcional)"
            extra="Se muestra en la tarjeta y como fondo al abrir el torneo."
          >
            <CampoImagen />
          </Form.Item>

          {formato === "grupos" && (
            <>
              <Space size="large" align="start" wrap>
                <Form.Item
                  name="cantidad_grupos"
                  label="Cantidad de grupos"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} max={10} precision={0} />
                </Form.Item>
                <Form.Item
                  name="clasifican_por_grupo"
                  label="Clasifican por grupo"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} max={50} precision={0} />
                </Form.Item>
              </Space>

              <Form.Item
                name="tipo_cruces"
                label="Emparejamiento en eliminatorias"
              >
                <Select
                  options={[
                    {
                      value: "posicional_cruzado",
                      label:
                        "Posicional Cruzado (1° vs Último, 2° vs Penúltimo)",
                    },
                    { value: "azar", label: "Sorteo Aleatorio (Azar)" },
                  ]}
                />
              </Form.Item>
            </>
          )}

          {/* Form.List para añadir N Premios dinámicamente usando Antd */}
          <Divider orientation="left">Premios del Torneo</Divider>
          <Form.List name="premios">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "posicion"]}
                      rules={[{ required: true, message: "Ej: 1° Puesto" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="Ej: 1° Puesto" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "descripcion"]}
                      rules={[
                        { required: true, message: "Detalle del premio" },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="Ej: Trofeo + $50.000" />
                    </Form.Item>
                    <DeleteOutlined
                      onClick={() => remove(name)}
                      style={{ color: "red", cursor: "pointer" }}
                    />
                  </Space>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Agregar Premio
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
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
