import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../domain/entities/sapeur_pompier.dart';
import '../../../domain/entities/etat_civil.dart';
import '../../../domain/entities/constantes.dart';
import '../../../domain/entities/examen_incorporation.dart';
import '../../../domain/entities/operation.dart';
import '../../../domain/entities/vaccination.dart';
import '../../../domain/entities/visite_sanitaire.dart';
import '../../../domain/entities/indisponibilite.dart';
import '../../../domain/entities/certificat.dart';
import '../../../domain/entities/decision_reforme.dart';
import '../../../domain/entities/controle_fin_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/sapeur_pompier_provider.dart';

// ---------------------------------------------------------------------------
// Provider dédié au détail d'un SP
// ---------------------------------------------------------------------------
final detailSapeurPompierProvider =
    FutureProvider.family<SapeurPompier?, String>((ref, id) async {
  final repo = ref.watch(sapeurPompierRepositoryProvider);
  final result = await repo.getSapeurPompierById(id);
  return result.fold((_) => null, (sp) => sp);
});

// ---------------------------------------------------------------------------
// Écran principal
// ---------------------------------------------------------------------------
class DetailScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const DetailScreen({Key? key, required this.sapeurPompierId})
      : super(key: key);

  @override
  ConsumerState<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends ConsumerState<DetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Labels et icônes des 11 onglets
  static const List<_TabInfo> _tabs = [
    _TabInfo(icon: Icons.dashboard, label: 'Résumé'),
    _TabInfo(icon: Icons.person, label: 'État Civil'),
    _TabInfo(icon: Icons.monitor_weight, label: 'Constantes'),
    _TabInfo(icon: Icons.medical_services, label: 'Incorporation'),
    _TabInfo(icon: Icons.military_tech, label: 'Opérations'),
    _TabInfo(icon: Icons.vaccines, label: 'Vaccinations'),
    _TabInfo(icon: Icons.local_hospital, label: 'Visites'),
    _TabInfo(icon: Icons.home, label: 'Indispo.'),
    _TabInfo(icon: Icons.description, label: 'Certificats'),
    _TabInfo(icon: Icons.balance, label: 'Réforme'),
    _TabInfo(icon: Icons.flag, label: 'Fin service'),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Couleur du badge statut
  // ---------------------------------------------------------------------------
  Color _statutColor(SapeurPompier sp) {
    if (sp.isApte) return AppColors.statusApte;
    if (sp.isInapte) return AppColors.statusInapte;
    return AppColors.statusEnAttente;
  }

  String _statutLabel(SapeurPompier sp) {
    if (sp.isApte) return 'Apte';
    if (sp.isInapte) return 'Inapte';
    return 'Non évalué';
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final detailAsync =
        ref.watch(detailSapeurPompierProvider(widget.sapeurPompierId));
    final canEdit = ref.watch(canEditProvider);
    final isAdmin = ref.watch(isAdminProvider);

    return detailAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          title: const Text('Chargement...'),
        ),
        body: const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      ),
      error: (err, _) => Scaffold(
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          title: const Text('Erreur'),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline,
                  color: AppColors.error, size: 64),
              const SizedBox(height: 16),
              Text('Erreur: $err',
                  style: const TextStyle(color: AppColors.error)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref
                    .refresh(detailSapeurPompierProvider(widget.sapeurPompierId)),
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary),
              ),
            ],
          ),
        ),
      ),
      data: (sp) {
        if (sp == null) {
          return Scaffold(
            appBar: AppBar(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              title: const Text('Dossier introuvable'),
            ),
            body: const Center(
              child: Text('Ce dossier n\'existe pas ou a été supprimé.'),
            ),
          );
        }
        return _buildScaffold(context, sp, canEdit, isAdmin);
      },
    );
  }

  Widget _buildScaffold(
      BuildContext context, SapeurPompier sp, bool canEdit, bool isAdmin) {
    final statutColor = _statutColor(sp);
    final statutLabel = _statutLabel(sp);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 130,
              pinned: true,
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding:
                    const EdgeInsets.only(left: 56, bottom: 56, right: 120),
                title: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sp.nomComplet,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      sp.matricule,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 12,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppColors.primaryDark, AppColors.primary],
                    ),
                  ),
                ),
              ),
              actions: [
                // Badge statut
                Container(
                  margin: const EdgeInsets.only(top: 8, right: 4),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statutColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statutColor, width: 1.5),
                  ),
                  child: Text(
                    statutLabel,
                    style: TextStyle(
                      color: statutColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (canEdit)
                  IconButton(
                    icon: const Icon(Icons.edit),
                    tooltip: 'Modifier',
                    onPressed: () => Navigator.of(context).pushNamed(
                      '/sapeur-pompier/edit',
                      arguments: sp.id,
                    ),
                  ),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert),
                  onSelected: (value) => _handleMenuAction(context, sp, value),
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'export_pdf',
                      child: Row(children: [
                        Icon(Icons.picture_as_pdf, color: AppColors.error),
                        SizedBox(width: 12),
                        Text('Exporter PDF'),
                      ]),
                    ),
                    if (isAdmin) ...[
                      const PopupMenuDivider(),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(children: [
                          Icon(Icons.delete_forever, color: AppColors.error),
                          SizedBox(width: 12),
                          Text('Supprimer',
                              style: TextStyle(color: AppColors.error)),
                        ]),
                      ),
                    ],
                  ],
                ),
              ],
              bottom: TabBar(
                controller: _tabController,
                isScrollable: true,
                indicatorColor: Colors.white,
                indicatorWeight: 3,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white60,
                labelPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                tabs: _tabs
                    .map((t) => Tab(
                          icon: Icon(t.icon, size: 18),
                          text: t.label,
                          iconMargin: const EdgeInsets.only(bottom: 2),
                        ))
                    .toList(),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _ResumeTab(sp: sp, onNavigateToTab: (int index, {bool animate = true}) {
              _tabController.animateTo(index);
            }),
            _EtatCivilTab(sp: sp, canEdit: canEdit),
            _ConstantesTab(sp: sp, canEdit: canEdit),
            _ExamenIncorporationTab(sp: sp, canEdit: canEdit),
            _OperationsTab(sp: sp, canEdit: canEdit),
            _VaccinationsTab(sp: sp, canEdit: canEdit),
            _VisitesTab(sp: sp, canEdit: canEdit),
            _IndisponibilitesTab(sp: sp, canEdit: canEdit),
            _CertificatsTab(sp: sp, canEdit: canEdit),
            _ReformeTab(sp: sp, canEdit: canEdit),
            _FinServiceTab(sp: sp, canEdit: canEdit),
          ],
        ),
      ),
    );
  }

  void _handleMenuAction(
      BuildContext context, SapeurPompier sp, String action) {
    switch (action) {
      case 'export_pdf':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(children: [
              SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white)),
              SizedBox(width: 12),
              Text(AppStrings.generatingPdf),
            ]),
            backgroundColor: AppColors.info,
            duration: Duration(seconds: 2),
          ),
        );
        break;
      case 'delete':
        _showDeleteConfirmation(context, sp);
        break;
    }
  }

  void _showDeleteConfirmation(BuildContext context, SapeurPompier sp) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(children: [
          Icon(Icons.warning, color: AppColors.error),
          SizedBox(width: 8),
          Text('Confirmer la suppression'),
        ]),
        content: Text(
          'Êtes-vous sûr de vouloir supprimer définitivement le dossier de '
          '${sp.nomComplet} (${sp.matricule}) ?\n\n'
          'Cette action est irréversible.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text(AppStrings.cancel),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.of(ctx).pop();
              final success = await ref
                  .read(sapeursPompiersProvider.notifier)
                  .deleteSapeurPompier(sp.id);
              if (mounted) {
                if (success) {
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(AppStrings.deleteSuccess),
                      backgroundColor: AppColors.success,
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(AppStrings.saveError),
                      backgroundColor: AppColors.error,
                    ),
                  );
                }
              }
            },
            icon: const Icon(Icons.delete_forever),
            label: const Text('Supprimer'),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Data class pour onglet
// ---------------------------------------------------------------------------
class _TabInfo {
  final IconData icon;
  final String label;
  const _TabInfo({required this.icon, required this.label});
}

// ===========================================================================
// ONGLET 0 — RÉSUMÉ
// ===========================================================================
class _ResumeTab extends StatelessWidget {
  final SapeurPompier sp;
  final void Function(int, {bool animate}) onNavigateToTab;

  const _ResumeTab({required this.sp, required this.onNavigateToTab});

  @override
  Widget build(BuildContext context) {
    final completion = sp.completionPercentage;
    final dernVisite = sp.derniereVisite;
    final alertes = <_AlerteItem>[];

    if (sp.visiteAnnuelleEnRetard) {
      alertes.add(const _AlerteItem(
        icon: Icons.schedule,
        label: AppStrings.alertVisiteEnRetard,
        color: AppColors.alertHigh,
      ));
    }
    for (int i = 0; i < sp.vaccinationsExpirees; i++) {
      alertes.add(const _AlerteItem(
        icon: Icons.vaccines,
        label: AppStrings.alertVaccinationExpiree,
        color: AppColors.alertCritical,
      ));
    }
    for (int i = 0; i < sp.vaccinationsProchesExpiration; i++) {
      alertes.add(const _AlerteItem(
        icon: Icons.warning_amber,
        label: AppStrings.alertVaccinationProche,
        color: AppColors.alertMedium,
      ));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Carte identité
          Card(
            elevation: 2,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.person,
                        color: AppColors.primary, size: 44),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          sp.nomComplet,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          sp.matricule,
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.5,
                          ),
                        ),
                        if (sp.age != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            '${sp.age} ans',
                            style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 13),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Complétude du dossier
          Card(
            elevation: 2,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Complétude du dossier',
                        style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary),
                      ),
                      Text(
                        '${completion.toStringAsFixed(0)}%',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: completion >= 70
                              ? AppColors.success
                              : AppColors.warning,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: completion / 100,
                      backgroundColor: AppColors.border,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        completion >= 70
                            ? AppColors.success
                            : AppColors.warning,
                      ),
                      minHeight: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Statut médical
          Card(
            elevation: 2,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: (sp.isApte
                          ? AppColors.statusApte
                          : sp.isInapte
                              ? AppColors.statusInapte
                              : AppColors.statusEnAttente)
                      .withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  sp.isApte
                      ? Icons.check_circle
                      : sp.isInapte
                          ? Icons.cancel
                          : Icons.help_outline,
                  color: sp.isApte
                      ? AppColors.statusApte
                      : sp.isInapte
                          ? AppColors.statusInapte
                          : AppColors.statusEnAttente,
                ),
              ),
              title: const Text('Statut médical',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              trailing: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: (sp.isApte
                          ? AppColors.statusApte
                          : sp.isInapte
                              ? AppColors.statusInapte
                              : AppColors.statusEnAttente)
                      .withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  sp.statutMedical,
                  style: TextStyle(
                    color: sp.isApte
                        ? AppColors.statusApte
                        : sp.isInapte
                            ? AppColors.statusInapte
                            : AppColors.statusEnAttente,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),

          // Alertes actives
          if (alertes.isNotEmpty) ...[
            const SizedBox(height: 16),
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppColors.error.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.warning,
                              color: AppColors.error, size: 18),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${alertes.length} alerte(s) active(s)',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppColors.error,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...alertes.map((a) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Icon(a.icon, color: a.color, size: 16),
                              const SizedBox(width: 8),
                              Text(a.label,
                                  style: TextStyle(color: a.color, fontSize: 13)),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
            ),
          ],

          // Dernière visite
          const SizedBox(height: 16),
          Card(
            elevation: 2,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.info.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child:
                    const Icon(Icons.local_hospital, color: AppColors.info),
              ),
              title: const Text('Dernière visite sanitaire',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(
                dernVisite != null
                    ? DateFormat('dd/MM/yyyy').format(dernVisite.dateVisite)
                    : 'Aucune visite enregistrée',
              ),
              trailing: dernVisite != null && sp.visiteAnnuelleEnRetard
                  ? const Icon(Icons.warning, color: AppColors.warning)
                  : null,
            ),
          ),

          // Boutons rapides
          const SizedBox(height: 24),
          const Text(
            'Accès rapide aux sections',
            style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 3,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.2,
            children: [
              _quickAccessTile(Icons.person, 'État Civil', 1),
              _quickAccessTile(Icons.monitor_weight, 'Constantes', 2),
              _quickAccessTile(Icons.medical_services, 'Incorporation', 3),
              _quickAccessTile(Icons.military_tech, 'Opérations', 4),
              _quickAccessTile(Icons.vaccines, 'Vaccinations', 5),
              _quickAccessTile(Icons.local_hospital, 'Visites', 6),
              _quickAccessTile(Icons.home, 'Indispo.', 7),
              _quickAccessTile(Icons.description, 'Certificats', 8),
              _quickAccessTile(Icons.balance, 'Réforme', 9),
            ],
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _quickAccessTile(IconData icon, String label, int tabIndex) {
    return GestureDetector(
      onTap: () => onNavigateToTab(tabIndex),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 6,
              offset: const Offset(0, 2),
            )
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.primary, size: 28),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _AlerteItem {
  final IconData icon;
  final String label;
  final Color color;
  const _AlerteItem(
      {required this.icon, required this.label, required this.color});
}

// ===========================================================================
// ONGLET 1 — ÉTAT CIVIL
// ===========================================================================
class _EtatCivilTab extends StatelessWidget {
  final SapeurPompier sp;
  final bool canEdit;
  const _EtatCivilTab({required this.sp, required this.canEdit});

  @override
  Widget build(BuildContext context) {
    final ec = sp.etatCivil;
    return _SectionWrapper(
      sapeurPompierId: sp.id,
      canEdit: canEdit,
      routeEdit: '/sapeur-pompier/etat-civil',
      child: ec == null
          ? _EmptySection(
              icon: Icons.person_add,
              message: 'Aucun état civil enregistré',
              action: canEdit ? 'Ajouter l\'état civil' : null,
              onAction: canEdit
                  ? () => Navigator.of(context).pushNamed(
                        '/sapeur-pompier/etat-civil',
                        arguments: sp.id,
                      )
                  : null,
            )
          : Column(
              children: [
                _InfoRow('Nom', ec.nom),
                _InfoRow('Prénoms', ec.prenoms),
                _InfoRow(
                    'Date de naissance',
                    DateFormat('dd/MM/yyyy').format(ec.dateNaissance)),
                _InfoRow('Age', '${ec.age} ans'),
                _InfoRow('Lieu de naissance', ec.lieuNaissance),
                if (ec.nomPere != null) _InfoRow('Nom du père', ec.nomPere!),
                if (ec.nomMere != null) _InfoRow('Nom de la mère', ec.nomMere!),
                if (ec.contactUrgence1 != null) ...[
                  const _SectionDivider(label: 'Contacts d\'urgence'),
                  _InfoRow('Contact 1', ec.contactUrgence1!.nom),
                  _InfoRow('Téléphone', ec.contactUrgence1!.telephone),
                  _InfoRow('Lien', ec.contactUrgence1!.lien),
                ],
                if (ec.contactUrgence2 != null) ...[
                  _InfoRow('Contact 2', ec.contactUrgence2!.nom),
                  _InfoRow('Téléphone', ec.contactUrgence2!.telephone),
                  _InfoRow('Lien', ec.contactUrgence2!.lien),
                ],
                if (ec.contactUrgence3 != null) ...[
                  _InfoRow('Contact 3', ec.contactUrgence3!.nom),
                  _InfoRow('Téléphone', ec.contactUrgence3!.telephone),
                  _InfoRow('Lien', ec.contactUrgence3!.lien),
                ],
              ],
            ),
    );
  }
}

// ===========================================================================
// ONGLET 2 — CONSTANTES
// ===========================================================================
class _ConstantesTab extends StatelessWidget {
  final SapeurPompier sp;
  final bool canEdit;
  const _ConstantesTab({required this.sp, required this.canEdit});

  @override
  Widget build(BuildContext context) {
    final c = sp.constantes;
    return _SectionWrapper(
      sapeurPompierId: sp.id,
      canEdit: canEdit,
      routeEdit: '/sapeur-pompier/constantes',
      child: c == null
          ? _EmptySection(
              icon: Icons.monitor_weight,
              message: 'Aucune constante enregistrée',
              action: canEdit ? 'Ajouter les constantes' : null,
              onAction: canEdit
                  ? () => Navigator.of(context).pushNamed(
                        '/sapeur-pompier/constantes',
                        arguments: sp.id,
                      )
                  : null,
            )
          : Column(
              children: [
                if (c.taille != null)
                  _InfoRow('Taille', '${c.taille!.toStringAsFixed(1)} cm'),
                if (c.poids != null)
                  _InfoRow('Poids', '${c.poids!.toStringAsFixed(1)} kg'),
                if (c.imc != null)
                  _InfoRow('IMC', c.imc!.toStringAsFixed(2)),
                if (c.perimetreThoracique != null)
                  _InfoRow('Périmètre thoracique',
                      '${c.perimetreThoracique!.toStringAsFixed(1)} cm'),
                if (c.perimetreAbdominal != null)
                  _InfoRow('Périmètre abdominal',
                      '${c.perimetreAbdominal!.toStringAsFixed(1)} cm'),
              ],
            ),
    );
  }
}

// ===========================================================================
// ONGLET 3 — EXAMEN D'INCORPORATION
// ===========================================================================
class _ExamenIncorporationTab extends StatelessWidget {
  final SapeurPompier sp;
  final bool canEdit;
  const _ExamenIncorporationTab({required this.sp, required this.canEdit});

  @override
  Widget build(BuildContext context) {
    final ei = sp.examenIncorporation;
    return _SectionWrapper(
      sapeurPompierId: sp.id,
      canEdit: canEdit,
      routeEdit: '/sapeur-pompier/examen-incorporation',
      child: ei == null
          ? _EmptySection(
              icon: Icons.medical_services,
              message: 'Aucun examen d\'incorporation',
              action: canEdit ? 'Saisir l\'examen' : null,
              onAction: canEdit
                  ? () => Navigator.of(context).pushNamed(
                        '/sapeur-pompier/examen-incorporation',
                        arguments: sp.id,
                      )
                  : null,
            )
          : Column(
              children: [
                if (ei.decision != null)
                  _InfoRow('Décision', ei.decision!,
                      valueColor: ei.isApte
                          ? AppColors.success
                          : AppColors.error),
                if (ei.nomMedecin != null)
                  _InfoRow('Médecin', ei.nomMedecin!),
                if (ei.dateCloture != null)
                  _InfoRow('Date clôture',
                      DateFormat('dd/MM/yyyy').format(ei.dateCloture!)),
                if (ei.mentionsSpeciales != null)
                  _InfoRow('Mentions spéciales', ei.mentionsSpeciales!),
              ],
            ),
    );
  }
}

// ===========================================================================
// ONGLET 4 — OPÉRATIONS
// ===========================================================================
class _OperationsTab extends StatelessWidget {
  final SapeurPompier sp;
  final bool canEdit;
  const _OperationsTab({required this.sp, required this.canEdit});

  @override
  Widget build(BuildContext context) {
    final ops = sp.operations;
    return _SectionWrapper(
      sapeurPompierId: sp.id,
      canEdit: canEdit,
      routeEdit: '/sapeur-pompier/operations',
      child: ops.isEmpty
          ? _EmptySection(
              icon: Icons.military_tech,
              message: 'Aucune opération enregistrée',
              action: canEdit ? 'Ajouter une opération' : null,
              onAction: canEdit
                  ? () => Navigator.of(context).pushNamed(
                        '/sapeur-pompier/operations',
                        arguments: sp.id,
                      )
                  : null,
            )
          : Column(
              children: ops
                  .map((op) => _OperationCard(operation: op))
                  .toList(),
            ),
    );
  }
}

class _OperationCard extends StatelessWidget {
  final Operation operation;
  const _OperationCard({required this.operation});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Séjour ${operation.numeroSejour}',
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12),
                  ),
                ),
                const Spacer(),
                Text(
                  '${operation.dateDepart != null ? DateFormat('dd/MM/yy').format(operation.dateDepart!) : '...'} → '
                  '${operation.dateRetour != null ? DateFormat('dd/MM/yy').format(operation.dateRetour!) : '...'}',
                  style: const TextStyle(
                      color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              operation.lieuSejour ?? '',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            if (operation.etatSanteDepart != null)
              Text(
                'Santé départ: ${operation.etatSanteDepart}',
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 12),
              ),
          ],
        ),
      ),
    );
  }
}

// ===========================================================================
// ONGLET 5 — VACCINATIONS
// ===========================================================================
class _VaccinationsTab extends StatelessWidget {
  final SapeurPompier sp;
  final bool canEdit;
  const _VaccinationsTab({required this.sp, required this.canEdit});

  @override
  Widget build(BuildContext context) {
    final vaccins = sp.vaccinations;
    return _SectionWrapper(
      sapeurPompierId: sp.id,
      canEdit: canEdit,
      routeEdit: '/sapeur-pompier/vaccinations',
      child: vaccins.isEmpty
          ? _EmptySection(
              icon: Icons.vaccines,
              message: 'Aucune vaccination enregistrée',
              action: canEdit ? 'Ajouter une vaccination' : null,
              onAction: canEdit
                  ? () => Navigator.of(context).pushNamed(
                        '/sapeur-pompier/vaccinations',
                        arguments: sp.id,
                      )
                  : null,
            )
          : Column(
              children: vaccins
                  .map((v) => _VaccinCard(vaccination: v))
                  .toList(),
            ),
    );
  }
}

class _VaccinCard extends StatelessWidget {
  final Vaccination vaccination;
  const _VaccinCard({required this.vaccination});

  @override
  Widget build(BuildContext context) {
    final isExpire = vaccination.isExpire;
    final isProche = vaccination.isProcheDExpiration;
    final statusColor = isExpire
        ? AppColors.error
        : isProche
            ? AppColors.warning
            : AppColors.success;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: statusColor.withOpacity(0.4)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.vaccines, color: statusColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    vaccination.typeVaccin,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Le ${DateFormat('dd/MM/yyyy').format(vaccination.dateVaccination)}',
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 12),
                  ),
                  if (vaccination.dateRappel != null)
                    Text(
                      'Rappel: ${DateFormat('dd/MM/yyyy').format(vaccination.dateRappel!)}',
                      style: TextStyle(color: statusColor, fontSize: 12),
                    ),
                ],
              ),
            ),
            if (isExpire)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Expiré',
                  style: TextStyle(
                      color: AppColors.error,
                      fontSize: 11,
                      fontWeight: FontWeight.bold),
                ),
              )
            else if (isProche)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Bientôt',
                  style: TextStyle(
                      color: AppColors.warning,
                      fontSize: 11,
                      fontWeight: FontWeight.bold),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ===========================================================================
// ONGLET 6 — VISITES SANITAIRES
// ===========================================================================
class _VisitesTab extends StatelessWidget {
  final SapeurPompier sp;
  final bool canEdit;
  const _VisitesTab({required this.sp, required this.canEdit});

  @override
  Widget build(BuildContext context) {
    final visites = sp.visitesSanitaires;
    return _SectionWrapper(
      sapeurPompierId: sp.id,
      canEdit: canEdit,
      routeEdit: '/sapeur-pompier/visites',
      child: visites.isEmpty
          ? _EmptySection(
              icon: Icons.local_hospital,
              message: 'Aucune visite sanitaire',
              action: canEdit ? 'Ajouter une visite' : null,
              onAction: canEdit
                  ? () => Navigator.of(context).pushNamed(
                        '/sapeur-pompier/visites',
                        arguments: sp.id,
                      )
                  : null,
            )
          : Column(
              children: visites
                  .map((v) => _VisiteCard(visite: v))
                  .toList(),
            ),
    );
  }
}

class _VisiteCard extends StatelessWidget {
  final VisiteSanitaire visite;
  const _VisiteCard({required this.visite});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.info.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.local_hospital, color: AppColors.info),
        ),
        title: Text(
          DateFormat('dd MMMM yyyy', 'fr').format(visite.dateVisite),
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: visite.entiteCorps != null
            ? Text(visite.entiteCorps!)
            : null,
        trailing: visite.resultats != null
            ? Text(
                visite.resultats!,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 12),
              )
            : null,
      ),
    );
  }
}

// ===========================================================================
// ONGLET 7 — INDISPONIBILITÉS
// ===========================================================================
class _IndisponibilitesTab extends StatelessWidget {
  final SapeurPompier sp;
  final bool canEdit;
  const _IndisponibilitesTab({required this.sp, required this.canEdit});

  @override
  Widget build(BuildContext context) {
    final indispos = sp.indisponibilites;
    return _SectionWrapper(
      sapeurPompierId: sp.id,
      canEdit: canEdit,
      routeEdit: '/sapeur-pompier/indisponibilites',
      child: indispos.isEmpty
          ? _EmptySection(
              icon: Icons.home,
              message: 'Aucune indisponibilité',
              action: canEdit ? 'Ajouter une indisponibilité' : null,
              onAction: canEdit
                  ? () => Navigator.of(context).pushNamed(
                        '/sapeur-pompier/indisponibilites',
                        arguments: sp.id,
                      )
                  : null,
            )
          : Column(
              children: [
                _StatBadge(
                  label: 'Total jours',
                  value: '${sp.totalJoursIndisponibilite} j',
                  color: AppColors.warning,
                ),
                const SizedBox(height: 12),
                ...indispos.map((i) => _IndispoCard(indisponibilite: i)),
              ],
            ),
    );
  }
}

class _IndispoCard extends StatelessWidget {
  final Indisponibilite indisponibilite;
  const _IndispoCard({required this.indisponibilite});

  @override
  Widget build(BuildContext context) {
    final isEnCours = indisponibilite.isEnCours;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: isEnCours
            ? const BorderSide(color: AppColors.warning)
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    indisponibilite.diagnostic ?? 'Diagnostic non précisé',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                if (isEnCours)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'En cours',
                      style: TextStyle(
                          color: AppColors.warning,
                          fontSize: 11,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              '${DateFormat('dd/MM/yyyy').format(indisponibilite.dateDebut)} → '
              '${indisponibilite.dateFin != null ? DateFormat('dd/MM/yyyy').format(indisponibilite.dateFin!) : 'En cours'}',
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 4),
            Text(
              'Durée totale: ${indisponibilite.dureeTotale} jour(s)',
              style: const TextStyle(fontSize: 12, color: AppColors.info),
            ),
          ],
        ),
      ),
    );
  }
}

// ===========================================================================
// ONGLET 8 — CERTIFICATS
// ===========================================================================
class _CertificatsTab extends StatelessWidget {
  final SapeurPompier sp;
  final bool canEdit;
  const _CertificatsTab({required this.sp, required this.canEdit});

  @override
  Widget build(BuildContext context) {
    final certs = sp.certificats;
    return _SectionWrapper(
      sapeurPompierId: sp.id,
      canEdit: canEdit,
      routeEdit: '/sapeur-pompier/certificats',
      child: certs.isEmpty
          ? _EmptySection(
              icon: Icons.description,
              message: 'Aucun certificat',
              action: canEdit ? 'Ajouter un certificat' : null,
              onAction: canEdit
                  ? () => Navigator.of(context).pushNamed(
                        '/sapeur-pompier/certificats',
                        arguments: sp.id,
                      )
                  : null,
            )
          : Column(
              children: certs
                  .map((c) => _CertificatCard(certificat: c))
                  .toList(),
            ),
    );
  }
}

class _CertificatCard extends StatelessWidget {
  final Certificat certificat;
  const _CertificatCard({required this.certificat});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.secondary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.description, color: AppColors.secondary),
        ),
        title: Text(
          certificat.titre ?? 'Certificat',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: certificat.dateCertificat != null
            ? Text(DateFormat('dd/MM/yyyy').format(certificat.dateCertificat!))
            : null,
        trailing: certificat.typeCertificat != null
            ? Chip(
                label: Text(certificat.typeCertificat!.name,
                    style: const TextStyle(fontSize: 11)),
                padding: EdgeInsets.zero,
                backgroundColor:
                    AppColors.secondary.withOpacity(0.1),
              )
            : null,
      ),
    );
  }
}

// ===========================================================================
// ONGLET 9 — DÉCISION DE RÉFORME
// ===========================================================================
class _ReformeTab extends StatelessWidget {
  final SapeurPompier sp;
  final bool canEdit;
  const _ReformeTab({required this.sp, required this.canEdit});

  @override
  Widget build(BuildContext context) {
    final decisions = sp.decisionsReforme;
    return _SectionWrapper(
      sapeurPompierId: sp.id,
      canEdit: canEdit,
      routeEdit: '/sapeur-pompier/reforme',
      child: decisions.isEmpty
          ? _EmptySection(
              icon: Icons.balance,
              message: 'Aucune décision de réforme',
              action: canEdit ? 'Ajouter une décision' : null,
              onAction: canEdit
                  ? () => Navigator.of(context).pushNamed(
                        '/sapeur-pompier/reforme',
                        arguments: sp.id,
                      )
                  : null,
            )
          : Column(
              children: decisions
                  .map((d) => _DecisionCard(decision: d))
                  .toList(),
            ),
    );
  }
}

class _DecisionCard extends StatelessWidget {
  final DecisionReforme decision;
  const _DecisionCard({required this.decision});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    decision.typeDecision ?? '-',
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12),
                  ),
                ),
                const Spacer(),
                if (decision.dateDecision != null)
                  Text(
                    DateFormat('dd/MM/yyyy').format(decision.dateDecision!),
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 12),
                  ),
              ],
            ),
            if (decision.observations != null) ...[
              const SizedBox(height: 8),
              Text(
                decision.observations!,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 13),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ===========================================================================
// ONGLET 10 — FIN DE SERVICE
// ===========================================================================
class _FinServiceTab extends StatelessWidget {
  final SapeurPompier sp;
  final bool canEdit;
  const _FinServiceTab({required this.sp, required this.canEdit});

  @override
  Widget build(BuildContext context) {
    final ctrl = sp.controleFinService;
    return _SectionWrapper(
      sapeurPompierId: sp.id,
      canEdit: canEdit,
      routeEdit: '/sapeur-pompier/fin-service',
      child: ctrl == null
          ? _EmptySection(
              icon: Icons.flag,
              message: 'Aucun contrôle de fin de service',
              action: canEdit ? 'Ajouter le contrôle' : null,
              onAction: canEdit
                  ? () => Navigator.of(context).pushNamed(
                        '/sapeur-pompier/fin-service',
                        arguments: sp.id,
                      )
                  : null,
            )
          : Column(
              children: [
                if (ctrl.dateRadiation != null)
                  _InfoRow('Date de radiation',
                      DateFormat('dd/MM/yyyy').format(ctrl.dateRadiation!)),
                if (ctrl.lieuExamen != null)
                  _InfoRow('Lieu d\'examen', ctrl.lieuExamen!),
                if (ctrl.etatSante != null)
                  _InfoRow('État de santé', ctrl.etatSante!),
                if (ctrl.nomMedecin != null)
                  _InfoRow('Médecin', ctrl.nomMedecin!),
              ],
            ),
    );
  }
}

// ===========================================================================
// COMPOSANTS RÉUTILISABLES
// ===========================================================================

/// Wrapper commun pour les sections avec bouton "Modifier"
class _SectionWrapper extends StatelessWidget {
  final String sapeurPompierId;
  final bool canEdit;
  final String routeEdit;
  final Widget child;

  const _SectionWrapper({
    required this.sapeurPompierId,
    required this.canEdit,
    required this.routeEdit,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: child,
            ),
          ),
          if (canEdit) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.of(context)
                    .pushNamed(routeEdit, arguments: sapeurPompierId),
                icon: const Icon(Icons.edit),
                label: const Text('Modifier cette section'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ],
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

/// Ligne d'information label/valeur
class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow(this.label, this.value, {this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 160,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value.isNotEmpty ? value : '-',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: valueColor ?? AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Section vide avec option d'action
class _EmptySection extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? action;
  final VoidCallback? onAction;

  const _EmptySection({
    required this.icon,
    required this.message,
    this.action,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Column(
        children: [
          Icon(icon, size: 56, color: AppColors.textDisabled),
          const SizedBox(height: 12),
          Text(
            message,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 15,
            ),
            textAlign: TextAlign.center,
          ),
          if (action != null && onAction != null) ...[
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onAction,
              icon: const Icon(Icons.add),
              label: Text(action!),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Diviseur de section avec label
class _SectionDivider extends StatelessWidget {
  final String label;
  const _SectionDivider({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          const Expanded(child: Divider()),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const Expanded(child: Divider()),
        ],
      ),
    );
  }
}

/// Badge statistique
class _StatBadge extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatBadge(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(color: color, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
