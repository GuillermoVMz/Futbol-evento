import { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { obtenerEmpresas, eliminarEmpresa } from '../services/empresaService';

const ListadoEmpresa = () => {
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  // Función para cargar los datos desde el backend
  const cargarEmpresas = async () => {
    try {
      setCargando(true);
      const data = await obtenerEmpresas();
      setEmpresas(data);
    } catch (error) {
      message.error('Error al cargar las empresas');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  // Se ejecuta una sola vez al cargar la pantalla
  useEffect(() => {
    cargarEmpresas();
  }, []);

  // Función para manejar el borrado
  const handleEliminar = async (id) => {
    try {
      await eliminarEmpresa(id);
      message.success('Empresa eliminada correctamente');
      cargarEmpresas(); // Recargamos la tabla
    } catch (error) {
      message.error('Hubo un error al eliminar');
    }
  };

  // Definición de las columnas de la tabla
  const columnas = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      // Cambiá 'nombre' por el nombre exacto de la columna en tu base de datos
      title: 'Nombre de la Empresa', 
      dataIndex: 'nombre',
      key: 'nombre',
    },
    // Podés agregar más columnas acá (ej: cuit, direccion) copiando el bloque anterior
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, registro) => (
        <Space size="middle">
          <Button 
            type="primary" 
            onClick={() => navigate(`/editar/${registro.id}`)}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Estás seguro de eliminar esta empresa?"
            onConfirm={() => handleEliminar(registro.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button type="primary" danger>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Listado de Empresas</h2>
        <Button 
          type="primary" 
          size="large"
          onClick={() => navigate('/crear')}
        >
          Crear Nueva Empresa
        </Button>
      </div>
      
      <Table 
        columns={columnas} 
        dataSource={empresas} 
        rowKey="id" 
        loading={cargando}
        bordered
      />
    </div>
  );
};

export default ListadoEmpresa;
