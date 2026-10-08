import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Layout, Menu } from "antd";
import EventosFutbol from "./componentes/EventosFutbol";
import ListadoEmpresa from "./componentes/ListadoEmpresa";
import InscripcionTorneo from "./componentes/InscripcionTorneo";

const { Header, Content } = Layout;

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

        <Content style={{ padding: "20px", margin: "0 auto", width: "100%", maxWidth: "1200px" }}>
          <Routes>
            <Route path="/" element={<EventosFutbol />} />
            <Route path="/empresas" element={<ListadoEmpresa />} />
            <Route path="/eventos/torneo/:id" element={<InscripcionTorneo />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

