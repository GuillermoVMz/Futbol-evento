import React, { useEffect, useState } from "react";
import { Alert, Button, ColorPicker, Divider, Form, Input, InputNumber, Modal, DatePicker, TimePicker, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import dayjs from "dayjs";
import {
  getTorneo, getInscriptos, actualizarTorneo, cambiarPago, inscribirEquipo, quitarEquipo, sortearTorneo, generarLlaves, reiniciarTorneo, guardarResultado,
} from "../../services/torneoService";
import ContenidoTorneo from "../torneo/ContenidoTorneo";
import CampoImagen from "./CampoImagen";
import { colorEquipo } from "../torneo/colores";
import { FORMATOS, estadoVisible, hhmm, formatearPlata } from "../torneo/utils";

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
        <Space size="large" align="start" wrap>
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
            <Space size="large" align="start" wrap>
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

// ---------- Inscripción: cupo, precio y fecha (solo antes del sorteo) ----------
function SeccionInscripcion({ id, torneo, minimo, onGuardado }) {
  const [cupo, setCupo] = useState(torneo.cupo_maximo ?? null);
  const [precio, setPrecio] = useState(torneo.precio_inscripcion ?? 0);
  const [fecha, setFecha] = useState(torneo.fecha_evento ? dayjs(torneo.fecha_evento) : null);
  const [guardando, setGuardando] = useState(false);

  const fechaTexto = fecha ? fecha.format("YYYY-MM-DD") : null;
  const hayCambios =
    (cupo != null && cupo !== torneo.cupo_maximo) ||
    (precio != null && precio !== (torneo.precio_inscripcion ?? 0)) ||
    (fechaTexto != null && fechaTexto !== torneo.fecha_evento);

  const guardar = async () => {
    // Solo se envía lo que cambió
    const cambios = {};
    if (cupo != null && cupo !== torneo.cupo_maximo) cambios.cupo_maximo = cupo;
    if (precio != null && precio !== (torneo.precio_inscripcion ?? 0)) cambios.precio_inscripcion = precio;
    if (fechaTexto != null && fechaTexto !== torneo.fecha_evento) cambios.fecha_evento = fechaTexto;

    setGuardando(true);
    try {
      await actualizarTorneo(id, cambios);
      message.success("Inscripción actualizada");
      onGuardado();
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudieron guardar los cambios");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Space wrap align="end" size="large">
      <div>
        <div>Cupo máximo</div>
        <InputNumber min={Math.max(2, minimo)} max={32} precision={0} value={cupo} onChange={setCupo} placeholder="Sin límite" />
      </div>
      <div>
        <div>Precio por equipo ($)</div>
        <InputNumber min={0} precision={0} step={1000} value={precio} onChange={setPrecio} />
      </div>
      <div>
        <div>Fecha del torneo</div>
        <DatePicker
          format="DD/MM/YYYY"
          value={fecha}
          onChange={setFecha}
          allowClear={false}
          disabledDate={(d) => d.endOf("day").valueOf() < Date.now()}
        />
      </div>
      <Button type="primary" onClick={guardar} loading={guardando} disabled={!hayCambios}>
        Guardar
      </Button>
      <Typography.Text type="secondary" style={{ maxWidth: 360 }}>
        Al llenarse el cupo o pasar la fecha, las inscripciones se cierran solas. Un cambio de precio no afecta a los equipos que ya se inscribieron.
      </Typography.Text>
    </Space>
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
  const [inscriptos, setInscriptos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [colorNuevo, setColorNuevo] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [partido, setPartido] = useState(null);

  const recargar = async () => {
    try {
      const [torneo, lista] = await Promise.all([getTorneo(id), getInscriptos(id)]);
      setDatos(torneo);
      setInscriptos(lista);
    } catch (err) {
      message.error(err.response?.data?.mensaje || "No se pudo cargar el torneo");
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
  const totalEsperado = inscriptos.reduce((suma, i) => suma + Number(i.precio || 0), 0);
  const totalCobrado = inscriptos.filter((i) => i.estado_pago === "pagado").reduce((suma, i) => suma + Number(i.precio || 0), 0);
  const cantidadPagos = inscriptos.filter((i) => i.estado_pago === "pagado").length;
  const pendientesGrupos = grupos.flatMap((g) => g.partidos).filter((p) => !p.jugado).length;
  const puedeGenerarLlaves = torneo.formato === "grupos" && torneo.estado === "en_curso" && llaves.length === 0;

  const inscribir = async () => {
    if (!nombre.trim()) return;
    if (await ejecutar(() => inscribirEquipo(id, nombre.trim(), colorNuevo), "Equipo inscripto")) {
      setNombre("");
      setColorNuevo(null);
    }
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
        <Tag color={estadoVisible(torneo, equipos.length).color}>{estadoVisible(torneo, equipos.length).texto}</Tag>
        <Tag>{FORMATOS[torneo.formato]}</Tag>
        {torneo.formato === "grupos" && (
          <Tag>
            {torneo.cantidad_grupos} grupo(s) · clasifican {torneo.clasifican_por_grupo} por grupo
          </Tag>
        )}
      </div>

      <Divider orientation="left">Imagen del torneo</Divider>
      <SeccionImagen id={id} inicial={torneo.imagen_url} onGuardado={recargar} />

      {enInscripcion && (
        <>
          <Divider orientation="left">Inscripción: cupo, precio y fecha</Divider>
          <SeccionInscripcion id={id} torneo={torneo} minimo={equipos.length} onGuardado={recargar} />
        </>
      )}

      <Divider orientation="left">
        Equipos inscriptos ({equipos.length}
        {torneo.cupo_maximo != null ? `/${torneo.cupo_maximo}` : ""})
      </Divider>

      {totalEsperado > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={`Cobrado: ${formatearPlata(totalCobrado)} de ${formatearPlata(totalEsperado)} (${cantidadPagos} de ${inscriptos.length} equipos pagaron)`}
          description="Marcá «Pagado» recién cuando recibas el dinero: los jugadores no pueden marcarlo ellos."
        />
      )}

      <Table
        size="small"
        pagination={false}
        rowKey="id_equipo"
        dataSource={inscriptos}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Todavía no hay equipos inscriptos" }}
        style={{ marginBottom: 12 }}
        columns={[
          {
            title: "Equipo",
            dataIndex: "nombre",
            render: (n, e) => (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: colorEquipo(n, e.color) }} />
                {e.grupo ? `${n} (Grupo ${e.grupo})` : n}
              </span>
            ),
          },
          {
            title: "Inscripto por",
            dataIndex: "contacto",
            render: (c) => c ?? <Typography.Text type="secondary">Cargado por el organizador</Typography.Text>,
          },
          {
            title: "Cobro",
            render: (_, e) => (
              <Space size={4} wrap>
                <Tag color={e.estado_pago === "pagado" ? "green" : "orange"}>
                  {e.estado_pago === "pagado" ? "Pagado" : "Pendiente"}
                </Tag>
                <span>{formatearPlata(e.precio)}</span>
                {Number(e.precio) > 0 && (
                  <Button
                    size="small"
                    type={e.estado_pago === "pagado" ? "default" : "primary"}
                    onClick={() =>
                      ejecutar(
                        () => cambiarPago(id, e.id_equipo, e.estado_pago === "pagado" ? "pendiente" : "pagado"),
                        e.estado_pago === "pagado" ? "Marcado como pendiente" : "Pago confirmado",
                      )
                    }
                  >
                    {e.estado_pago === "pagado" ? "Deshacer" : "Marcar pagado"}
                  </Button>
                )}
              </Space>
            ),
          },
          { title: "Teléfono", dataIndex: "telefono", render: (t) => t ?? "—" },
          { title: "Email", dataIndex: "email", render: (e) => e ?? "—" },
          ...(enInscripcion
            ? [
                {
                  title: "",
                  render: (_, e) => (
                    <Popconfirm
                      title={`¿Quitar a ${e.nombre}?`}
                      okText="Quitar"
                      cancelText="No"
                      onConfirm={() => ejecutar(() => quitarEquipo(id, e.id_equipo))}
                    >
                      <Button size="small" danger>
                        Quitar
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]
            : []),
        ]}
      />

      {enInscripcion && (
        <Space wrap align="center" style={{ marginBottom: 12 }}>
        <Space.Compact style={{ display: "flex", maxWidth: 460 }}>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onPressEnter={inscribir}
            placeholder={
              torneo.cupo_maximo != null && equipos.length >= torneo.cupo_maximo
                ? "Cupos llenos"
                : "Cargar un equipo a mano (nombre)"
            }
            maxLength={100}
            disabled={torneo.cupo_maximo != null && equipos.length >= torneo.cupo_maximo}
          />
          <Button
            type="primary"
            onClick={inscribir}
            loading={trabajando}
            disabled={torneo.cupo_maximo != null && equipos.length >= torneo.cupo_maximo}
          >
            Inscribir
          </Button>
        </Space.Compact>
        <ColorPicker
          disabledAlpha
          value={colorEquipo(nombre || "equipo", colorNuevo)}
          onChange={(c) => setColorNuevo(c.toHexString())}
        />
        </Space>
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
      {torneo.estado === "en_curso" && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            torneo.formato === "grupos" && llaves.length === 0
              ? "Paso actual: cargar los resultados de la fase de grupos"
              : "Paso actual: cargar los resultados de las llaves"
          }
          description={
            torneo.formato === "grupos" && llaves.length === 0
              ? "Tocá cada partido de los grupos para cargar el resultado. Cuando estén todos, apretá «Generar llaves»: los clasificados pasan solos al cuadro."
              : "Tocá un cruce del cuadro para cargar el resultado. El ganador avanza solo a la ronda siguiente."
          }
        />
      )}
      <ContenidoTorneo datos={datos} onPartido={abrirPartido} mostrarEquipos={false} />

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
