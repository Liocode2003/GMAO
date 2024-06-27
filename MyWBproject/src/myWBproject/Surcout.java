import java.util.Date;

public class Surcout {

    private int id;
    private int idClient;
    private double montant;
    private Date dateCreation;
    private String description;

    public Surcout(int id, int idClient, double montant, Date dateCreation, String description) {
        this.id = id;
        this.idClient = idClient;
        this.montant = montant;
        this.dateCreation = dateCreation;
        this.description = description;
    }

    public int getId() {
        return id;
    }

    public int getIdClient() {
        return idClient;
    }

    public void setIdClient(int idClient) {
        this.idClient = idClient;
    }

    public double getMontant() {
        return montant;
    }

    public void setMontant(double montant) {
        this.montant = montant;
    }

    public Date getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(Date dateCreation) {
        this.dateCreation = dateCreation;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public String toString() {
        return "Surcout [ID: " + id + ", ID Client: " + idClient + ", Montant: " + montant + "€, Date de création: " + dateCreation + ", Description: " + description + "]";
    }
}
