import java.util.Date;

public class Cloturedossier {

    /**
     * ID de la clôture de dossier
     */
    private int id;

    /**
     * ID de la facture associée
     */
    private int idFacture;

    /**
     * ID de la maintenance associée
     */
    private int idMaintenance;

    /**
     * Date de clôture de dossier
     */
    private Date date;

    /**
     * Constructeur
     * @param id ID de la clôture de dossier
     * @param idFacture ID de la facture associée
     * @param idMaintenance ID de la maintenance associée
     * @param date Date de clôture de dossier
     */
    public Cloturedossier(int id, int idFacture, int idMaintenance, Date date) {
        this.id = id;
        this.idFacture = idFacture;
        this.idMaintenance = idMaintenance;
        this.date = date;
    }

    /**
     * Getter pour l'attribut id
     * @return valeur de l'ID de la clôture de dossier
     */
    public int getId() {
        return id;
    }

    /**
     * Getter pour l'attribut idFacture
     * @return valeur de l'ID de la facture associée
     */
    public int getIdFacture() {
        return idFacture;
    }

    /**
     * Setter pour l'attribut idFacture
     * @param idFacture nouvelle valeur de l'ID de la facture associée
     */
    public void setIdFacture(int idFacture) {
        this.idFacture = idFacture;
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
     * Getter pour l'attribut date
     * @return valeur de la date de clôture de dossier
     */
    public Date getDate() {
        return date;
    }

    /**
     * Setter pour l'attribut date
     * @param date nouvelle valeur de la date de clôture de dossier
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
        return "ClotureDossier [ID: " + id + ", ID Facture: " + idFacture + ", ID Maintenance: " + idMaintenance + ", Date: " + date + "]";
    }
}
