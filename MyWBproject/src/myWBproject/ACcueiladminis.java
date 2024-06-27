package myWBproject;

import java.awt.EventQueue;

import javax.swing.JFrame;
import java.awt.SystemColor;
import javax.swing.JLabel;
import java.awt.Font;
import javax.swing.JButton;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;

public class ACcueiladminis {

	JFrame frame;

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					ACcueiladminis window = new ACcueiladminis();
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
	public ACcueiladminis() {
		initialize();
	}

	/**
	 * Initialize the contents of the frame.
	 */
	private void initialize() {
		frame = new JFrame();
		frame.getContentPane().setBackground(SystemColor.text);
		frame.getContentPane().setLayout(null);
		
		JLabel lblNewLabel = new JLabel("MENU");
		lblNewLabel.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		lblNewLabel.setBounds(10, 11, 113, 14);
		frame.getContentPane().add(lblNewLabel);
		
		JButton btnNewButton = new JButton("AJOUTER UN CLIENT");
		btnNewButton.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				Ajouterunclient R= new Ajouterunclient();
				R.frame.setVisible(true);
				frame.dispose();
			}
		});
		btnNewButton.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton.setBounds(10, 73, 235, 33);
		frame.getContentPane().add(btnNewButton);
		
		JButton btnNewButton_1 = new JButton("LISTES DES CLIENTS");
		btnNewButton_1.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				LISTECLIENT R= new LISTECLIENT ();
				R.frame.setVisible(true);
				frame.dispose();
			}
		});
		btnNewButton_1.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_1.setBounds(10, 201, 235, 33);
		frame.getContentPane().add(btnNewButton_1);
		
		JButton btnNewButton_2 = new JButton("DECONNEXION");
		btnNewButton_2.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				Acceuil R= new Acceuil ();
				R.frame.setVisible(true);
				frame.dispose();
			}
		});
		btnNewButton_2.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_2.setBounds(184, 325, 143, 23);
		frame.getContentPane().add(btnNewButton_2);
		frame.setBackground(SystemColor.text);
		frame.setBounds(100, 100, 524, 412);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
	}

}
