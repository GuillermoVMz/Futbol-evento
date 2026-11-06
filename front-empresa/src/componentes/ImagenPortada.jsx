import React, { useState } from "react";

// Imagen de portada de una tarjeta. Si el link no carga, no muestra nada (en vez de un ícono roto).
export default function ImagenPortada({ src, alt, altura = 150 }) {
  const [fallo, setFallo] = useState(null);
  if (!src || fallo === src) return null;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFallo(src)}
      style={{ display: "block", width: "100%", height: altura, objectFit: "cover" }}
    />
  );
}
