
/**
 * Classe Article
 * Bonjour cette classe me permet de faire une serialisation des mes données 
 * @author grave - roueche - serais
 * @version 1.2
 * 
 * */

public class Article {

	/** 
	 * référence de l'article
	 */
	private int reference;		
	/**
	 * désignation
	 */
	private String designation;	
	/**
	 * prix unitaire hors taxe
	 */
	private int puHt;		
	/**
	 * quantité en stock
	 */
	private int qteStock;


	/**
	 * Constructeur
	 * @param reference référence de l'article
	 * @param designation désignation
	 * @param puHt prix unitaire hors taxe
	 * @param qteStock quantité en stock
	 */
	public Article(int reference, String designation, int  puHt, int qteStock) {
		this.reference=reference;
		this.designation = designation;
		this.puHt = puHt;
		this.qteStock = qteStock;
	}
	
	/**
	 * getter pour l'attribut reference
	 * @return valeur de la reference article
	 */
	public int getReference() {
		return reference;
	}
	/**
	 * getter pour l'attribut désignation
	 * @return valeur de la désignation article
	 */
	public String getDesignation() {
		return designation;
	}
	/**
	 * setter  pour l'attribut designation
	 * @param designation : nouvelle valeur de la désignation article
	 */
	public void setDesignation(String designation) {
		this.designation = designation;
	}
	/**
	 * getter  pour l'attribut puHt
	 * @return valeur de prix unitaire HT
	 */
	public int getPuHt() {
		return this.puHt;
	}
	/**
	 * setter  pour l'attribut puHt
	 * @param puHt :  nouvelle valeur de prix unitaire HT
	 */
	public void setPuHt(int puHt) {
		this.puHt = puHt;
	}
	/**
	 * getter  pour l'attribut qteStock
	 * @return valeur de quantité en stock
	 */
	public int getQteStock() {
		return qteStock;
	}
	/**
	 * setter  pour l'attribut qteStock
	 * @param qteStock : nouvelle valeur de prix unitaire HT
	 */
	public void setQteStock(int qteStock) {
		this.qteStock = qteStock;
	}

	/**
	 * Redéfinition de la méthode toString permettant de définir la traduction de l'objet en String
	 * pour l'affichage par exemple
	 */
	public String toString() {
		return "Article [réf : " + reference + " - " + designation
				+ ", " + puHt + "€ HT, " + qteStock + " en stock]";
	}
}
