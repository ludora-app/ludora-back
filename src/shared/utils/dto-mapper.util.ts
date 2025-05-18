import { plainToInstance } from 'class-transformer';

export class DtoMapperUtil {
  /**
   * @description Converts an object with snake_case keys to an object with camelCase keys.
   * @param cls - The `cls` parameter in the `toDto` function is a constructor function that creates
   * objects of a specific type `T`.
   * @param {Record<string, any> | Record<string, any>[]} plain - The `plain` parameter in the `toDto`
   * function is expected to be either a single object of type `Record<string, any>` or an array of
   * objects of type `Record<string, any>`.
   * @returns The `toDto` function returns an instance of type `T` or an array of instances of type `T`
   * after converting the input `plain` object or array of objects to camelCase keys using the
   * `normalize` function and then converting them to instances using the `plainToInstance` function.
   */
  public static toCamelCase<T>(
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
}
