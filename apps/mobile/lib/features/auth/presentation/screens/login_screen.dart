import 'package:flutter/material.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_colors.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLoading = false;

  void _handleDemoPreview() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    setState(() => _isLoading = false);

    Navigator.of(context).pushReplacementNamed(AppRoutes.main);
  }

  void _handleKeycloakSSO() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: AppColors.midnightNavy,
        content: Text(
          'Vista previa OIDC Authorization Code + PKCE lista para conectar con Keycloak',
          style: TextStyle(color: AppColors.opticalWhite),
        ),
      ),
    );

    Navigator.of(context).pushReplacementNamed(AppRoutes.main);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.obsidianSlate,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo & Header
                Center(
                  child: Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: AppColors.midnightNavy,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.steelBorder, width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.laserBlue.withValues(alpha: 0.25),
                          blurRadius: 20,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.insights_rounded,
                      color: AppColors.skyLaser,
                      size: 40,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'QUANTIFY CORE',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.opticalWhite,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Monitoreo y mejora de hábitos personales con evidencia e IA',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.coolGray,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 32),

                // Tarjeta de Acceso Institucional sin contraseña en el cliente
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.midnightNavy,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.steelBorder),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.verified_user_rounded,
                            color: AppColors.skyLaser,
                            size: 22,
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Iniciar Sesión Segura (Sin Contraseña Local)',
                              style: TextStyle(
                                color: AppColors.opticalWhite,
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 10),
                      Text(
                        'Por tu seguridad, esta aplicación nunca pide ni guarda tu contraseña aquí adentro. El acceso se realiza mediante una cuenta única institucional en Keycloak con protocolo OIDC + PKCE.',
                        style: TextStyle(
                          color: AppColors.coolGray,
                          fontSize: 12,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Botón principal OIDC Keycloak
                ElevatedButton.icon(
                  onPressed: _isLoading ? null : _handleKeycloakSSO,
                  icon: const Icon(Icons.security_rounded, size: 18),
                  label: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.opticalWhite,
                          ),
                        )
                      : const Text('Continuar con Keycloak OIDC'),
                ),
                const SizedBox(height: 14),

                // Botón modo demostración offline rotulado
                OutlinedButton.icon(
                  onPressed: _isLoading ? null : _handleDemoPreview,
                  icon: const Icon(Icons.visibility_outlined, size: 18),
                  label: const Text('Entrar a la Demostración'),
                ),
                const SizedBox(height: 28),

                // Mensaje informativo de configuración OIDC
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.midnightNavy.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.steelBorder.withValues(alpha: 0.6)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: AppColors.electricCyan, size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Cliente: ${ApiConstants.oidcClientId} • Authorization Code + PKCE (S256)',
                          style: const TextStyle(color: AppColors.coolGray, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
