import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ClientDAO {
    final static String URL = "jdbc:oracle:thin:@localhost:1521:xe";
    final static String LOGIN = "GMAO2024";
    final static String PASS = "1234";

    public ClientDAO() {
        try {
            Class.forName("oracle.jdbc.OracleDriver");
        } catch (ClassNotFoundException e) {
            System.err.println("Impossible de charger le pilote de BDD, ne pas oublier d'importer le fichier .jar dans le projet");
        }
    }

    public int ajouter(Client client) {
        Connection con = null;
        PreparedStatement ps = null;
        int retour = 0;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("INSERT INTO client (id, NUMERO_IFU, NUMERO_RCCM, CODE_APE) VALUES (?, ?, ?, ?)");
            ps.setInt(1, client.getId());
            ps.setString(2, client.getNUMERO_IFU());
            ps.setString(3, client.getNUMERO_RCCM());
            ps.setString(4, client.getCODE_APE());

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

    public Client getClient(int id) {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        Client retour = null;

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM client WHERE id = ?");
            ps.setInt(1, id);

            rs = ps.executeQuery();
            if (rs.next()) {
                retour = new Client(rs.getInt("id"), rs.getString("NUMERO_IFU"), rs.getString("NUMERO_RCCM"), rs.getString("CODE_APE"));
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

    public List<Client> getListeClients() {
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        List<Client> retour = new ArrayList<Client>();

        try {
            con = DriverManager.getConnection(URL, LOGIN, PASS);
            ps = con.prepareStatement("SELECT * FROM client");

            rs = ps.executeQuery();
            while (rs.next()) {
                retour.add(new Client(rs.getInt("id"), rs.getString("NUMERO_IFU"), rs.getString("NUMERO_RCCM"), rs.getString("CODE_APE")));
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
