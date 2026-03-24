// Mock de la base de données pour les tests
const mockQuery = jest.fn();
const mockPool = {
  query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }], rowCount: 1 }),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
};

export const query = mockQuery;
export const pool = mockPool;
export const getClient = jest.fn();

// Helper pour réinitialiser les mocks entre les tests
export const resetDbMocks = () => {
  mockQuery.mockReset();
  mockPool.query.mockReset();
};
