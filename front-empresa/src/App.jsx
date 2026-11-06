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
  Drawer,
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
  MenuOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import EventosFutbol from "./componentes/EventosFutbol";
import ListadoEmpresa from "./componentes/ListadoEmpresa";
import ReservaCancha from "./componentes/ReservaCancha";
import BuscoJugadores from "./componentes/BuscoJugadores";
import AdminDashboard from "./componentes/AdminDashboard";
import MisReservas from "./componentes/MisReservas";
import Login from "./componentes/Login";
import Registro from "./componentes/Registro";
import DetalleTorneo from "./componentes/DetalleTorneo";
import PanelSuperadmin from "./componentes/PanelSuperadmin";
import RutaProtegida from "./componentes/RutaProtegida";
import { useSesion, cerrarSesion } from "./services/session";
import { useEsMovil } from "./hooks/useEsMovil";

const { Header, Content, Footer } = Layout;

function HeaderUsuario({ vertical = false, onNavegar }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { usuario } = useSesion();
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (saliendo && pathname === "/") {
      cerrarSesion();
      setSaliendo(false);
      message.success("Sesión cerrada");
      onNavegar?.();
    }
  }, [saliendo, pathname, onNavegar]);

  const salir = () => {
    setSaliendo(true);
    navigate("/");
  };

  const contenedor = vertical
    ? { display: "flex", flexDirection: "column", gap: "8px" }
    : { display: "flex", alignItems: "center", gap: "12px" };
  const enlace = vertical ? { display: "block" } : undefined;

  return (
    <div style={contenedor}>
      {usuario ? (
        <>
          <Typography.Text
            type="secondary"
            style={{
              fontSize: "13px",
              fontWeight: 500,
              textAlign: vertical ? "left" : undefined,
            }}
          >
            {usuario.nombre || usuario.email}
          </Typography.Text>
          <Button
            type="text"
            danger
            size={vertical ? "middle" : "small"}
            block={vertical}
            icon={<LogoutOutlined />}
            onClick={salir}
          >
            Salir
          </Button>
        </>
      ) : (
        <>
          <Link to="/login" style={enlace} onClick={onNavegar}>
            <Button
              type="default"
              size={vertical ? "middle" : "small"}
              block={vertical}
              icon={<LoginOutlined />}
            >
              Ingresar
            </Button>
          </Link>
          <Link to="/registro" style={enlace} onClick={onNavegar}>
            <Button
              type="primary"
              size={vertical ? "middle" : "small"}
              block={vertical}
              icon={<UserAddOutlined />}
            >
              Registrarme
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}

function NavMenu({ vertical = false, onNavegar }) {
  const { rol } = useSesion();
  const { pathname } = useLocation();

  const items = [
    { key: "/", icon: <TrophyOutlined />, label: <Link to="/">Eventos</Link> },
    {
      key: "/empresas",
      icon: <ShopOutlined />,
      label: <Link to="/empresas">Canchas</Link>,
    },
    {
      key: "/busco-jugadores",
      icon: <TeamOutlined />,
      label: <Link to="/busco-jugadores">Busco Jugadores</Link>,
    },
    ...(rol === "usuario"
      ? [
          {
            key: "/mis-reservas",
            icon: <UserOutlined />,
            label: <Link to="/mis-reservas">Mis Reservas</Link>,
          },
        ]
      : []),
    ...(rol === "empresa"
      ? [
          {
            key: "/admin",
            icon: <DashboardOutlined />,
            label: <Link to="/admin">Panel</Link>,
          },
        ]
      : []),
    ...(rol === "superadmin"
      ? [
          {
            key: "/super",
            icon: <SafetyCertificateOutlined />,
            label: <Link to="/super">Super admin</Link>,
          },
        ]
      : []),
  ];

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
      mode={vertical ? "inline" : "horizontal"}
      selectedKeys={seleccionada ? [seleccionada] : []}
      items={items}
      onClick={() => onNavegar?.()}
      style={{
        flex: 1,
        minWidth: 0,
        borderBottom: "none",
        borderInlineEnd: "none",
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
        color: isDarkMode ? "#94a3b8" : "#64748b",
        borderTop: isDarkMode ? "1px solid #1e293b" : "1px solid #f1f5f9",
      }}
    >
      Manager Deportivo — Villa María
      {(!rol || rol === "usuario") && (
        <div style={{ marginTop: 4 }}>
          <Link
            to="/admin/login"
            style={{ fontSize: 12, color: isDarkMode ? "#94a3b8" : "#64748b" }}
          >
            Acceso para complejos y organizadores
          </Link>
        </div>
      )}
    </Footer>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esMovil = useEsMovil();

  useEffect(() => {
    document.documentElement.style.backgroundColor = isDarkMode
      ? "#0b132b"
      : "#fafafa";
    document.documentElement.style.colorScheme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#059669",
          colorBgBase: isDarkMode ? "#0b132b" : "#fafafa",
          colorBgContainer: isDarkMode ? "#151e3d" : "#ffffff",
          colorBgElevated: isDarkMode ? "#1c274c" : "#ffffff",
          colorBorder: isDarkMode ? "#1e293b" : "#e2e8f0",
          colorBorderSecondary: isDarkMode ? "#1e293b" : "#f1f5f9",
          colorText: isDarkMode ? "#f8fafc" : "#0f172a",
          colorTextSecondary: isDarkMode ? "#94a3b8" : "#64748b",
          colorTextHeading: isDarkMode ? "#ffffff" : "#0f172a",
          colorTextDescription: isDarkMode ? "#cbd5e1" : "#475569",
          borderRadius: 10,
          fontFamily: "'Inter', system-ui, sans-serif",
        },
        components: {
          Layout: {
            headerBg: isDarkMode ? "#0b132b" : "#ffffff",
            bodyBg: isDarkMode ? "#0b132b" : "#fafafa",
          },
          Menu: {
            activeBarHeight: 2,
            itemColor: isDarkMode ? "#94a3b8" : "#64748b",
            itemSelectedColor: "#059669",
            horizontalItemSelectedColor: "#059669",
          },
          Card: {
            boxShadowSecondary: isDarkMode
              ? "0 4px 14px rgba(0,0,0,0.4)"
              : "0 2px 8px rgba(0,0,0,0.04)",
            colorBgContainer: isDarkMode ? "#151e3d" : "#ffffff",
          },
          Table: {
            colorBgContainer: isDarkMode ? "#151e3d" : "#ffffff",
            headerBg: isDarkMode ? "#1c274c" : "#f8fafc",
            headerColor: isDarkMode ? "#f8fafc" : "#0f172a",
            rowHoverBg: isDarkMode ? "#1c274c" : "#f1f5f9",
          },
        },
      }}
    >
      {/* Regla CSS global para forzar visibilidad de títulos en modo oscuro */}
      {isDarkMode && (
        <style>{`
          h1, h2, h3, h4, h5, h6, 
          .ant-typography, 
          .ant-card-head-title,
          div[class*="titulo"],
          div[class*="title"] {
            color: #ffffff !important;
          }
          p, span, label {
            color: #cbd5e1;
          }
          .ant-card-meta-title {
            color: #ffffff !important;
          }
          .ant-card-meta-description {
            color: #94a3b8 !important;
          }
        `}</style>
      )}

      <BrowserRouter>
        <Layout style={{ minHeight: "100vh" }}>
          {/* Header Minimalista */}
          <Header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: esMovil ? "0 12px" : "0 32px",
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
                gap: esMovil ? "8px" : "32px",
                flex: 1,
                minWidth: 0,
              }}
            >
              {esMovil && (
                <Button
                  type="text"
                  aria-label="Abrir menú"
                  icon={<MenuOutlined />}
                  onClick={() => setMenuAbierto(true)}
                />
              )}
              <Typography.Text
                strong
                style={{
                  fontSize: esMovil ? "14px" : "16px",
                  letterSpacing: "-0.3px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                }}
              >
                MANAGER DEPORTIVO
              </Typography.Text>

              {!esMovil && <NavMenu />}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: esMovil ? "8px" : "16px",
              }}
            >
              {!esMovil && <HeaderUsuario />}
              <Switch
                size="small"
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<BulbOutlined />}
                checked={isDarkMode}
                onChange={(checked) => setIsDarkMode(checked)}
              />
            </div>
          </Header>

          {/* Celular: menú y cuenta en panel lateral */}
          <Drawer
            open={esMovil && menuAbierto}
            onClose={() => setMenuAbierto(false)}
            placement="left"
            size={280}
            title="Manager Deportivo"
            styles={{ body: { padding: 0 } }}
          >
            <NavMenu vertical onNavegar={() => setMenuAbierto(false)} />
            <div
              style={{
                padding: 16,
                borderTop: isDarkMode
                  ? "1px solid #1e293b"
                  : "1px solid #e2e8f0",
              }}
            >
              <HeaderUsuario vertical onNavegar={() => setMenuAbierto(false)} />
            </div>
          </Drawer>

          {/* Contenido principal */}
          <Content
            style={{
              padding: esMovil ? "16px 12px" : "32px 24px",
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
                element={<Navigate to="/" replace />}
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

              {/* Organizadores / Complejos */}
              <Route path="/admin/login" element={<Login tipo="empresa" />} />
              <Route
                path="/admin/registro"
                element={<Registro tipo="empresa" />}
              />
              <Route
                path="/super/login"
                element={<Login tipo="superadmin" />}
              />
              <Route
                path="/super"
                element={
                  <RutaProtegida rol="superadmin">
                    <PanelSuperadmin />
                  </RutaProtegida>
                }
              />
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
