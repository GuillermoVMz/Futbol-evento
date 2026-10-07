import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ListadoEmpresa from './componentes/ListadoEmpresa';
import FormularioEmpresa from './componentes/FormularioEmpresa';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal que muestra la tabla */}
        <Route path="/" element={<ListadoEmpresa />} />
        
        {/* Rutas para crear y editar usando el mismo componente */}
        <Route path="/crear" element={<FormularioEmpresa />} />
        <Route path="/editar/:id" element={<FormularioEmpresa />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
