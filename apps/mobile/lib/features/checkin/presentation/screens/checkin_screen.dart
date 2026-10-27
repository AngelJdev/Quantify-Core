import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../habits/domain/models/habit_model.dart';

class CheckInScreen extends StatefulWidget {
  final List<HabitModel> habits;
  final Function(String habitId, double value, String note)? onConfirm;

  const CheckInScreen({
    super.key,
    required this.habits,
    this.onConfirm,
  });

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  late String _selectedHabitId;
  double _currentValue = 1.0;
  final TextEditingController _noteController = TextEditingController();
  final String _idempotencyKey = 'idemp-${DateTime.now().millisecondsSinceEpoch}';
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _selectedHabitId = widget.habits.isNotEmpty ? widget.habits.first.id : '';
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  void _submitCheckIn() async {
    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    widget.onConfirm?.call(_selectedHabitId, _currentValue, _noteController.text);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.midnightNavy,
        content: Text(
          'Check-in registrado con éxito (Idempotency-Key: ${_idempotencyKey.substring(0, 14)}...)',
          style: const TextStyle(color: AppColors.emerald),
        ),
      ),
    );

    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final selectedHabit = widget.habits.firstWhere(
      (h) => h.id == _selectedHabitId,
      orElse: () => widget.habits.first,
    );

    return Scaffold(
      backgroundColor: AppColors.obsidianSlate,
      appBar: AppBar(
        title: const Text('Registrar Avance (Check-in)'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Selección de Hábito
            const Text(
              'Seleccionar Hábito',
              style: TextStyle(color: AppColors.opticalWhite, fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.midnightNavy,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.steelBorder),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedHabitId,
                  dropdownColor: AppColors.midnightNavy,
                  isExpanded: true,
                  icon: const Icon(Icons.arrow_drop_down, color: AppColors.skyLaser),
                  items: widget.habits.map((habit) {
                    return DropdownMenuItem<String>(
                      value: habit.id,
                      child: Row(
                        children: [
                          Icon(habit.icon, color: AppColors.skyLaser, size: 20),
                          const SizedBox(width: 12),
                          Text(
                            habit.title,
                            style: const TextStyle(color: AppColors.opticalWhite, fontSize: 14),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() {
                        _selectedHabitId = val;
                      });
                    }
                  },
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Fecha de Negocio
            const Text(
              'Fecha de Negocio',
              style: TextStyle(color: AppColors.opticalWhite, fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.midnightNavy,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.steelBorder),
              ),
              child: const Row(
                children: [
                  Icon(Icons.calendar_today_rounded, color: AppColors.coolGray, size: 18),
                  SizedBox(width: 12),
                  Text(
                    '2026-10-27 (Hoy)',
                    style: TextStyle(color: AppColors.opticalWhite, fontSize: 14),
                  ),
                  Spacer(),
                  Text(
                    'UTC-06:00',
                    style: TextStyle(color: AppColors.coolGray, fontSize: 12),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Valor alcanzado
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Cantidad realizada',
                  style: TextStyle(color: AppColors.opticalWhite, fontSize: 14, fontWeight: FontWeight.bold),
                ),
                Text(
                  '${_currentValue.toStringAsFixed(1)} ${selectedHabit.unit}',
                  style: const TextStyle(color: AppColors.skyLaser, fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Slider(
              value: _currentValue,
              min: 0.5,
              max: selectedHabit.targetValue * 2 > 10 ? selectedHabit.targetValue * 2 : 10.0,
              divisions: 20,
              activeColor: AppColors.laserBlue,
              inactiveColor: AppColors.surfaceDark,
              onChanged: (val) {
                setState(() => _currentValue = val);
              },
            ),

            const SizedBox(height: 20),

            // Evidencia / Nota opcional
            const Text(
              'Evidencia o Nota (Opcional)',
              style: TextStyle(color: AppColors.opticalWhite, fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _noteController,
              maxLines: 3,
              style: const TextStyle(color: AppColors.opticalWhite, fontSize: 14),
              decoration: const InputDecoration(
                hintText: 'Ej. Sesión matutina completada con buen ritmo.',
              ),
            ),

            const SizedBox(height: 20),

            // Clave de Idempotencia visible para trazabilidad técnica
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.midnightNavy.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.steelBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.fingerprint_rounded, color: AppColors.emerald, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Cabecera Idempotente (Trazabilidad RF-04)',
                          style: TextStyle(color: AppColors.coolGray, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          _idempotencyKey,
                          style: const TextStyle(color: AppColors.emerald, fontSize: 11, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // Botón de Envío
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitCheckIn,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.opticalWhite),
                    )
                  : const Text('Confirmar Check-in'),
            ),
          ],
        ),
      ),
    );
  }
}
