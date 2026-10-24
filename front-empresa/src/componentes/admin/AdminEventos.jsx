import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Space, Popconfirm, Upload, message } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getMisEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  urlImagenEvento,
  subirImagenEvento,
  eliminarImagenEvento,
} from "../../services/eventoService";
import { comprimirImagen } from "../../services/imagen";

const MODALIDADES = ["F5", "F7", "F11"];
const ESTADOS = ["Inscripciones Abiertas", "Cupos Llenos", "Finalizado"];

export default function AdminEventos() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nuevo
  const [guardando, setGuardando] = useState(false);
  const [imagenNueva, setImagenNueva] = useState(null); // data URL de la imagen recién elegida
  const [quitarImagen, setQuitarImagen] = useState(false); // true = borrar la imagen que ya tenía
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
    setImagenNueva(null);
    setQuitarImagen(false);
    setEditando(evento ?? {});
  };

  // Lo que se muestra en la vista previa: la imagen recién elegida o, si no, la que ya tenía
  const vistaPrevia = imagenNueva ?? (quitarImagen ? null : urlImagenEvento(editando));

  const elegirImagen = async (archivo) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(archivo.type)) {
      message.error("Elegí una imagen PNG, JPG o WEBP");
      return false;
    }
    if (archivo.size > 15 * 1024 * 1024) {
      message.error("La imagen es demasiado pesada (máximo 15 MB)");
      return false;
    }
    try {
      setImagenNueva(await comprimirImagen(archivo));
      setQuitarImagen(false);
    } catch (err) {
      message.error(err.message);
    }
    return false; // false = no subirla sola: se sube junto con el resto al guardar
  };

  const guardar = async (valores) => {
    setGuardando(true);
    const datos = { ...valores, fecha: valores.fecha.format("YYYY-MM-DDTHH:mm:ss") };
    try {
      const guardado = editando.id
        ? await actualizarEvento(editando.id, datos)
        : await crearEvento(datos);

      // La imagen se sube aparte, ya con el id del evento. Si falla, el evento igual quedó guardado.
      try {
        if (imagenNueva) await subirImagenEvento(guardado.id, imagenNueva);
        else if (quitarImagen && editando.id) await eliminarImagenEvento(editando.id);
        message.success("Evento guardado");
      } catch (err) {
        message.warning(
          err.response?.data?.mensaje
            ? `El evento se guardó, pero la imagen no: ${err.response.data.mensaje}`
            : "El evento se guardó, pero no se pudo subir la imagen",
        );
      }
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
    {
      title: "Imagen",
      render: (_, e) =>
        e.tiene_imagen ? (
          <img
            alt={e.titulo}
            src={urlImagenEvento(e)}
            style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 4, display: "block" }}
          />
        ) : (
          "—"
        ),
    },
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

          {/* La imagen no es un campo del formulario: se maneja con su propio estado */}
          <Form.Item
            label="Imagen del torneo"
            extra="Un afiche o foto con el trofeo. Mejor horizontal (4:3). PNG, JPG o WEBP."
          >
            {vistaPrevia && (
              <img
                alt="Vista previa"
                src={vistaPrevia}
                style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
              />
            )}
            <Space>
              <Upload accept="image/png,image/jpeg,image/webp" showUploadList={false} beforeUpload={elegirImagen}>
                <Button icon={<UploadOutlined />}>{vistaPrevia ? "Cambiar imagen" : "Elegir imagen"}</Button>
              </Upload>
              {vistaPrevia && (
                <Button
                  danger
                  onClick={() => {
                    setImagenNueva(null);
                    setQuitarImagen(true);
                  }}
                >
                  Quitar
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
