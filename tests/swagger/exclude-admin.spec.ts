import { OpenAPIObject } from '@nestjs/swagger';
import { excludeAdmin } from 'src/swagger/exclude-admin';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const jsonBody = (name: string) => ({
  content: { 'application/json': { schema: ref(name) } },
});

function buildDocument(): OpenAPIObject {
  return {
    components: {
      schemas: {
        AddressDto: { properties: { city: { type: 'string' } }, type: 'object' },
        AdminGeoDto: { properties: { label: { type: 'string' } }, type: 'object' },
        AdminOnlyDto: { properties: { role: { type: 'string' } }, type: 'object' },
        AdminStatsDto: {
          properties: { items: { items: ref('AdminStatsItemDto'), type: 'array' } },
          type: 'object',
        },
        AdminStatsItemDto: { properties: { count: { type: 'number' } }, type: 'object' },
        SharedDto: { properties: { id: { type: 'string' } }, type: 'object' },
        UserDto: {
          allOf: [ref('SharedDto')],
          properties: { address: ref('AddressDto') },
          type: 'object',
        },
      },
      securitySchemes: { 'JWT-auth': { scheme: 'bearer', type: 'http' } },
    },
    info: { title: 'Test API', version: '1.0.0' },
    openapi: '3.0.0',
    paths: {
      '/auth-b2b/login-admin': {
        post: {
          responses: { '200': { description: 'OK', ...jsonBody('SharedDto') } },
          tags: ['Auth B2B'],
        },
      },
      '/geolocalisation/admin/list/collection': {
        get: {
          responses: { '200': { description: 'OK', ...jsonBody('AdminGeoDto') } },
          tags: ['Geolocalisation'],
        },
      },
      '/admin/stats': {
        get: {
          responses: { '200': { description: 'OK', ...jsonBody('AdminStatsDto') } },
          tags: ['Users [ADMIN]'],
        },
      },
      '/users/{id}': {
        delete: {
          requestBody: jsonBody('AdminOnlyDto'),
          responses: { '200': { description: 'OK', ...jsonBody('SharedDto') } },
          tags: ['Users [ADMIN]'],
        },
        get: {
          responses: { '200': { description: 'OK', ...jsonBody('UserDto') } },
          tags: ['Users'],
        },
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      },
    },
    tags: [
      { description: 'Users', name: 'Users' },
      { description: 'Users admin', name: 'Users [ADMIN]' },
      { description: 'Fields admin', name: 'Fields [ADMIN]' },
    ],
  } as OpenAPIObject;
}

describe('excludeAdmin', () => {
  it('should remove admin operations and keep public operations of the same path', () => {
    const result = excludeAdmin(buildDocument());

    expect(result.paths['/users/{id}'].delete).toBeUndefined();
    expect(result.paths['/users/{id}'].get).toBeDefined();
    expect(result.paths['/users/{id}'].parameters).toHaveLength(1);
  });

  it('should remove paths that only contain admin operations', () => {
    const result = excludeAdmin(buildDocument());

    expect(result.paths['/admin/stats']).toBeUndefined();
  });

  it('should remove operations under an /admin path segment even without an [ADMIN] tag', () => {
    const result = excludeAdmin(buildDocument());

    expect(result.paths['/geolocalisation/admin/list/collection']).toBeUndefined();
    expect(result.components.schemas.AdminGeoDto).toBeUndefined();
  });

  it('should keep paths where "admin" is not a full path segment', () => {
    const result = excludeAdmin(buildDocument());

    expect(Object.keys(result.paths).sort()).toEqual(['/auth-b2b/login-admin', '/users/{id}']);
  });

  it('should remove schemas only used by admin operations', () => {
    const result = excludeAdmin(buildDocument());

    expect(result.components.schemas.AdminOnlyDto).toBeUndefined();
    expect(result.components.schemas.AdminStatsDto).toBeUndefined();
    expect(result.components.schemas.AdminStatsItemDto).toBeUndefined();
  });

  it('should keep shared and transitively referenced schemas', () => {
    const result = excludeAdmin(buildDocument());

    expect(Object.keys(result.components.schemas).sort()).toEqual([
      'AddressDto',
      'SharedDto',
      'UserDto',
    ]);
  });

  it('should keep non-schema components', () => {
    const result = excludeAdmin(buildDocument());

    expect(result.components.securitySchemes['JWT-auth']).toBeDefined();
  });

  it('should remove admin tags from doc.tags', () => {
    const result = excludeAdmin(buildDocument());

    expect(result.tags.map((tag) => tag.name)).toEqual(['Users']);
  });

  it('should not mutate the input document', () => {
    const doc = buildDocument();
    const snapshot = structuredClone(doc);

    excludeAdmin(doc);

    expect(doc).toEqual(snapshot);
  });

  it('should not contain any [ADMIN] marker in the result', () => {
    const result = excludeAdmin(buildDocument());

    expect(JSON.stringify(result)).not.toContain('[ADMIN]');
  });
});
