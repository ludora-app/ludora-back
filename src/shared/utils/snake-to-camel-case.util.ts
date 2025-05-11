import { plainToInstance } from 'class-transformer';

/**
 * @description Convertit un tableau ou un objet avec des clés snake_case vers un DTO avec des propriétés camelCase.
 */
export function transformSnakeToCamel<T>(
  cls: new () => T,
  plain: Record<string, any> | Record<string, any>[],
): T | T[] {
  const normalize = (obj: Record<string, any>): Record<string, any> => {
    return Object.entries(obj).reduce(
      (acc, [key, value]) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        acc[camelKey] = value;
        return acc;
      },
      {} as Record<string, any>,
    );
  };

  if (Array.isArray(plain)) {
    return plainToInstance(cls, plain.map(normalize));
  }

  return plainToInstance(cls, normalize(plain));
}
