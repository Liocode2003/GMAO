import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class MaintenanceDAO {
    final static String URL = "jdbc:oracle:thin:@localhost:1521:xe";
    final static String LOGIN = "GMAO2024";
    final static String PASS = "1234";

    public MaintenanceDAO() {
        try {
            Class.forName("oracle.jdbc.OracleDriver");
        } catch (ClassNotFoundException e) {
            System.err.println("Impossible de charger le pilote de BDD, ne pas oublier d'importer le fichier .jar dans le projet");
        }
    }

    public int ajouter(Maintenance maintenance) {
        Connection con = null;
        PreparedStatement ps = null;
        int retour = 0;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("INSERT INTO maintenance (id, id_client, description, type, date_creation) VALUES (?, ?, ?, ?, ?)");
            ps.setInt(1, maintenance.getId());
            ps.setInt(2, maintenance.getIdClient());
            ps.setString(3, maintenance.getDescription());
            ps.setString(4, maintenance.getType());
            ps.setDate(5, new java.sql.Date(maintenance.getDateCreation().getTime()));

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

    public Maintenance getMaintenance(int id) {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        Maintenance retour = null;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM maintenance WHERE id = ?");
            ps.setInt(1, id);

            rs = ps.executeQuery();
            if (rs.next()) {
                retour = new Maintenance(rs.getInt("id"), rs.getInt("id_client"), rs.getString("description"), rs.getString("type"), rs.getDate("date_creation"));
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

    public List<Maintenance> getListeMaintenances() {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        List<Maintenance> retour = new ArrayList<Maintenance>();

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM maintenance");

            rs = ps.executeQuery();
            while (rs.next()) {
                retour.add(new Maintenance(rs.getInt("id"), rs.getInt("id_client"), rs.getString("description"), rs.getString("type"), rs.getDate("date_creation")));
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
