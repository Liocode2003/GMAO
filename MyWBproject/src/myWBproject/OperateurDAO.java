import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class OperateurDAO {
    final static String URL = "jdbc:oracle:thin:@localhost:1521:xe";
    final static String LOGIN = "GMAO2024";
    final static String PASS = "1234";

    public OperateurDAO() {
        try {
            Class.forName("oracle.jdbc.OracleDriver");
        } catch (ClassNotFoundException e) {
            System.err.println("Impossible de charger le pilote de BDD, ne pas oublier d'importer le fichier .jar dans le projet");
        }
    }

    public int ajouter(Operateur operateur) {
        Connection con = null;
        PreparedStatement ps = null;
        int retour = 0;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("INSERT INTO operateur (id, nom, prenom, specialite) VALUES (?, ?, ?, ?)");
            ps.setInt(1, operateur.getId());
            ps.setString(2, operateur.getNom());
            ps.setString(3, operateur.getPrenom());
            ps.setString(4, operateur.getSpecialite());

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

    public Operateur getOperateur(int id) {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        Operateur retour = null;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM operateur WHERE id = ?");
            ps.setInt(1, id);

            rs = ps.executeQuery();
            if (rs.next()) {
                retour = new Operateur(rs.getInt("id"), rs.getString("nom"), rs.getString("prenom"), rs.getString("specialite"));
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

    public List<Operateur> getListeOperateurs() {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        List<Operateur> retour = new ArrayList<Operateur>();

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM operateur");

            rs = ps.executeQuery();
            while (rs.next()) {
                retour.add(new Operateur(rs.getInt("id"), rs.getString("nom"), rs.getString("prenom"), rs.getString("specialite")));
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
