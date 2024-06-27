package myWBproject;

import java.awt.EventQueue;

import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JLabel;
import javax.swing.JButton;
import java.awt.Font;
import java.awt.SystemColor;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;

public class ACCEUILCHEFMAINT {

	private JFrame frame;

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					ACCEUILCHEFMAINT window = new ACCEUILCHEFMAINT();
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
	public ACCEUILCHEFMAINT() {
		initialize();
	}

	/**
	 * Initialize the contents of the frame.
	 */
	private void initialize() {
		frame = new JFrame();
		frame.getContentPane().setBackground(SystemColor.text);
		frame.setBounds(100, 100, 681, 500);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		frame.getContentPane().setLayout(null);
		
		JPanel panel = new JPanel();
		panel.setBackground(SystemColor.text);
		panel.setBounds(10, 42, 278, 348);
		frame.getContentPane().add(panel);
		panel.setLayout(null);
		
		JButton btnNewButton_1 = new JButton("AJOUTER UN CLIENT");
		btnNewButton_1.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_1.setBounds(10, 21, 258, 23);
		panel.add(btnNewButton_1);
		
		JButton btnNewButton_2 = new JButton("MODIFIER UN CLIENT");
		btnNewButton_2.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_2.setBounds(10, 82, 258, 23);
		panel.add(btnNewButton_2);
		
		JButton btnNewButton_3 = new JButton("SUPPRIMER UN CLIENT");
		btnNewButton_3.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_3.setBounds(10, 149, 258, 23);
		panel.add(btnNewButton_3);
		
		JButton btnNewButton_4 = new JButton("LISTE CLIENT");
		btnNewButton_4.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
			}
		});
		btnNewButton_4.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_4.setBounds(10, 219, 258, 23);
		panel.add(btnNewButton_4);
		
		JButton btnNewButton_5 = new JButton("EDITION DE RAPPORT");
		btnNewButton_5.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_5.setBounds(10, 297, 258, 23);
		panel.add(btnNewButton_5);
		
		JPanel panel_1 = new JPanel();
		panel_1.setBackground(SystemColor.text);
		panel_1.setBounds(324, 42, 331, 348);
		frame.getContentPane().add(panel_1);
		panel_1.setLayout(null);
		
		JLabel lblNewLabel = new JLabel("GESTION DES CLIENTS");
		lblNewLabel.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		lblNewLabel.setBounds(10, 11, 220, 14);
		frame.getContentPane().add(lblNewLabel);
		
		JButton btnNewButton = new JButton("DECONNEXION");
		btnNewButton.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton.setBounds(233, 427, 156, 23);
		frame.getContentPane().add(btnNewButton);
	}
}
