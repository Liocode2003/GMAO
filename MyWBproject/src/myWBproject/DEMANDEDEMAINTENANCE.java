
import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public class DEMANDEDEMAINTENANCE {

    public static final String NAME = "demandeMaintenance";

    private JPanel panel;
    private JPanel cards;

    public DEMANDEDEMAINTENANCE(JPanel cards) {
        this.cards = cards;
        initialize();
    }

    private void initialize() {
        panel = new JPanel();
        panel.setBackground(SystemColor.text);
        panel.setBounds(10, 10, 510, 520);
        panel.setLayout(null);

        JLabel lblNewLabel = new JLabel("SAISIR UNE DEMANDE DE MAINTENANCE");
        lblNewLabel.setFont(new Font("Times New Roman", Font.ITALIC, 16));
        lblNewLabel.setBounds(90, 11, 339, 20);
        panel.add(lblNewLabel);

        JLabel lblNewLabel_1 = new JLabel("DESCRIPTION");
        lblNewLabel_1.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        lblNewLabel_1.setBounds(10, 79, 100, 20);
        panel.add(lblNewLabel_1);

        JTextField textField = new JTextField();
        textField.setBounds(188, 79, 200, 30);
        panel.add(textField);
        textField.setColumns(10);

        JLabel lblNewLabel_2 = new JLabel("ID");
        lblNewLabel_2.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        lblNewLabel_2.setBounds(10, 155, 100, 20);
        panel.add(lblNewLabel_2);

        JTextField textField_1 = new JTextField();
        textField_1.setBounds(188, 155, 200, 30);
        panel.add(textField_1);
        textField_1.setColumns(10);

        JLabel lblNewLabel_3 = new JLabel("DATE DE DEMANDE");
        lblNewLabel_3.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        lblNewLabel_3.setBounds(10, 220, 122, 20);
        panel.add(lblNewLabel_3);

        JTextField textField_2 = new JTextField();
        textField_2.setBounds(188, 220, 200, 30);
        panel.add(textField_2);
        textField_2.setColumns(10);

        JLabel lblNewLabel_4 = new JLabel("TYPE DE MAINTENANCE");
        lblNewLabel_4.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        lblNewLabel_4.setBounds(10, 303, 150, 20);
        panel.add(lblNewLabel_4);

        JTextField textField_3 = new JTextField();
        textField_3.setBounds(188, 298, 200, 30);
        panel.add(textField_3);
        textField_3.setColumns(10);

        JButton btnNewButton = new JButton("RETOUR");
        btnNewButton.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        btnNewButton.setBounds(78, 386, 100, 30);
        panel.add(btnNewButton);

        JButton btnNewButton_1 = new JButton("VALIDER");
        btnNewButton_1.setFont(new Font("Times New Roman", Font.ITALIC, 12));
        btnNewButton_1.setBounds(379, 386, 100, 30);
        panel.add(btnNewButton_1);

        // Action pour le bouton "RETOUR"
        btnNewButton.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                CardLayout cl = (CardLayout) cards.getLayout();
                cl.show(cards, MenuPanel.NAME); // Retourne au panel MenuPanel
            }
        });

        // Ajoutez des actions pour les autres boutons selon vos besoins
    }

    public JPanel getPanel() {
        return panel;
    }
}
