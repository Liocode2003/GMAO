package myWBproject;

import java.awt.EventQueue;

import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JButton;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;
import javax.swing.JPanel;
import java.awt.Font;
import javax.swing.JTable;
import java.awt.SystemColor;
import java.awt.FlowLayout;

public class GESTIONADMFIN {

	private JFrame frame;

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					GESTIONADMFIN window = new GESTIONADMFIN();
					window.frame.setVisible(true);
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		});
	}

	/**
	 * Create the application.
	 */
	public GESTIONADMFIN() {
		initialize();
	}

	/**
	 * Initialize the contents of the frame.
	 */
	private void initialize() {
		frame = new JFrame();
		frame.getContentPane().setBackground(SystemColor.text);
		frame.setBounds(100, 100, 680, 498);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		frame.getContentPane().setLayout(null);
		
		JPanel panel = new JPanel();
		panel.setBackground(SystemColor.text);
		panel.setBounds(10, 36, 363, 377);
		frame.getContentPane().add(panel);
		panel.setLayout(null);
		
		JButton btnNewButton_1 = new JButton("CREER UNE FACTURE");
		btnNewButton_1.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_1.setBounds(72, 28, 196, 23);
		panel.add(btnNewButton_1);
		
		JButton btnNewButton_2 = new JButton("LISTE DES FACTURES");
		btnNewButton_2.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_2.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
			}
		});
		btnNewButton_2.setBounds(72, 120, 196, 23);
		panel.add(btnNewButton_2);
		
		JButton btnNewButton_3 = new JButton("CLOTURER UN DOSSIER");
		btnNewButton_3.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_3.setBounds(72, 216, 196, 23);
		panel.add(btnNewButton_3);
		
		JButton btnNewButton_4 = new JButton("LISTE DOSSIER CLOTURES");
		btnNewButton_4.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_4.setBounds(72, 320, 196, 23);
		panel.add(btnNewButton_4);
		
		JLabel lblNewLabel = new JLabel("REGLEMENT ET CLOTURE DE DOSSIER");
		lblNewLabel.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		lblNewLabel.setBounds(10, 11, 363, 14);
		frame.getContentPane().add(lblNewLabel);
		
		JPanel panel_1 = new JPanel();
		panel_1.setBackground(SystemColor.text);
		panel_1.setBounds(383, 41, 271, 377);
		frame.getContentPane().add(panel_1);
		
		JPanel panel_2 = new JPanel();
		panel_2.setBackground(SystemColor.text);
		panel_2.setBounds(20, 428, 634, 20);
		frame.getContentPane().add(panel_2);
		panel_2.setLayout(null);
		
		JButton btnNewButton = new JButton("RETOUR");
		btnNewButton.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton.setBounds(290, 0, 109, 23);
		panel_2.add(btnNewButton);
	}

}
