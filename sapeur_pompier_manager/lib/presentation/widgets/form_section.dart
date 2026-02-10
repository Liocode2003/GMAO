import 'package:flutter/material.dart';
import 'package:sapeur_pompier_manager/presentation/widgets/section_card.dart';

class FormSection extends StatelessWidget {
  final String title;
  final List<Widget> children;
  final Widget? trailing;
  final EdgeInsetsGeometry? contentPadding;
  final double childSpacing;

  const FormSection({
    super.key,
    required this.title,
    required this.children,
    this.trailing,
    this.contentPadding,
    this.childSpacing = 8.0,
  });

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: title,
      trailing: trailing,
      contentPadding: contentPadding ?? const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: _intersperse(children, childSpacing),
      ),
    );
  }

  List<Widget> _intersperse(List<Widget> items, double spacing) {
    if (items.isEmpty) return [];
    final result = <Widget>[];
    for (int i = 0; i < items.length; i++) {
      result.add(items[i]);
      if (i < items.length - 1) {
        result.add(SizedBox(height: spacing));
      }
    }
    return result;
  }
}
