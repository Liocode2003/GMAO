package myWBproject;

import java.awt.EventQueue;

import javax.swing.JFrame;
import javax.swing.GroupLayout;
import javax.swing.GroupLayout.Alignment;
import javax.swing.JLabel;
import javax.swing.JTextField;
import javax.swing.JRadioButton;
import javax.swing.JButton;
import javax.swing.LayoutStyle.ComponentPlacement;
import java.awt.SystemColor;
import java.awt.Color;
import javax.swing.JPasswordField;
import java.awt.Font;

public class Acceuil {

	private JFrame frame;
	private JTextField textField;
	private JPasswordField passwordField;

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					Acceuil window = new Acceuil();
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
	public Acceuil() {
		initialize();
	}

	/**
	 * Initialize the contents of the frame.
	 */
	private void initialize() {
		frame = new JFrame();
		frame.getContentPane().setFont(new Font("Times New Roman", Font.ITALIC, 12));
		frame.getContentPane().setBackground(SystemColor.text);
		frame.getContentPane().setForeground(new Color(0, 0, 0));
		frame.setBounds(100, 100, 584, 390);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		
		JLabel lblNewLabel_1 = new JLabel("NOM D'UTILISATEUR");
		lblNewLabel_1.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		
		JLabel lblNewLabel_2 = new JLabel("MOT DE PASSE");
		lblNewLabel_2.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		
		JButton btnNewButton = new JButton("Connexion");
		btnNewButton.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton.setForeground(new Color(0, 0, 0));
		
		textField = new JTextField();
		textField.setColumns(10);
		
		JRadioButton rdbtnNewRadioButton = new JRadioButton("Se souvenir de moi?");
		rdbtnNewRadioButton.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		
		JLabel lblNewLabel = new JLabel("Veuillez entrer vos informations de connexion");
		lblNewLabel.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		
		passwordField = new JPasswordField();
		GroupLayout groupLayout = new GroupLayout(frame.getContentPane());
		groupLayout.setHorizontalGroup(
			groupLayout.createParallelGroup(Alignment.LEADING)
				.addGroup(groupLayout.createSequentialGroup()
					.addContainerGap(10, Short.MAX_VALUE)
					.addGroup(groupLayout.createParallelGroup(Alignment.TRAILING)
						.addComponent(lblNewLabel_1)
						.addComponent(lblNewLabel_2))
					.addGap(53)
					.addGroup(groupLayout.createParallelGroup(Alignment.LEADING)
						.addComponent(textField, GroupLayout.PREFERRED_SIZE, 208, GroupLayout.PREFERRED_SIZE)
						.addComponent(passwordField, 208, 208, 208))
					.addGap(325))
				.addGroup(groupLayout.createSequentialGroup()
					.addGap(205)
					.addComponent(btnNewButton)
					.addContainerGap(408, Short.MAX_VALUE))
				.addGroup(groupLayout.createSequentialGroup()
					.addGap(188)
					.addComponent(rdbtnNewRadioButton)
					.addContainerGap(387, Short.MAX_VALUE))
				.addGroup(groupLayout.createSequentialGroup()
					.addContainerGap()
					.addComponent(lblNewLabel, GroupLayout.PREFERRED_SIZE, 245, GroupLayout.PREFERRED_SIZE)
					.addContainerGap(457, Short.MAX_VALUE))
		);
		groupLayout.setVerticalGroup(
			groupLayout.createParallelGroup(Alignment.LEADING)
				.addGroup(groupLayout.createSequentialGroup()
					.addContainerGap()
					.addComponent(lblNewLabel)
					.addGap(55)
					.addGroup(groupLayout.createParallelGroup(Alignment.BASELINE)
						.addComponent(lblNewLabel_1)
						.addComponent(textField, GroupLayout.PREFERRED_SIZE, 30, GroupLayout.PREFERRED_SIZE))
					.addGap(44)
					.addGroup(groupLayout.createParallelGroup(Alignment.BASELINE)
						.addComponent(passwordField, GroupLayout.PREFERRED_SIZE, 29, GroupLayout.PREFERRED_SIZE)
						.addComponent(lblNewLabel_2))
					.addGap(31)
					.addComponent(rdbtnNewRadioButton)
					.addGap(27)
					.addComponent(btnNewButton)
					.addContainerGap(83, Short.MAX_VALUE))
		);
		frame.getContentPane().setLayout(groupLayout);
	}
}
