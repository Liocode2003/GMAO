import java.util.Date;

public class Maintenance {

    /**
     * ID de la maintenance
     */
    private int id;

    /**
     * ID du client
     */
    private int idClient;

    /**
     * Description de la maintenance
     */
    private String description;

    /**
     * Type de maintenance (préventive, palliative, corrective)
     */
    private String type;

    /**
     * Date de création de la maintenance
     */
    private Date dateCreation;

    /**
     * Constructeur
     * @param id ID de la maintenance
     * @param idClient ID du client
     * @param description Description de la maintenance
     * @param type Type de maintenance
     * @param dateCreation Date de création de la maintenance
     */
    public Maintenance(int id, int idClient, String description, String type, Date dateCreation) {
        this.id = id;
        this.idClient = idClient;
        this.description = description;
        this.type = type;
        this.dateCreation = dateCreation;
    }

    /**
     * Getter pour l'attribut id
     * @return valeur de l'ID de la maintenance
     */
    public int getId() {
        return id;
    }

    /**
     * Getter pour l'attribut idClient
     * @return valeur de l'ID du client
     */
    public int getIdClient() {
        return idClient;
    }

    /**
     * Getter pour l'attribut description
     * @return valeur de la description de la maintenance
     */
    public String getDescription() {
        return description;
    }

    /**
     * Setter pour l'attribut description
     * @param description nouvelle valeur de la description de la maintenance
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Getter pour l'attribut type
     * @return valeur du type de maintenance
     */
    public String getType() {
        return type;
    }

    /**
     * Setter pour l'attribut type
     * @param type nouvelle valeur du type de maintenance
     */
    public void setType(String type) {
        this.type = type;
    }

    /**
     * Getter pour l'attribut dateCreation
     * @return valeur de la date de création de la maintenance
     */
    public Date getDateCreation() {
        return dateCreation;
    }

    /**
     * Setter pour l'attribut dateCreation
     * @param dateCreation nouvelle valeur de la date de création de la maintenance
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
        return "Maintenance [ID: " + id + ", ID Client: " + idClient + ", Description: " + description + ", Type: " + type + ", Date de création: " + dateCreation + "]";
    }
}
