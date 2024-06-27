import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Classe d'accès aux données contenues dans la table article
 * 
 * @author grave - roueche - serais
 * @version 1.2
 * */
public class ArticleDAO {

	/**
	 * Paramètres de connexion à la base de données oracle URL, LOGIN et PASS
	 * sont des constantes
	 */
	final static String URL = "jdbc:oracle:thin:@localhost:1521:xe";
	//final static String URL = "jdbc:mysql://localhost/stock";
	
	final static String LOGIN = "prof";  //exemple BDD1
	final static String PASS = "isgeic2019";   //exemple BDD1

	
	/**
	 * Constructeur de la classe
	 * 
	 */
	public ArticleDAO() {
		// chargement du pilote de bases de données
		try {
			Class.forName("oracle.jdbc.OracleDriver");
		} catch (ClassNotFoundException e) {
			System.err
					.println("Impossible de charger le pilote de BDD, ne pas oublier d'importer le fichier .jar dans le projet");
		}

	}

	/**
	 * Permet d'ajouter un article dans la table article Le mode est auto-commit
	 * par défaut : chaque insertion est validée
	 * 
	 * @param article
	 *            l'article à ajouter
	 * @return retourne le nombre de lignes ajoutées dans la table
	 */
	public int ajouter(Article article) {
		Connection con = null;
		PreparedStatement ps = null;
		int retour = 0;

		// connexion à la base de données
		try {

			// tentative de connexion
			con = DriverManager.getConnection(URL, LOGIN, PASS);
			// préparation de l'instruction SQL, chaque ? représente une valeur
			// à communiquer dans l'insertion
			// les getters permettent de récupérer les valeurs des attributs
			// souhaités
			ps = con.prepareStatement("INSERT INTO article (art_reference, art_designation, art_pu_ht, art_qte_stock) VALUES (?, ?, ?, ?)");
			ps.setInt(1, article.getReference());
			ps.setString(2, article.getDesignation());
			ps.setInt(3, article.getPuHt());
			ps.setInt(4, article.getQteStock());

			// Exécution de la requête
			retour = ps.executeUpdate();

		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			// fermeture du preparedStatement et de la connexion
			try {
				if (ps != null)
					ps.close();
			} catch (Exception ignore) {
			}
			try {
				if (con != null)
					con.close();
			} catch (Exception ignore) {
			}
		}
		return retour;

	}

	/**
	 * Permet de récupérer un article à partir de sa référence
	 * 
	 * @param reference
	 *            la référence de l'article à récupérer
	 * @return 	l'article trouvé;
	 * 			null si aucun article ne correspond à cette référence
	 */
	public Article getArticle(int reference) {

		Connection con = null;
		PreparedStatement ps = null;
		ResultSet rs = null;
		Article retour = null;

		// connexion à la base de données
		try {

			con = DriverManager.getConnection(URL, LOGIN, PASS);
			ps = con.prepareStatement("SELECT * FROM article WHERE art_reference = ?");
			ps.setInt(1, reference);

			// on exécute la requête
			// rs contient un pointeur situé juste avant la première ligne
			// retournée
			rs = ps.executeQuery();
			// passe à la première (et unique) ligne retournée
			if (rs.next())
				retour = new Article(rs.getInt("art_reference"),
						rs.getString("art_designation"),
						rs.getInt("art_pu_ht"), rs.getInt("art_qte_stock"));

		} catch (Exception ee) {
			ee.printStackTrace();
		} finally {
			// fermeture du ResultSet, du PreparedStatement et de la Connexion
			try {
				if (rs != null)
					rs.close();
			} catch (Exception ignore) {
			}
			try {
				if (ps != null)
					ps.close();
			} catch (Exception ignore) {
			}
			try {
				if (con != null)
					con.close();
			} catch (Exception ignore) {
			}
		}
		return retour;

	}

	/**
	 * Permet de récupérer tous les articles stockés dans la table article
	 * 
	 * @return une ArrayList d'Articles
	 */
	public List<Article> getListeArticles() {

		Connection con = null;
		PreparedStatement ps = null;
		ResultSet rs = null;
		List<Article> retour = new ArrayList<Article>();

		// connexion à la base de données
		try {

			con = DriverManager.getConnection(URL, LOGIN, PASS);
			ps = con.prepareStatement("SELECT * FROM article");

			// on exécute la requête
			rs = ps.executeQuery();
			// on parcourt les lignes du résultat
			while (rs.next())
				retour.add(new Article(rs.getInt("art_reference"), rs
						.getString("art_designation"), rs
						.getInt("art_pu_ht"), rs.getInt("art_qte_stock")));

		} catch (Exception ee) {
			ee.printStackTrace();
		} finally {
			// fermeture du rs, du preparedStatement et de la connexion
			try {
				if (rs != null)
					rs.close();
			} catch (Exception ignore) {
			}
			try {
				if (ps != null)
					ps.close();
			} catch (Exception ignore) {
			}
			try {
				if (con != null)
					con.close();
			} catch (Exception ignore) {
			}
		}
		return retour;

	}

	// main permettant de tester la classe
	/*public static void main(String[] args) throws SQLException {

		ArticleDAO articleDAO = new ArticleDAO();
		// test de la méthode ajouter
		Article a1 = new Article(2, "Set de 2 raquettes de ping-pong", 149.9,10);
		int retour = articleDAO.ajouter(a1);

		System.out.println(retour + " lignes ajoutées");

		// test de la méthode getArticle
		Article a2 = articleDAO.getArticle(1);
		System.out.println(a2);

		// test de la méthode getListeArticles
		List<Article> liste = articleDAO.getListeArticles();
		// affichage des articles
		for (Article art : liste) {
			System.out.println(art.toString());
		}

	}*/
}
