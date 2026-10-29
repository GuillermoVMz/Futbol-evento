import React, { useEffect, useState } from "react";
import { Alert, Button, Divider, Form, Input, InputNumber, Modal, DatePicker, TimePicker, Popconfirm, Space, Tag, Typography, message } from "antd";
import dayjs from "dayjs";
import {
  getTorneo, actualizarTorneo, inscribirEquipo, quitarEquipo, sortearTorneo, generarLlaves, reiniciarTorneo, guardarResultado,
} from "../../services/torneoService";
import ContenidoTorneo from "../torneo/ContenidoTorneo";
import CampoImagen from "./CampoImagen";
import { FORMATOS, ESTADOS, hhmm } from "../torneo/utils";

// ---------- Resultado (o fecha y hora) de un partido ----------
function ModalResultado({ partido, onCerrar, onGuardado }) {
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);
  const gl = Form.useWatch("goles_local", form);
  const gv = Form.useWatch("goles_visitante", form);
  const pideP = partido.fase === "eliminatoria" && gl != null && gv != null && gl === gv;

  const guardar = async (v) => {
    const datos = {
      fecha: v.fecha ? v.fecha.format("YYYY-MM-DD") : undefined,
      horario: v.horario ? v.horario.format("HH:mm") : undefined,
    };
    if (v.goles_local != null || v.goles_visitante != null) {
      datos.goles_local = v.goles_local;
      datos.goles_visitante = v.goles_visitante;
      if (pideP) {
        datos.penales_local = v.penales_local;
        datos.penales_visitante = v.penales_visitante;
      }
    }
    setGuardando(true);
    try {
      await guardarResultado(partido.id_partido, datos);
      message.success("Guardado");
      onGuardado();
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open
      title={`${partido.equipo_local ?? "?"} vs ${partido.equipo_visitante ?? "?"}`}
      okText="Guardar"
      cancelText="Cancelar"
      confirmLoading={guardando}
      onOk={() => form.submit()}
      onCancel={onCerrar}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={guardar}
        initialValues={{
          goles_local: partido.jugado ? partido.goles_local : undefined,
          goles_visitante: partido.jugado ? partido.goles_visitante : undefined,
          penales_local: partido.penales_local ?? undefined,
          penales_visitante: partido.penales_visitante ?? undefined,
          fecha: partido.fecha ? dayjs(partido.fecha) : undefined,
          horario: partido.horario ? dayjs(`2000-01-01T${hhmm(partido.horario)}`) : undefined,
        }}
      >
        <Space size="large" align="start">
          <Form.Item name="goles_local" label={`Goles ${partido.equipo_local}`}>
            <InputNumber min={0} precision={0} />
          </Form.Item>
          <Form.Item name="goles_visitante" label={`Goles ${partido.equipo_visitante}`}>
            <InputNumber min={0} precision={0} />
          </Form.Item>
        </Space>

        {pideP && (
          <>
            <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="Empate en llaves: cargá los penales" />
            <Space size="large" align="start">
              <Form.Item name="penales_local" label={`Penales ${partido.equipo_local}`} rules={[{ required: true }]}>
                <InputNumber min={0} precision={0} />
              </Form.Item>
              <Form.Item name="penales_visitante" label={`Penales ${partido.equipo_visitante}`} rules={[{ required: true }]}>
                <InputNumber min={0} precision={0} />
              </Form.Item>
            </Space>
          </>
        )}

        <Divider style={{ margin: "8px 0 16px" }} />
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          Fecha y hora (opcional). Dejá los goles vacíos si solo querés programar el partido.
        </Typography.Text>
        <Space>
          <Form.Item name="fecha" style={{ marginBottom: 0 }}>
            <DatePicker format="DD/MM/YYYY" placeholder="Fecha" />
          </Form.Item>
          <Form.Item name="horario" style={{ marginBottom: 0 }}>
            <TimePicker format="HH:mm" minuteStep={15} placeholder="Hora" />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}

// ---------- Imagen de portada del torneo ----------
function SeccionImagen({ id, inicial, onGuardado }) {
  const [imagen, setImagen] = useState(inicial ?? "");
  const [guardando, setGuardando] = useState(false);
  const hayCambios = (imagen || null) !== (inicial || null);

  const guardar = async () => {
    setGuardando(true);
    try {
      await actualizarTorneo(id, { imagen_url: imagen || null });
      message.success("Imagen guardada");
      onGuardado();
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo guardar la imagen");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
        Se muestra en la tarjeta del torneo y como fondo al abrirlo.
      </Typography.Text>
      <CampoImagen value={imagen} onChange={setImagen} />
      <Button type="primary" style={{ marginTop: 8 }} onClick={guardar} loading={guardando} disabled={!hayCambios}>
        Guardar imagen
      </Button>
    </>
  );
}

// ---------- Gestión completa de un torneo ----------
export default function GestionTorneo({ id }) {
  const [datos, setDatos] = useState(null);
  const [nombre, setNombre] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [partido, setPartido] = useState(null);

  const recargar = async () => {
    try {
      setDatos(await getTorneo(id));
    } catch {
      message.error("No se pudo cargar el torneo");
    }
  };

  useEffect(() => {
    recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Ejecuta una acción, avisa el resultado y recarga. Devuelve true si salió bien.
  const ejecutar = async (accion, exito) => {
    setTrabajando(true);
    try {
      await accion();
      if (exito) message.success(exito);
      await recargar();
      return true;
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo completar la acción");
      return false;
    } finally {
      setTrabajando(false);
    }
  };

  if (!datos) return null;

  const { torneo, equipos, grupos, llaves } = datos;
  const enInscripcion = torneo.estado === "inscripcion";
  const pendientesGrupos = grupos.flatMap((g) => g.partidos).filter((p) => !p.jugado).length;
  const puedeGenerarLlaves = torneo.formato === "grupos" && torneo.estado === "en_curso" && llaves.length === 0;

  const inscribir = async () => {
    if (!nombre.trim()) return;
    if (await ejecutar(() => inscribirEquipo(id, nombre.trim()), "Equipo inscripto")) setNombre("");
  };

  const abrirPartido = (p) => {
    // Las llaves con equipos sin definir todavía no admiten resultado
    if (p.id_equipo_local == null || p.id_equipo_visitante == null) {
      message.info("Todavía no están definidos los dos equipos de este cruce");
      return;
    }
    setPartido(p);
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Tag color={ESTADOS[torneo.estado]?.color}>{ESTADOS[torneo.estado]?.texto}</Tag>
        <Tag>{FORMATOS[torneo.formato]}</Tag>
        {torneo.formato === "grupos" && (
          <Tag>
            {torneo.cantidad_grupos} grupo(s) · clasifican {torneo.clasifican_por_grupo} por grupo
          </Tag>
        )}
      </div>

      <Divider orientation="left">Imagen del torneo</Divider>
      <SeccionImagen id={id} inicial={torneo.imagen_url} onGuardado={recargar} />

      <Divider orientation="left">Equipos inscriptos ({equipos.length})</Divider>
      <Space wrap style={{ marginBottom: 12 }}>
        {equipos.map((e) =>
          enInscripcion ? (
            <Popconfirm key={e.id_equipo} title={`¿Quitar a ${e.nombre}?`} okText="Quitar" cancelText="No"
              onConfirm={() => ejecutar(() => quitarEquipo(id, e.id_equipo))}>
              <Tag closable onClose={(ev) => ev.preventDefault()}>{e.nombre}</Tag>
            </Popconfirm>
          ) : (
            <Tag key={e.id_equipo}>{e.grupo ? `${e.nombre} (Grupo ${e.grupo})` : e.nombre}</Tag>
          ),
        )}
      </Space>

      {enInscripcion && (
        <Space.Compact style={{ display: "flex", maxWidth: 420, marginBottom: 12 }}>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} onPressEnter={inscribir}
            placeholder="Nombre del equipo" maxLength={100} />
          <Button type="primary" onClick={inscribir} loading={trabajando}>Inscribir</Button>
        </Space.Compact>
      )}

      <Space wrap style={{ marginBottom: 8 }}>
        {enInscripcion && (
          <Popconfirm
            title="¿Sortear ahora?"
            description="Después del sorteo no se pueden agregar ni quitar equipos."
            okText="Sortear" cancelText="No"
            onConfirm={() => ejecutar(() => sortearTorneo(id), "Sorteo realizado")}
          >
            <Button type="primary" loading={trabajando} disabled={equipos.length < 2}>
              Sortear y generar fixture
            </Button>
          </Popconfirm>
        )}
        {puedeGenerarLlaves && (
          <Button type="primary" loading={trabajando} disabled={pendientesGrupos > 0}
            onClick={() => ejecutar(() => generarLlaves(id), "Llaves generadas")}>
            Generar llaves
          </Button>
        )}
        {!enInscripcion && (
          <Popconfirm
            title="¿Reiniciar el torneo?"
            description="Se borran el sorteo y TODOS los resultados cargados."
            okText="Reiniciar" okButtonProps={{ danger: true }} cancelText="No"
            onConfirm={() => ejecutar(() => reiniciarTorneo(id), "Torneo reiniciado")}
          >
            <Button danger loading={trabajando}>Reiniciar sorteo</Button>
          </Popconfirm>
        )}
      </Space>
      {puedeGenerarLlaves && pendientesGrupos > 0 && (
        <Typography.Text type="secondary" style={{ display: "block" }}>
          Faltan cargar {pendientesGrupos} resultado(s) de la fase de grupos para generar las llaves.
        </Typography.Text>
      )}

      <Divider orientation="left">{enInscripcion ? "Vista previa" : "Resultados y cruces"}</Divider>
      {!enInscripcion && (
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          Tocá un partido para cargar o corregir el resultado. En las llaves, el ganador avanza solo.
        </Typography.Text>
      )}
      <ContenidoTorneo datos={datos} onPartido={abrirPartido} />

      {partido && (
        <ModalResultado
          key={partido.id_partido}
          partido={partido}
          onCerrar={() => setPartido(null)}
          onGuardado={() => {
            setPartido(null);
            recargar();
          }}
        />
      )}
    </div>
  );
}
