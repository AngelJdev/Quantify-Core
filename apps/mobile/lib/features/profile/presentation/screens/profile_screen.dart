import 'package:flutter/material.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_colors.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _offlineSyncEnabled = true;
  bool _wearableSyncEnabled = false;
  bool _notificationsEnabled = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.obsidianSlate,
      appBar: AppBar(
        title: const Text('Mi Perfil y Ajustes'),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // Tarjeta de Usuario
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.midnightNavy,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.steelBorder),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppColors.laserBlue.withValues(alpha: 0.25),
                  child: const Text(
                    'AD',
                    style: TextStyle(
                      color: AppColors.skyLaser,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ángel Demo',
                        style: TextStyle(color: AppColors.opticalWhite, fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'usuario.demo@quantify.dev',
                        style: TextStyle(color: AppColors.coolGray, fontSize: 13),
                      ),
                      SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.shield_outlined, color: AppColors.emerald, size: 14),
                          SizedBox(width: 4),
                          Text(
                            'Rol: Usuario (OIDC Autenticado)',
                            style: TextStyle(color: AppColors.emerald, fontSize: 11, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Configuración de API e Identidad
          const Text(
            'Entorno y Conectividad',
            style: TextStyle(color: AppColors.opticalWhite, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),

          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.midnightNavy,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.steelBorder),
            ),
            child: const Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('API Base', style: TextStyle(color: AppColors.coolGray, fontSize: 12)),
                    Text(ApiConstants.baseUrl, style: TextStyle(color: AppColors.skyLaser, fontSize: 12)),
                  ],
                ),
                Divider(color: AppColors.steelBorder, height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('IdP Keycloak', style: TextStyle(color: AppColors.coolGray, fontSize: 12)),
                    Text('quantify (26.8.1)', style: TextStyle(color: AppColors.opticalWhite, fontSize: 12)),
                  ],
                ),
                Divider(color: AppColors.steelBorder, height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Cliente PKCE', style: TextStyle(color: AppColors.coolGray, fontSize: 12)),
                    Text(ApiConstants.oidcClientId, style: TextStyle(color: AppColors.emerald, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Opciones de sincronización y permisos
          const Text(
            'Preferencias y Privacidad',
            style: TextStyle(color: AppColors.opticalWhite, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),

          Card(
            margin: EdgeInsets.zero,
            child: Column(
              children: [
                SwitchListTile(
                  value: _notificationsEnabled,
                  activeThumbColor: AppColors.laserBlue,
                  title: const Text('Recordatorios locales', style: TextStyle(color: AppColors.opticalWhite, fontSize: 14)),
                  subtitle: const Text('Avisos diarios de hábitos pendientes', style: TextStyle(color: AppColors.coolGray, fontSize: 12)),
                  onChanged: (val) => setState(() => _notificationsEnabled = val),
                ),
                const Divider(color: AppColors.steelBorder, height: 1),
                SwitchListTile(
                  value: _offlineSyncEnabled,
                  activeThumbColor: AppColors.laserBlue,
                  title: const Text('Tolerancia Offline', style: TextStyle(color: AppColors.opticalWhite, fontSize: 14)),
                  subtitle: const Text('Guardar comandos y reintentar al conectar', style: TextStyle(color: AppColors.coolGray, fontSize: 12)),
                  onChanged: (val) => setState(() => _offlineSyncEnabled = val),
                ),
                const Divider(color: AppColors.steelBorder, height: 1),
                SwitchListTile(
                  value: _wearableSyncEnabled,
                  activeThumbColor: AppColors.laserBlue,
                  title: const Text('Telemetría Wear OS', style: TextStyle(color: AppColors.opticalWhite, fontSize: 14)),
                  subtitle: const Text('Integración gradual de biometría autorizada', style: TextStyle(color: AppColors.coolGray, fontSize: 12)),
                  onChanged: (val) => setState(() => _wearableSyncEnabled = val),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Botón Cerrar Sesión
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.crimson,
              side: const BorderSide(color: AppColors.crimson),
            ),
            onPressed: () {
              Navigator.of(context).pushReplacementNamed(AppRoutes.login);
            },
            icon: const Icon(Icons.logout_rounded, size: 18),
            label: const Text('Cerrar Sesión'),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
