import 'dart:io';

import 'package:intl/intl.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../domain/entities/certificat.dart';
import '../../domain/entities/constantes.dart';
import '../../domain/entities/controle_fin_service.dart';
import '../../domain/entities/decision_reforme.dart';
import '../../domain/entities/examen_incorporation.dart';
import '../../domain/entities/indisponibilite.dart';
import '../../domain/entities/operation.dart';
import '../../domain/entities/sapeur_pompier.dart';
import '../../domain/entities/vaccination.dart';
import '../../domain/entities/visite_sanitaire.dart';

/// Générateur de livrets sanitaires au format PDF
class PdfGenerator {
  PdfGenerator._();

  // ─── Couleurs ────────────────────────────────────────────────────────────────

  static const PdfColor _rouge = PdfColor.fromInt(0xFFD32F2F);
  static const PdfColor _bleu = PdfColor.fromInt(0xFF1976D2);
  static const PdfColor _gris = PdfColor.fromInt(0xFF757575);
  static const PdfColor _grisClaire = PdfColor.fromInt(0xFFE0E0E0);
  static const PdfColor _noir = PdfColor.fromInt(0xFF212121);
  static const PdfColor _blanc = PdfColors.white;
  static const PdfColor _vert = PdfColor.fromInt(0xFF388E3C);

  // ─── Utilitaire de date ───────────────────────────────────────────────────────

  static String _formatDate(DateTime? date) {
    if (date == null) return '...../....../..........';
    return DateFormat('dd/MM/yyyy').format(date);
  }

  static String _formatDateHeure(DateTime? date) {
    if (date == null) return '...../....../..........';
    return DateFormat('dd/MM/yyyy HH:mm').format(date);
  }

  static String _vide(String? valeur, {String defaut = '.............................'}) {
    if (valeur == null || valeur.trim().isEmpty) return defaut;
    return valeur;
  }

  static String _videDouble(double? valeur, {int decimales = 1, String defaut = '............'}) {
    if (valeur == null) return defaut;
    return valeur.toStringAsFixed(decimales);
  }

  // ─── API publique ─────────────────────────────────────────────────────────────

  /// Génère le livret sanitaire complet et enregistre le fichier.
  /// Retourne le chemin absolu du fichier généré.
  static Future<String> generateLivretComplet(
    SapeurPompier sapeurPompier,
    String outputPath,
  ) async {
    try {
      final doc = pw.Document(
        title: 'Livret sanitaire – ${sapeurPompier.nomComplet}',
        author: 'Gestion des Sapeurs-Pompiers – Burkina Faso',
        creator: 'GMAO SP v1.0',
      );

      _buildAllPages(doc, sapeurPompier);

      final bytes = await doc.save();
      final fichier = File(outputPath);
      await fichier.parent.create(recursive: true);
      await fichier.writeAsBytes(bytes);
      return outputPath;
    } catch (e) {
      throw Exception('Erreur lors de la génération du PDF : $e');
    }
  }

  /// Génère uniquement une section du livret sanitaire.
  /// [section] : 'garde', 'etat_civil', 'constantes', 'examen', 'operations',
  ///             'vaccinations', 'visites', 'indisponibilites', 'certificats',
  ///             'reformes', 'fin_service'
  static Future<String> generateSection(
    SapeurPompier sapeurPompier,
    String section,
    String outputPath,
  ) async {
    try {
      final doc = pw.Document();
      _buildSection(doc, sapeurPompier, section);

      final bytes = await doc.save();
      final fichier = File(outputPath);
      await fichier.parent.create(recursive: true);
      await fichier.writeAsBytes(bytes);
      return outputPath;
    } catch (e) {
      throw Exception('Erreur lors de la génération de la section "$section" : $e');
    }
  }

  /// Génère le livret et ouvre la boîte de dialogue d'impression native.
  static Future<void> printLivret(SapeurPompier sapeurPompier) async {
    final doc = pw.Document(
      title: 'Livret sanitaire – ${sapeurPompier.nomComplet}',
    );
    _buildAllPages(doc, sapeurPompier);

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => doc.save(),
      name: 'Livret_${sapeurPompier.matricule}.pdf',
    );
  }

  /// Génère et enregistre dans le dossier Documents avec un nom automatique.
  /// Retourne le chemin du fichier créé.
  static Future<String> generateInDocuments(SapeurPompier sapeurPompier) async {
    final documentsDir = await getApplicationDocumentsDirectory();
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final nom = '${sapeurPompier.matricule}_livret_$timestamp.pdf';
    final chemin = p.join(documentsDir.path, 'livrets', nom);
    return generateLivretComplet(sapeurPompier, chemin);
  }

  // ─── Construction globale ─────────────────────────────────────────────────────

  static void _buildAllPages(pw.Document doc, SapeurPompier sp) {
    doc.addPage(_buildPageGarde(sp));
    doc.addPage(_buildPageEtatCivil(sp));
    doc.addPage(_buildPageConstantes(sp));
    doc.addPage(_buildPageExamen(sp));
    doc.addPage(_buildPagesOperations(sp));
    doc.addPage(_buildPagesVaccinations(sp));
    doc.addPage(_buildPagesVisites(sp));
    doc.addPage(_buildPagesIndisponibilites(sp));
    doc.addPage(_buildPagesCertificats(sp));
    doc.addPage(_buildPageDecisionsReforme(sp));
    doc.addPage(_buildPageControleFinService(sp));
  }

  static void _buildSection(pw.Document doc, SapeurPompier sp, String section) {
    switch (section) {
      case 'garde':
        doc.addPage(_buildPageGarde(sp));
      case 'etat_civil':
        doc.addPage(_buildPageEtatCivil(sp));
      case 'constantes':
        doc.addPage(_buildPageConstantes(sp));
      case 'examen':
        doc.addPage(_buildPageExamen(sp));
      case 'operations':
        doc.addPage(_buildPagesOperations(sp));
      case 'vaccinations':
        doc.addPage(_buildPagesVaccinations(sp));
      case 'visites':
        doc.addPage(_buildPagesVisites(sp));
      case 'indisponibilites':
        doc.addPage(_buildPagesIndisponibilites(sp));
      case 'certificats':
        doc.addPage(_buildPagesCertificats(sp));
      case 'reformes':
        doc.addPage(_buildPageDecisionsReforme(sp));
      case 'fin_service':
        doc.addPage(_buildPageControleFinService(sp));
      default:
        _buildAllPages(doc, sp);
    }
  }

  // ─── Pages individuelles ──────────────────────────────────────────────────────

  /// Page de garde
  static pw.Page _buildPageGarde(SapeurPompier sp) {
    return pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(40),
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.center,
        children: [
          pw.SizedBox(height: 40),
          // Logo placeholder
          pw.Container(
            width: 100,
            height: 100,
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: _rouge, width: 2),
              borderRadius: const pw.BorderRadius.all(pw.Radius.circular(50)),
            ),
            child: pw.Center(
              child: pw.Text(
                'SP',
                style: pw.TextStyle(
                  fontSize: 36,
                  fontWeight: pw.FontWeight.bold,
                  color: _rouge,
                ),
              ),
            ),
          ),
          pw.SizedBox(height: 30),
          pw.Text(
            'BURKINA FASO',
            style: pw.TextStyle(fontSize: 11, letterSpacing: 2, color: _gris),
          ),
          pw.Text(
            'SERVICE DES SAPEURS-POMPIERS',
            style: pw.TextStyle(fontSize: 10, letterSpacing: 1.5, color: _gris),
          ),
          pw.SizedBox(height: 40),
          pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: pw.BoxDecoration(
              color: _rouge,
              borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
            ),
            child: pw.Text(
              'LIVRET SANITAIRE',
              style: pw.TextStyle(
                fontSize: 22,
                fontWeight: pw.FontWeight.bold,
                color: _blanc,
                letterSpacing: 2,
              ),
            ),
          ),
          pw.SizedBox(height: 40),
          pw.Container(
            width: double.infinity,
            padding: const pw.EdgeInsets.all(20),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: _grisClaire, width: 1),
              borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _buildInfoLine('NOM & PRÉNOMS', sp.nomComplet),
                pw.SizedBox(height: 8),
                _buildInfoLine('MATRICULE', sp.matricule),
                pw.SizedBox(height: 8),
                _buildInfoLine(
                  'UNITÉ',
                  _vide(sp.etatCivil?.lieuNaissance, defaut: '.....................'),
                ),
                pw.SizedBox(height: 8),
                _buildInfoLine(
                  'DATE DE NAISSANCE',
                  sp.etatCivil != null
                      ? _formatDate(sp.etatCivil!.dateNaissance)
                      : '....../...../..........',
                ),
              ],
            ),
          ),
          pw.Spacer(),
          pw.Divider(color: _grisClaire),
          pw.SizedBox(height: 8),
          pw.Text(
            'Généré le ${_formatDateHeure(DateTime.now())}',
            style: pw.TextStyle(fontSize: 9, color: _gris),
          ),
        ],
      ),
    );
  }

  /// Page état civil
  static pw.Page _buildPageEtatCivil(SapeurPompier sp) {
    final ec = sp.etatCivil;
    return pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(30),
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          _buildPageHeader('ÉTAT CIVIL', sp),
          pw.SizedBox(height: 16),
          _buildTableauInfo([
            {'label': 'Nom', 'valeur': _vide(ec?.nom)},
            {'label': 'Prénoms', 'valeur': _vide(ec?.prenoms)},
            {
              'label': 'Date de naissance',
              'valeur': ec != null ? _formatDate(ec.dateNaissance) : '....../...../.......…',
            },
            {'label': 'Lieu de naissance', 'valeur': _vide(ec?.lieuNaissance)},
            {'label': 'Nom du père', 'valeur': _vide(ec?.nomPere)},
            {'label': 'Nom de la mère', 'valeur': _vide(ec?.nomMere)},
          ]),
          pw.SizedBox(height: 16),
          _buildSectionTitle('Contacts d\'urgence'),
          pw.SizedBox(height: 8),
          _buildContactsUrgenceTable(ec),
          pw.Spacer(),
          _buildPageFooter(sp),
        ],
      ),
    );
  }

  /// Page constantes physiques
  static pw.Page _buildPageConstantes(SapeurPompier sp) {
    final c = sp.constantes;
    return pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(30),
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          _buildPageHeader('CONSTANTES PHYSIQUES', sp),
          pw.SizedBox(height: 16),
          _buildTableauInfo([
            {'label': 'Taille (cm)', 'valeur': _videDouble(c?.taille)},
            {'label': 'Poids (kg)', 'valeur': _videDouble(c?.poids)},
            {'label': 'IMC', 'valeur': _videDouble(c?.imc, decimales: 2)},
            {
              'label': 'Interprétation IMC',
              'valeur': c != null ? c.imcInterpretation : '.............................',
            },
            {
              'label': 'Périmètre thoracique (cm)',
              'valeur': _videDouble(c?.perimetreThoracique),
            },
            {
              'label': 'Périmètre abdominal (cm)',
              'valeur': _videDouble(c?.perimetreAbdominal),
            },
            {
              'label': 'Date de mesure',
              'valeur': c != null ? _formatDate(c.dateMesure) : '....../...../..........',
            },
          ]),
          pw.SizedBox(height: 20),
          _buildSectionTitle('Empreintes et Signature'),
          pw.SizedBox(height: 8),
          pw.Row(
            children: [
              _buildSignatureBlock(
                'Empreintes digitales',
                c?.hasEmpreintes == true ? 'Disponible' : null,
                null,
              ),
              pw.SizedBox(width: 20),
              _buildSignatureBlock(
                'Signature du sapeur-pompier',
                c?.hasSignature == true ? 'Disponible' : null,
                null,
              ),
            ],
          ),
          pw.Spacer(),
          _buildPageFooter(sp),
        ],
      ),
    );
  }

  /// Page examen d'incorporation
  static pw.Page _buildPageExamen(SapeurPompier sp) {
    final ex = sp.examenIncorporation;
    return pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(30),
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          _buildPageHeader('EXAMEN D\'INCORPORATION', sp),
          pw.SizedBox(height: 12),
          _buildSectionTitle('Antécédents'),
          pw.SizedBox(height: 6),
          _buildTableauInfo([
            {'label': 'Héréditaires', 'valeur': _vide(ex?.antecedentsHereditaires)},
            {'label': 'Personnels', 'valeur': _vide(ex?.antecedentsPersonnels)},
            {'label': 'Collatéraux', 'valeur': _vide(ex?.antecedentsCollateraux)},
          ]),
          pw.SizedBox(height: 10),
          _buildSectionTitle('Examen clinique'),
          pw.SizedBox(height: 6),
          _buildTableauInfo([
            {
              'label': 'Appareil respiratoire',
              'valeur': _vide(ex?.appareilRespiratoire),
            },
            {
              'label': 'Appareil circulatoire',
              'valeur': _vide(ex?.appareilCirculatoire),
            },
            {'label': 'Appareil digestif', 'valeur': _vide(ex?.appareilDigestif)},
            {
              'label': 'Appareil génito-urinaire',
              'valeur': _vide(ex?.appareilGenitoUrinaire),
            },
            {'label': 'Système nerveux', 'valeur': _vide(ex?.systemeNerveux)},
            {'label': 'Peau / Annexes', 'valeur': _vide(ex?.peauAnnexes)},
            {'label': 'Radiographie', 'valeur': _vide(ex?.radiographie)},
            {'label': 'Denture / État', 'valeur': _vide(ex?.dentureEtat)},
            {
              'label': 'Coefficient mastication',
              'valeur': _vide(ex?.coefficientMastication),
            },
            {
              'label': 'FC (batt/min)',
              'valeur': ex?.fc != null ? '${ex!.fc}' : '............',
            },
            {'label': 'TA', 'valeur': _vide(ex?.ta)},
            {'label': 'Sucre', 'valeur': _vide(ex?.sucre)},
            {'label': 'Albumine', 'valeur': _vide(ex?.albumine)},
          ]),
          pw.SizedBox(height: 10),
          _buildSectionTitle('Vision & Audition'),
          pw.SizedBox(height: 6),
          _buildTableauDouble(
            titres: ['Acuité visuelle', 'OD sans', 'OD avec', 'OG sans', 'OG avec'],
            valeurs: [
              [
                'AV',
                _vide(ex?.avOdSans, defaut: '....'),
                _vide(ex?.avOdAvec, defaut: '....'),
                _vide(ex?.avOgSans, defaut: '....'),
                _vide(ex?.avOgAvec, defaut: '....'),
              ],
            ],
          ),
          pw.SizedBox(height: 6),
          _buildTableauDouble(
            titres: ['Acuité auditive', 'OD haute', 'OD chuchotée', 'OG haute', 'OG chuchotée'],
            valeurs: [
              [
                'AA',
                _vide(ex?.aaOdHaute, defaut: '....'),
                _vide(ex?.aaOdChuchotee, defaut: '....'),
                _vide(ex?.aaOgHaute, defaut: '....'),
                _vide(ex?.aaOgChuchotee, defaut: '....'),
              ],
            ],
          ),
          pw.SizedBox(height: 10),
          if (ex != null) _buildSigycopTable(ex.profilSigycop),
          pw.SizedBox(height: 10),
          _buildSectionTitle('Décision'),
          pw.SizedBox(height: 6),
          _buildTableauInfo([
            {'label': 'Date de clôture', 'valeur': _formatDate(ex?.dateCloture)},
            {'label': 'Décision', 'valeur': _vide(ex?.decision)},
            {'label': 'À surveiller', 'valeur': _vide(ex?.aSurveiller)},
            {'label': 'Mentions spéciales', 'valeur': _vide(ex?.mentionsSpeciales)},
            {'label': 'Nom du médecin', 'valeur': _vide(ex?.nomMedecin)},
          ]),
          pw.Spacer(),
          _buildPageFooter(sp),
        ],
      ),
    );
  }

  /// Pages opérations (1 opération par page)
  static pw.MultiPage _buildPagesOperations(SapeurPompier sp) {
    return pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(30),
      header: (context) => _buildPageHeader('OPÉRATIONS EXTÉRIEURES', sp),
      footer: (context) => _buildPageFooter(sp),
      build: (context) {
        if (sp.operations.isEmpty) {
          return [_buildEmptySection('Aucune opération enregistrée.')];
        }
        final widgets = <pw.Widget>[];
        for (final op in sp.operations) {
          widgets.add(_buildOperationBlock(op));
          widgets.add(pw.SizedBox(height: 16));
        }
        return widgets;
      },
    );
  }

  /// Pages vaccinations
  static pw.MultiPage _buildPagesVaccinations(SapeurPompier sp) {
    return pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(30),
      header: (context) => _buildPageHeader('VACCINATIONS', sp),
      footer: (context) => _buildPageFooter(sp),
      build: (context) {
        if (sp.vaccinations.isEmpty) {
          return [_buildEmptySection('Aucune vaccination enregistrée.')];
        }
        return [_buildVaccinationsTable(sp.vaccinations)];
      },
    );
  }

  /// Pages visites sanitaires
  static pw.MultiPage _buildPagesVisites(SapeurPompier sp) {
    return pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(30),
      header: (context) => _buildPageHeader('VISITES SANITAIRES PÉRIODIQUES', sp),
      footer: (context) => _buildPageFooter(sp),
      build: (context) {
        if (sp.visitesSanitaires.isEmpty) {
          return [_buildEmptySection('Aucune visite sanitaire enregistrée.')];
        }
        return [_buildVisitesTable(sp.visitesSanitaires)];
      },
    );
  }

  /// Pages indisponibilités
  static pw.MultiPage _buildPagesIndisponibilites(SapeurPompier sp) {
    return pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(30),
      header: (context) => _buildPageHeader('INDISPONIBILITÉS POUR RAISON DE SANTÉ', sp),
      footer: (context) => _buildPageFooter(sp),
      build: (context) {
        if (sp.indisponibilites.isEmpty) {
          return [_buildEmptySection('Aucune indisponibilité enregistrée.')];
        }
        return [_buildIndisponibilitesTable(sp.indisponibilites)];
      },
    );
  }

  /// Pages certificats
  static pw.MultiPage _buildPagesCertificats(SapeurPompier sp) {
    return pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(30),
      header: (context) => _buildPageHeader('COPIES DE CERTIFICATS MÉDICAUX', sp),
      footer: (context) => _buildPageFooter(sp),
      build: (context) {
        if (sp.certificats.isEmpty) {
          return [_buildEmptySection('Aucun certificat enregistré.')];
        }
        return [_buildCertificatsTable(sp.certificats)];
      },
    );
  }

  /// Page décisions de réforme
  static pw.Page _buildPageDecisionsReforme(SapeurPompier sp) {
    return pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(30),
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          _buildPageHeader('DÉCISIONS DE COMMISSION DE RÉFORME', sp),
          pw.SizedBox(height: 16),
          if (sp.decisionsReforme.isEmpty)
            _buildEmptySection('Aucune décision de réforme enregistrée.')
          else
            _buildDecisionsReformeTable(sp.decisionsReforme),
          pw.Spacer(),
          _buildPageFooter(sp),
        ],
      ),
    );
  }

  /// Page contrôle de fin de service
  static pw.Page _buildPageControleFinService(SapeurPompier sp) {
    final cfs = sp.controleFinService;
    return pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(30),
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          _buildPageHeader('CONTRÔLE DE FIN DE SERVICE', sp),
          pw.SizedBox(height: 16),
          _buildTableauInfo([
            {
              'label': 'Date de radiation',
              'valeur': _formatDate(cfs?.dateRadiation),
            },
            {'label': 'Lieu de l\'examen', 'valeur': _vide(cfs?.lieuExamen)},
            {'label': 'État de santé', 'valeur': _vide(cfs?.etatSante)},
            {
              'label': 'Atteint de',
              'valeur': _vide(cfs?.atteintDe, defaut: 'N/A'),
            },
            {'label': 'Hospitalisé à', 'valeur': _vide(cfs?.hospitaliseA)},
          ]),
          pw.SizedBox(height: 12),
          _buildSectionTitle('Examen clinique final'),
          pw.SizedBox(height: 6),
          _buildTableauInfo([
            {'label': 'Poids (kg)', 'valeur': _videDouble(cfs?.poids)},
            {'label': 'Taille (cm)', 'valeur': _videDouble(cfs?.taille)},
            {
              'label': 'Indice de Pignet',
              'valeur': _videDouble(cfs?.indicePignet, decimales: 2),
            },
            {
              'label': 'Interprétation',
              'valeur': cfs?.indicePignetInterpretation ?? '.............................',
            },
            {'label': 'TA', 'valeur': _vide(cfs?.ta)},
            {'label': 'Sucre', 'valeur': _vide(cfs?.sucre)},
            {'label': 'Albumine', 'valeur': _vide(cfs?.albumine)},
          ]),
          pw.SizedBox(height: 12),
          _buildTableauDouble(
            titres: ['Acuité visuelle finale', 'OD sans', 'OD avec', 'OG sans', 'OG avec'],
            valeurs: [
              [
                'AV',
                _vide(cfs?.avOdSans, defaut: '....'),
                _vide(cfs?.avOdAvec, defaut: '....'),
                _vide(cfs?.avOgSans, defaut: '....'),
                _vide(cfs?.avOgAvec, defaut: '....'),
              ],
            ],
          ),
          pw.SizedBox(height: 12),
          _buildSignatureBlock(
            'Signature du médecin',
            _vide(cfs?.nomMedecin, defaut: null),
            cfs?.dateSignature != null ? _formatDate(cfs!.dateSignature) : null,
          ),
          pw.Spacer(),
          _buildPageFooter(sp),
        ],
      ),
    );
  }

  // ─── Composants réutilisables ─────────────────────────────────────────────────

  /// En-tête de chaque page avec le nom et le matricule du sapeur-pompier
  static pw.Widget _buildPageHeader(String titre, SapeurPompier sp) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  titre,
                  style: pw.TextStyle(
                    fontSize: 14,
                    fontWeight: pw.FontWeight.bold,
                    color: _rouge,
                  ),
                ),
                pw.SizedBox(height: 2),
                pw.Text(
                  'LIVRET SANITAIRE',
                  style: pw.TextStyle(fontSize: 9, color: _gris, letterSpacing: 1),
                ),
              ],
            ),
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Text(
                  sp.nomComplet,
                  style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold),
                ),
                pw.Text(
                  'Matr. ${sp.matricule}',
                  style: pw.TextStyle(fontSize: 9, color: _gris),
                ),
              ],
            ),
          ],
        ),
        pw.SizedBox(height: 4),
        pw.Divider(color: _rouge, thickness: 1.5),
        pw.SizedBox(height: 8),
      ],
    );
  }

  /// Pied de page avec pagination et date de génération
  static pw.Widget _buildPageFooter(SapeurPompier sp) {
    return pw.Column(
      children: [
        pw.Divider(color: _grisClaire),
        pw.SizedBox(height: 4),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              'Matr. ${sp.matricule} – ${sp.nomComplet}',
              style: pw.TextStyle(fontSize: 8, color: _gris),
            ),
            pw.Text(
              'Généré le ${_formatDate(DateTime.now())}',
              style: pw.TextStyle(fontSize: 8, color: _gris),
            ),
          ],
        ),
      ],
    );
  }

  /// Tableau d'informations clé / valeur en deux colonnes
  static pw.Widget _buildTableauInfo(List<Map<String, String>> lignes) {
    return pw.Table(
      border: pw.TableBorder.all(color: _grisClaire, width: 0.5),
      columnWidths: const {
        0: pw.FlexColumnWidth(1),
        1: pw.FlexColumnWidth(2),
      },
      children: lignes.map((ligne) {
        return pw.TableRow(children: [
          pw.Padding(
            padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 5),
            child: pw.Text(
              ligne['label'] ?? '',
              style: pw.TextStyle(
                fontSize: 9,
                fontWeight: pw.FontWeight.bold,
                color: _noir,
              ),
            ),
          ),
          pw.Padding(
            padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 5),
            child: pw.Text(
              ligne['valeur'] ?? '.............................',
              style: const pw.TextStyle(fontSize: 9),
            ),
          ),
        ]);
      }).toList(),
    );
  }

  /// Tableau multi-colonnes avec titres
  static pw.Widget _buildTableauDouble({
    required List<String> titres,
    required List<List<String>> valeurs,
  }) {
    final columnWidths = <int, pw.TableColumnWidth>{};
    for (var i = 0; i < titres.length; i++) {
      columnWidths[i] = const pw.FlexColumnWidth(1);
    }

    return pw.Table(
      border: pw.TableBorder.all(color: _grisClaire, width: 0.5),
      columnWidths: columnWidths,
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: _grisClaire),
          children: titres.map((t) {
            return pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: pw.Text(
                t,
                style: pw.TextStyle(
                  fontSize: 8,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            );
          }).toList(),
        ),
        ...valeurs.map((ligne) {
          return pw.TableRow(
            children: ligne.map((v) {
              return pw.Padding(
                padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: pw.Text(v, style: const pw.TextStyle(fontSize: 9)),
              );
            }).toList(),
          );
        }),
      ],
    );
  }

  /// Bloc signature avec label, nom et date
  static pw.Widget _buildSignatureBlock(String label, String? nom, String? date) {
    return pw.Expanded(
      child: pw.Container(
        padding: const pw.EdgeInsets.all(10),
        decoration: pw.BoxDecoration(
          border: pw.Border.all(color: _grisClaire),
        ),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(
              label,
              style: pw.TextStyle(
                fontSize: 9,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            pw.SizedBox(height: 24),
            pw.Divider(color: _grisClaire),
            pw.SizedBox(height: 4),
            pw.Text(
              nom ?? '.............................',
              style: const pw.TextStyle(fontSize: 9),
            ),
            pw.Text(
              date ?? '....../...../..........',
              style: pw.TextStyle(fontSize: 8, color: _gris),
            ),
          ],
        ),
      ),
    );
  }

  /// Tableau SIGYCOP (S-I-G-Y-C-O-P) avec scores
  static pw.Widget _buildSigycopTable(ProfilSigycop sigycop) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Profil SIGYCOP'),
        pw.SizedBox(height: 6),
        pw.Table(
          border: pw.TableBorder.all(color: _grisClaire, width: 0.5),
          columnWidths: const {
            0: pw.FlexColumnWidth(3),
            1: pw.FlexColumnWidth(1),
          },
          children: [
            _sigycopLigne('S – État général', sigycop.s),
            _sigycopLigne('I – Membres inférieurs', sigycop.i),
            _sigycopLigne('G – Membres supérieurs', sigycop.g),
            _sigycopLigne('Y – Vision (yeux)', sigycop.y),
            _sigycopLigne('C – Appareil circulatoire', sigycop.c),
            _sigycopLigne('O – Audition (oreilles)', sigycop.o),
            _sigycopLigne('P – Psychisme', sigycop.p),
            pw.TableRow(
              decoration: const pw.BoxDecoration(color: _grisClaire),
              children: [
                pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: pw.Text(
                    'SCORE TOTAL',
                    style: pw.TextStyle(
                      fontSize: 9,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                ),
                pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: pw.Text(
                    '${sigycop.scoreTotal}',
                    style: pw.TextStyle(
                      fontSize: 9,
                      fontWeight: pw.FontWeight.bold,
                      color: _rouge,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  static pw.TableRow _sigycopLigne(String libelle, int score) {
    return pw.TableRow(children: [
      pw.Padding(
        padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: pw.Text(libelle, style: const pw.TextStyle(fontSize: 9)),
      ),
      pw.Padding(
        padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: pw.Text(
          '$score',
          style: pw.TextStyle(
            fontSize: 9,
            fontWeight: pw.FontWeight.bold,
            color: score == 0 ? _gris : _noir,
          ),
        ),
      ),
    ]);
  }

  /// Tableau des contacts d'urgence
  static pw.Widget _buildContactsUrgenceTable(dynamic etatCivil) {
    final contacts = [
      etatCivil?.contactUrgence1,
      etatCivil?.contactUrgence2,
      etatCivil?.contactUrgence3,
    ];

    return pw.Table(
      border: pw.TableBorder.all(color: _grisClaire, width: 0.5),
      columnWidths: const {
        0: pw.FlexColumnWidth(0.5),
        1: pw.FlexColumnWidth(2),
        2: pw.FlexColumnWidth(1.5),
        3: pw.FlexColumnWidth(1),
      },
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: _grisClaire),
          children: ['N°', 'Nom', 'Téléphone', 'Lien'].map((h) {
            return pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: pw.Text(
                h,
                style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold),
              ),
            );
          }).toList(),
        ),
        for (var i = 0; i < contacts.length; i++)
          pw.TableRow(children: [
            _cellule('${i + 1}'),
            _cellule(contacts[i]?.nom ?? '...................'),
            _cellule(contacts[i]?.telephone ?? '.................'),
            _cellule(contacts[i]?.lien ?? '...........'),
          ]),
      ],
    );
  }

  /// Bloc d'une opération
  static pw.Widget _buildOperationBlock(Operation op) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: _grisClaire, width: 0.8),
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: const pw.BoxDecoration(color: _rouge),
            child: pw.Text(
              'SÉJOUR N° ${op.numeroSejour}  –  ${_vide(op.lieuSejour, defaut: 'Lieu non renseigné')}',
              style: pw.TextStyle(
                fontSize: 10,
                fontWeight: pw.FontWeight.bold,
                color: _blanc,
              ),
            ),
          ),
          pw.SizedBox(height: 8),
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'AU DÉPART',
                      style: pw.TextStyle(
                        fontSize: 9,
                        fontWeight: pw.FontWeight.bold,
                        color: _bleu,
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    _ligneInfo('Date', _formatDate(op.dateDepart)),
                    _ligneInfo('État de santé', _vide(op.etatSanteDepart)),
                    _ligneInfo(
                      'Poids',
                      op.poidsDepart != null
                          ? '${op.poidsDepart!.toStringAsFixed(1)} kg'
                          : '............',
                    ),
                    _ligneInfo('TA', _vide(op.taDepart)),
                    _ligneInfo('Médecin', _vide(op.nomMedecinDepart)),
                  ],
                ),
              ),
              pw.SizedBox(width: 10),
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'AU RETOUR',
                      style: pw.TextStyle(
                        fontSize: 9,
                        fontWeight: pw.FontWeight.bold,
                        color: _vert,
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    _ligneInfo('Date', _formatDate(op.dateRetour)),
                    _ligneInfo('État de santé', _vide(op.etatSanteRetour)),
                    _ligneInfo(
                      'Poids',
                      op.poidsRetour != null
                          ? '${op.poidsRetour!.toStringAsFixed(1)} kg'
                          : '............',
                    ),
                    _ligneInfo('TA', _vide(op.taRetour)),
                    _ligneInfo('Médecin', _vide(op.nomMedecinRetour)),
                  ],
                ),
              ),
            ],
          ),
          if (op.observationsDepart != null || op.observationsRetour != null) ...[
            pw.SizedBox(height: 6),
            _ligneInfo(
              'Observations',
              _vide(op.observationsDepart ?? op.observationsRetour),
            ),
          ],
        ],
      ),
    );
  }

  /// Tableau des vaccinations
  static pw.Widget _buildVaccinationsTable(List<Vaccination> vaccinations) {
    return pw.Table(
      border: pw.TableBorder.all(color: _grisClaire, width: 0.5),
      columnWidths: const {
        0: pw.FlexColumnWidth(2),
        1: pw.FlexColumnWidth(1.2),
        2: pw.FlexColumnWidth(1.2),
        3: pw.FlexColumnWidth(0.8),
        4: pw.FlexColumnWidth(1.5),
        5: pw.FlexColumnWidth(1),
      },
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: _rouge),
          children: [
            'Type de vaccin',
            'Date vaccin.',
            'Date rappel',
            'Doses',
            'Médecin',
            'Statut',
          ].map((h) {
            return pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 5, vertical: 4),
              child: pw.Text(
                h,
                style: pw.TextStyle(
                  fontSize: 8,
                  fontWeight: pw.FontWeight.bold,
                  color: _blanc,
                ),
              ),
            );
          }).toList(),
        ),
        ...vaccinations.map((v) {
          final statut = v.statut;
          final couleurStatut =
              statut == 'Expiré' ? _rouge : (statut == 'Proche expiration' ? _gris : _vert);
          return pw.TableRow(children: [
            _cellule(v.typeVaccinLibelle),
            _cellule(_formatDate(v.dateVaccination)),
            _cellule(_formatDate(v.dateRappel)),
            _cellule(v.nombreDoses != null ? '${v.nombreDoses}' : '-'),
            _cellule(_vide(v.nomMedecin)),
            pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 5, vertical: 4),
              child: pw.Text(
                statut,
                style: pw.TextStyle(fontSize: 8, color: couleurStatut),
              ),
            ),
          ]);
        }),
      ],
    );
  }

  /// Tableau des visites sanitaires
  static pw.Widget _buildVisitesTable(List<VisiteSanitaire> visites) {
    return pw.Table(
      border: pw.TableBorder.all(color: _grisClaire, width: 0.5),
      columnWidths: const {
        0: pw.FlexColumnWidth(1.2),
        1: pw.FlexColumnWidth(1.5),
        2: pw.FlexColumnWidth(1.5),
        3: pw.FlexColumnWidth(1.5),
        4: pw.FlexColumnWidth(1),
      },
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: _bleu),
          children: ['Date', 'Entité / Corps', 'Résultats', 'Observations', 'Médecin']
              .map((h) {
            return pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 5, vertical: 4),
              child: pw.Text(
                h,
                style: pw.TextStyle(
                  fontSize: 8,
                  fontWeight: pw.FontWeight.bold,
                  color: _blanc,
                ),
              ),
            );
          }).toList(),
        ),
        ...visites.map((v) {
          return pw.TableRow(children: [
            _cellule(_formatDate(v.dateVisite)),
            _cellule(_vide(v.entiteCorps)),
            _cellule(_vide(v.resultats)),
            _cellule(_vide(v.observations)),
            _cellule(_vide(v.nomMedecin)),
          ]);
        }),
      ],
    );
  }

  /// Tableau des indisponibilités
  static pw.Widget _buildIndisponibilitesTable(List<Indisponibilite> indisponibilites) {
    return pw.Table(
      border: pw.TableBorder.all(color: _grisClaire, width: 0.5),
      columnWidths: const {
        0: pw.FlexColumnWidth(1),
        1: pw.FlexColumnWidth(1),
        2: pw.FlexColumnWidth(2),
        3: pw.FlexColumnWidth(0.8),
        4: pw.FlexColumnWidth(0.8),
        5: pw.FlexColumnWidth(0.8),
        6: pw.FlexColumnWidth(1),
      },
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: _gris),
          children: ['Début', 'Fin', 'Diagnostic', 'Hôp.', 'Infirm.', 'Chamb.', 'Médecin']
              .map((h) {
            return pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              child: pw.Text(
                h,
                style: pw.TextStyle(
                  fontSize: 8,
                  fontWeight: pw.FontWeight.bold,
                  color: _blanc,
                ),
              ),
            );
          }).toList(),
        ),
        ...indisponibilites.map((ind) {
          return pw.TableRow(children: [
            _cellule(_formatDate(ind.dateDebut)),
            _cellule(_formatDate(ind.dateFin)),
            _cellule(_vide(ind.diagnostic)),
            _cellule(ind.dureeHopital != null ? '${ind.dureeHopital}j' : '-'),
            _cellule(ind.dureeInfirmerie != null ? '${ind.dureeInfirmerie}j' : '-'),
            _cellule(ind.dureeChambre != null ? '${ind.dureeChambre}j' : '-'),
            _cellule(_vide(ind.nomMedecin)),
          ]);
        }),
      ],
    );
  }

  /// Tableau des certificats médicaux
  static pw.Widget _buildCertificatsTable(List<Certificat> certificats) {
    return pw.Table(
      border: pw.TableBorder.all(color: _grisClaire, width: 0.5),
      columnWidths: const {
        0: pw.FlexColumnWidth(2),
        1: pw.FlexColumnWidth(1),
        2: pw.FlexColumnWidth(1),
        3: pw.FlexColumnWidth(2),
      },
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: _grisClaire),
          children: ['Titre', 'Date', 'Type', 'Notes'].map((h) {
            return pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: pw.Text(
                h,
                style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold),
              ),
            );
          }).toList(),
        ),
        ...certificats.map((c) {
          return pw.TableRow(children: [
            _cellule(c.titre),
            _cellule(_formatDate(c.dateCertificat)),
            _cellule(c.typeCertificatLibelle),
            _cellule(_vide(c.notes)),
          ]);
        }),
      ],
    );
  }

  /// Tableau des décisions de réforme
  static pw.Widget _buildDecisionsReformeTable(List<DecisionReforme> decisions) {
    return pw.Table(
      border: pw.TableBorder.all(color: _grisClaire, width: 0.5),
      columnWidths: const {
        0: pw.FlexColumnWidth(1),
        1: pw.FlexColumnWidth(1),
        2: pw.FlexColumnWidth(2),
        3: pw.FlexColumnWidth(2),
      },
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: _rouge),
          children: ['Date', 'Type', 'Diagnostic', 'Observations'].map((h) {
            return pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: pw.Text(
                h,
                style: pw.TextStyle(
                  fontSize: 9,
                  fontWeight: pw.FontWeight.bold,
                  color: _blanc,
                ),
              ),
            );
          }).toList(),
        ),
        ...decisions.map((d) {
          return pw.TableRow(children: [
            _cellule(_formatDate(d.dateDecision)),
            _cellule(d.typeDecisionLibelle),
            _cellule(_vide(d.diagnostic)),
            _cellule(_vide(d.observations)),
          ]);
        }),
      ],
    );
  }

  /// Message de section vide
  static pw.Widget _buildEmptySection(String message) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(20),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: _grisClaire, width: 0.5),
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
      ),
      child: pw.Center(
        child: pw.Text(
          message,
          style: pw.TextStyle(fontSize: 10, color: _gris, fontStyle: pw.FontStyle.italic),
        ),
      ),
    );
  }

  /// Titre de sous-section
  static pw.Widget _buildSectionTitle(String titre) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: const pw.BoxDecoration(color: _grisClaire),
      child: pw.Text(
        titre.toUpperCase(),
        style: pw.TextStyle(
          fontSize: 9,
          fontWeight: pw.FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  /// Cellule de tableau avec padding standard
  static pw.Widget _cellule(String texte) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 5, vertical: 4),
      child: pw.Text(texte, style: const pw.TextStyle(fontSize: 8)),
    );
  }

  /// Ligne d'information inline (label: valeur)
  static pw.Widget _ligneInfo(String label, String valeur) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 2),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(
            width: 80,
            child: pw.Text(
              '$label :',
              style: pw.TextStyle(fontSize: 8, color: _gris),
            ),
          ),
          pw.Expanded(
            child: pw.Text(valeur, style: const pw.TextStyle(fontSize: 8)),
          ),
        ],
      ),
    );
  }

  /// Ligne d'information dans un tableau (label bold / valeur)
  static pw.Widget _buildInfoLine(String label, String valeur) {
    return pw.Row(
      children: [
        pw.SizedBox(
          width: 120,
          child: pw.Text(
            '$label :',
            style: pw.TextStyle(
              fontSize: 10,
              fontWeight: pw.FontWeight.bold,
              color: _gris,
            ),
          ),
        ),
        pw.Expanded(
          child: pw.Text(
            valeur,
            style: const pw.TextStyle(fontSize: 10),
          ),
        ),
      ],
    );
  }
}
