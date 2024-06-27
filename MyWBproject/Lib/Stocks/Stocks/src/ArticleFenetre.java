
import java.awt.Color;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.Dimension;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.JPanel;
import javax.swing.BoxLayout;
import javax.swing.Box;

import java.util.List;


/**
 * Classe ArticleFenetre
 * Définit et ouvre une fenetre qui :
 * 
 *    - Permet l'insertion d'un nouvel article dans la table article via
 * la saisie des valeurs de reference, désignation, prix et quantité en stock
 *    - Permet l'affichage de tous les articles dans la console
 * @author grave - roueche - serais
 * @version 1.3
 * */



public class ArticleFenetre extends JFrame implements ActionListener {
	/**
	 * numero de version pour classe serialisable Permet d'eviter le warning
	 * "The serializable class ArticleFenetre does not declare a static final serialVersionUID field of type long"
	 */
	private static final long serialVersionUID = 1L;

	/**
	 * conteneur : il accueille les differents composants graphiques de
	 * ArticleFenetre
	 */
	private JPanel containerPanel;

	/**
	 * zone de texte pour le champ reference
	 */
	private JTextField textFieldReference;

	/**
	 * zone de texte pour le champ designation
	 */
	private JTextField textFieldDesignation;

	/**
	 * zone de texte pour le prix unitaire hors taxe
	 * 
	 */
	private JTextField textFieldPuHt;
	/**
	 * zone de texte pour la quantite en stock
	 */
	private JTextField textFieldQteStock;

	/**
	 * label reference
	 */
	private JLabel labelReference;

	/**
	 * label designation
	 */
	private JLabel labelDesignation;

	/**
	 * label prix unitaire hors taxe
	 */
	private JLabel labelPu_ht;

	/**
	 * label quantité en stock
	 */
	private JLabel labelQtestock;

	/**
	 * bouton d'ajout de l'article
	 */
	private JButton boutonAjouter;

	/**
	 * bouton qui permet d'afficher tous les articles
	 */
	private JButton boutonAffichageTousLesArticles;

	/**
	 * Zone de texte pour afficher les articles
	 */
	JTextArea zoneTextListArticle;

	/**
	 * Zone de défilement pour la zone de texte
	 */
	JScrollPane zoneDefilement;

	/**
	 * instance de ArticleDAO permettant les accès à la base de données
	 */
	private ArticleDAO monArticleDAO;

	/**
	 * Constructeur Définit la fenêtre et ses composants - affiche la fenêtre
	 */
	public ArticleFenetre() {
		// on instancie la classe Article DAO
		this.monArticleDAO = new ArticleDAO();

		// on fixe le titre de la fenêtre
		this.setTitle("Article");
		// initialisation de la taille de la fenêtre
		this.setSize(400, 400);

		// création du conteneur
		containerPanel = new JPanel();

		// choix du Layout pour ce conteneur
		// il permet de gérer la position des éléments
		// il autorisera un retaillage de la fenêtre en conservant la
		// présentation
		// BoxLayout permet par exemple de positionner les élements sur une
		// colonne ( PAGE_AXIS )
		containerPanel.setLayout(new BoxLayout(containerPanel,
				BoxLayout.PAGE_AXIS));

		// choix de la couleur pour le conteneur
		containerPanel.setBackground(Color.PINK);

		// instantiation des composants graphiques
		textFieldReference = new JTextField();
		textFieldDesignation = new JTextField();
		textFieldPuHt = new JTextField();
		textFieldQteStock = new JTextField();
		boutonAjouter = new JButton("ajouter");
		boutonAffichageTousLesArticles = new JButton(
				"afficher tous les articles");
		labelReference = new JLabel("Référence :");
		labelDesignation = new JLabel("Désignation :");
		labelPu_ht = new JLabel("Prix unitaire HT :");
		labelQtestock = new JLabel("Quantité en stock :");

		zoneTextListArticle = new JTextArea(10, 20);
		zoneDefilement = new JScrollPane(zoneTextListArticle);
		zoneTextListArticle.setEditable(false);

		// ajout des composants sur le container
		containerPanel.add(labelReference);
		// introduire une espace constant entre le label et le champ texte
		containerPanel.add(Box.createRigidArea(new Dimension(0, 5)));
		containerPanel.add(textFieldReference);
		// introduire une espace constant entre le champ texte et le composant
		// suivant
		containerPanel.add(Box.createRigidArea(new Dimension(0, 10)));

		containerPanel.add(labelDesignation);
		containerPanel.add(Box.createRigidArea(new Dimension(0, 5)));
		containerPanel.add(textFieldDesignation);
		containerPanel.add(Box.createRigidArea(new Dimension(0, 10)));

		containerPanel.add(labelPu_ht);
		containerPanel.add(Box.createRigidArea(new Dimension(0, 5)));
		containerPanel.add(textFieldPuHt);
		containerPanel.add(Box.createRigidArea(new Dimension(0, 10)));

		containerPanel.add(labelQtestock);
		containerPanel.add(Box.createRigidArea(new Dimension(0, 5)));
		containerPanel.add(textFieldQteStock);
		containerPanel.add(Box.createRigidArea(new Dimension(0, 10)));

		containerPanel.add(boutonAjouter);

		containerPanel.add(Box.createRigidArea(new Dimension(0, 20)));

		containerPanel.add(boutonAffichageTousLesArticles);
		containerPanel.add(Box.createRigidArea(new Dimension(0, 5)));
		containerPanel.add(zoneDefilement);

		// ajouter une bordure vide de taille constante autour de l'ensemble des
		// composants
		containerPanel.setBorder(BorderFactory
				.createEmptyBorder(10, 10, 10, 10));

		// ajout des écouteurs sur les boutons pour gérer les évènements
		boutonAjouter.addActionListener(this);
		boutonAffichageTousLesArticles.addActionListener(this);

		// permet de quitter l'application si on ferme la fenêtre
		this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

		this.setContentPane(containerPanel);

		// affichage de la fenêtre
		this.setVisible(true);
	}

	/**
	 * Gère les actions réalisées sur les boutons
	 *
	 */
	public void actionPerformed(ActionEvent ae) {
		int retour; // code de retour de la classe ArticleDAO

		try {
			if (ae.getSource() == boutonAjouter) {
				// on crée l'objet message
				Article a = new Article(
						Integer.parseInt(this.textFieldReference.getText()),
						this.textFieldDesignation.getText(),
						Integer.parseInt(this.textFieldPuHt.getText()),
						Integer.parseInt(this.textFieldQteStock.getText()));
				// on demande à la classe de communication d'envoyer l'article
				// dans la table article
				retour = monArticleDAO.ajouter(a);
				// affichage du nombre de lignes ajoutées
				// dans la bdd pour vérification
				System.out.println("" + retour + " ligne ajoutée ");
				if (retour == 1)
					JOptionPane.showMessageDialog(this, "article ajouté !");
				else
					JOptionPane.showMessageDialog(this, "erreur ajout article",
							"Erreur", JOptionPane.ERROR_MESSAGE);
			} else if (ae.getSource() == boutonAffichageTousLesArticles) {
				// on demande à la classe ArticleDAO d'ajouter le message
				// dans la base de données
				List<Article> liste = monArticleDAO.getListeArticles();
				// on efface l'ancien contenu de la zone de texte
				zoneTextListArticle.setText("");
				// on affiche dans la console du client les articles reçus
				for (Article a : liste) {
					zoneTextListArticle.append(a.toString());
					zoneTextListArticle.append("\n");
					// Pour afficher dans la console :
					// System.out.println(a.toString());
				}
			}
		} catch (Exception e) {
			JOptionPane.showMessageDialog(this,
					"Veuillez contrôler vos saisies", "Erreur",
					JOptionPane.ERROR_MESSAGE);
			System.err.println("Veuillez contrôler vos saisies");
		}

	}

	public static void main(String[] args) {
		new ArticleFenetre();
	}

}
