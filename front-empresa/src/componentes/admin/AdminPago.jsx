import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Alert, Spin, message } from "antd";
import { obtenerDatosPago, guardarDatosPago } from "../../services/adminService";

// Alias argentino: 6 a 20 caracteres con letras, números, puntos o guiones
const ALIAS = /^[A-Za-z0-9.-]{6,20}$/;
const vacio = (v) => !v || !String(v).trim();

export default function AdminPago() {
  const [form] = Form.useForm();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerDatosPago()
      .then((datos) => form.setFieldsValue(datos))
      .catch(() => message.error("No se pudieron cargar los datos de pago"))
      .finally(() => setCargando(false));
  }, [form]);

  const guardar = async (valores) => {
    setGuardando(true);
    try {
      const guardado = await guardarDatosPago(valores);
      form.setFieldsValue(guardado);
      message.success(
        guardado.alias_pago
          ? "Datos de pago guardados"
          : "Listo: ahora solo se aceptan pagos en efectivo",
      );
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudieron guardar los datos");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Spin style={{ display: "block", margin: "40px auto" }} />;

  return (
    <Card style={{ maxWidth: 560 }}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message="Estos datos se muestran a los jugadores cuando eligen pagar por transferencia (al reservar una cancha o inscribirse a tus torneos). Si los dejás vacíos, solo se acepta efectivo."
      />
      <Form form={form} layout="vertical" onFinish={guardar}>
        <Form.Item
          name="alias_pago"
          label="Alias para transferencias"
          dependencies={["titular_pago"]}
          rules={[
            {
              validator: (_, v) =>
                (vacio(v) && vacio(form.getFieldValue("titular_pago"))) || ALIAS.test(String(v ?? "").trim())
                  ? Promise.resolve()
                  : Promise.reject(new Error("6 a 20 caracteres: letras, números, puntos o guiones")),
            },
          ]}
        >
          <Input placeholder="Ej: golazo.futbol" maxLength={20} />
        </Form.Item>

        <Form.Item
          name="titular_pago"
          label="Nombre del titular (como debe figurar en la transferencia)"
          dependencies={["alias_pago"]}
          rules={[
            {
              validator: (_, v) =>
                (vacio(v) && vacio(form.getFieldValue("alias_pago"))) || String(v ?? "").trim().length >= 3
                  ? Promise.resolve()
                  : Promise.reject(new Error("Ingresá el nombre del titular")),
            },
          ]}
        >
          <Input placeholder="Ej: Juan Pérez" maxLength={100} />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={guardando}>
          Guardar
        </Button>
      </Form>
    </Card>
  );
}
