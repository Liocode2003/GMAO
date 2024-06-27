package myWBproject;

import java.awt.EventQueue;

import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JButton;
import java.awt.SystemColor;
import javax.swing.JPanel;
import java.awt.Font;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;

public class FACTURATIONDESPRESTATIONS {

	private JFrame frame;

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					FACTURATIONDESPRESTATIONS window = new FACTURATIONDESPRESTATIONS();
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
	public FACTURATIONDESPRESTATIONS() {
		initialize();
	}

	/**
	 * Initialize the contents of the frame.
	 */
	private void initialize() {
		frame = new JFrame();
		frame.getContentPane().setBackground(SystemColor.text);
		frame.setBounds(100, 100, 683, 473);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		frame.getContentPane().setLayout(null);
		
		JPanel panel = new JPanel();
		panel.setBackground(SystemColor.text);
		panel.setBounds(10, 42, 300, 338);
		frame.getContentPane().add(panel);
		panel.setLayout(null);
		
		JButton btnNewButton = new JButton("CREER UN SURCOUT");
		btnNewButton.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
			}
		});
		btnNewButton.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton.setBounds(10, 34, 166, 23);
		panel.add(btnNewButton);
		
		JButton btnNewButton_1 = new JButton("LISTE SURCOUT");
		btnNewButton_1.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_1.setBounds(10, 114, 166, 23);
		panel.add(btnNewButton_1);
		
		JButton btnNewButton_2 = new JButton("CREER UN DEVIS");
		btnNewButton_2.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_2.setBounds(10, 197, 166, 23);
		panel.add(btnNewButton_2);
		
		JButton btnNewButton_3 = new JButton("LISTE DEVIS");
		btnNewButton_3.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_3.setBounds(10, 283, 166, 23);
		panel.add(btnNewButton_3);
		
		JPanel panel_1 = new JPanel();
		panel_1.setBackground(SystemColor.text);
		panel_1.setBounds(320, 42, 337, 338);
		frame.getContentPane().add(panel_1);
		
		JLabel lblNewLabel = new JLabel("GESTION DES PRESTATIONS");
		lblNewLabel.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		lblNewLabel.setBounds(10, 11, 300, 14);
		frame.getContentPane().add(lblNewLabel);
		
		JButton btnNewButton_4 = new JButton("RETOUR");
		btnNewButton_4.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_4.setBounds(245, 400, 150, 23);
		frame.getContentPane().add(btnNewButton_4);
	}

}
