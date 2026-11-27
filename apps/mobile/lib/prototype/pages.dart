import 'package:flutter/material.dart';

import '../api/mobile_api.dart';
import '../identity/mobile_session.dart';

import 'appearance_sheet.dart';
import 'auth_animations.dart';
import 'design.dart';
import 'generated_tokens.dart';
import 'state.dart';

class PageContent extends StatelessWidget {
  const PageContent({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => ListView(
    padding: EdgeInsets.fromLTRB(
      24,
      MediaQuery.textScalerOf(context).scale(14) > 21 ? 140 : 100,
      24,
      140,
    ),
    children: children,
  );
}

class _SyncStatusBanner extends StatelessWidget {
  const _SyncStatusBanner();
  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.of(context);
    if (!model.isConnected) return const SizedBox.shrink();
    if (model.loading) {
      return const Padding(
        padding: EdgeInsets.only(bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LinearProgressIndicator(),
            SizedBox(height: 8),
            Text('Sincronizando con Quantify API…', style: TextStyle(fontSize: 12)),
          ],
        ),
      );
    }
    if (model.errorMessage == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: LiquidSurface(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Semantics(
              liveRegion: true,
              child: Text(
                model.errorMessage!,
                style: const TextStyle(fontWeight: FontWeight.w600, height: 1.5),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: model.refresh,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Reintentar conexión'),
            ),
          ],
        ),
      ),
    );
  }
}

class TodayPage extends StatelessWidget {
  const TodayPage({super.key});
  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.of(context);
    final active = model.habits
        .where((habit) => !habit.archived && !habit.paused)
        .toList();
    final completed = active.where((habit) => habit.progress == 1).length;
    final pending = active.where((habit) => habit.progress < 1).toList();
    return PageContent(
      children: [
        const Eyebrow('Un momento para ti'),
        const SizedBox(height: 12),
        SectionTitle(
          'Tu rutina de hoy',
          subtitle: 'Haz espacio para lo que te hace bien.',
          trailing: model.isConnected
              ? IconButton(
                  onPressed: model.loading ? null : model.refresh,
                  tooltip: 'Actualizar datos',
                  icon: const Icon(Icons.refresh_rounded),
                )
              : null,
        ),
        const SizedBox(height: 20),
        const _SyncStatusBanner(),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: MobileTokens.laserBlue,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$completed de ${active.length} metas completas',
                style: const TextStyle(
                  color: MobileTokens.white,
                  fontSize: 23,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -.6,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                model.isConnected
                    ? 'Fecha de negocio: ${model.todayBusinessDate}'
                    : 'Avanza a tu ritmo.',
                style: const TextStyle(color: MobileTokens.white),
              ),
              const SizedBox(height: 20),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: active.isEmpty ? 0 : completed / active.length,
                  minHeight: 7,
                  color: MobileTokens.white,
                  backgroundColor: MobileTokens.white.withValues(alpha: .25),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        Row(
          children: [
            const Expanded(
              child: Text(
                'Tus hábitos',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
            ),
            TextButton(
              onPressed: () => showPrototypePage(context, const HabitsPage()),
              child: const Text('Ver todos'),
            ),
          ],
        ),
        if (active.isEmpty && !model.loading)
          const Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: LiquidSurface(
              child: Text('Tu rutina tiene espacio para una nueva intención.'),
            ),
          ),
        for (final habit in active)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: HabitTile(habit: habit),
          ),
        FilledButton.icon(
          onPressed: () => showPrototypePage(context, const HabitEditor()),
          icon: const Icon(Icons.add_rounded),
          label: const Text('Crear hábito'),
        ),
        const SizedBox(height: 22),
        LiquidSurface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('Sin prisa, con intención'),
              const SizedBox(height: 12),
              const Text(
                'Lo que sigue hoy',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 14),
              Text(
                model.isConnected
                    ? (pending.isEmpty
                          ? (active.isEmpty
                                ? 'Crea tu primer hábito para registrar avances confirmados en PostgreSQL.'
                                : 'Completaste todas tus metas activas de hoy.')
                          : 'Pendiente hoy: ${pending.map((h) => h.name).join(', ')}.')
                    : '18:00 · Tu momento de lectura\nPuedes retomar Caminar más tarde.',
                style: const TextStyle(height: 1.8),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        const DemoNote(),
      ],
    );
  }
}

class HabitTile extends StatelessWidget {
  const HabitTile({super.key, required this.habit});
  final PrototypeHabit habit;
  @override
  Widget build(BuildContext context) => LiquidSurface(
    padding: EdgeInsets.zero,
    child: InkWell(
      borderRadius: BorderRadius.circular(28),
      onTap: () => showPrototypePage(context, HabitDetail(id: habit.id)),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(15),
                color: context.color('icon').withValues(alpha: .12),
              ),
              child: Icon(habit.icon, color: context.color('icon')),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    habit.name,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    habit.archived
                        ? 'Archivado'
                        : habit.paused
                        ? 'En pausa'
                        : '${amount(habit.value)} / ${amount(habit.target)} ${habit.unit}',
                    style: TextStyle(
                      fontSize: 12,
                      color: context.color('muted'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              habit.progress == 1
                  ? Icons.check_circle_rounded
                  : Icons.chevron_right_rounded,
              color: habit.progress == 1
                  ? MobileTokens.emerald
                  : context.color('muted'),
              size: 22,
            ),
          ],
        ),
      ),
    ),
  );
}

enum _HabitFilter { active, paused, archived }

class HabitsPage extends StatefulWidget {
  const HabitsPage({super.key});
  @override
  State<HabitsPage> createState() => _HabitsPageState();
}

class _HabitsPageState extends State<HabitsPage> {
  String _query = '';
  _HabitFilter _filter = _HabitFilter.active;
  @override
  Widget build(BuildContext context) {
    final habits = PrototypeScope.of(context).habits
        .where(
          (habit) =>
              switch (_filter) {
                _HabitFilter.active => !habit.archived && !habit.paused,
                _HabitFilter.paused => !habit.archived && habit.paused,
                _HabitFilter.archived => habit.archived,
              } &&
              habit.name.toLowerCase().contains(_query.toLowerCase()),
        )
        .toList();
    return Scaffold(
      body: PrototypeBackdrop(
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      tooltip: 'Volver',
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                    const Expanded(
                      child: Text(
                        'Mis hábitos',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () =>
                          showPrototypePage(context, const HabitEditor()),
                      tooltip: 'Crear hábito',
                      icon: const Icon(Icons.add_rounded),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: TextField(
                  decoration: const InputDecoration(
                    labelText: 'Buscar hábito',
                    prefixIcon: Icon(Icons.search_rounded),
                  ),
                  onChanged: (value) => setState(() => _query = value),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Wrap(
                  spacing: 10,
                  children: [
                    ChoiceChip(
                      label: const Text('En tu rutina'),
                      selected: _filter == _HabitFilter.active,
                      onSelected: (_) =>
                          setState(() => _filter = _HabitFilter.active),
                    ),
                    ChoiceChip(
                      label: const Text('En pausa'),
                      selected: _filter == _HabitFilter.paused,
                      onSelected: (_) =>
                          setState(() => _filter = _HabitFilter.paused),
                    ),
                    ChoiceChip(
                      label: const Text('Archivados'),
                      selected: _filter == _HabitFilter.archived,
                      onSelected: (_) =>
                          setState(() => _filter = _HabitFilter.archived),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: habits.isEmpty
                    ? const Center(
                        child: Text('No hay hábitos para este filtro.'),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        itemCount: habits.length,
                        itemBuilder: (_, index) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: HabitTile(habit: habits[index]),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class HabitDetail extends StatelessWidget {
  const HabitDetail({super.key, required this.id});
  final String id;
  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.of(context);
    final habit = model.habitOrNull(id);
    if (habit == null) {
      return const DetailPage(
        title: 'Un paso más cerca',
        children: [
          LiquidSurface(child: Text('Este hábito ya no está disponible.')),
        ],
      );
    }
    return DetailPage(
      title: 'Un paso más cerca',
      children: [
        const _SyncStatusBanner(),
        LiquidSurface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(habit.icon, color: context.color('icon'), size: 32),
              const SizedBox(height: 20),
              SectionTitle(habit.name),
              const SizedBox(height: 18),
              Text(
                '${amount(habit.value)} / ${amount(habit.target)} ${habit.unit}',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 14),
              LinearProgressIndicator(value: habit.progress, minHeight: 6),
              const SizedBox(height: 18),
              Text(
                habit.archived
                    ? 'Archivado · Historial conservado'
                    : habit.paused
                    ? 'En pausa'
                    : 'Activo · ${habit.timeZone}',
              ),
              const SizedBox(height: 8),
              Text(
                'Días: ${habit.days.map((day) => ['L', 'M', 'X', 'J', 'V', 'S', 'D'][day - 1]).join(' · ')}',
              ),
              if (model.isConnected) ...[
                const SizedBox(height: 6),
                Builder(
                  builder: (_) {
                    final todayForHabit = businessDateForZone(
                      DateTime.now(),
                      habit.timeZone,
                    );
                    final isFuture =
                        habit.effectiveFrom.compareTo(todayForHabit) > 0;
                    return Text(
                      isFuture
                          ? 'Versión ${habit.version} · Cambio programado desde ${habit.effectiveFrom}'
                          : 'Versión ${habit.version} · Vigente desde ${habit.effectiveFrom}',
                      style: TextStyle(
                        fontSize: 12,
                        color: context.color('muted'),
                      ),
                    );
                  },
                ),
                if (model.metricsForHabit(id) case final metrics?) ...[
                  const SizedBox(height: 12),
                  const Divider(),
                  const SizedBox(height: 10),
                  Text(
                    metrics.completionRate != null
                        ? 'Cumplimiento 30 días: ${metrics.completionRate!.round()}% (${metrics.completedPeriods}/${metrics.eligiblePeriods} periodos)'
                        : 'Cumplimiento 30 días: sin periodos cerrados aún',
                    style: const TextStyle(fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Racha actual: ${metrics.currentStreak} · Mejor racha: ${metrics.longestStreak}',
                    style: TextStyle(
                      fontSize: 12,
                      color: context.color('muted'),
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
        const SizedBox(height: 24),
        if (!habit.archived) ...[
          FilledButton.icon(
            onPressed: habit.paused || model.saving
                ? null
                : () => showPrototypePage(context, CheckInEditor(id: id)),
            icon: const Icon(Icons.check_rounded),
            label: const Text('Registrar avance'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: model.saving
                ? null
                : () => showPrototypePage(context, HabitEditor(id: id)),
            child: const Text('Editar hábito'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: model.saving
                ? null
                : () async {
                    final ok = await model.submitPauseToggle(id);
                    if (!ok && context.mounted && model.errorMessage != null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(model.errorMessage!)),
                      );
                    }
                  },
            child: Text(habit.paused ? 'Reanudar hábito' : 'Pausar hábito'),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: model.saving
                ? null
                : () async {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('¿Archivar este hábito?'),
                        content: Text(
                          model.isConnected
                              ? 'Sale de tu rutina activa. El historial en PostgreSQL se conserva.'
                              : 'Sale de tu rutina activa. El historial de esta visita se conserva.',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Conservar'),
                          ),
                          FilledButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Archivar'),
                          ),
                        ],
                      ),
                    );
                    if (confirmed == true && context.mounted) {
                      final ok = await model.submitArchive(id);
                      if (!ok &&
                          context.mounted &&
                          model.errorMessage != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(model.errorMessage!)),
                        );
                      }
                    }
                  },
            child: const Text('Archivar hábito'),
          ),
        ],
        const SizedBox(height: 18),
        const DemoNote(),
      ],
    );
  }
}

class HabitEditor extends StatefulWidget {
  const HabitEditor({
    super.key,
    this.id,
    this.initialDraft,
    this.onSaved,
  });
  final String? id;
  final ApiHabitDraft? initialDraft;
  final VoidCallback? onSaved;
  @override
  State<HabitEditor> createState() => _HabitEditorState();
}

class _HabitEditorState extends State<HabitEditor> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController(),
      _target = TextEditingController(),
      _unit = TextEditingController();
  Set<int> _days = {1, 2, 3, 4, 5};
  bool _initialized = false;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final model = PrototypeScope.of(context);
    final habit = widget.id == null ? null : model.habitOrNull(widget.id!);
    final draft = widget.id == null ? widget.initialDraft : null;
    if (draft != null) {
      _name.text = draft.name;
      _target.text = amount(draft.targetValue);
      _unit.text = draft.unit;
      _days = {...draft.weekdays};
      return;
    }
    _name.text = habit?.name ?? '';
    _target.text = habit == null ? '20' : amount(habit.target);
    _unit.text = habit?.unit ?? 'min';
    _days = {
      ...?habit?.days,
      if (habit == null) ...[
        1,
        2,
        3,
        4,
        5,
        if (model.isConnected) DateTime.parse(model.todayBusinessDate).weekday,
      ],
    };
  }

  @override
  void dispose() {
    _name.dispose();
    _target.dispose();
    _unit.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.of(context);
    return DetailPage(
      title: widget.id == null
          ? 'Diseña tu próximo hábito'
          : 'Dale un nuevo ritmo',
      children: [
        Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Eyebrow(
                widget.initialDraft != null
                    ? 'Borrador asistido · Revisable'
                    : 'Una intención clara',
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _name,
                decoration: const InputDecoration(
                  labelText: 'Nombre del hábito',
                ),
                maxLength: 60,
                validator: (value) => (value?.trim().length ?? 0) < 3
                    ? 'Escribe al menos 3 caracteres.'
                    : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _target,
                decoration: const InputDecoration(labelText: 'Meta'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                validator: (value) {
                  final number = double.tryParse(
                    (value ?? '').replaceAll(',', '.'),
                  );
                  return number == null || !number.isFinite || number <= 0
                      ? 'La meta debe ser mayor que cero.'
                      : null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _unit,
                decoration: const InputDecoration(labelText: 'Unidad'),
                validator: (value) => (value?.trim().isEmpty ?? true)
                    ? 'Indica una unidad.'
                    : null,
              ),
              const SizedBox(height: 20),
              const Text(
                'Días de tu rutina',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 8,
                children: List.generate(
                  7,
                  (index) => FilterChip(
                    label: Text(['L', 'M', 'X', 'J', 'V', 'S', 'D'][index]),
                    selected: _days.contains(index + 1),
                    onSelected: (selected) => setState(
                      () => selected
                          ? _days.add(index + 1)
                          : _days.remove(index + 1),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                model.isConnected
                    ? (widget.id == null
                          ? 'Zona para el hábito: ${model.newHabitTimeZone}'
                          : 'Zona del hábito: ${model.habitOrNull(widget.id!)?.timeZone ?? model.activeTimeZone}\nLos cambios aplican desde la próxima fecha elegible sin alterar el historial previo.')
                    : 'Zona de ejemplo: America/Mexico_City',
                style: const TextStyle(fontSize: 12, height: 1.5),
              ),
              const SizedBox(height: 24),
              if (model.saving)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: LinearProgressIndicator(),
                ),
              FilledButton(
                onPressed: model.saving
                    ? null
                    : () async {
                        if (!_form.currentState!.validate()) return;
                        if (_days.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Selecciona al menos un día.'),
                            ),
                          );
                          return;
                        }
                        final ok = await model.submitHabit(
                          id: widget.id,
                          name: _name.text,
                          target: double.parse(
                            _target.text.replaceAll(',', '.'),
                          ),
                          unit: _unit.text,
                          days: _days.toList()..sort(),
                        );
                        if (!context.mounted) return;
                        if (ok) {
                          widget.onSaved?.call();
                          Navigator.pop(context);
                        } else if (model.errorMessage != null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(model.errorMessage!)),
                          );
                        }
                      },
                child: Text(
                  model.isConnected
                      ? 'Guardar hábito'
                      : 'Guardar en la demostración',
                ),
              ),
              const SizedBox(height: 16),
              const DemoNote(),
            ],
          ),
        ),
      ],
    );
  }
}

class CheckInEditor extends StatefulWidget {
  const CheckInEditor({super.key, required this.id});
  final String id;
  @override
  State<CheckInEditor> createState() => _CheckInEditorState();
}

class _CheckInEditorState extends State<CheckInEditor> {
  final _form = GlobalKey<FormState>();
  final _value = TextEditingController();
  bool _initialized = false;
  String? _selectedDate;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      final model = PrototypeScope.of(context);
      final habit = model.habitOrNull(widget.id);
      if (model.isConnected) {
        final dates = model.eligibleDatesForHabit(widget.id);
        _selectedDate = dates.isNotEmpty
            ? dates.first
            : model.todayBusinessDateForHabit(widget.id);
        _value.text = amount(
          model.valueForHabitOnDate(widget.id, _selectedDate!),
        );
      } else {
        _value.text = habit == null ? '0' : amount(habit.value);
      }
    }
  }

  @override
  void dispose() {
    _value.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.of(context);
    final habit = model.habitOrNull(widget.id);
    if (habit == null) {
      return const DetailPage(
        title: 'Cada avance cuenta',
        children: [LiquidSurface(child: Text('Hábito no disponible.'))],
      );
    }
    final eligibleDates = model.isConnected
        ? model.eligibleDatesForHabit(widget.id)
        : const <String>[];
    final todayForHabit = model.isConnected
        ? model.todayBusinessDateForHabit(widget.id)
        : '2026-11-20';
    final noEligibleDateToday = model.isConnected && eligibleDates.isEmpty;
    final selectedDate = _selectedDate ?? todayForHabit;
    return DetailPage(
      title: 'Cada avance cuenta',
      children: [
        SectionTitle(
          habit.name,
          subtitle:
              'Valor acumulado del día. Corregirlo reemplaza el valor anterior.',
        ),
        const SizedBox(height: 24),
        if (noEligibleDateToday) ...[
          LiquidSurface(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Eyebrow('FUERA DE AGENDA VIGENTE'),
                const SizedBox(height: 10),
                Text(
                  'Hoy ($todayForHabit) no está programado en la rutina de "${habit.name}" y no hay días elegibles previos desde ${habit.effectiveFrom}.',
                  style: const TextStyle(height: 1.6),
                ),
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    showPrototypePage(context, HabitEditor(id: habit.id));
                  },
                  icon: const Icon(Icons.edit_calendar_rounded),
                  label: const Text('Editar días del hábito'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ] else if (model.isConnected && eligibleDates.length > 1) ...[
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final date in eligibleDates)
                ChoiceChip(
                  label: Text(date == todayForHabit ? 'Hoy ($date)' : date),
                  selected: selectedDate == date,
                  onSelected: model.saving
                      ? null
                      : (_) {
                          setState(() {
                            _selectedDate = date;
                            _value.text = amount(
                              model.valueForHabitOnDate(habit.id, date),
                            );
                          });
                        },
                ),
            ],
          ),
          const SizedBox(height: 18),
        ],
        Form(
          key: _form,
          child: TextFormField(
            controller: _value,
            enabled: !noEligibleDateToday,
            decoration: InputDecoration(
              labelText: 'Valor acumulado (${habit.unit})',
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: (text) {
              final value = double.tryParse((text ?? '').replaceAll(',', '.'));
              return value == null || !value.isFinite || value < 0
                  ? 'Escribe un valor válido, mayor o igual a cero.'
                  : null;
            },
          ),
        ),
        const SizedBox(height: 20),
        Text(
          model.isConnected
              ? '$selectedDate · Fecha de negocio\n${habit.timeZone}'
              : '20 nov 2026 · Fecha de ejemplo\nAmerica/Mexico_City',
          style: const TextStyle(height: 1.7),
        ),
        const SizedBox(height: 24),
        if (model.saving)
          const Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: LinearProgressIndicator(),
          ),
        FilledButton(
          onPressed:
              habit.paused ||
                  habit.archived ||
                  model.saving ||
                  noEligibleDateToday
              ? null
              : () async {
                  if (!_form.currentState!.validate()) return;
                  final ok = await model.submitCheckIn(
                    habit.id,
                    double.parse(_value.text.replaceAll(',', '.')),
                    businessDate: model.isConnected ? selectedDate : null,
                  );
                  if (!context.mounted) return;
                  if (ok) {
                    Navigator.pop(context);
                  } else if (model.errorMessage != null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(model.errorMessage!)),
                    );
                  }
                },
          child: Text(
            model.isConnected ? 'Guardar avance' : 'Previsualizar avance',
          ),
        ),
        const SizedBox(height: 18),
        const DemoNote(),
      ],
    );
  }
}

class ProgressPage extends StatefulWidget {
  const ProgressPage({super.key});
  @override
  State<ProgressPage> createState() => _ProgressPageState();
}

class _ProgressPageState extends State<ProgressPage> {
  bool _month = false;
  List<double> _demoValues() =>
      _month ? const [45, 65, 75, 85] : const [30, 55, 40, 80, 65, 90, 70];
  List<String> _demoLabels() => _month
      ? const ['S1', 'S2', 'S3', 'S4']
      : const ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  String _weekdayShort(String ymd) {
    final parts = ymd.split('-').map(int.parse).toList(growable: false);
    final weekday = DateTime.utc(parts[0], parts[1], parts[2]).weekday;
    return const ['L', 'M', 'X', 'J', 'V', 'S', 'D'][weekday - 1];
  }

  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.of(context);
    final connected = model.isConnected;
    final trendPoints = _month ? model.monthlyTrends : model.weeklyTrends;
    final hasClosedOpportunities =
        connected && trendPoints.any((p) => p.opportunities > 0);
    final List<double> barHeights;
    final List<String> barLabels;
    if (connected && trendPoints.isNotEmpty) {
      barHeights = trendPoints
          .map((p) => ((p.completionRate ?? 0) * 0.82 + 8).clamp(8.0, 90.0))
          .toList(growable: false);
      barLabels = List.generate(
        trendPoints.length,
        (i) => _month ? 'S${i + 1}' : _weekdayShort(trendPoints[i].from),
      );
    } else {
      barHeights = _demoValues();
      barLabels = _demoLabels();
    }

    return PageContent(
      children: [
        const Eyebrow('Cada avance tiene historia'),
        const SizedBox(height: 12),
        const SectionTitle(
          'Observa tu constancia',
          subtitle: 'Una mirada a tus avances, más allá de una racha.',
        ),
        const SizedBox(height: 20),
        const _SyncStatusBanner(),
        Wrap(
          spacing: 8,
          children: [
            ChoiceChip(
              label: const Text('Semana'),
              selected: !_month,
              onSelected: (_) => setState(() => _month = false),
            ),
            ChoiceChip(
              label: const Text('Mes'),
              selected: _month,
              onSelected: (_) => setState(() => _month = true),
            ),
          ],
        ),
        const SizedBox(height: 20),
        LiquidSurface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Eyebrow(
                connected ? 'Cumplimiento confirmado' : 'Tendencia ilustrativa',
              ),
              const SizedBox(height: 14),
              Text(
                _month ? 'Un mes, muchos pasos.' : 'Tu semana, paso a paso.',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 24),
              if (connected && !hasClosedOpportunities)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Text(
                    'Sin oportunidades cerradas aún en este periodo. El día abierto de hoy se evalúa al cerrar la fecha.',
                    style: TextStyle(height: 1.6),
                  ),
                )
              else
                Semantics(
                  label: connected
                      ? 'Gráfico de cumplimiento confirmado por la API.'
                      : (_month
                            ? 'Gráfico mensual de ejemplo: semana 1, 45; semana 2, 65; semana 3, 75; semana 4, 85 por ciento.'
                            : 'Gráfico semanal de ejemplo: lunes 30, martes 55, miércoles 40, jueves 80, viernes 65, sábado 90 y domingo 70 por ciento.'),
                  child: ExcludeSemantics(
                    child: SizedBox(
                      height: 130,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: List.generate(
                          barHeights.length,
                          (index) => Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 5,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Container(
                                    height: barHeights[index],
                                    decoration: BoxDecoration(
                                      color: index == barHeights.length - 1
                                          ? MobileTokens.laserBlue
                                          : context
                                                .color('icon')
                                                .withValues(alpha: .25),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    barLabels[index],
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              if (connected && model.dashboardProgress != null) ...[
                Text(
                  'Resumen 30 días: ${model.dashboardProgress!.closed.completed}/${model.dashboardProgress!.closed.opportunities} cerradas · ${model.dashboardProgress!.open.completed}/${model.dashboardProgress!.open.opportunities} hoy · ${model.dashboardProgress!.futureOpportunities} próximas',
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 8),
              ],
              Text(
                connected
                    ? 'Calculado desde PostgreSQL · Zona ${model.activeTimeZone}.'
                    : 'Valores de muestra. No son métricas oficiales.',
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        OutlinedButton.icon(
          onPressed: () => showPrototypePage(context, const HistoryPage()),
          icon: const Icon(Icons.history_rounded),
          label: Text(
            connected
                ? 'Ver historial confirmado'
                : 'Ver historial de esta visita',
          ),
        ),
        const SizedBox(height: 18),
        const DemoNote(),
      ],
    );
  }
}

class HistoryPage extends StatelessWidget {
  const HistoryPage({super.key});
  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.of(context);
    final entries = model.entries;
    return DetailPage(
      title: model.isConnected
          ? 'Tu historial confirmado'
          : 'Tu historial de ejemplo',
      children: [
        if (entries.isEmpty)
          LiquidSurface(
            child: Text(
              model.isConnected
                  ? 'Aún no tienes check-ins confirmados en los últimos 30 días.'
                  : 'Aún no registras avances durante esta visita.',
            ),
          ),
        for (final entry in entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: LiquidSurface(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.name,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text('${amount(entry.value)} ${entry.unit} · ${entry.date}'),
                ],
              ),
            ),
          ),
        const SizedBox(height: 18),
        const DemoNote(),
      ],
    );
  }
}

class AssistantPage extends StatefulWidget {
  const AssistantPage({super.key});
  @override
  State<AssistantPage> createState() => _AssistantPageState();
}

class _AssistantPageState extends State<AssistantPage> {
  final _prompt = TextEditingController();

  static const _starterPrompts = [
    'Recomiéndame un hábito de lectura',
    'Quiero tomar más agua entre semana',
    'Ayúdame a caminar por la mañana',
  ];

  @override
  void dispose() {
    _prompt.dispose();
    super.dispose();
  }

  Future<void> _sendPrompt(PrototypeModel model, [String? preset]) async {
    final text = (preset ?? _prompt.text).trim();
    if (text.isEmpty || model.assistantSending) return;
    if (preset != null) {
      _prompt.text = preset;
    }
    final ok = await model.sendAssistantPrompt(text);
    if (ok && mounted) {
      _prompt.clear();
    }
  }

  static String _weekdaySummary(List<int> days) {
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    return days
        .where((d) => d >= 1 && d <= 7)
        .map((d) => labels[d - 1])
        .join(', ');
  }

  static String _missingLabels(List<String> fields) {
    const map = {
      'name': 'nombre',
      'targetValue': 'meta',
      'unit': 'unidad',
      'weekdays': 'días',
    };
    return fields.map((f) => map[f] ?? f).join(', ');
  }

  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.of(context);
    if (!model.isConnected) {
      return PageContent(
        children: [
          const Eyebrow('Ideas con contexto'),
          const SizedBox(height: 12),
          const SectionTitle('Un hábito puede empezar con una idea.'),
          const SizedBox(height: 24),
          LiquidSurface(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.auto_awesome_outlined,
                  color: context.color('icon'),
                  size: 36,
                ),
                const SizedBox(height: 20),
                Text(
                  model.apiConfigured
                      ? 'Inicia sesión para conversar con tu asistente.'
                      : 'Asistente disponible en modo conectado.',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  model.apiConfigured
                      ? 'El asistente conversacional Gemini opera a través de Quantify API con tu cuenta de Keycloak, sin guardar el chat en el servidor. También puedes crear tu hábito manualmente.'
                      : 'En esta vista de demostración no se simulan respuestas de IA. Conecta Quantify API para usar Gemini o diseña tu hábito manualmente.',
                  style: const TextStyle(height: 1.7),
                ),
                const SizedBox(height: 24),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    if (model.apiConfigured)
                      AnimatedPressButton(
                        child: OutlinedButton.icon(
                          onPressed: () =>
                              showLoginSlidePage(context, const AccessPreview()),
                          icon: const Icon(Icons.login_rounded),
                          label: const Text('Iniciar sesión'),
                        ),
                      ),
                    FilledButton(
                      onPressed: () =>
                          showPrototypePage(context, const HabitEditor()),
                      child: const Text('Crear hábito manualmente'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const DemoNote(),
        ],
      );
    }

    final consentGranted = model.assistantConsent?.granted ?? false;
    if (!consentGranted) {
      return PageContent(
        children: [
          const Eyebrow('Asistente conversacional · RF-07'),
          const SizedBox(height: 10),
          const SectionTitle(
            'Tu asistente de hábitos.',
            subtitle: 'Borradores claros con Gemini. Nada se guarda sin confirmar.',
          ),
          const SizedBox(height: 16),
          const _SyncStatusBanner(),
          LiquidSurface(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Consentimiento antes de empezar',
                  style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Tus mensajes se procesan con Google Gemini mediante Quantify API, sin claves en el teléfono ni historial guardado en el servidor. Es apoyo práctico, no consejo médico.',
                  style: TextStyle(height: 1.55),
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Incluir resumen de mis hábitos actuales'),
                  subtitle: const Text('Nombre, meta, unidad y días.'),
                  value: model.includeHabitContext,
                  onChanged: model.setIncludeHabitContext,
                ),
                if (model.assistantError != null) ...[
                  const SizedBox(height: 8),
                  Semantics(
                    liveRegion: true,
                    child: Text(
                      model.assistantError!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                if (model.assistantConsentSaving)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: LinearProgressIndicator(),
                  ),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    FilledButton.icon(
                      onPressed: model.assistantConsentSaving
                          ? null
                          : () => model.updateAssistantConsent(true),
                      icon: const Icon(Icons.auto_awesome_outlined),
                      label: const Text('Activar asistente Gemini'),
                    ),
                    OutlinedButton(
                      onPressed: () =>
                          showPrototypePage(context, const HabitEditor()),
                      child: const Text('Crear hábito manualmente'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const DemoNote(),
        ],
      );
    }

    return PageContent(
      children: [
        const Eyebrow('Ideas con contexto · Gemini'),
        const SizedBox(height: 12),
        const SectionTitle(
          'Diseña un hábito conversando.',
          subtitle:
              'Revisa cada borrador con calma. Solo se guarda cuando tú lo confirmas.',
        ),
        const SizedBox(height: 20),
        const _SyncStatusBanner(),
        LiquidSurface(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Usar contexto de mis hábitos'),
                subtitle: Text(
                  model.includeHabitContext
                      ? 'Se comparte nombre, meta y días de tus hábitos propios.'
                      : 'Solo se envía el texto de esta conversación.',
                ),
                value: model.includeHabitContext,
                onChanged: model.assistantSending
                    ? null
                    : model.setIncludeHabitContext,
              ),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (model.assistantMessages.isNotEmpty)
                    OutlinedButton.icon(
                      onPressed: model.assistantSending
                          ? null
                          : model.clearAssistantConversation,
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('Nueva conversación'),
                    ),
                  TextButton(
                    onPressed: model.assistantConsentSaving || model.assistantSending
                        ? null
                        : () => model.updateAssistantConsent(false),
                    child: const Text('Revocar consentimiento'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (model.assistantMessages.isEmpty) ...[
          LiquidSurface(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Eyebrow('Sugerencias para empezar'),
                const SizedBox(height: 12),
                const Text(
                  'Cuéntame qué hábito quieres construir o toca un ejemplo:',
                  style: TextStyle(height: 1.5),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final suggestion in _starterPrompts)
                      ActionChip(
                        label: Text(suggestion),
                        onPressed: model.assistantSending
                            ? null
                            : () => _sendPrompt(model, suggestion),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        for (final item in model.assistantMessages) ...[
          LiquidSurface(
            child: Semantics(
              liveRegion: item.role == 'assistant',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Eyebrow(
                    item.role == 'user'
                        ? 'Tu solicitud'
                        : 'Asistente Quantify · Gemini',
                  ),
                  const SizedBox(height: 10),
                  Text(item.text, style: const TextStyle(height: 1.6)),
                  if (item.role == 'assistant') ...[
                    const SizedBox(height: 10),
                    Text(
                      'Modelo: ${item.model ?? "Gemini"} · ${item.contextUsed ? "Con contexto de hábitos" : "Sin contexto de hábitos"}',
                      style: TextStyle(
                        fontSize: 11,
                        color: context.color('muted'),
                      ),
                    ),
                    if (item.outOfScope)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          'Consulta fuera del alcance de hábitos personales.',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: context.color('muted'),
                          ),
                        ),
                      ),
                    if (item.missingFields.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          'Datos por confirmar: ${_missingLabels(item.missingFields)}.',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (item.draft != null) ...[
            _AssistantDraftCard(
              item: item,
              weekdayText: _weekdaySummary(item.draft!.weekdays),
            ),
            const SizedBox(height: 12),
          ],
        ],
        if (model.assistantSending)
          const Padding(
            padding: EdgeInsets.only(bottom: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LinearProgressIndicator(),
                SizedBox(height: 8),
                Text(
                  'Consultando a Gemini…',
                  style: TextStyle(fontSize: 12),
                ),
              ],
            ),
          ),
        if (model.assistantError != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: LiquidSurface(
              child: Semantics(
                liveRegion: true,
                child: Text(
                  model.assistantError!,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.error,
                    fontWeight: FontWeight.w600,
                    height: 1.5,
                  ),
                ),
              ),
            ),
          ),
        LiquidSurface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                key: const ValueKey('assistant-input'),
                controller: _prompt,
                minLines: 1,
                maxLines: 4,
                maxLength: 1000,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendPrompt(model),
                decoration: const InputDecoration(
                  labelText: 'Escribe tu solicitud sobre hábitos',
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  FilledButton.icon(
                    key: const ValueKey('assistant-send'),
                    onPressed: model.assistantSending
                        ? null
                        : () => _sendPrompt(model),
                    icon: const Icon(Icons.send_rounded, size: 18),
                    label: const Text('Enviar al asistente'),
                  ),
                  OutlinedButton(
                    onPressed: () =>
                        showPrototypePage(context, const HabitEditor()),
                    child: const Text('Crear hábito manualmente'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const DemoNote(),
      ],
    );
  }
}

class _AssistantDraftCard extends StatelessWidget {
  const _AssistantDraftCard({
    required this.item,
    required this.weekdayText,
  });

  final AssistantMessageItem item;
  final String weekdayText;

  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.of(context);
    final draft = item.draft!;
    final stateLabel = switch (item.draftState) {
      AssistantDraftState.pending => 'BORRADOR REVISABLE · SIN GUARDAR',
      AssistantDraftState.saved => 'HÁBITO CONFIRMADO Y GUARDADO',
      AssistantDraftState.discarded => 'BORRADOR DESCARTADO',
    };
    return LiquidSurface(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Eyebrow(stateLabel),
          const SizedBox(height: 10),
          Text(
            draft.name,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(
            'Meta: ${amount(draft.targetValue)} ${draft.unit} · Días: $weekdayText',
            style: const TextStyle(fontWeight: FontWeight.w600, height: 1.5),
          ),
          Text(
            'Zona para alta: ${model.newHabitTimeZone}',
            style: TextStyle(fontSize: 12, color: context.color('muted')),
          ),
          const SizedBox(height: 10),
          Text(draft.rationale, style: const TextStyle(height: 1.55)),
          if (item.draftState == AssistantDraftState.pending) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                FilledButton.icon(
                  onPressed: model.saving
                      ? null
                      : () async {
                          final ok = await model.confirmAssistantDraft(item.id);
                          if (!context.mounted) return;
                          if (ok) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Hábito confirmado y guardado.'),
                              ),
                            );
                          }
                        },
                  icon: const Icon(Icons.check_rounded),
                  label: const Text('Confirmar y guardar'),
                ),
                OutlinedButton(
                  onPressed: model.saving
                      ? null
                      : () => showPrototypePage(
                            context,
                            HabitEditor(
                              initialDraft: draft,
                              onSaved: () =>
                                  model.markAssistantDraftSaved(item.id),
                            ),
                          ),
                  child: const Text('Editar borrador'),
                ),
                TextButton(
                  onPressed: model.saving
                      ? null
                      : () => model.discardAssistantDraft(item.id),
                  child: const Text('Descartar'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});
  @override
  Widget build(BuildContext context) {
    final session = MobileSessionScope.of(context);
    final model = PrototypeScope.of(context);
    final String statusText;
    if (session.authenticated && model.isConnected) {
      statusText = model.profile != null
          ? 'Sesión Keycloak activa\nAPI conectada · ${model.profile!.timeZone}'
          : 'Sesión Keycloak activa\nSincronizando perfil con API…';
    } else if (session.authenticated) {
      statusText = 'Sesión Keycloak activa\nDashboard de ejemplo';
    } else {
      statusText = 'Perfil de ejemplo\nSin cuenta conectada';
    }
    return PageContent(
      children: [
        const Eyebrow('Tu espacio, tus decisiones'),
        const SizedBox(height: 12),
        const SectionTitle(
          'Hazlo tuyo.',
          subtitle: 'Una textura y un ritmo que van contigo.',
        ),
        const SizedBox(height: 24),
        const _SyncStatusBanner(),
        LiquidSurface(
          child: Row(
            children: [
              UserAvatarMedallion(
                identity: session.authenticated ? session.userIdentity : null,
                size: 40,
                showVerifiedBadge: session.authenticated,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (session.authenticated &&
                        session.userIdentity != null &&
                        session.userIdentity!.displayName != 'Usuario Quantify')
                      Text(
                        session.userIdentity!.displayName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                    Text(statusText, style: const TextStyle(height: 1.6)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (session.authenticated)
          _ProfileAction(
            icon: Icons.logout_rounded,
            title: 'Cerrar sesión',
            onTap: session.signOut,
          ),
        _ProfileAction(
          icon: Icons.public_rounded,
          title: 'Zona horaria (${model.newHabitTimeZone})',
          onTap: () => _showTimeZoneSheet(context, model),
        ),
        _ProfileAction(
          icon: Icons.tune_rounded,
          title: 'Apariencia y Liquid Glass',
          onTap: () => showAppearance(context),
        ),
        _ProfileAction(
          icon: Icons.checklist_rounded,
          title: 'Mis hábitos',
          onTap: () => showPrototypePage(context, const HabitsPage()),
        ),
        _ProfileAction(
          icon: Icons.history_rounded,
          title: 'Historial',
          onTap: () => showPrototypePage(context, const HistoryPage()),
        ),
        _ProfileAction(
          icon: Icons.shield_outlined,
          title: 'Privacidad y alcance',
          onTap: () => showPrototypePage(
            context,
            DetailPage(
              title: 'Tu información, tus decisiones',
              children: [
                LiquidSurface(
                  child: Text(
                    model.isConnected
                        ? 'Keycloak gestiona las credenciales y el acceso con Google mediante Authorization Code + PKCE. La sesión se guarda cifrada en el almacén seguro del dispositivo sin respaldo en la nube; tus hábitos y check-ins se almacenan en PostgreSQL vía Quantify API.\n\nEl asistente conversacional Gemini requiere consentimiento explícito revocable desde IA hábitos y no retiene el historial de mensajes en el servidor. Consentimiento biométrico y dispositivos siguen pendientes.'
                        : 'Los hábitos y métricas son datos sintéticos en memoria. Cuando conectes la app con Keycloak, la sesión se guardará de forma segura en el dispositivo.\n\nConsentimiento, dispositivos y datos de negocio conectados siguen pendientes.',
                    style: const TextStyle(height: 1.8),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        const DemoNote(),
      ],
    );
  }
}

void _showTimeZoneSheet(BuildContext context, PrototypeModel model) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (sheetContext) => SafeArea(
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
        children: [
          const Text(
            'Zona horaria para nuevos hábitos',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          for (final tz in supportedTimeZones)
            ListTile(
              title: Text(tz.label),
              subtitle: Text(tz.id),
              trailing: model.newHabitTimeZone == tz.id
                  ? const Icon(Icons.check_rounded)
                  : null,
              onTap: () {
                model.setPreferredTimeZone(tz.id);
                Navigator.pop(sheetContext);
              },
            ),
        ],
      ),
    ),
  );
}

class _ProfileAction extends StatelessWidget {
  const _ProfileAction({
    required this.icon,
    required this.title,
    required this.onTap,
  });
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: LiquidSurface(
      padding: EdgeInsets.zero,
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
        leading: Icon(icon, color: context.color('icon')),
        title: Text(title),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: onTap,
      ),
    ),
  );
}

class NoticesPage extends StatelessWidget {
  const NoticesPage({super.key});
  @override
  Widget build(BuildContext context) {
    final connected = PrototypeScope.maybeOf(context)?.isConnected ?? false;
    return DetailPage(
      title: 'Todo en su momento',
      children: [
        LiquidSurface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Eyebrow(connected ? 'Estado del servicio' : 'Aviso de ejemplo'),
              const SizedBox(height: 12),
              Text(
                connected
                    ? 'Recordatorios locales pendientes'
                    : 'Tu momento de lectura · 18:00',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                connected
                    ? 'Tu cuenta ya guarda hábitos y check-ins reales en PostgreSQL. Las notificaciones en segundo plano aún no están habilitadas.'
                    : 'Vista ilustrativa. No se han programado notificaciones en el dispositivo.',
                style: const TextStyle(height: 1.7),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class AccessPreview extends StatelessWidget {
  const AccessPreview({super.key});
  @override
  Widget build(BuildContext context) {
    final session = MobileSessionScope.of(context);
    final canTrigger = session.available && !session.busy;

    return DetailPage(
      title: 'Un espacio seguro para ti',
      children: [
        StaggeredSlideFade(
          index: 0,
          offset: const Offset(24, 14),
          child: LiquidSurface(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const KeycloakLogoMark(size: 38),
                const SizedBox(height: 20),
                const Text(
                  'Tu identidad, con Keycloak.',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Inicia sesión o crea tu cuenta en Keycloak. Al terminar volverás a Quantify con tu sesión activa.',
                  style: TextStyle(height: 1.8),
                ),
                const SizedBox(height: 24),
                if (!session.available)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Text(
                      session.supported
                          ? 'Falta configurar Keycloak para este dispositivo.'
                          : 'Abre la app Android o iOS para iniciar sesión.',
                    ),
                  ),
                if (session.busy)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 14),
                    child: LinearProgressIndicator(),
                  ),
                if (session.message != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Semantics(
                      liveRegion: true,
                      child: Text(session.message!),
                    ),
                  ),
                StaggeredSlideFade(
                  index: 1,
                  child: SizedBox(
                    width: double.infinity,
                    child: AnimatedPressButton(
                      enabled: canTrigger,
                      child: FilledButton.icon(
                        onPressed: canTrigger
                            ? () => openAuthConnectionSplash(
                                context,
                                kind: AuthProviderSplashKind.keycloak,
                              )
                            : null,
                        icon: const Icon(Icons.shield_outlined, size: 20),
                        label: const Text('Continuar con Keycloak'),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                StaggeredSlideFade(
                  index: 2,
                  child: SizedBox(
                    width: double.infinity,
                    child: AnimatedPressButton(
                      enabled: canTrigger,
                      child: OutlinedButton.icon(
                        onPressed: canTrigger
                            ? () => openAuthConnectionSplash(
                                context,
                                kind: AuthProviderSplashKind.register,
                              )
                            : null,
                        icon: const QMark(size: 18),
                        label: const Text('Crear cuenta'),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 16),
                const Text(
                  'Otras formas de entrar',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 16),
                StaggeredSlideFade(
                  index: 3,
                  child: SizedBox(
                    width: double.infinity,
                    child: AnimatedPressButton(
                      enabled: canTrigger,
                      child: OutlinedButton.icon(
                        onPressed: canTrigger
                            ? () => openAuthConnectionSplash(
                                context,
                                kind: AuthProviderSplashKind.google,
                              )
                            : null,
                        icon: const GoogleLogoMark(size: 20),
                        label: const Text('Continuar con Google'),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Próximamente',
                  style: TextStyle(color: context.color('muted')),
                ),
                const SizedBox(height: 12),
                for (final provider in const [
                  (label: 'Facebook', icon: Icons.facebook_rounded),
                  (label: 'Apple ID', icon: Icons.apple_rounded),
                ])
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: null,
                        icon: Icon(provider.icon, size: 24),
                        label: Text('Continuar con ${provider.label}'),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
