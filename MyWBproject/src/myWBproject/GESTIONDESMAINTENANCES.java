package myWBproject;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public class GESTIONDESMAINTENANCES {

    private JPanel panel;

    /**
     * Créer le panel.
     */
    public GESTIONDESMAINTENANCES() {
        initialize();
    }

    /**
     * Initialiser le contenu du panel.
     */
    private void initialize() {
        panel = new JPanel();
        panel.setBackground(SystemColor.text);
        panel.setBounds(10, 10, 510, 520); // Ajuster les dimensions et la position selon vos besoins
        panel.setLayout(null);

        JPanel innerPanel = new JPanel();
        innerPanel.setBackground(SystemColor.text);
        innerPanel.setBounds(10, 50, 480, 460);
        panel.add(innerPanel);
        innerPanel.setLayout(null);

        JButton btnNewButton_1 = new JButton("CREER UNE MAINTENANCE");
        btnNewButton_1.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        btnNewButton_1.setBounds(137, 58, 200, 50);
        innerPanel.add(btnNewButton_1);

        JButton btnListeDeMaintenance = new JButton("LISTE DE MAINTENANCE");
        btnListeDeMaintenance.addActionListener(new ActionListener() {
        	public void actionPerformed(ActionEvent e) {
        		   LISTEDEMANDEMAINTENANCE listeWindow = new LISTEDEMANDEMAINTENANCE();
        	        listeWindow.getFrame().setVisible(true);
        	}
        });
        btnListeDeMaintenance.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        btnListeDeMaintenance.setBounds(137, 178, 200, 50);
        innerPanel.add(btnListeDeMaintenance);

        JLabel lblNewLabel = new JLabel("GESTION DES MAINTENANCES");
        lblNewLabel.setFont(new Font("Times New Roman", Font.BOLD, 16));
        lblNewLabel.setBounds(142, 11, 257, 20);
        panel.add(lblNewLabel);

        JPanel panel_1 = new JPanel();
        panel_1.setBackground(SystemColor.text);
        panel_1.setBounds(250, 50, 220, 360);
        panel.add(panel_1);

        JButton btnNewButton = new JButton("RETOUR");
        btnNewButton.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        btnNewButton.setBounds(170, 420, 150, 30);
        panel.add(btnNewButton);

        // Ajouter un action listener au bouton "CREER UNE MAINTENANCE"
        btnNewButton_1.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                panel.removeAll();
                DEMANDEDEMAINTENANCE demandePanel = new DEMANDEDEMAINTENANCE();
                panel.add(demandePanel.getPanel());
                panel.revalidate();
                panel.repaint();
            }
        });
        
        btnListeDeMaintenance.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                panel.removeAll();
                LISTEDEMANDEMAINTENANCE listePanel = new LISTEDEMANDEMAINTENANCE();
                panel.add(listePanel.getPanel());
                panel.revalidate();
                panel.repaint();
            }
        });
    }

    public JPanel getPanel() {
        return panel;
    }
}
