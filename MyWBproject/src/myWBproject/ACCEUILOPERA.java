package myWBproject;

import java.awt.EventQueue;

import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JButton;
import java.awt.Font;
import javax.swing.JLabel;
import java.awt.SystemColor;

public class ACCEUILOPERA {

	private JFrame frame;

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					ACCEUILOPERA window = new ACCEUILOPERA();
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
	public ACCEUILOPERA() {
		initialize();
	}

	/**
	 * Initialize the contents of the frame.
	 */
	private void initialize() {
		frame = new JFrame();
		frame.getContentPane().setBackground(SystemColor.text);
		frame.getContentPane().setFont(new Font("Times New Roman", Font.ITALIC, 12));
		frame.setBounds(100, 100, 685, 495);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		frame.getContentPane().setLayout(null);
		
		JPanel panel = new JPanel();
		panel.setBackground(SystemColor.text);
		panel.setBounds(10, 34, 258, 367);
		frame.getContentPane().add(panel);
		panel.setLayout(null);
		
		JButton btnNewButton_1 = new JButton("SIGNALER UNE MAINTENANCE");
		btnNewButton_1.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton_1.setBounds(26, 49, 201, 23);
		panel.add(btnNewButton_1);
		
		JButton btnNewButton_2 = new JButton("FICHES DE MAINTENANCE");
		btnNewButton_2.setFont(new Font("Times New Roman", Font.ITALIC, 11));
		btnNewButton_2.setBounds(37, 226, 190, 23);
		panel.add(btnNewButton_2);
		
		JPanel panel_1 = new JPanel();
		panel_1.setBackground(SystemColor.text);
		panel_1.setBounds(278, 34, 381, 367);
		frame.getContentPane().add(panel_1);
		
		JButton btnNewButton = new JButton("DECONNEXION");
		btnNewButton.setFont(new Font("Times New Roman", Font.ITALIC, 12));
		btnNewButton.setBounds(205, 424, 208, 23);
		frame.getContentPane().add(btnNewButton);
		
		JLabel lblNewLabel = new JLabel("ACCEUIL");
		lblNewLabel.setFont(new Font("Times New Roman", Font.ITALIC, 11));
		lblNewLabel.setBounds(10, 9, 258, 14);
		frame.getContentPane().add(lblNewLabel);
	}

}
