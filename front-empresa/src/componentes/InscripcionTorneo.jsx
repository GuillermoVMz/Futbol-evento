import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, DatePicker, Select, Button, Card, message } from 'antd';

export default function InscripcionTorneo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const onFinish = (valores) => {
    console.log("Datos de inscripción:", { torneoId: id, ...valores });
    message.success("Inscripción simulada con éxito");
    // Más adelante, aquí harás el fetch/axios hacia el backend
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        Volver a Eventos
      </Button>

      <Card title={`Inscripción al Torneo #${id}`}>
        <Form layout="vertical" onFinish={onFinish}>
          
          <Form.Item 
            label="Nombre del Equipo" 
            name="nombre_equipo" 
            rules={[{ required: true, message: 'Ingresá el nombre del equipo' }]}
          >
            <Input placeholder="Ej: Los Pumas F5" />
          </Form.Item>

          <Form.Item 
            label="Integrantes (Nombre y Apellido)" 
            name="integrantes" 
            rules={[{ required: true, message: 'Detallá los integrantes' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="1. Juan Pérez&#10;2. Martín Gómez..." 
            />
          </Form.Item>

          <Form.Item 
            label="Precio de Inscripción ($)" 
            name="precio" 
            rules={[{ required: true, message: 'Ingresá el precio' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="Ej: 5000" />
          </Form.Item>

          <Form.Item 
            label="Fecha de Inscripción" 
            name="fecha_inscripcion" 
            rules={[{ required: true, message: 'Seleccioná la fecha' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Seleccionar fecha" />
          </Form.Item>

          <Form.Item 
            label="Estado de Pago" 
            name="estado_pago" 
            rules={[{ required: true, message: 'Seleccioná el estado' }]}
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
