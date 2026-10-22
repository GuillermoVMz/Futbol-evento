import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, Alert, message } from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUsuario, loginEmpresa } from "../services/authService";
import { guardarSesion } from "../services/session";

const { Title, Text } = Typography;

// tipo="usuario": jugadores (/login)  |  tipo="empresa": dueños y organizadores (/admin/login)
export default function Login({ tipo = "usuario" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const esEmpresa = tipo === "empresa";

  const handleSubmit = async (values) => {
    setLoading(true);
    setError("");
    try {
      const peticion = esEmpresa ? loginEmpresa : loginUsuario;
      const { data } = await peticion(values.email, values.password);
      guardarSesion(data);

      message.success("¡Sesión iniciada correctamente!");
      const destinoPorDefecto = esEmpresa ? "/admin" : "/empresas";
      navigate(location.state?.from || destinoPorDefecto, { replace: true });
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "65vh" }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: "#16a34a" }}>
            ⚽ {esEmpresa ? "Acceso para complejos" : "Iniciar Sesión"}
          </Title>
          <Text type="secondary">
            {esEmpresa
              ? "Administrá tus canchas, horarios, reservas y eventos"
              : "Ingresá para reservar canchas y ver tus turnos"}
          </Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[{ required: true, type: "email", message: "Ingresá un email válido" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="usuario@ejemplo.com" size="large" />
          </Form.Item>

          <Form.Item name="password" label="Contraseña" rules={[{ required: true, message: "Ingresá tu contraseña" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<LoginOutlined />}>
            Ingresar
          </Button>
        </Form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text type="secondary">¿No tenés cuenta? </Text>
          <Link to={esEmpresa ? "/admin/registro" : "/registro"}>Registrate</Link>
          <br />
          <Link to={esEmpresa ? "/login" : "/admin/login"} style={{ fontSize: 12 }}>
            {esEmpresa ? "Soy jugador/a" : "Soy dueño de un complejo u organizador"}
          </Link>
        </div>
      </Card>
    </div>
  );
}
