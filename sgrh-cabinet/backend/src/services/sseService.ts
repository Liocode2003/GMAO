import { Response } from 'express';
import { logger } from '../utils/logger';

// Map<userId, Set<Response>>
const clients = new Map<string, Set<Response>>();

export function addClient(userId: string, res: Response): void {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(res);
  logger.debug(`[SSE] Client connecté: ${userId} (${clients.get(userId)!.size} cx)`);
}

export function removeClient(userId: string, res: Response): void {
  const conns = clients.get(userId);
  if (!conns) return;
  conns.delete(res);
  if (conns.size === 0) clients.delete(userId);
  logger.debug(`[SSE] Client déconnecté: ${userId}`);
}

export function pushToUser(userId: string, event: string, data: object): void {
  const conns = clients.get(userId);
  if (!conns) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of conns) {
    try { res.write(payload); }
    catch { conns.delete(res); }
  }
}

export function pushToUsers(userIds: string[], event: string, data: object): void {
  for (const uid of userIds) pushToUser(uid, event, data);
}
