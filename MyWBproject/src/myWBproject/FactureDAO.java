import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class FactureDAO {
    final static String URL = "jdbc:oracle:thin:@localhost:1521:xe";
    final static String LOGIN = "GMAO2024";
    final static String PASS = "1234";

    public FactureDAO() {
        try {
            Class.forName("oracle.jdbc.OracleDriver");
        } catch (ClassNotFoundException e) {
            System.err.println("Impossible de charger le pilote de BDD, ne pas oublier d'importer le fichier .jar dans le projet");
        }
    }

    public int ajouter(Facture facture) {
        Connection con = null;
        PreparedStatement ps = null;
        int retour = 0;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("INSERT INTO facture (id, id_maintenance, montant, date_facture) VALUES (?, ?, ?, ?)");
            ps.setInt(1, facture.getId());
            ps.setInt(2, facture.getIdMaintenance());
            ps.setDouble(3, facture.getMontant());
            ps.setDate(4, new java.sql.Date(facture.getDate().getTime()));

            retour = ps.executeUpdate();

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (ps != null) ps.close();
            } catch (Exception ignore) {}
            try {
                if (con != null) con.close();
            } catch (Exception ignore) {}
        }
        return retour;
    }

    public Facture getFacture(int id) {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        Facture retour = null;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM facture WHERE id = ?");
            ps.setInt(1, id);

            rs = ps.executeQuery();
            if (rs.next()) {
                retour = new Facture(rs.getInt("id"), rs.getInt("id_maintenance"), rs.getDouble("montant"), rs.getDate("date_facture"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (rs != null) rs.close();
            } catch (Exception ignore) {}
            try {
                if (ps != null) ps.close();
            } catch (Exception ignore) {}
            try {
                if (con != null) con.close();
            } catch (Exception ignore) {}
        }
        return retour;
    }

    public List<Facture> getListeFactures() {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        List<Facture> retour = new ArrayList<Facture>();

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM facture");

            rs = ps.executeQuery();
            while (rs.next()) {
                retour.add(new Facture(rs.getInt("id"), rs.getInt("id_maintenance"), rs.getDouble("montant"), rs.getDate("date_facture")));
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (rs != null) rs.close();
            } catch (Exception ignore) {}
            try {
                if (ps != null) ps.close();
            } catch (Exception ignore) {}
            try {
                if (con != null) con.close();
            } catch (Exception ignore) {}
        }
        return retour;
    }
}
