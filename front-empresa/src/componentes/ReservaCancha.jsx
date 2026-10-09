import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  message,
  Spin,
} from "antd";
// Importamos el servicio para traer la lista de canchas al formulario
import { obtenerEmpresas } from "../services/empresaService";

export default function ReservaCancha() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [canchas, setCanchas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const horariosDisponibles = [
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00",
    "21:00 - 22:00",
    "22:00 - 23:00",
    "23:00 - 00:00",
  ];

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await obtenerEmpresas();
        setCanchas(data);
      } catch (error) {
        message.error("Error al cargar las canchas disponibles");
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const onFinish = (valores) => {
    const [horario_in, horario_fin] = valores.turno.split(" - ");
    // Buscamos la cancha elegida para saber su precio real y empresa
    const canchaSeleccionada = canchas.find(
      (c) => c.id_cancha === valores.id_cancha,
    );

    const reservaData = {
      id_cancha: valores.id_cancha,
      id_empresa: canchaSeleccionada?.id_empresa || 1,
      fecha: valores.fecha.format("YYYY-MM-DD"),
      horario_in: `${horario_in}:00`,
      horario_fin: `${horario_fin}:00`,
      nombre_cliente: valores.nombre_cliente,
      telefono: valores.telefono,
      precio: canchaSeleccionada?.precio_hora || 15000,
    };

    console.log("Reserva enviada:", reservaData);
    message.success("¡Reserva guardada exitosamente!");
    setTimeout(() => navigate("/empresas"), 1500);
  };

  if (cargando) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <Button onClick={() => navigate(-1)} style={{ marginBottom: "20px" }}>
        Volver a Canchas
      </Button>

      <Card title="Completar Nueva Reserva">
        {/* initialValues preselecciona la cancha si el usuario viene de hacer clic en la tabla */}
        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ id_cancha: id ? Number(id) : undefined }}
        >
          <Form.Item
            label="Seleccionar Complejo y Cancha"
            name="id_cancha"
            rules={[{ required: true, message: "Seleccioná una cancha" }]}
          >
            <Select placeholder="Elegí la cancha para jugar">
              {canchas.map((cancha) => (
                <Select.Option key={cancha.id_cancha} value={cancha.id_cancha}>
                  {cancha.id_empresa === 1 ? "Complejo Golazo" : "Área 51"} -{" "}
                  {cancha.nombre} ({cancha.tipo})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Nombre y Apellido"
            name="nombre_cliente"
            rules={[{ required: true, message: "Ingresá tu nombre" }]}
          >
            <Input placeholder="Ej: Lucas Martínez" />
          </Form.Item>

          <Form.Item
            label="Número de Teléfono"
            name="telefono"
            rules={[{ required: true, message: "Ingresá tu teléfono" }]}
          >
            <Input placeholder="Ej: 3534112233" />
          </Form.Item>

          <Form.Item
            label="Fecha del Partido"
            name="fecha"
            rules={[{ required: true, message: "Seleccioná una fecha" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Seleccionar fecha"
            />
          </Form.Item>

          <Form.Item
            label="Seleccionar Turno Horario"
            name="turno"
            rules={[{ required: true, message: "Seleccioná un turno" }]}
          >
            <Select placeholder="Elegir un horario disponible">
              {horariosDisponibles.map((horario) => (
                <Select.Option key={horario} value={horario}>
                  {horario} hs
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Confirmar Reserva
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
