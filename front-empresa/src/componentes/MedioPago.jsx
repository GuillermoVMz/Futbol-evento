import React from "react";
import { Form, Radio, Alert, Typography } from "antd";

const { Text } = Typography;

// Selector de medio de pago para usar DENTRO de un <Form> de antd (campo "medio_pago").
// Si el jugador elige transferencia, muestra el alias y el nombre del titular a quien transferir.
// Si el complejo no cargó esos datos, la transferencia queda deshabilitada.
export default function MedioPago({ alias, titular, monto, name = "medio_pago" }) {
  const transferenciaHabilitada = Boolean(alias && titular);

  return (
    <>
      <Form.Item
        label="Medio de pago"
        name={name}
        rules={[{ required: true, message: "Elegí cómo vas a pagar" }]}
        extra={
          !transferenciaHabilitada
            ? "Este complejo todavía no habilitó pagos por transferencia."
            : undefined
        }
      >
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          options={[
            { value: "efectivo", label: "Efectivo" },
            { value: "transferencia", label: "Transferencia", disabled: !transferenciaHabilitada },
          ]}
        />
      </Form.Item>

      {/* Se vuelve a dibujar solo cuando cambia la opción elegida */}
      <Form.Item noStyle shouldUpdate={(anterior, actual) => anterior[name] !== actual[name]}>
        {({ getFieldValue }) =>
          getFieldValue(name) === "transferencia" && transferenciaHabilitada ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
              message="Datos para la transferencia"
              description={
                <div>
                  <div>
                    Alias:{" "}
                    <Text strong copyable>
                      {alias}
                    </Text>
                  </div>
                  <div>
                    Titular: <Text strong>{titular}</Text>
                  </div>
                  {Number(monto) > 0 && (
                    <div>
                      Importe: <Text strong>${Number(monto).toLocaleString()}</Text>
                    </div>
                  )}
                  <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
                    Antes de confirmar la transferencia, verificá que el nombre del titular sea ese. Cuando
                    el complejo la reciba, marcará tu pago como acreditado.
                  </Text>
                </div>
              }
            />
          ) : null
        }
      </Form.Item>
    </>
  );
}
