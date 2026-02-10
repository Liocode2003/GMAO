import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../providers/auth_provider.dart';

/// Layout principal de l'application avec sidebar
class AppLayout extends ConsumerStatefulWidget {
  final Widget child;
  final String currentRoute;

  const AppLayout({
    Key? key,
    required this.child,
    required this.currentRoute,
  }) : super(key: key);

  @override
  ConsumerState<AppLayout> createState() => _AppLayoutState();
}

class _AppLayoutState extends ConsumerState<AppLayout> {
  bool _isExpanded = true;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isAdmin = ref.watch(isAdminProvider);

    return Scaffold(
      body: Row(
        children: [
          // Sidebar
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: _isExpanded ? 280 : 70,
            decoration: const BoxDecoration(
              color: AppColors.sidebarBackground,
              boxShadow: [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 8,
                  offset: Offset(2, 0),
                ),
              ],
            ),
            child: Column(
              children: [
                // Header
                Container(
                  height: 70,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    boxShadow: AppColors.elevatedShadow,
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.local_fire_department,
                        color: Colors.white,
                        size: _isExpanded ? 32 : 28,
                      ),
                      if (_isExpanded) ...[
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'GMAO',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                'Sapeurs-Pompiers',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                // Menu Items
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    children: [
                      _buildMenuItem(
                        icon: Icons.dashboard,
                        label: AppStrings.dashboard,
                        route: '/dashboard',
                        isSelected: widget.currentRoute == '/dashboard',
                      ),
                      _buildMenuItem(
                        icon: Icons.people,
                        label: AppStrings.listeSapeursPompiers,
                        route: '/liste',
                        isSelected: widget.currentRoute == '/liste',
                      ),
                      if (isAdmin) ...[
                        const SizedBox(height: 8),
                        if (_isExpanded)
                          Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            child: Text(
                              'ADMINISTRATION',
                              style: TextStyle(
                                color: AppColors.sidebarText.withOpacity(0.6),
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        _buildMenuItem(
                          icon: Icons.supervised_user_circle,
                          label: AppStrings.userManagement,
                          route: '/users',
                          isSelected: widget.currentRoute == '/users',
                        ),
                        _buildMenuItem(
                          icon: Icons.backup,
                          label: AppStrings.backup,
                          route: '/backup',
                          isSelected: widget.currentRoute == '/backup',
                        ),
                      ],
                      const SizedBox(height: 8),
                      if (_isExpanded)
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          child: Text(
                            'GÉNÉRAL',
                            style: TextStyle(
                              color: AppColors.sidebarText.withOpacity(0.6),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      _buildMenuItem(
                        icon: Icons.settings,
                        label: AppStrings.settings,
                        route: '/settings',
                        isSelected: widget.currentRoute == '/settings',
                      ),
                    ],
                  ),
                ),

                // User Info & Logout
                Container(
                  decoration: const BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: AppColors.sidebarHover,
                        width: 1,
                      ),
                    ),
                  ),
                  child: Column(
                    children: [
                      // User Info
                      if (user != null)
                        InkWell(
                          onTap: () {
                            // Navigation vers le profil
                          },
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: _isExpanded ? 20 : 16,
                                  backgroundColor: AppColors.primary,
                                  child: Text(
                                    user.username.isNotEmpty
                                        ? user.username[0].toUpperCase()
                                        : 'U',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                if (_isExpanded) ...[
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          user.nomComplet ?? user.username,
                                          style: const TextStyle(
                                            color: AppColors.sidebarText,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w500,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          _getRoleLabel(user.role),
                                          style: TextStyle(
                                            color: AppColors.sidebarText
                                                .withOpacity(0.7),
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),

                      // Logout button
                      InkWell(
                        onTap: () => _handleLogout(context),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.logout,
                                color: AppColors.error,
                                size: 24,
                              ),
                              if (_isExpanded) ...[
                                const SizedBox(width: 12),
                                const Text(
                                  AppStrings.logout,
                                  style: TextStyle(
                                    color: AppColors.error,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),

                      // Toggle button
                      InkWell(
                        onTap: () {
                          setState(() {
                            _isExpanded = !_isExpanded;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          child: Icon(
                            _isExpanded
                                ? Icons.chevron_left
                                : Icons.chevron_right,
                            color: AppColors.sidebarText,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Main Content
          Expanded(
            child: widget.child,
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String label,
    required String route,
    required bool isSelected,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.sidebarSelected : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: InkWell(
        onTap: () {
          if (!isSelected) {
            Navigator.of(context).pushReplacementNamed(route);
          }
        },
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Icon(
                icon,
                color: AppColors.sidebarText,
                size: 24,
              ),
              if (_isExpanded) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: const TextStyle(
                      color: AppColors.sidebarText,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _getRoleLabel(String role) {
    switch (role) {
      case 'admin':
        return AppStrings.roleAdmin;
      case 'medecin':
        return AppStrings.roleMedecin;
      case 'consultation':
        return AppStrings.roleConsultation;
      default:
        return role;
    }
  }

  Future<void> _handleLogout(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmation'),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text(AppStrings.cancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
            ),
            child: const Text(AppStrings.logout),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ref.read(authProvider.notifier).logout();
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/login');
      }
    }
  }
}
