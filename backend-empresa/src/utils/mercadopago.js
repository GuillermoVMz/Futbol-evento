import { MercadoPagoConfig } from "mercadopago";

// Configuración del cliente con el Access Token de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "TU_ACCESS_TOKEN_DE_PRUEBA_AQUI",
});

export default client;
