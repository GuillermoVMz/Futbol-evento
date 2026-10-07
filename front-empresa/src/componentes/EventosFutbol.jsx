import { useState, useEffect } from "react";
import { List, Card, Button, Typography, Tag, Spin, message } from "antd";
import { getEventos } from "../services/eventoService";

const { Title } = Typography;

export default function EventosFutbol() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const datos = await getEventos();
        setEventos(datos);
      } catch (error) {
        message.error("No se pudieron cargar los eventos de la base de datos");
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Próximos Partidos y Torneos F5/F7</Title>
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
        dataSource={eventos}
        renderItem={(item) => (
          <List.Item>
            <Card
              title={item.titulo}
              extra={
                <Tag color={item.modalidad === "F5" ? "blue" : "green"}>
                  {item.modalidad}
                </Tag>
              }
              hoverable
            >
              <p>
                <strong>Ubicación:</strong> {item.lugar}
              </p>
              <p>
                <strong>Horario:</strong>{" "}
                {new Date(item.fecha).toLocaleString()}
              </p>
              <p>
                <strong>Estado:</strong>{" "}
                <Tag
                  color={
                    item.estado === "Inscripciones Abiertas" ? "gold" : "red"
                  }
                >
                  {item.estado}
                </Tag>
              </p>
              <Button
                type="primary"
                style={{ marginTop: "10px", width: "100%" }}
              >
                Ver Detalles
              </Button>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
