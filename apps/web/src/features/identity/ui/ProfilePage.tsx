import React from 'react';
import { useSession } from '../application/useSession';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { appConfig } from '@/shared/config/env';

export const ProfilePage: React.FC = () => {
  const { profile, logout } = useSession();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Perfil y Seguridad</h1>
        <p style={{ margin: '6px 0 0 0', color: 'var(--qc-muted, #283548)' }}>
          Datos de identidad vinculados a Keycloak OIDC y configuración regional.
        </p>
      </div>

      <Card title="Información del Usuario">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--qc-muted, #283548)', display: 'block' }}>
              Nombre de visualización
            </label>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 600 }}>{profile.displayName}</p>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--qc-muted, #283548)', display: 'block' }}>
              Correo electrónico
            </label>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 600 }}>{profile.email}</p>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--qc-muted, #283548)', display: 'block' }}>
              Zona horaria (IANA)
            </label>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 600 }}>{profile.timezone}</p>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--qc-muted, #283548)', display: 'block' }}>
              Roles asignados
            </label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {profile.roles.map((role) => (
                <Badge key={role} variant="info">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Configuración de Conexión y Autenticación">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
          <p style={{ margin: 0 }}>
            <strong>Emisor OIDC (Keycloak Realm):</strong> <code>{appConfig.oidcIssuer}</code>
          </p>
          <p style={{ margin: 0 }}>
            <strong>Client ID Web:</strong> <code>{appConfig.oidcClientId}</code>
          </p>
          <p style={{ margin: 0 }}>
            <strong>API Base URL:</strong> <code>{appConfig.apiBaseUrl}</code>
          </p>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--qc-line, #D8E1F0)' }}>
          <Button variant="danger" onClick={logout}>
            Cerrar Sesión
          </Button>
        </div>
      </Card>
    </div>
  );
};

