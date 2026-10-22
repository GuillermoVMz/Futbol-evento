import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, Alert, Result, message } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { registrarUsuario, registrarEmpresa } from "../services/authService";
import { guardarSesion } from "../services/session";

const { Title, Text } = Typography;

// tipo="usuario": jugadores (/registro)  |  tipo="empresa": dueños y organizadores (/admin/registro)
export default function Registro({ tipo = "usuario" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const navigate = useNavigate();
  const esEmpresa = tipo === "empresa";

  const handleSubmit = async ({ confirmar, ...datos }) => {
    setLoading(true);
    setError("");
    try {
      const peticion = esEmpresa ? registrarEmpresa : registrarUsuario;
      const { data } = await peticion(datos);

      // Los complejos quedan pendientes de aprobación: no hay sesión hasta que el equipo los habilite
      if (data.pendiente) {
        setSolicitudEnviada(true);
        return;
      }

      guardarSesion(data);
      message.success("¡Cuenta creada correctamente!");
      navigate(esEmpresa ? "/admin" : "/empresas", { replace: true });
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  if (solicitudEnviada) {
    return (
      <Result
        status="success"
        title="¡Solicitud enviada!"
        subTitle="Revisaremos los datos de tu complejo y te avisaremos cuando tu cuenta esté aprobada. Recién ahí vas a poder ingresar al panel."
        extra={
          <Link to="/">
            <Button type="primary">Volver al inicio</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
      <Card style={{ width: 440, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: "#16a34a" }}>
            ⚽ {esEmpresa ? "Registrar mi complejo" : "Crear cuenta"}
          </Title>
          <Text type="secondary">
            {esEmpresa
              ? "Para dueños de canchas y organizadores de eventos. Las cuentas se aprueban manualmente."
              : "Para reservar canchas e inscribirte a eventos"}
          </Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={handleSubmit}>
          {esEmpresa ? (
            <>
              <Form.Item name="nombre_complejo" label="Nombre del complejo / organización" rules={[{ required: true, message: "Ingresá el nombre" }]}>
                <Input placeholder="Ej: Complejo Golazo" />
              </Form.Item>
              <Form.Item name="socios" label="Responsable o socios" rules={[{ required: true, message: "Ingresá el responsable" }]}>
                <Input placeholder="Ej: Juan Pérez, Carlos Gómez" />
              </Form.Item>
              <Form.Item name="direccion" label="Dirección" rules={[{ required: true, message: "Ingresá la dirección" }]}>
                <Input placeholder="Ej: Bulevar España 123, Villa María, Córdoba" />
              </Form.Item>
              <Form.Item name="codigo" label="Código de invitación" extra="Si el equipo te dio uno, ingresalo acá.">
                <Input placeholder="Código de invitación" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="nombre" label="Nombre y Apellido" rules={[{ required: true, message: "Ingresá tu nombre" }]}>
                <Input placeholder="Ej: Lucas Martínez" />
              </Form.Item>
              <Form.Item name="telefono" label="Teléfono" rules={[{ required: true, message: "Ingresá tu teléfono" }]}>
                <Input placeholder="Ej: 3534112233" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[{ required: true, type: "email", message: "Ingresá un email válido" }]}
          >
            <Input placeholder="usuario@ejemplo.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contraseña"
            rules={[{ required: true, min: 6, message: "Mínimo 6 caracteres" }]}
          >
            <Input.Password placeholder="Mínimo 6 caracteres" />
          </Form.Item>

          <Form.Item
            name="confirmar"
            label="Repetir contraseña"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Repetí la contraseña" },
              ({ getFieldValue }) => ({
                validator: (_, v) =>
                  !v || getFieldValue("password") === v
                    ? Promise.resolve()
                    : Promise.reject(new Error("Las contraseñas no coinciden")),
              }),
            ]}
          >
            <Input.Password placeholder="Repetí la contraseña" />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<UserAddOutlined />}>
            Crear cuenta
          </Button>
        </Form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text type="secondary">¿Ya tenés cuenta? </Text>
          <Link to={esEmpresa ? "/admin/login" : "/login"}>Ingresá</Link>
        </div>
      </Card>
    </div>
  );
}
