
public class Operateur {

    /**
     * ID de l'opérateur
     */
    private int id;
    
    /**
     * Nom de l'opérateur
     */
    private String nom;
    
    /**
     * Prénom de l'opérateur
     */
    private String prenom;
    
    /**
     * Spécialité de l'opérateur
     */
    private String specialite;

    /**
     * Constructeur
     * @param id ID de l'opérateur
     * @param nom Nom de l'opérateur
     * @param prenom Prénom de l'opérateur
     * @param specialite Spécialité de l'opérateur
     */
    public Operateur(int id, String nom, String prenom, String specialite) {
        this.id = id;
        this.nom = nom;
        this.prenom = prenom;
        this.specialite = specialite;
    }

    /**
     * Getter pour l'attribut id
     * @return valeur de l'ID de l'opérateur
     */
    public int getId() {
        return id;
    }

    /**
     * Getter pour l'attribut nom
     * @return valeur du nom de l'opérateur
     */
    public String getNom() {
        return nom;
    }

    /**
     * Setter pour l'attribut nom
     * @param nom nouvelle valeur du nom de l'opérateur
     */
    public void setNom(String nom) {
        this.nom = nom;
    }

    /**
     * Getter pour l'attribut prenom
     * @return valeur du prénom de l'opérateur
     */
    public String getPrenom() {
        return prenom;
    }

    /**
     * Setter pour l'attribut prenom
     * @param prenom nouvelle valeur du prénom de l'opérateur
     */
    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    /**
     * Getter pour l'attribut specialite
     * @return valeur de la spécialité de l'opérateur
     */
    public String getSpecialite() {
        return specialite;
    }

    /**
     * Setter pour l'attribut specialite
     * @param specialite nouvelle valeur de la spécialité de l'opérateur
     */
    public void setSpecialite(String specialite) {
        this.specialite = specialite;
    }

    /**
     * Redéfinition de la méthode toString permettant de définir la traduction de l'objet en String
     * pour l'affichage par exemple
     */
    @Override
    public String toString() {
        return "Operateur [ID: " + id + ", Nom: " + nom + ", Prénom: " + prenom + ", Spécialité: " + specialite + "]";
    }
}
