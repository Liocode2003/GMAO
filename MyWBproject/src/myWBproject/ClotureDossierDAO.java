import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ClotureDossierDAO {
    final static String URL = "jdbc:oracle:thin:@localhost:1521:xe";
    final static String LOGIN = "GMAO2024";
    final static String PASS = "1234";

    public ClotureDossierDAO() {
        try {
            Class.forName("oracle.jdbc.OracleDriver");
        } catch (ClassNotFoundException e) {
            System.err.println("Impossible de charger le pilote de BDD, ne pas oublier d'importer le fichier .jar dans le projet");
        }
    }

    public int ajouter(Cloturedossier cloturedossier) {
        Connection con = null;
        PreparedStatement ps = null;
        int retour = 0;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("INSERT INTO cloture_dossier (id, id_facture, id_maintenance, date_cloture) VALUES (?, ?, ?, ?)");
            ps.setInt(1, cloturedossier.getId());
            ps.setInt(2, cloturedossier.getIdFacture());
            ps.setInt(3, cloturedossier.getIdMaintenance());
            ps.setDate(4, new java.sql.Date(cloturedossier.getDate().getTime()));

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

    public Cloturedossier getCloturedossier(int id) {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        Cloturedossier retour = null;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM cloture_dossier WHERE id = ?");
            ps.setInt(1, id);

            rs = ps.executeQuery();
            if (rs.next()) {
                retour = new Cloturedossier(rs.getInt("id"), rs.getInt("id_facture"), rs.getInt("id_maintenance"), rs.getDate("date_cloture"));
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

    public List<Cloturedossier> getListeCloturedossiers() {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        List<Cloturedossier> retour = new ArrayList<Cloturedossier>();

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM cloture_dossier");

            rs = ps.executeQuery();
            while (rs.next()) {
                retour.add(new Cloturedossier(rs.getInt("id"), rs.getInt("id_facture"), rs.getInt("id_maintenance"), rs.getDate("date_cloture")));
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
