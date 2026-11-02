import { useState } from 'react';
import { UserProfile } from '../data/profileTypes';

const MOCK_PROFILE: UserProfile = {
  id: 'usr-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  email: 'francisco@quantify.internal',
  displayName: 'Francisco',
  timezone: 'America/Mexico_City',
  roles: ['user'],
  createdAt: '2026-10-01T12:00:00Z',
};

export function useSession() {
  const [profile] = useState<UserProfile>(MOCK_PROFILE);
  const [isAuthenticated] = useState<boolean>(true);

  const logout = () => {
    // En una implementación completa contra Keycloak se limpia la sesión en memoria
    alert('Sesión cerrada. Los datos temporales locales han sido removidos.');
  };

  return {
    profile,
    isAuthenticated,
    logout,
  };
}

