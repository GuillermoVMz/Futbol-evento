import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Layout, Menu } from "antd";
import EventosFutbol from "./componentes/EventosFutbol";
import ListadoEmpresa from "./componentes/ListadoEmpresa"; // Tu componente actual

const { Header, Content, Footer } = Layout;

function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: "100vh" }}>
        <Header style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              color: "white",
              fontSize: "20px",
              fontWeight: "bold",
              marginRight: "40px",
            }}
          >
            Manager Deportivo
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["1"]}
            style={{ flex: 1 }}
          >
            <Menu.Item key="1">
              <Link to="/">Eventos</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/empresas">Canchas y Complejos</Link>
            </Menu.Item>
          </Menu>
        </Header>

        <Content style={{ padding: "0 50px", marginTop: "30px" }}>
          <div
            style={{
              background: "#fff",
              padding: 24,
              minHeight: 380,
              borderRadius: "8px",
            }}
          >
            <Routes>
              <Route path="/" element={<EventosFutbol />} />
              <Route path="/empresas" element={<ListadoEmpresa />} />
            </Routes>
          </div>
        </Content>

        <Footer style={{ textAlign: "center" }}>
          Gestor de Eventos y Complejos ©2026
        </Footer>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
