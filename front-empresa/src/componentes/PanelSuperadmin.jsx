import React, { useState } from "react";
import { Badge, Tabs, Typography } from "antd";
import { useSesion } from "../services/session";
import TablaComplejos from "./super/TablaComplejos";
import TablaSuperadmins from "./super/TablaSuperadmins";

// Panel del equipo: aprobar y gestionar los complejos sin usar comandos
export default function PanelSuperadmin() {
  const { usuario } = useSesion();
  const [pendientes, setPendientes] = useState(0);

  const items = [
    {
      key: "complejos",
      label: (
        <span>
          Complejos <Badge count={pendientes} size="small" offset={[4, -2]} />
        </span>
      ),
      children: <TablaComplejos onPendientes={setPendientes} />,
    },
    { key: "superadmins", label: "Super admins", children: <TablaSuperadmins /> },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Panel de super admin</h2>
      <Typography.Text type="secondary">{usuario?.nombre}</Typography.Text>
      <Tabs items={items} destroyOnHidden style={{ marginTop: 16 }} />
    </div>
  );
}
