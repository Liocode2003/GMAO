package myWBproject;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;

public class LISTEDEMANDEMAINTENANCE {

    private JFrame frame;
    private JTable table;

    /**
     * Lancer l'application.
     */
    public static void main(String[] args) {
        EventQueue.invokeLater(new Runnable() {
            public void run() {
                try {
                    LISTEDEMANDEMAINTENANCE window = new LISTEDEMANDEMAINTENANCE();
                    window.frame.setVisible(true);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    /**
     * Créer l'application.
     */
    public LISTEDEMANDEMAINTENANCE() {
        initialize();
    }

    /**
     * Initialiser le contenu du cadre.
     */
    private void initialize() {
        frame = new JFrame();
        frame.getContentPane().setBackground(SystemColor.text);
        frame.setBounds(100, 100, 697, 466);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.getContentPane().setLayout(null);

        JLabel lblNewLabel = new JLabel("LISTE DES DEMANDES DE MAINTENANCE");
        lblNewLabel.setFont(new Font("Times New Roman", Font.ITALIC, 16));
        lblNewLabel.setBounds(10, 11, 300, 20);
        frame.getContentPane().add(lblNewLabel);

        JPanel panel = new JPanel();
        panel.setBackground(SystemColor.text);
        panel.setBounds(10, 400, 661, 26);
        frame.getContentPane().add(panel);
        panel.setLayout(null);

        JButton btnRetour = new JButton("RETOUR");
        btnRetour.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        btnRetour.setBounds(30, 0, 89, 23);
        panel.add(btnRetour);

        JButton btnValiderAffectation = new JButton("VALIDER L'AFFECTATION");
        btnValiderAffectation.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        btnValiderAffectation.setBounds(219, 0, 183, 23);
        panel.add(btnValiderAffectation);

        JButton btnModifier = new JButton("MODIFIER");
        btnModifier.setFont(new Font("Times New Roman", Font.PLAIN, 12));
        btnModifier.setBounds(502, 0, 136, 23);
        panel.add(btnModifier);

        JPanel panel_1 = new JPanel();
        panel_1.setBackground(SystemColor.text);
        panel_1.setBounds(10, 36, 402, 353);
        frame.getContentPane().add(panel_1);
        panel_1.setLayout(null);

        JScrollPane scrollPane = new JScrollPane();
        scrollPane.setBounds(10, 11, 382, 331);
        panel_1.add(scrollPane);

        table = new JTable();
        table.setModel(new DefaultTableModel(
                new Object[][]{
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                        {null, null, null, null},
                },
                new String[]{
                        "ID", "TYPE", "DESCRIPTION", "DATE"
                }
        ));
        table.getColumnModel().getColumn(3).setResizable(false);
        scrollPane.setViewportView(table);
        
        JPanel panel_2 = new JPanel();
        panel_2.setBackground(SystemColor.text);
        panel_2.setBounds(422, 49, 249, 327);
        frame.getContentPane().add(panel_2);

        frame.setVisible(true);
    }

    public JFrame getFrame() {
        return frame;
    }

    public JTable getTable() {
        return table;
    }

	public Component getPanel() {
		// TODO Auto-generated method stub
		return null;
	}
}
