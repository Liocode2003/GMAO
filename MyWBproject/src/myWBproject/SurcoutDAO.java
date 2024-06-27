import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

public class SurcoutDAO {
    final static String URL = "jdbc:oracle:thin:@localhost:1521:xe";
    final static String LOGIN = "GMAO2024";
    final static String PASS = "1234";

    public SurcoutDAO() {
        try {
            Class.forName("oracle.jdbc.OracleDriver");
        } catch (ClassNotFoundException e) {
            System.err.println("Impossible de charger le pilote de BDD, ne pas oublier d'importer le fichier .jar dans le projet");
        }
    }

    public int ajouter(Surcout surcout) {
        Connection con = null;
        PreparedStatement ps = null;
        int retour = 0;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("INSERT INTO surcout (id, id_client, montant, date_creation, description) VALUES (?, ?, ?, ?, ?)");
            ps.setInt(1, surcout.getId());
            ps.setInt(2, surcout.getIdClient());
            ps.setDouble(3, surcout.getMontant());
            ps.setDate(4, new java.sql.Date(surcout.getDateCreation().getTime()));
            ps.setString(5, surcout.getDescription());

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

    public Surcout getSurcout(int id) {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        Surcout retour = null;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM surcout WHERE id = ?");
            ps.setInt(1, id);

            rs = ps.executeQuery();
            if (rs.next()) {
                retour = new Surcout(rs.getInt("id"), rs.getInt("id_client"), rs.getDouble("montant"), rs.getDate("date_creation"), rs.getString("description"));
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

    public List<Surcout> getListeSurcouts() {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        List<Surcout> retour = new ArrayList<Surcout>();

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM surcout");

            rs = ps.executeQuery();
            while (rs.next()) {
                retour.add(new Surcout(rs.getInt("id"), rs.getInt("id_client"), rs.getDouble("montant"), rs.getDate("date_creation"), rs.getString("description")));
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
