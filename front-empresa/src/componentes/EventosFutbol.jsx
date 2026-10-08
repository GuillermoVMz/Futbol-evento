import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col } from 'antd';

export default function EventosFutbol() {
  const navigate = useNavigate();

  // Datos de ejemplo para que puedas ver el diseño de inmediato
  const torneos = [
    { id: 1, nombre: "Torneo Relámpago F5", lugar: "Complejo La Cancha" },
    { id: 2, nombre: "Liga Nocturna F7", lugar: "Predio El Golazo" }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Próximos Partidos y Torneos F5/F7</h2>
      <Row gutter={[16, 16]}>
        {torneos.map(torneo => (
          <Col xs={24} sm={12} md={8} key={torneo.id}>
            <Card title={torneo.nombre} hoverable>
              <p><strong>Lugar:</strong> {torneo.lugar}</p>
              <Button 
                type="primary" 
                onClick={() => navigate(`/eventos/torneo/${torneo.id}`)}
                style={{ marginTop: '10px' }}
              >
                Ver e Inscribirse
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

