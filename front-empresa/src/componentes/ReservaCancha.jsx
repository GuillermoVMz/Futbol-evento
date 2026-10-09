import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  DatePicker,
  TimePicker,
  Button,
  Card,
  message,
} from "antd";

export default function ReservaCancha() {
  const { id } = useParams(); // Obtenemos el ID de la cancha desde la URL
  const navigate = useNavigate();

  const onFinish = (valores) => {
    // Aquí preparamos los datos tal como los espera tu tabla 'reservas' en SQL
    const reservaData = {
      id_cancha: id,
      id_empresa: 1, // Suponiendo que es la empresa 1. Más adelante puedes pasarlo dinámicamente.
      fecha: valores.fecha.format("YYYY-MM-DD"),
      horario_in: valores.horarios[0].format("HH:mm:ss"),
      horario_fin: valores.horarios[1].format("HH:mm:ss"),
      nombre_cliente: valores.nombre_cliente,
      telefono: valores.telefono,
      precio: 15000, // Aquí podrías traer el precio_hora real de la cancha
    };

    console.log("Datos de la reserva a enviar al backend:", reservaData);
    message.success("¡Reserva solicitada con éxito!");

    // Simula una redirección después de reservar
    setTimeout(() => {
      navigate("/empresas");
    }, 1500);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <Button onClick={() => navigate(-1)} style={{ marginBottom: "20px" }}>
        Volver a Canchas
      </Button>

      <Card title={`Reservar Cancha #${id}`}>
        <Form layout="vertical" onFinish={onFinish}>
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

          {/* RangePicker nos permite elegir una hora de inicio y una de fin al mismo tiempo */}
          <Form.Item
            label="Horario (Desde - Hasta)"
            name="horarios"
            rules={[{ required: true, message: "Seleccioná el horario" }]}
          >
            <TimePicker.RangePicker style={{ width: "100%" }} format="HH:mm" />
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
