import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, InputNumber, DatePicker, Select, Button, Card, Spin, Tag, message } from "antd";
import { getEventoPorId, urlImagenEvento } from "../services/eventoService";
import MedioPago from "./MedioPago";

export default function InscripcionTorneo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const precio = Form.useWatch("precio", form);

  const [evento, setEvento] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getEventoPorId(id)
      .then(setEvento)
      .catch(() => {
        message.error("El torneo no existe o ya no está disponible");
        navigate("/", { replace: true });
      })
      .finally(() => setCargando(false));
  }, [id, navigate]);

  const onFinish = (valores) => {
    console.log("Datos de inscripción:", { torneoId: id, ...valores });
    message.success("Inscripción simulada con éxito");
    // Más adelante, aquí harás el fetch/axios hacia el backend
  };

  if (cargando || !evento) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  const imagen = urlImagenEvento(evento);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <Button onClick={() => navigate(-1)} style={{ marginBottom: "20px" }}>
        Volver a Eventos
      </Button>

      <Card
        cover={
          imagen ? (
            <img alt={evento.titulo} src={imagen} style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
          ) : undefined
        }
        title={`Inscripción: ${evento.titulo}`}
        extra={<Tag color="blue">{evento.modalidad}</Tag>}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ medio_pago: "efectivo" }}>
          <Form.Item
            label="Nombre del Equipo"
            name="nombre_equipo"
            rules={[{ required: true, message: "Ingresá el nombre del equipo" }]}
          >
            <Input placeholder="Ej: Los Pumas F5" />
          </Form.Item>

          <Form.Item
            label="Integrantes (Nombre y Apellido)"
            name="integrantes"
            rules={[{ required: true, message: "Detallá los integrantes" }]}
          >
            <Input.TextArea rows={4} placeholder={"1. Juan Pérez\n2. Martín Gómez..."} />
          </Form.Item>

          <Form.Item
            label="Precio de Inscripción ($)"
            name="precio"
            rules={[{ required: true, message: "Ingresá el precio" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} placeholder="Ej: 5000" />
          </Form.Item>

          <MedioPago alias={evento.alias_pago} titular={evento.titular_pago} monto={precio} />

          <Form.Item
            label="Fecha de Inscripción"
            name="fecha_inscripcion"
            rules={[{ required: true, message: "Seleccioná la fecha" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Seleccionar fecha" />
          </Form.Item>

          <Form.Item
            label="Estado de Pago"
            name="estado_pago"
            rules={[{ required: true, message: "Seleccioná el estado" }]}
          >
            <Select placeholder="Seleccionar estado">
              <Select.Option value="pagado">Pagado</Select.Option>
              <Select.Option value="seña">Seña entregada</Select.Option>
              <Select.Option value="pendiente">Pendiente</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Confirmar Registro
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
