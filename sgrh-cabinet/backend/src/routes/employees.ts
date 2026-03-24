import { Router, Request, Response, NextFunction } from 'express';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  getEmployeeHistory,
  getSalaryHistory,
  checkDuplicates,
  uploadPhoto,
  handlePhotoUpload,
  servePhoto,
} from '../controllers/employeeController';
import {
  uploadExcel,
  parseImport,
  executeImport,
  downloadImportTemplate,
  exportEmployeesExcel,
  exportEmployeesPDF,
  exportEmployeePDF,
} from '../controllers/importExportController';
import { authenticate, authorize, auditLog } from '../middleware/auth';

const router = Router();

// Photo publique — doit être AVANT router.use(authenticate)
// (le navigateur charge <img src="..."> sans token JWT)
router.get('/:id/photo/file/:filename', servePhoto);

router.use(authenticate);

// Liste + filtres
router.get('/', listEmployees);
router.get('/check-duplicates', checkDuplicates);

// Exports (avant /:id pour éviter les conflits)
router.get('/export/excel', exportEmployeesExcel);
router.get('/export/pdf', exportEmployeesPDF);

// Import Excel
router.get('/import/template', downloadImportTemplate);

router.post('/import/parse', authorize('DRH', 'DIRECTION_GENERALE'), (req: Request, res: Response, next: NextFunction) => {
  uploadExcel(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, parseImport);

router.post('/import/execute', authorize('DRH', 'DIRECTION_GENERALE'), executeImport);

// Détail, CRUD
router.get('/:id', auditLog('READ', 'employee'), getEmployee);
router.post('/', authorize('DRH', 'DIRECTION_GENERALE'), createEmployee);
router.put('/:id', authorize('DRH', 'DIRECTION_GENERALE', 'MANAGER'), updateEmployee);
router.patch('/:id/deactivate', authorize('DRH', 'DIRECTION_GENERALE'), deactivateEmployee);

// Historique modifications
router.get('/:id/history', authorize('DRH', 'DIRECTION_GENERALE'), getEmployeeHistory);

// Historique salaires
router.get('/:id/salary-history', authorize('DRH', 'DIRECTION_GENERALE', 'ASSOCIE'), getSalaryHistory);

// Photo de profil
router.post('/:id/photo', authorize('DRH', 'DIRECTION_GENERALE'), (req: Request, res: Response, next: NextFunction) => {
  uploadPhoto(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, handlePhotoUpload);

// Export PDF fiche individuelle
router.get('/:id/export/pdf', exportEmployeePDF);

export default router;
