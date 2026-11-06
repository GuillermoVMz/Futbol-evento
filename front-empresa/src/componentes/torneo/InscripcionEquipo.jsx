import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, ColorPicker, Input, Popconfirm, Progress, Space, Typography, message } from "antd";
import { useSesion } from "../../services/session";
import { getMiInscripcion, inscribirMiEquipo, cancelarMiInscripcion } from "../../services/torneoService";
import { colorEquipo } from "./colores";
import { formatearFecha, formatearPlata } from "./utils";

// Tarjeta para que un jugador inscriba su equipo. Se cierra sola cuando el torneo llena el cupo o se sortea.
export default function InscripcionEquipo({ torneo, cantidad, onCambio }) {
  const { rol } = useSesion();
  const navigate = useNavigate();
  const [miEquipo, setMiEquipo] = useState(null);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(null); // null = se usa un color automático según el nombre
  const [enviando, setEnviando] = useState(false);

  const cupo = torneo.cupo_maximo;
  const llena = cupo != null && cantidad >= cupo;
  const vencida = Boolean(torneo.fecha_vencida); // pasó el día del torneo
  const enInscripcion = torneo.estado === "inscripcion";

  useEffect(() => {
    if (rol !== "usuario") {
      setMiEquipo(null);
      return;
    }
    getMiInscripcion(torneo.id_torneo)
      .then((r) => setMiEquipo(r.equipo))
      .catch(() => setMiEquipo(null));
  }, [rol, torneo.id_torneo]);

  const inscribir = async () => {
    if (!nombre.trim()) return message.warning("Ingresá el nombre de tu equipo");
    setEnviando(true);
    try {
      const equipo = await inscribirMiEquipo(torneo.id_torneo, nombre.trim(), color);
      setMiEquipo({ id_equipo: equipo.id_equipo, nombre: equipo.nombre, precio: equipo.precio, estado_pago: equipo.estado_pago });
      setNombre("");
      setColor(null);
      message.success("¡Equipo inscripto!");
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo completar la inscripción");
    } finally {
      setEnviando(false);
      onCambio(); // actualiza el cupo (también si alguien se llevó el último lugar)
    }
  };

  const cancelar = async () => {
    try {
      await cancelarMiInscripcion(torneo.id_torneo);
      setMiEquipo(null);
      message.success("Inscripción cancelada");
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo cancelar la inscripción");
    } finally {
      onCambio();
    }
  };

  // Torneo ya sorteado: solo se informa si tu equipo participa
  if (!enInscripcion) {
    return miEquipo ? (
      <Alert type="info" showIcon style={{ marginBottom: 20 }} message={`Tu equipo «${miEquipo.nombre}» participa en este torneo`} />
    ) : null;
  }

  return (
    <Card title="Inscripción de equipos" style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong style={{ display: "block", fontSize: 16 }}>
          Inscripción: {formatearPlata(torneo.precio_inscripcion)}
          {Number(torneo.precio_inscripcion) > 0 ? " por equipo" : ""}
        </Typography.Text>
        {torneo.fecha_evento && (
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
            Podés inscribirte hasta el día del torneo ({formatearFecha(torneo.fecha_evento)}), si quedan cupos.
          </Typography.Text>
        )}
        {cupo != null ? (
          <>
            <Typography.Text strong>
              {cantidad} de {cupo} equipos inscriptos
            </Typography.Text>
            <Progress
              percent={Math.round((cantidad / cupo) * 100)}
              showInfo={false}
              status={llena ? "exception" : "active"}
            />
          </>
        ) : (
          <Typography.Text strong>{cantidad} equipo(s) inscriptos (sin límite de cupo)</Typography.Text>
        )}
      </div>

      {rol === "empresa" ? (
        <Typography.Text type="secondary">
          Las cuentas de complejo cargan y gestionan los equipos desde el Panel.
        </Typography.Text>
      ) : miEquipo ? (
        <Alert
          type={miEquipo.estado_pago === "pagado" ? "success" : "warning"}
          showIcon
          message={`Tu equipo «${miEquipo.nombre}» está inscripto`}
          description={
            miEquipo.estado_pago === "pagado"
              ? "Tu pago está confirmado."
              : Number(miEquipo.precio) > 0
                ? `Pago pendiente: ${formatearPlata(miEquipo.precio)}. El organizador te va a contactar al teléfono de tu cuenta para coordinar el pago.`
                : "Esta inscripción es gratuita."
          }
          action={
            miEquipo.estado_pago === "pagado" ? undefined : (
              <Popconfirm title="¿Cancelar la inscripción de tu equipo?" okText="Sí, cancelar" cancelText="No" onConfirm={cancelar}>
                <Button size="small" danger>
                  Cancelar inscripción
                </Button>
              </Popconfirm>
            )
          }
        />
      ) : llena ? (
        <Alert type="warning" showIcon message="Cupos llenos: las inscripciones de este torneo están cerradas." />
      ) : vencida ? (
        <Alert
          type="warning"
          showIcon
          message={`Inscripciones cerradas: el torneo era el ${formatearFecha(torneo.fecha_evento)}.`}
        />
      ) : rol === "usuario" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 460 }}>
          <Space.Compact style={{ display: "flex" }}>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onPressEnter={inscribir}
              placeholder="Nombre de tu equipo"
              maxLength={100}
            />
            <Button type="primary" onClick={inscribir} loading={enviando}>
              Inscribir mi equipo
            </Button>
          </Space.Compact>
          <Space wrap align="center" style={{ justifyContent: "center" }}>
            <Typography.Text type="secondary">Color de tu equipo (se ve en las llaves):</Typography.Text>
            <ColorPicker
              disabledAlpha
              value={colorEquipo(nombre || "equipo", color)}
              onChange={(c) => setColor(c.toHexString())}
            />
          </Space>
        </div>
      ) : (
        <Space wrap>
          <Button
            type="primary"
            onClick={() => navigate("/login", { state: { from: `/torneos/${torneo.id_torneo}` } })}
          >
            Ingresá para inscribir tu equipo
          </Button>
          <Typography.Text type="secondary">¿No tenés cuenta?</Typography.Text>
          <Button type="link" style={{ padding: 0 }} onClick={() => navigate("/registro")}>
            Registrate
          </Button>
        </Space>
      )}
    </Card>
  );
}
