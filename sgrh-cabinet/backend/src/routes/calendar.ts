import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listCalendarEvents } from '../controllers/calendarController';

const router = Router();

/**
 * GET /api/calendar/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Retourne tous les événements du calendrier équipe (congés, formations, fins de contrat)
 */
router.get('/events', authenticate, listCalendarEvents);

export default router;
