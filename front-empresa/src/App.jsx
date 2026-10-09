import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Layout, Menu, ConfigProvider, theme, Switch, Typography } from "antd";
import {
  TrophyOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  DashboardOutlined,
  BulbOutlined,
  BulbFilled,
} from "@ant-design/icons";

import EventosFutbol from "./componentes/EventosFutbol";
import ListadoEmpresa from "./componentes/ListadoEmpresa";
import InscripcionTorneo from "./componentes/InscripcionTorneo";
import ReservaCancha from "./componentes/ReservaCancha";
import BuscoJugadores from "./componentes/BuscoJugadores";
import AdminDashboard from "./componentes/AdminDashboard";
import MisReservas from "./componentes/MisReservas";

const { Header, Content, Footer } = Layout;

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#16a34a", // Verde Esmeralda elegante
          colorBgBase: isDarkMode ? "#0f172a" : "#f8fafc",
          colorBgContainer: isDarkMode ? "#1e293b" : "#ffffff",
          colorBorder: isDarkMode ? "#334155" : "#e2e8f0",
          colorText: isDarkMode ? "#f8fafc" : "#0f172a",
          colorTextHeading: isDarkMode ? "#f8fafc" : "#0f172a",
          borderRadius: 10,
          fontFamily: "'Montserrat', 'Inter', sans-serif",
        },
        components: {
          Button: {
            colorPrimary: "#16a34a",
            fontWeight: 600,
          },
          Menu: {
            darkItemSelectedBg: "#16a34a", // Fondo del botón de menú activo en verde elegante
            darkItemColor: "#cbd5e1",
            darkItemSelectedColor: "#ffffff",
          },
        },
      }}
    >
      <BrowserRouter>
        <Layout
          style={{
            minHeight: "100vh",
            background: isDarkMode ? "#0f172a" : "#f8fafc",
          }}
        >
          {/* Header Superior */}
          <Header
            style={{
              display: "flex",
              alignItems: "center",
              justify: "space-between",
              padding: "0 24px",
              background: "#0f172a",
              borderBottom: "1px solid #1e293b",
              position: "sticky",
              top: 0,
              zIndex: 1000,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <Typography.Title
                level={3}
                style={{
                  color: "#4ade80",
                  margin: "0 30px 0 0",
                  fontWeight: 900,
                  letterSpacing: "1px",
                  fontStyle: "italic",
                }}
              >
                ⚽ ChuiquiMafia
              </Typography.Title>

              <Menu
                theme="dark"
                mode="horizontal"
                defaultSelectedKeys={["3"]}
                style={{
                  flex: 1,
                  background: "transparent",
                  borderBottom: "none",
                  fontWeight: 600,
                }}
              >
                <Menu.Item key="1" icon={<TrophyOutlined />}>
                  <Link to="/">Eventos</Link>
                </Menu.Item>
                <Menu.Item key="2" icon={<ShopOutlined />}>
                  <Link to="/empresas">Canchas</Link>
                </Menu.Item>
                <Menu.Item key="3" icon={<TeamOutlined />}>
                  <Link to="/busco-jugadores">Busco Jugadores</Link>
                </Menu.Item>
                <Menu.Item key="4" icon={<UserOutlined />}>
                  <Link to="/mis-reservas">Mis Reservas</Link>
                </Menu.Item>
                <Menu.Item key="5" icon={<DashboardOutlined />}>
                  <Link to="/admin" style={{ color: "#ef4444" }}>
                    Admin
                  </Link>
                </Menu.Item>
              </Menu>
            </div>

            {/* Interruptor Modo Claro / Oscuro */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}
              >
                {isDarkMode ? "Oscuro" : "Claro"}
              </span>
              <Switch
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<BulbOutlined />}
                checked={isDarkMode}
                onChange={(checked) => setIsDarkMode(checked)}
              />
            </div>
          </Header>

          {/* Contenido Principal */}
          <Content
            style={{
              padding: "30px 20px",
              margin: "0 auto",
              width: "100%",
              maxWidth: "1200px",
            }}
          >
            <Routes>
              <Route path="/" element={<EventosFutbol />} />
              <Route path="/empresas" element={<ListadoEmpresa />} />
              <Route
                path="/eventos/torneo/:id"
                element={<InscripcionTorneo />}
              />
              <Route path="/reservar/cancha/:id" element={<ReservaCancha />} />
              <Route path="/busco-jugadores" element={<BuscoJugadores />} />
              <Route path="/mis-reservas" element={<MisReservas />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </Content>

          <Footer
            style={{
              textAlign: "center",
              background: isDarkMode ? "#0f172a" : "#f1f5f9",
              color: "#64748b",
              borderTop: isDarkMode ? "1px solid #1e293b" : "1px solid #e2e8f0",
            }}
          >
            ChuiquiMafia ©2026 — Villa María, Córdoba
          </Footer>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
