import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DevisDAO {
    final static String URL = "jdbc:oracle:thin:@localhost:1521:xe";
    final static String LOGIN = "prof";
    final static String PASS = "isgeic2019";

    public DevisDAO() {
        try {
            Class.forName("oracle.jdbc.OracleDriver");
        } catch (ClassNotFoundException e) {
            System.err.println("Impossible de charger le pilote de BDD, ne pas oublier d'importer le fichier .jar dans le projet");
        }
    }

    public int ajouter(Devis devis) {
        Connection con = null;
        PreparedStatement ps = null;
        int retour = 0;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("INSERT INTO devis (id, id_maintenance, montant, date_creation) VALUES (?, ?, ?, ?)");
            ps.setInt(1, devis.getId());
            ps.setInt(2, devis.getIdMaintenance());
            ps.setDouble(3, devis.getMontant());
            ps.setDate(4, new java.sql.Date(devis.getDateCreation().getTime()));

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

    public Devis getDevis(int id) {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        Devis retour = null;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM devis WHERE id = ?");
            ps.setInt(1, id);

            rs = ps.executeQuery();
            if (rs.next()) {
                retour = new Devis(rs.getInt("id"), rs.getInt("id_maintenance"), rs.getDouble("montant"), rs.getDate("date_creation"));
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

    public List<Devis> getListeDevis() {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        List<Devis> retour = new ArrayList<Devis>();

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM devis");

            rs = ps.executeQuery();
            while (rs.next()) {
                retour.add(new Devis(rs.getInt("id"), rs.getInt("id_maintenance"), rs.getDouble("montant"), rs.getDate("date_creation")));
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
