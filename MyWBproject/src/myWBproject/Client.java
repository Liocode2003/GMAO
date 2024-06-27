public class Client {
    private int id;
    private String NUMERO_IFU;
    private String NUMERO_RCCM;
    private String CODE_APE;
   

    // Constructeur
    public Client(int id, String NUMERO_IFU, String NUMERO_RCCM, String CODE_APE) {
        this.id = id;
        this.NUMERO_IFU = NUMERO_IFU;
        this.NUMERO_RCCM = NUMERO_RCCM;
        this.CODE_APE = CODE_APE;
      
    }

    // Méthodes get
    public int getId() {
        return id;
    }

    public String getNUMERO_IFU() {
        return NUMERO_IFU;
    }

    public String getNUMERO_RCCM() {
        return NUMERO_RCCM;
    }

    public String getCODE_APE() {
        return CODE_APE;
    }

    
}

