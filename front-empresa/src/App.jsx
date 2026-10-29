import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Layout,
  Menu,
  ConfigProvider,
  theme,
  Switch,
  Typography,
  Button,
  message,
} from "antd";
import {
  TrophyOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  DashboardOutlined,
  BulbOutlined,
  BulbFilled,
  LogoutOutlined,
  LoginOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

import EventosFutbol from "./componentes/EventosFutbol";
import ListadoEmpresa from "./componentes/ListadoEmpresa";
import InscripcionTorneo from "./componentes/InscripcionTorneo";
import ReservaCancha from "./componentes/ReservaCancha";
import BuscoJugadores from "./componentes/BuscoJugadores";
import AdminDashboard from "./componentes/AdminDashboard";
import MisReservas from "./componentes/MisReservas";
import Login from "./componentes/Login";
import Registro from "./componentes/Registro";
import DetalleTorneo from "./componentes/DetalleTorneo";
import RutaProtegida from "./componentes/RutaProtegida";
import { useSesion, cerrarSesion } from "./services/session";

const { Header, Content, Footer } = Layout;

function HeaderUsuario() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { usuario } = useSesion();
  const [saliendo, setSaliendo] = useState(false);

  // Primero se vuelve al inicio y recién ahí se cierra la sesión. Si se cerrara antes, una pantalla
  // protegida (como el Panel) te mandaría al login en el medio y parecería que "Salir" no funciona.
  useEffect(() => {
    if (saliendo && pathname === "/") {
      cerrarSesion();
      setSaliendo(false);
      message.success("Sesión cerrada");
    }
  }, [saliendo, pathname]);

  const salir = () => {
    setSaliendo(true);
    navigate("/");
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {usuario ? (
        <>
          <Typography.Text
            type="secondary"
            style={{ fontSize: "13px", fontWeight: 500 }}
          >
            {usuario.nombre || usuario.email}
          </Typography.Text>
          <Button
            type="text"
            danger
            size="small"
            icon={<LogoutOutlined />}
            onClick={salir}
          >
            Salir
          </Button>
        </>
      ) : (
        <>
          <Link to="/login">
            <Button type="default" size="small" icon={<LoginOutlined />}>
              Ingresar
            </Button>
          </Link>
          <Link to="/registro">
            <Button type="primary" size="small" icon={<UserAddOutlined />}>
              Registrarme
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}

// El menú depende de quién inició sesión: el público no ve "Admin" ni "Panel"
function NavMenu() {
  const { rol } = useSesion();
  const { pathname } = useLocation();

  const items = [
    { key: "/", icon: <TrophyOutlined />, label: <Link to="/">Eventos</Link> },
    { key: "/empresas", icon: <ShopOutlined />, label: <Link to="/empresas">Canchas</Link> },
    { key: "/busco-jugadores", icon: <TeamOutlined />, label: <Link to="/busco-jugadores">Busco Jugadores</Link> },
    ...(rol === "usuario"
      ? [{ key: "/mis-reservas", icon: <UserOutlined />, label: <Link to="/mis-reservas">Mis Reservas</Link> }]
      : []),
    ...(rol === "empresa"
      ? [{ key: "/admin", icon: <DashboardOutlined />, label: <Link to="/admin">Panel</Link> }]
      : []),
  ];

  // Qué opción se resalta según la ruta actual
  const seccion = pathname.startsWith("/reservar")
    ? "/empresas"
    : pathname.startsWith("/eventos") || pathname.startsWith("/torneos")
      ? "/"
      : pathname;
  const seleccionada = items.find((i) =>
    i.key === "/" ? seccion === "/" : seccion.startsWith(i.key),
  )?.key;

  return (
    <Menu
      mode="horizontal"
      selectedKeys={seleccionada ? [seleccionada] : []}
      items={items}
      style={{
        flex: 1,
        borderBottom: "none",
        background: "transparent",
        fontWeight: 500,
      }}
    />
  );
}

function PieDePagina({ isDarkMode }) {
  const { rol } = useSesion();
  return (
    <Footer
      style={{
        textAlign: "center",
        fontSize: "13px",
        color: "#94a3b8",
        borderTop: isDarkMode ? "1px solid #1e293b" : "1px solid #f1f5f9",
      }}
    >
      Manager Deportivo — Villa María
      {rol !== "empresa" && (
        <div style={{ marginTop: 4 }}>
          <Link to="/admin/login" style={{ fontSize: 12, color: "#94a3b8" }}>
            Acceso para complejos y organizadores
          </Link>
        </div>
      )}
    </Footer>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#059669", // Verde esmeralda sobrio
          colorBgBase: isDarkMode ? "#0f172a" : "#fafafa",
          colorBgContainer: isDarkMode ? "#1e293b" : "#ffffff",
          colorBorder: isDarkMode ? "#334155" : "#e2e8f0",
          colorBorderSecondary: isDarkMode ? "#1e293b" : "#f1f5f9",
          colorText: isDarkMode ? "#f8fafc" : "#0f172a",
          colorTextHeading: isDarkMode ? "#f8fafc" : "#0f172a",
          borderRadius: 8,
          fontFamily: "'Inter', system-ui, sans-serif",
        },
        components: {
          Layout: {
            headerBg: isDarkMode ? "#0f172a" : "#ffffff",
            bodyBg: isDarkMode ? "#0f172a" : "#fafafa",
          },
          Menu: {
            activeBarHeight: 2,
            itemColor: isDarkMode ? "#94a3b8" : "#64748b",
            itemSelectedColor: "#059669",
            horizontalItemSelectedColor: "#059669",
          },
          Card: {
            boxShadowSecondary: "none",
          },
        },
      }}
    >
      <BrowserRouter>
        <Layout style={{ minHeight: "100vh" }}>
          {/* Header Minimalista */}
          <Header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 32px",
              borderBottom: isDarkMode
                ? "1px solid #1e293b"
                : "1px solid #e2e8f0",
              position: "sticky",
              top: 0,
              zIndex: 1000,
              height: "64px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "32px",
                flex: 1,
              }}
            >
              <Typography.Text
                strong
                style={{
                  fontSize: "16px",
                  letterSpacing: "-0.3px",
                  color: isDarkMode ? "#f8fafc" : "#0f172a",
                }}
              >
                MANAGER DEPORTIVO
              </Typography.Text>

              <NavMenu />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <HeaderUsuario />
              <Switch
                size="small"
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<BulbOutlined />}
                checked={isDarkMode}
                onChange={(checked) => setIsDarkMode(checked)}
              />
            </div>
          </Header>

          {/* Contenido */}
          <Content
            style={{
              padding: "32px 24px",
              margin: "0 auto",
              width: "100%",
              maxWidth: "1100px",
            }}
          >
            <Routes>
              {/* Público */}
              <Route path="/" element={<EventosFutbol />} />
              <Route path="/torneos" element={<Navigate to="/" replace />} />
              <Route path="/torneos/:id" element={<DetalleTorneo />} />
              <Route path="/empresas" element={<ListadoEmpresa />} />
              <Route path="/busco-jugadores" element={<BuscoJugadores />} />
              <Route
                path="/eventos/torneo/:id"
                element={<InscripcionTorneo />}
              />

              {/* Jugadores */}
              <Route path="/login" element={<Login tipo="usuario" />} />
              <Route path="/registro" element={<Registro tipo="usuario" />} />
              <Route
                path="/reservar/cancha/:id"
                element={
                  <RutaProtegida rol="usuario">
                    <ReservaCancha />
                  </RutaProtegida>
                }
              />
              <Route
                path="/mis-reservas"
                element={
                  <RutaProtegida rol="usuario">
                    <MisReservas />
                  </RutaProtegida>
                }
              />

              {/* Dueños de complejos / organizadores */}
              <Route path="/admin/login" element={<Login tipo="empresa" />} />
              <Route path="/admin/registro" element={<Registro tipo="empresa" />} />
              <Route
                path="/admin"
                element={
                  <RutaProtegida rol="empresa">
                    <AdminDashboard />
                  </RutaProtegida>
                }
              />
            </Routes>
          </Content>

          <PieDePagina isDarkMode={isDarkMode} />
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
