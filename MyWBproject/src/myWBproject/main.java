package myWBproject;
import javax.swing.*;
import java.awt.*;

public class main {

    private JFrame frame;
    private JPanel cards;

    public static void main(String[] args) {
        EventQueue.invokeLater(() -> {
            try {
                main window = new main();
                window.frame.setVisible(true);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    public main() {
        initialize();
    }

    private void initialize() {
        frame = new JFrame();
        frame.setTitle("Gestion de Maintenances");
        frame.setBounds(100, 100, 800, 600);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.getContentPane().setLayout(new BorderLayout());

        // Panel principal avec CardLayout
        cards = new JPanel(new CardLayout());
        frame.getContentPane().add(cards, BorderLayout.CENTER);

        // Ajout des différents panels
        addPanels();

        // Affichage du premier panel au démarrage (par exemple, MenuPanel)
        CardLayout cl = (CardLayout) cards.getLayout();
        cl.show(cards, MenuPanel.NAME);
    }

    private void addPanels() {
        // Ajouter les différents panels à cards
        MenuPanel menuPanel = new MenuPanel(cards);
        cards.add(menuPanel.getPanel(), MenuPanel.NAME);

        GESTIONDESMAINTENANCES gestionPanel = new GESTIONDESMAINTENANCES(cards);
        cards.add(gestionPanel.getPanel(), GESTIONDESMAINTENANCES.NAME);

        DEMANDEDEMAINTENANCE demandePanel = new DEMANDEDEMAINTENANCE(cards);
        cards.add(demandePanel.getPanel(), DEMANDEDEMAINTENANCE.NAME);

        // Ajoutez d'autres panels comme GestionDesPrestationsPanel ici si nécessaire
    }
}

