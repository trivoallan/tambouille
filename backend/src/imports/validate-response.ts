import { BadGatewayException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

/**
 * Valide une réponse tierce, déjà analysée, contre une classe de réponse
 * `class-validator` (ADR-0005). Rend l'instance typée, ou lève une 502 avec
 * le message de l'importeur : aucun champ d'une réponse non conforme n'est lu.
 */
export function validateResponse<T extends object>(
  schema: new () => T,
  payload: unknown,
  message: string,
): T {
  if (typeof payload !== 'object' || payload === null) {
    throw new BadGatewayException(message);
  }
  const instance = plainToInstance(schema, payload);
  if (validateSync(instance).length > 0) {
    throw new BadGatewayException(message);
  }
  return instance;
}
