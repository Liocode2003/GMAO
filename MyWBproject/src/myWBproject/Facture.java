import java.util.Date;

public class Facture {

    /**
     * ID de la facture
     */
    private int id;
    
    /**
     * ID de la maintenance associée
     */
    private int idMaintenance;
    
    /**
     * Montant de la facture
     */
    private double montant;
    
    /**
     * Date de la facture
     */
    private Date date;

    /**
     * Constructeur
     * @param id ID de la facture
     * @param idMaintenance ID de la maintenance associée
     * @param montant Montant de la facture
     * @param date Date de la facture
     */
    public Facture(int id, int idMaintenance, double montant, Date date) {
        this.id = id;
        this.idMaintenance = idMaintenance;
        this.montant = montant;
        this.date = date;
    }

    /**
     * Getter pour l'attribut id
     * @return valeur de l'ID de la facture
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
     * @return valeur du montant de la facture
     */
    public double getMontant() {
        return montant;
    }

    /**
     * Setter pour l'attribut montant
     * @param montant nouvelle valeur du montant de la facture
     */
    public void setMontant(double montant) {
        this.montant = montant;
    }

    /**
     * Getter pour l'attribut date
     * @return valeur de la date de la facture
     */
    public Date getDate() {
        return date;
    }

    /**
     * Setter pour l'attribut date
     * @param date nouvelle valeur de la date de la facture
     */
    public void setDate(Date date) {
        this.date = date;
    }

    /**
     * Redéfinition de la méthode toString permettant de définir la traduction de l'objet en String
     * pour l'affichage par exemple
     */
    @Override
    public String toString() {
        return "Facture [ID: " + id + ", ID Maintenance: " + idMaintenance + ", Montant: " + montant + "€, Date: " + date + "]";
    }
}
