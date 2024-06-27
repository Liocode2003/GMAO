package myWBproject;

import java.awt.EventQueue;

import javax.swing.JFrame;
import javax.swing.GroupLayout;
import javax.swing.GroupLayout.Alignment;
import javax.swing.JButton;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;
import javax.swing.LayoutStyle.ComponentPlacement;
import javax.swing.JLabel;
import javax.swing.JPanel;
import java.awt.Font;
import java.awt.SystemColor;

public class GESTIONDESOPERATEURS {

	private JFrame frame;

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					GESTIONDESOPERATEURS window = new GESTIONDESOPERATEURS();
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
	public GESTIONDESOPERATEURS() {
		initialize();
	}

	/**
	 * Initialize the contents of the frame.
	 */
	private void initialize() {
		frame = new JFrame();
		frame.getContentPane().setBackground(SystemColor.text);
		frame.getContentPane().setLayout(null);
		
		JPanel panel = new JPanel();
		panel.setBackground(SystemColor.text);
		panel.setBounds(10, 39, 274, 361);
		frame.getContentPane().add(panel);
		panel.setLayout(null);
		
		JButton btnNewButton = new JButton("CREER UN OPERATEUR");
		btnNewButton.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton.setForeground(SystemColor.activeCaptionText);
		btnNewButton.setBounds(29, 30, 160, 23);
		panel.add(btnNewButton);
		
		JButton btnNewButton_1 = new JButton("LISTE OPERATEUR");
		btnNewButton_1.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_1.setBounds(29, 109, 160, 23);
		panel.add(btnNewButton_1);
		
		JButton btnNewButton_3 = new JButton("MODFIER");
		btnNewButton_3.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_3.setBounds(29, 194, 160, 23);
		panel.add(btnNewButton_3);
		
		JButton btnNewButton_4 = new JButton("SUPPRIMER");
		btnNewButton_4.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_4.setBounds(29, 278, 160, 23);
		panel.add(btnNewButton_4);
		
		JPanel panel_1 = new JPanel();
		panel_1.setBackground(SystemColor.text);
		panel_1.setBounds(294, 39, 361, 361);
		frame.getContentPane().add(panel_1);
		
		JLabel lblNewLabel = new JLabel("GESTION DES OPERATEURS");
		lblNewLabel.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		lblNewLabel.setBounds(0, 11, 284, 14);
		frame.getContentPane().add(lblNewLabel);
		
		JButton btnNewButton_2 = new JButton("RETOUR");
		btnNewButton_2.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_2.setBounds(223, 418, 179, 23);
		frame.getContentPane().add(btnNewButton_2);
	}

}
