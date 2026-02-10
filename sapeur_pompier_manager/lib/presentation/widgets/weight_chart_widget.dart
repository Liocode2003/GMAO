import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:sapeur_pompier_manager/data/models/constantes_model.dart';
import 'package:sapeur_pompier_manager/presentation/widgets/empty_state.dart';

class AppColors {
  static const Color primaryColor = Color(0xFF1565C0);
  static const Color secondaryColor = Color(0xFF0288D1);
  static const Color successColor = Color(0xFF2E7D32);
  static const Color warningColor = Color(0xFFE65100);
  static const Color dangerColor = Color(0xFFC62828);
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color surfaceColor = Colors.white;
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
}

class WeightChartWidget extends StatefulWidget {
  final List<HistoriquePoidsModel> historique;

  const WeightChartWidget({super.key, required this.historique});

  @override
  State<WeightChartWidget> createState() => _WeightChartWidgetState();
}

class _WeightChartWidgetState extends State<WeightChartWidget> {
  int? _touchedIndex;

  List<HistoriquePoidsModel> get _sortedData {
    final list = List<HistoriquePoidsModel>.from(widget.historique);
    list.sort((a, b) => a.annee.compareTo(b.annee));
    return list;
  }

  String _shortLabel(String isoDate) {
    try {
      final parts = isoDate.split('-');
      if (parts.length < 2) return isoDate;
      const months = [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
        'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
      ];
      final month = int.tryParse(parts[1]);
      if (month == null || month < 1 || month > 12) return isoDate;
      return '${months[month - 1]}\n${parts[0].substring(2)}';
    } catch (_) {
      return isoDate;
    }
  }

  String _fullLabel(String isoDate) {
    try {
      final parts = isoDate.split('-');
      if (parts.length < 3) return isoDate;
      const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
      ];
      final day = int.tryParse(parts[2]) ?? 0;
      final month = int.tryParse(parts[1]);
      if (month == null || month < 1 || month > 12) return isoDate;
      return '$day ${months[month - 1]} ${parts[0]}';
    } catch (_) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.historique.isEmpty) {
      return const EmptyState(
        icon: Icons.monitor_weight_outlined,
        title: 'Aucune donnée de poids',
        subtitle: 'Ajoutez des mesures pour visualiser l\'évolution',
      );
    }

    final data = _sortedData;
    final weights = data.map((e) => e.poids).toList();
    final minWeight = weights.reduce((a, b) => a < b ? a : b);
    final maxWeight = weights.reduce((a, b) => a > b ? a : b);
    final padding = (maxWeight - minWeight) < 5 ? 5.0 : (maxWeight - minWeight) * 0.15;
    final minY = (minWeight - padding).floorToDouble();
    final maxY = (maxWeight + padding).ceilToDouble();

    final spots = List.generate(
      data.length,
      (i) => FlSpot(i.toDouble(), data[i].poids),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Text(
            'Évolution du Poids',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
          ),
        ),
        SizedBox(
          height: 260,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 16, 24, 8),
            child: LineChart(
              LineChartData(
                minY: minY,
                maxY: maxY,
                lineTouchData: LineTouchData(
                  touchCallback: (FlTouchEvent event, LineTouchResponse? resp) {
                    setState(() {
                      if (resp != null &&
                          resp.lineBarSpots != null &&
                          resp.lineBarSpots!.isNotEmpty) {
                        _touchedIndex = resp.lineBarSpots!.first.spotIndex;
                      } else {
                        _touchedIndex = null;
                      }
                    });
                  },
                  touchTooltipData: LineTouchTooltipData(
                    tooltipRoundedRadius: 8,
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((spot) {
                        final index = spot.spotIndex;
                        final entry = data[index];
                        return LineTooltipItem(
                          '${_fullLabel(entry.dateMesure?.toIso8601String() ?? entry.annee.toString())}\n',
                          const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w400,
                          ),
                          children: [
                            TextSpan(
                              text: '${entry.poids.toStringAsFixed(1)} kg',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        );
                      }).toList();
                    },
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: AppColors.textSecondary.withOpacity(0.15),
                    strokeWidth: 1,
                    dashArray: [4, 4],
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border(
                    bottom: BorderSide(
                      color: AppColors.textSecondary.withOpacity(0.3),
                      width: 1,
                    ),
                    left: BorderSide(
                      color: AppColors.textSecondary.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 38,
                      interval: data.length <= 6
                          ? 1
                          : (data.length / 6).ceilToDouble(),
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 || index >= data.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 4.0),
                          child: Text(
                            _shortLabel(data[index].dateMesure?.toIso8601String() ?? data[index].annee.toString()),
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 10,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 42,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${value.toInt()} kg',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 10,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    curveSmoothness: 0.3,
                    color: AppColors.primaryColor,
                    barWidth: 2.5,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, bar, index) {
                        final isTouched = index == _touchedIndex;
                        return FlDotCirclePainter(
                          radius: isTouched ? 6 : 4,
                          color: isTouched
                              ? AppColors.primaryColor
                              : Colors.white,
                          strokeWidth: 2,
                          strokeColor: AppColors.primaryColor,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primaryColor.withOpacity(0.25),
                          AppColors.primaryColor.withOpacity(0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
