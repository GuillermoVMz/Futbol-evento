// Colores de los equipos. Si el equipo no eligió uno, se le asigna uno fijo según su nombre
// (así siempre se ve igual en las tablas, las llaves y los clasificados).
const PALETA = [
  "#d32f2f", "#1565c0", "#2e7d32", "#f9a825", "#6a1b9a", "#ef6c00",
  "#00838f", "#ad1457", "#37474f", "#558b2f", "#4527a0", "#c2185b",
];

const esHex = (c) => typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c);

export const colorEquipo = (nombre, color) => {
  if (esHex(color)) return color;
  let h = 0;
  for (const ch of String(nombre ?? "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
};

// Texto blanco o negro, según cuál se lea mejor sobre el color de fondo
export const textoSobre = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
};
