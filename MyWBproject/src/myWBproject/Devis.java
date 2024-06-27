import java.util.Date;

public class Devis {

    /**
     * ID du devis
     */
    private int id;

    /**
     * ID de la maintenance associée
     */
    private int idMaintenance;

    /**
     * Montant du devis
     */
    private double montant;

    /**
     * Date de création du devis
     */
    private Date dateCreation;

    /**
     * Constructeur
     * @param id ID du devis
     * @param idMaintenance ID de la maintenance associée
     * @param montant Montant du devis
     * @param dateCreation Date de création du devis
     */
    public Devis(int id, int idMaintenance, double montant, Date dateCreation) {
        this.id = id;
        this.idMaintenance = idMaintenance;
        this.montant = montant;
        this.dateCreation = dateCreation;
    }

    /**
     * Getter pour l'attribut id
     * @return valeur de l'ID du devis
     */
    public int getId() {
        return id;
    }

    /**
     * Getter pour l'attribut idMaintenance
     * @return valeur de l'ID de la maintenance associée
     */
    public int getIdMaintenance() {
        return idMaintenance;
    }

    /**
     * Setter pour l'attribut idMaintenance
     * @param idMaintenance nouvelle valeur de l'ID de la maintenance associée
     */
    public void setIdMaintenance(int idMaintenance) {
        this.idMaintenance = idMaintenance;
    }

    /**
     * Getter pour l'attribut montant
     * @return valeur du montant du devis
     */
    public double getMontant() {
        return montant;
    }

    /**
     * Setter pour l'attribut montant
     * @param montant nouvelle valeur du montant du devis
     */
    public void setMontant(double montant) {
        this.montant = montant;
    }

    /**
     * Getter pour l'attribut dateCreation
     * @return valeur de la date de création du devis
     */
    public Date getDateCreation() {
        return dateCreation;
    }

    /**
     * Setter pour l'attribut dateCreation
     * @param dateCreation nouvelle valeur de la date de création du devis
     */
    public void setDateCreation(Date dateCreation) {
        this.dateCreation = dateCreation;
    }

    /**
     * Redéfinition de la méthode toString permettant de définir la traduction de l'objet en String
     * pour l'affichage par exemple
     */
    @Override
    public String toString() {
        return "Devis [ID: " + id + ", ID Maintenance: " + idMaintenance + ", Montant: " + montant + "€, Date de création: " + dateCreation + "]";
    }
}
