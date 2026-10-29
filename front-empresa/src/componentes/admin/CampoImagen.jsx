import React, { useState } from "react";
import { Button, Input, Typography, Upload, message } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { subirImagen } from "../../services/imagenService";

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 5;

// Campo de formulario: subir una foto desde la computadora O pegar el link de una imagen.
// Funciona dentro de <Form.Item name="..."> (recibe value y onChange).
export default function CampoImagen({ value, onChange }) {
  const [subiendo, setSubiendo] = useState(false);
  const [fallo, setFallo] = useState(null); // link que no se pudo mostrar

  const validar = (archivo) => {
    if (!TIPOS.includes(archivo.type)) {
      message.error("Elegí una imagen JPG, PNG, WEBP o GIF");
      return Upload.LIST_IGNORE;
    }
    if (archivo.size > MAX_MB * 1024 * 1024) {
      message.error(`La imagen no puede pesar más de ${MAX_MB} MB`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const subir = async ({ file, onSuccess, onError }) => {
    setSubiendo(true);
    try {
      const url = await subirImagen(file);
      onChange?.(url);
      onSuccess?.(url);
      message.success("Imagen subida");
    } catch (err) {
      onError?.(err);
      message.error(err.response?.data?.mensaje || "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Upload accept={TIPOS.join(",")} showUploadList={false} beforeUpload={validar} customRequest={subir}>
        <Button icon={<UploadOutlined />} loading={subiendo}>
          Subir desde mi computadora
        </Button>
      </Upload>

      <Input
        allowClear
        placeholder="…o pegá el link de una imagen (https://…)"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />

      {value &&
        (fallo === value ? (
          <Typography.Text type="danger">No se pudo mostrar esa imagen: revisá el link.</Typography.Text>
        ) : (
          <div>
            <img
              src={value}
              alt="Vista previa"
              onError={() => setFallo(value)}
              style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 8, objectFit: "cover", display: "block" }}
            />
            <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => onChange?.("")}>
              Quitar imagen
            </Button>
          </div>
        ))}
    </div>
  );
}
