import 'package:flutter/material.dart';

import 'appearance_sheet.dart';
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

class TodayPage extends StatelessWidget {
  const TodayPage({super.key});
  @override
  Widget build(BuildContext context) {
    final model = PrototypeScope.of(context);
    final active = model.habits
        .where((habit) => !habit.archived && !habit.paused)
        .toList();
    final completed = active.where((habit) => habit.progress == 1).length;
    return PageContent(
      children: [
        const Eyebrow('Un momento para ti'),
        const SizedBox(height: 12),
        const SectionTitle(
          'Tu rutina de hoy',
          subtitle: 'Haz espacio para lo que te hace bien.',
        ),
        const SizedBox(height: 20),
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
              const Text(
                'Avanza a tu ritmo.',
                style: TextStyle(color: MobileTokens.white),
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
        if (active.isEmpty)
          const LiquidSurface(
            child: Text('Tu rutina tiene espacio para una nueva intención.'),
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
        const LiquidSurface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Eyebrow('Sin prisa, con intención'),
              SizedBox(height: 12),
              Text(
                'Lo que sigue hoy',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
              ),
              SizedBox(height: 14),
              Text(
                '18:00 · Tu momento de lectura\nPuedes retomar Caminar más tarde.',
                style: TextStyle(height: 1.8),
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

class HabitsPage extends StatefulWidget {
  const HabitsPage({super.key});
  @override
  State<HabitsPage> createState() => _HabitsPageState();
}

class _HabitsPageState extends State<HabitsPage> {
  String _query = '';
  bool _archived = false;
  @override
  Widget build(BuildContext context) {
    final habits = PrototypeScope.of(context).habits
        .where(
          (habit) =>
              habit.archived == _archived &&
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
                      selected: !_archived,
                      onSelected: (_) => setState(() => _archived = false),
                    ),
                    ChoiceChip(
                      label: const Text('Archivados'),
                      selected: _archived,
                      onSelected: (_) => setState(() => _archived = true),
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
    final model = PrototypeScope.of(context), habit = model.habit(id);
    return DetailPage(
      title: 'Un paso más cerca',
      children: [
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
                    : 'Activo · America/Mexico_City',
              ),
              const SizedBox(height: 8),
              Text(
                'Días: ${habit.days.map((day) => ['L', 'M', 'X', 'J', 'V', 'S', 'D'][day - 1]).join(' · ')}',
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        if (!habit.archived) ...[
          FilledButton.icon(
            onPressed: habit.paused
                ? null
                : () => showPrototypePage(context, CheckInEditor(id: id)),
            icon: const Icon(Icons.check_rounded),
            label: const Text('Registrar avance'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => showPrototypePage(context, HabitEditor(id: id)),
            child: const Text('Editar hábito'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => model.pause(id),
            child: Text(habit.paused ? 'Reanudar hábito' : 'Pausar hábito'),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('¿Archivar este hábito?'),
                  content: const Text(
                    'Sale de tu rutina activa. El historial de esta visita se conserva.',
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
              if (confirmed == true) model.archive(id);
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
  const HabitEditor({super.key, this.id});
  final String? id;
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
    final habit = widget.id == null
        ? null
        : PrototypeScope.of(context).habit(widget.id!);
    _name.text = habit?.name ?? '';
    _target.text = habit == null ? '20' : amount(habit.target);
    _unit.text = habit?.unit ?? 'min';
    _days = {
      ...?habit?.days,
      if (habit == null) ...[1, 2, 3, 4, 5],
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
  Widget build(BuildContext context) => DetailPage(
    title: widget.id == null
        ? 'Diseña tu próximo hábito'
        : 'Dale un nuevo ritmo',
    children: [
      Form(
        key: _form,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Eyebrow('Una intención clara'),
            const SizedBox(height: 20),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Nombre del hábito'),
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
              validator: (value) =>
                  (value?.trim().isEmpty ?? true) ? 'Indica una unidad.' : null,
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
            const Text(
              'Zona de ejemplo: America/Mexico_City',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () {
                if (!_form.currentState!.validate()) return;
                if (_days.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Selecciona al menos un día.'),
                    ),
                  );
                  return;
                }
                PrototypeScope.of(context).save(
                  id: widget.id,
                  name: _name.text,
                  target: double.parse(_target.text.replaceAll(',', '.')),
                  unit: _unit.text,
                  days: _days.toList()..sort(),
                );
                Navigator.pop(context);
              },
              child: const Text('Guardar en la demostración'),
            ),
            const SizedBox(height: 16),
            const DemoNote(),
          ],
        ),
      ),
    ],
  );
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
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      _value.text = amount(PrototypeScope.of(context).habit(widget.id).value);
    }
  }

  @override
  void dispose() {
    _value.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final habit = PrototypeScope.of(context).habit(widget.id);
    return DetailPage(
      title: 'Cada avance cuenta',
      children: [
        SectionTitle(
          habit.name,
          subtitle: 'Valor acumulado del día. Corregirlo reemplaza el valor anterior.',
        ),
        const SizedBox(height: 24),
        Form(
          key: _form,
          child: TextFormField(
            controller: _value,
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
        const Text(
          '20 nov 2026 · Fecha de ejemplo\nAmerica/Mexico_City',
          style: TextStyle(height: 1.7),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: habit.paused || habit.archived
              ? null
              : () {
                  if (!_form.currentState!.validate()) return;
                  PrototypeScope.of(context).setValue(
                    habit.id,
                    double.parse(_value.text.replaceAll(',', '.')),
                  );
                  Navigator.pop(context);
                },
          child: const Text('Previsualizar avance'),
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
  List<double> get _values =>
      _month ? const [45, 65, 75, 85] : const [30, 55, 40, 80, 65, 90, 70];
  List<String> get _labels => _month
      ? const ['S1', 'S2', 'S3', 'S4']
      : const ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  @override
  Widget build(BuildContext context) => PageContent(
    children: [
      const Eyebrow('Cada avance tiene historia'),
      const SizedBox(height: 12),
      const SectionTitle(
        'Observa tu constancia',
        subtitle: 'Una mirada a tus avances, más allá de una racha.',
      ),
      const SizedBox(height: 20),
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
            const Eyebrow('Tendencia ilustrativa'),
            const SizedBox(height: 14),
            Text(
              _month ? 'Un mes, muchos pasos.' : 'Tu semana, paso a paso.',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 24),
            Semantics(
              label: _month
                  ? 'Gráfico mensual de ejemplo: semana 1, 45; semana 2, 65; semana 3, 75; semana 4, 85 por ciento.'
                  : 'Gráfico semanal de ejemplo: lunes 30, martes 55, miércoles 40, jueves 80, viernes 65, sábado 90 y domingo 70 por ciento.',
              child: ExcludeSemantics(
                child: SizedBox(
                  height: 130,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(
                      _values.length,
                      (index) => Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 5),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Container(
                                height: _values[index],
                                decoration: BoxDecoration(
                                  color: index == _values.length - 1
                                      ? MobileTokens.laserBlue
                                      : context
                                            .color('icon')
                                            .withValues(alpha: .25),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _labels[index],
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
            const Text(
              'Valores de muestra. No son métricas oficiales.',
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
      const SizedBox(height: 18),
      OutlinedButton.icon(
        onPressed: () => showPrototypePage(context, const HistoryPage()),
        icon: const Icon(Icons.history_rounded),
        label: const Text('Ver historial de esta visita'),
      ),
      const SizedBox(height: 18),
      const DemoNote(),
    ],
  );
}

class HistoryPage extends StatelessWidget {
  const HistoryPage({super.key});
  @override
  Widget build(BuildContext context) {
    final entries = PrototypeScope.of(context).entries;
    return DetailPage(
      title: 'Tu historial de ejemplo',
      children: [
        if (entries.isEmpty)
          const LiquidSurface(
            child: Text('Aún no registras avances durante esta visita.'),
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

class AssistantPage extends StatelessWidget {
  const AssistantPage({super.key});
  @override
  Widget build(BuildContext context) => PageContent(
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
            const Text(
              'Aquí irá tu asistente.',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            const Text(
              'El asistente conversacional aún no está conectado. Por ahora puedes diseñar un hábito manualmente, con calma y a tu medida.',
              style: TextStyle(height: 1.7),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => showPrototypePage(context, const HabitEditor()),
              child: const Text('Crear hábito manualmente'),
            ),
          ],
        ),
      ),
      const SizedBox(height: 20),
      const DemoNote(),
    ],
  );
}

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});
  @override
  Widget build(BuildContext context) => PageContent(
    children: [
      const Eyebrow('Tu espacio, tus decisiones'),
      const SizedBox(height: 12),
      const SectionTitle(
        'Hazlo tuyo.',
        subtitle: 'Una textura y un ritmo que van contigo.',
      ),
      const SizedBox(height: 24),
      LiquidSurface(
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: context.color('icon').withValues(alpha: .1),
              child: Icon(
                Icons.person_outline_rounded,
                color: context.color('icon'),
              ),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Text(
                'Perfil de ejemplo\nSin cuenta conectada',
                style: TextStyle(height: 1.6),
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
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
          const DetailPage(
            title: 'Tu información, tus decisiones',
            children: [
              LiquidSurface(
                child: Text(
                  'Solo datos sintéticos en memoria. No se recogen credenciales, biometría ni conversaciones.\n\nConsentimiento, dispositivos y sesión real siguen pendientes de integración.',
                  style: TextStyle(height: 1.8),
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
  Widget build(BuildContext context) => const DetailPage(
    title: 'Todo en su momento',
    children: [
      LiquidSurface(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Eyebrow('Aviso de ejemplo'),
            SizedBox(height: 12),
            Text(
              'Tu momento de lectura · 18:00',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            SizedBox(height: 12),
            Text(
              'Vista ilustrativa. No se han programado notificaciones en el dispositivo.',
              style: TextStyle(height: 1.7),
            ),
          ],
        ),
      ),
    ],
  );
}

class AccessPreview extends StatelessWidget {
  const AccessPreview({super.key});
  @override
  Widget build(BuildContext context) => const DetailPage(
    title: 'Un espacio seguro para ti',
    children: [
      LiquidSurface(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.shield_outlined, size: 36),
            SizedBox(height: 20),
            Text(
              'Tu identidad, con Keycloak.',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
            ),
            SizedBox(height: 18),
            Text(
              'El acceso OIDC del cliente móvil está pendiente. Esta vista no recibe contraseñas ni crea una sesión.',
              style: TextStyle(height: 1.8),
            ),
            SizedBox(height: 24),
            FilledButton(
              onPressed: null,
              child: Text('Acceso institucional pendiente'),
            ),
          ],
        ),
      ),
    ],
  );
}
