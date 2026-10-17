# Fastify: routes are the outer edge

Fastify (`app.ts`, `modules/*/routes.ts`) is a **delivery mechanism**. Ring 4 only. The same rules apply to any HTTP framework.

## Rules

1. **A handler does three things:** resolve the request context → call **one** service method → return. No queries, no aggregation, no external API calls, no branching business rules.
2. **Validate with route schemas, not by hand.** Use a type provider such as `fastify-type-provider-zod` (`app.withTypeProvider<ZodTypeProvider>()`, `schema: { params, querystring, body }`). No `Schema.parse(req.body)` inside handlers.
3. **Response shape = a contract DTO.** Add a `response` schema when practical so the serializer enforces the contract; map domain → DTO in a pure mapper, never inside the handler.
4. **Services and helpers never import `fastify`.** Need logging in a service? Accept a structural logger type (`{ info, warn, error }`), not `FastifyBaseLogger` or `req`.
5. **Never pass `req`/`reply` inward.** Extract what the service needs (tenant id, user id, parsed body) in the handler. One shared helper (for example `_shared/context.ts#getContext`) adapts a request to a tenancy context.
6. **Errors:** services throw a domain error family; a single `app.setErrorHandler` maps them to the error envelope. A handler that catches an error to build a "degraded" response is doing business logic; move it into the service.
7. **Wiring:** a routes plugin builds its service **once at registration** from explicit deps (`new OrdersService({ repo: app.container.ordersRepo })`). Routes may read the container; nothing inward may.
8. **Plugins vs DI.** Fastify encapsulation + `decorate` is fine *transport-level* DI (`app.decorate('container', container)`), and `fastify-plugin` is for cross-cutting infrastructure (cors, helmet, rate-limit, SSE). Do **not** use decorators to smuggle domain services through `req`/`app` into inner rings.
9. **Module registration** is a static registry (`modules/index.ts`), one plugin per feature. A new module = new folder + one registry line.
10. **SSE / streaming:** the route owns the HTTP stream; the service publishes to a port (an event bus), it does not write to `reply`.

## Skeleton (target shape)

```ts
// modules/<name>/routes.ts: ring 4 (edge)
export default async function fooRoutes(appBase: FastifyInstance) {
  const app = appBase.withTypeProvider<ZodTypeProvider>();
  const service = new FooService({ repo: app.container.fooRepo, github: () => app.container.github() });

  app.post('/foos', { schema: { body: CreateFooBody } }, async (req, reply) => {
    const { tenantId, userId } = await getContext(app.container, req);
    const foo = await service.create(tenantId, req.body, userId);
    reply.status(201);
    return foo;
  });
}
```

## Testing

Build the app with container overrides (fake adapters) and call `app.inject()`. Route tests assert status and envelope; business rules are tested at the service with fakes ([testing.md](testing.md)).

## Sources

Fastify [Plugins guide](https://fastify.dev/docs/latest/Guides/Plugins-Guide/) · [Decorators](https://fastify.dev/docs/latest/Reference/Decorators/) · Skill: `engineering-paved-path:fastify-best-practices` for mechanics.
