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
  final _emailController = TextEditingController(text: 'usuario.demo@quantify.dev');
  final _passwordController = TextEditingController(text: '••••••••');
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() => _isLoading = false);

    Navigator.of(context).pushReplacementNamed(AppRoutes.main);
  }

  void _handleKeycloakSSO() async {
    setState(() => _isLoading = true);
    // Simula flujo PKCE OIDC con Keycloak
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: AppColors.midnightNavy,
        content: Text(
          'Simulación OIDC Authorization Code + PKCE completada (Keycloak)',
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
                const SizedBox(height: 36),

                // Formulario de Acceso
                const Text(
                  'Iniciar Sesión',
                  style: TextStyle(
                    color: AppColors.opticalWhite,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: AppColors.opticalWhite, fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'Correo electrónico',
                    prefixIcon: Icon(Icons.email_outlined, color: AppColors.coolGray),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  style: const TextStyle(color: AppColors.opticalWhite, fontSize: 14),
                  decoration: InputDecoration(
                    labelText: 'Contraseña',
                    prefixIcon: const Icon(Icons.lock_outline, color: AppColors.coolGray),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: AppColors.coolGray,
                      ),
                      onPressed: () {
                        setState(() => _obscurePassword = !_obscurePassword);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 22),

                // Botón Iniciar Sesión Demo
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.opticalWhite,
                          ),
                        )
                      : const Text('Entrar a la Demostración'),
                ),
                const SizedBox(height: 14),

                // Botón OIDC Keycloak
                OutlinedButton.icon(
                  onPressed: _isLoading ? null : _handleKeycloakSSO,
                  icon: const Icon(Icons.security_rounded, size: 18),
                  label: const Text('Iniciar con Keycloak OIDC'),
                ),
                const SizedBox(height: 28),

                // Mensaje informativo
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
                          'Cliente: ${ApiConstants.oidcClientId} • Modo seguro con PKCE',
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
