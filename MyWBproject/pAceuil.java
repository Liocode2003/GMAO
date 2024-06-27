package myWBproject;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public class pAceuil {

    public static final String NAME = "menu";

    private JPanel panel;
    private JPanel cards;

    public pAceuil(JPanel cards) {
        this.cards = cards;
        initialize();
    }

    private void initialize() {
        panel = new JPanel();
        panel.setBackground(Color.WHITE);
        panel.setLayout(null);

        JLabel lblMenu = new JLabel("MENU");
        lblMenu.setFont(new Font("Tahoma", Font.BOLD, 18));
        lblMenu.setBounds(330, 50, 100, 30);
        panel.add(lblMenu);

        JButton btnGestionDesMaintenances = new JButton("GESTION DES MAINTENANCES");
        btnGestionDesMaintenances.setFont(new Font("Tahoma", Font.PLAIN, 12));
        btnGestionDesMaintenances.setBounds(280, 150, 250, 50);
        panel.add(btnGestionDesMaintenances);

        JButton btnGestionOperateur = new JButton("GESTION OPERATEUR");
        btnGestionOperateur.setFont(new Font("Tahoma", Font.PLAIN, 12));
        btnGestionOperateur.setBounds(280, 220, 250, 50);
        panel.add(btnGestionOperateur);

        JButton btnGestionFichesDeMaintenance = new JButton("GESTION FICHES DE MAINTENANCE");
        btnGestionFichesDeMaintenance.setFont(new Font("Tahoma", Font.PLAIN, 12));
        btnGestionFichesDeMaintenance.setBounds(280, 290, 250, 50);
        panel.add(btnGestionFichesDeMaintenance);

        JButton btnGestionDesPrestations = new JButton("GESTION DES PRESTATIONS");
        btnGestionDesPrestations.setFont(new Font("Tahoma", Font.PLAIN, 12));
        btnGestionDesPrestations.setBounds(280, 360, 250, 50);
        panel.add(btnGestionDesPrestations);

        JButton btnReglementEtClotureDeDossier = new JButton("REGLEMENT ET CLOTURE DE DOSSIER");
        btnReglementEtClotureDeDossier.setFont(new Font("Tahoma", Font.PLAIN, 12));
        btnReglementEtClotureDeDossier.setBounds(280, 430, 250, 50);
        panel.add(btnReglementEtClotureDeDossier);

        JButton btnDeconnexion = new JButton("DECONNEXION");
        btnDeconnexion.setFont(new Font("Tahoma", Font.PLAIN, 12));
        btnDeconnexion.setBounds(650, 510, 120, 30);
        panel.add(btnDeconnexion);

        // Action pour le bouton "GESTION DES MAINTENANCES"
        btnGestionDesMaintenances.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                CardLayout cl = (CardLayout) cards.getLayout();
                cl.show(cards, GESTIONDESMAINTENANCES.NAME); // Affiche le panel GESTIONDESMAINTENANCES
            }
        });

        // Action pour le bouton "DECONNEXION"
        btnDeconnexion.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                // Code pour la déconnexion
                JOptionPane.showMessageDialog(panel, "Déconnexion effectuée.");
                // Vous pouvez fermer l'application ou rediriger vers une page de connexion ici
            }
        });

        // Ajoutez des actions pour les autres boutons selon vos besoins
    }

    public JPanel getPanel() {
        return panel;
    }
}
