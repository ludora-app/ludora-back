import { OpenAPIObject } from '@nestjs/swagger';

export const ADMIN_TAG_MARKER = '[ADMIN]';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

const SCHEMA_REF_PREFIX = '#/components/schemas/';

/** Matches a `/admin` path segment (e.g. `/users/admin/{uid}`), but not `/auth-b2b/login-admin`. */
export const ADMIN_PATH_SEGMENT = /(^|\/)admin(\/|$)/i;

const isAdminTag = (tag: string) => tag.includes(ADMIN_TAG_MARKER);

const isAdminPath = (path: string) => ADMIN_PATH_SEGMENT.test(path);

/** Collects every `$ref` found anywhere inside `node`. */
function collectRefs(node: unknown, refs: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectRefs(item, refs);
    return;
  }
  if (!node || typeof node !== 'object') return;

  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref' && typeof value === 'string') refs.add(value);
    else collectRefs(value, refs);
  }
}

/** Resolves a local `$ref` (e.g. `#/components/schemas/UserDto`) against the document. */
function resolveRef(doc: OpenAPIObject, ref: string): unknown {
  if (!ref.startsWith('#/')) return undefined;
  return ref
    .slice(2)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce<unknown>((node, segment) => (node as Record<string, unknown>)?.[segment], doc);
}

/**
 * Returns a copy of the OpenAPI document without any admin operation, for the public (mobile) client.
 * An operation is considered admin when its path contains a `/admin` segment
 * OR one of its tags contains `[ADMIN]` (both criteria are combined as a safety net).
 *
 * - removes admin paths and admin operations, then paths left without any operation;
 * - removes admin tags from `doc.tags`;
 * - keeps only the `components.schemas` still reachable (transitively) from the remaining paths,
 *   so that code generators (Orval) do not emit admin-only DTOs.
 *
 * The input document is not mutated.
 */
export function excludeAdmin(doc: OpenAPIObject): OpenAPIObject {
  const result: OpenAPIObject = structuredClone(doc);

  for (const [path, pathItem] of Object.entries(result.paths ?? {})) {
    if (isAdminPath(path)) {
      delete result.paths[path];
      continue;
    }
    for (const method of HTTP_METHODS) {
      if (pathItem[method]?.tags?.some(isAdminTag)) delete pathItem[method];
    }
    if (!HTTP_METHODS.some((method) => pathItem[method])) delete result.paths[path];
  }

  if (result.tags) {
    result.tags = result.tags.filter((tag) => !isAdminTag(tag.name));
  }

  const schemas = result.components?.schemas;
  if (schemas) {
    // Walk every $ref reachable from the remaining paths, following refs through components.
    const visited = new Set<string>();
    const pending = new Set<string>();
    collectRefs(result.paths, pending);

    while (pending.size > 0) {
      const [ref] = pending;
      pending.delete(ref);
      if (visited.has(ref)) continue;
      visited.add(ref);

      const refs = new Set<string>();
      collectRefs(resolveRef(result, ref), refs);
      for (const next of refs) if (!visited.has(next)) pending.add(next);
    }

    for (const name of Object.keys(schemas)) {
      if (!visited.has(`${SCHEMA_REF_PREFIX}${name}`)) delete schemas[name];
    }
  }

  return result;
}
