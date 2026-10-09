import React, { useState } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  message,
  Typography,
} from "antd";
import {
  PhoneOutlined,
  UserAddOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function BuscoJugadores() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [partidos, setPartidos] = useState([
    {
      id: 1,
      lugar: "Complejo Golazo - Cancha 1",
      fecha: "12/10/2026",
      horario: "20:00 - 21:00 hs",
      jugadoresFaltantes: 2,
      precioPorPersona: 3000,
      contacto: "3534112233",
      organizador: "Lucas Martínez",
    },
    {
      id: 2,
      lugar: "Área 51 - Cancha 3",
      fecha: "13/10/2026",
      horario: "21:00 - 22:00 hs",
      jugadoresFaltantes: 1,
      precioPorPersona: 4000,
      contacto: "3534998877",
      organizador: "Gonzalo Fernández",
    },
  ]);

  const [form] = Form.useForm();

  const publicarBusqueda = (valores) => {
    const nuevoPartido = {
      id: Date.now(),
      lugar: valores.lugar,
      fecha: valores.fecha.format("DD/MM/YYYY"),
      horario: valores.horario,
      jugadoresFaltantes: valores.jugadoresFaltantes,
      precioPorPersona: valores.precioPorPersona,
      contacto: valores.contacto,
      organizador: valores.organizador,
    };

    setPartidos([nuevoPartido, ...partidos]);
    message.success("¡Publicación creada exitosamente!");
    setModalAbierto(false);
    form.resetFields();
  };

  return (
    <div style={{ padding: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Partidos buscando jugadores
          </Title>
          <Paragraph type="secondary" style={{ margin: "4px 0 0 0" }}>
            Súmate a un partido o publica si te faltan jugadores para completar
            tu equipo.
          </Paragraph>
        </div>

        <Button
          type="primary"
          icon={<UserAddOutlined />}
          size="large"
          onClick={() => setModalAbierto(true)}
          style={{ borderRadius: "8px" }}
        >
          Publicar Búsqueda
        </Button>
      </div>

      <Row gutter={[20, 20]}>
        {partidos.map((partido) => (
          <Col xs={24} sm={12} md={8} key={partido.id}>
            <Card
              hoverable
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              title={
                <Text bold style={{ fontSize: "16px" }}>
                  {partido.lugar}
                </Text>
              }
              extra={
                <Tag
                  color="volcano"
                  style={{ borderRadius: "6px", fontWeight: "bold" }}
                >
                  Faltan {partido.jugadoresFaltantes} jug.
                </Tag>
              }
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <CalendarOutlined style={{ marginRight: "8px" }} />{" "}
                  <Text strong>Fecha:</Text> {partido.fecha}
                </div>
                <div>
                  <ClockCircleOutlined style={{ marginRight: "8px" }} />{" "}
                  <Text strong>Horario:</Text> {partido.horario}
                </div>
                <div>
                  <DollarOutlined style={{ marginRight: "8px" }} />{" "}
                  <Text strong>Cuota:</Text> $
                  {partido.precioPorPersona.toLocaleString()}
                </div>
                <div>
                  <TeamOutlined style={{ marginRight: "8px" }} />{" "}
                  <Text strong>Organiza:</Text> {partido.organizador}
                </div>
              </div>

              <Button
                type="primary"
                icon={<PhoneOutlined />}
                href={`https://wa.me/${partido.contacto}?text=Hola!%20Vi%20tu%20publicacion%20para%20el%20partido%20en%20${encodeURIComponent(partido.lugar)}`}
                target="_blank"
                style={{
                  backgroundColor: "#25D366",
                  borderColor: "#25D366",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
                block
              >
                Contactar ({partido.contacto})
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal para agregar publicación */}
      <Modal
        title="Publicar Búsqueda de Jugadores"
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={publicarBusqueda}>
          <Form.Item
            name="organizador"
            label="Tu Nombre"
            rules={[{ required: true }]}
          >
            <Input placeholder="Ej: Lucas Martínez" />
          </Form.Item>
          <Form.Item
            name="contacto"
            label="Número de WhatsApp"
            rules={[{ required: true }]}
          >
            <Input placeholder="Ej: 3534112233" />
          </Form.Item>
          <Form.Item
            name="lugar"
            label="Cancha / Complejo"
            rules={[{ required: true }]}
          >
            <Select placeholder="Seleccionar complejo">
              <Select.Option value="Complejo Golazo - Cancha 1">
                Complejo Golazo - Cancha 1 (F5)
              </Select.Option>
              <Select.Option value="Complejo Golazo - Cancha 2">
                Complejo Golazo - Cancha 2 (F7)
              </Select.Option>
              <Select.Option value="Área 51 - Cancha Principal">
                Área 51 - Cancha Principal (F11)
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="fecha" label="Fecha" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item
            name="horario"
            label="Horario"
            rules={[{ required: true }]}
          >
            <Input placeholder="Ej: 21:00 - 22:00 hs" />
          </Form.Item>
          <Form.Item
            name="jugadoresFaltantes"
            label="¿Cuántos jugadores faltan?"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={10} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="precioPorPersona"
            label="Precio sugerido por persona ($)"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            style={{ marginTop: "10px" }}
          >
            Publicar
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
