import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, DatePicker, Select, Button, Card, Tag, Typography, Alert, message, Spin } from "antd";
import { obtenerEmpresaPorId, obtenerDisponibilidad } from "../services/empresaService";
import { crearReserva } from "../services/reservaService";
import { obtenerSesion } from "../services/session";

const { Text } = Typography;

const hhmm = (t) => String(t).slice(0, 5);

export default function ReservaCancha() {
  // La cancha viene en la URL (el usuario ya la eligió en "Canchas"): no se vuelve a pedir
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const fecha = Form.useWatch("fecha", form);

  const [cancha, setCancha] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [turnos, setTurnos] = useState([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const { usuario } = obtenerSesion();

  useEffect(() => {
    const cargarCancha = async () => {
      try {
        setCancha(await obtenerEmpresaPorId(id));
      } catch {
        message.error("La cancha no existe o ya no está disponible");
        navigate("/empresas", { replace: true });
      } finally {
        setCargando(false);
      }
    };
    cargarCancha();
  }, [id, navigate]);

  const cargarTurnos = async (dia) => {
    setCargandoTurnos(true);
    try {
      setTurnos(await obtenerDisponibilidad(id, dia.format("YYYY-MM-DD")));
    } catch {
      message.error("No se pudieron cargar los horarios");
      setTurnos([]);
    } finally {
      setCargandoTurnos(false);
    }
  };

  // Al elegir fecha se consultan los turnos libres de ESA cancha en ESE día
  useEffect(() => {
    form.setFieldValue("turno", undefined);
    if (fecha) cargarTurnos(fecha);
    else setTurnos([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  const onFinish = async (valores) => {
    const turno = turnos.find((t) => t.id_horario === valores.turno);
    setEnviando(true);
    try {
      await crearReserva({
        id_cancha: Number(id),
        fecha: valores.fecha.format("YYYY-MM-DD"),
        horario_in: hhmm(turno.hora_inicio),
        horario_fin: hhmm(turno.hora_fin),
        nombre_cliente: valores.nombre_cliente,
        telefono: valores.telefono,
      });
      message.success("¡Reserva confirmada!");
      navigate("/mis-reservas");
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo guardar la reserva");
      if (err.response?.status === 409) cargarTurnos(valores.fecha); // alguien lo tomó antes
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  const opcionesTurno = turnos.map((t) => ({
    value: t.id_horario,
    disabled: !t.disponible,
    label: `${hhmm(t.hora_inicio)} - ${hhmm(t.hora_fin)} hs${t.disponible ? "" : "  (no disponible)"}`,
  }));
  const hayLibres = turnos.some((t) => t.disponible);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <Button onClick={() => navigate("/empresas")} style={{ marginBottom: "20px" }}>
        Volver a Canchas
      </Button>

      <Card title="Completar Nueva Reserva">
        {/* Resumen de la cancha elegida (reemplaza al selector de complejo y cancha) */}
        <Card size="small" style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 16 }}>
            {cancha.complejo}
          </Text>
          <div style={{ margin: "6px 0" }}>
            {cancha.nombre} <Tag color="blue">{cancha.tipo}</Tag>
            {cancha.techada && <Tag color="green">Techada</Tag>}
          </div>
          <Text type="secondary">
            ${Number(cancha.precio_hora).toLocaleString()} por hora · {cancha.direccion}
          </Text>
        </Card>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ nombre_cliente: usuario?.nombre, telefono: usuario?.telefono }}
        >
          <Form.Item label="Nombre y Apellido" name="nombre_cliente" rules={[{ required: true, message: "Ingresá tu nombre" }]}>
            <Input placeholder="Ej: Lucas Martínez" />
          </Form.Item>

          <Form.Item label="Número de Teléfono" name="telefono" rules={[{ required: true, message: "Ingresá tu teléfono" }]}>
            <Input placeholder="Ej: 3534112233" />
          </Form.Item>

          <Form.Item label="Fecha del Partido" name="fecha" rules={[{ required: true, message: "Seleccioná una fecha" }]}>
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Seleccionar fecha"
              disabledDate={(dia) => dia.endOf("day").valueOf() < Date.now()}
            />
          </Form.Item>

          {fecha && !cargandoTurnos && turnos.length === 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Este complejo todavía no cargó horarios para esta cancha."
            />
          )}
          {fecha && !cargandoTurnos && turnos.length > 0 && !hayLibres && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="No quedan turnos libres ese día. Probá con otra fecha."
            />
          )}

          <Form.Item label="Seleccionar Turno Horario" name="turno" rules={[{ required: true, message: "Seleccioná un turno" }]}>
            <Select
              placeholder={fecha ? "Elegir un horario disponible" : "Primero elegí la fecha"}
              disabled={!fecha}
              loading={cargandoTurnos}
              options={opcionesTurno}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={enviando}>
              Confirmar Reserva
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
