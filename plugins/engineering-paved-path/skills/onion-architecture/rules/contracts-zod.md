# Zod contracts are DTOs at the boundary

Many repos keep a **shared kernel**: a contracts package (or a vendored `shared/` folder) holding Zod contracts (API DTOs), value enums, and sometimes port interfaces. Your architecture docs say where it lives and how it is shared between packages.

## Rules

1. **Contracts are for the wire.** Request/response envelope schemas are the edge's vocabulary. If they use a wire casing (for example snake_case) and persistence uses camelCase, do not let the wire fields become the domain model.
2. **Value enums may travel inward.** Provider names, strategies, severities and similar value types are shared vocabulary; services and repositories can use them.
3. **Three shapes, two mappers.** `row (infra) ⇄ domain type ⇄ DTO (edge)`. Row → domain lives in the repository; domain → DTO in the module's `helpers.ts` (`toOrderDto`). Keep mappers named, pure, single-direction and unit-tested.
4. **Parse once, at the boundary** ("parse, don't validate"). The route schema turns untrusted JSON into a typed value; services accept the typed value and don't re-validate shape. Business-rule checks (uniqueness, state transitions) stay in the service and throw a validation error.
5. **No duplicate input types.** If the route defines `CreateOrderBody` and the service re-declares `CreateOrderInput`, pick one source: define the schema in the module's `types.ts` (or the contracts package) and use `z.infer` as the service input type. Services must not import from `routes.ts`.
6. **External data is untrusted too.** LLM structured output, VCS payloads, webhook bodies: parse with Zod inside the **adapter** (anti-corruption) and return domain types.
7. **Config and secrets:** validate env/config once in `platform/config.ts`; secrets only via the secrets port, never `.env` reads in inner rings.
8. **Changing a contract:** follow the repo's documented process (workspace package, vendored copy, generated client). Prefer additive, optional fields.

## Anti-patterns

- Service signature `create(input: z.infer<typeof CreateOrderBody>)` importing the route file → move the schema out of `routes.ts`.
- Returning a DB row from a handler and hoping the serializer hides fields → map to the DTO explicitly.
- `z.any()` / `z.unknown()` leaking into domain code. It is a boundary escape hatch; narrow it in the service.

## Sources

Alexis King, [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) · Khalil Stemmler, [DTOs, Mappers & Repository](https://khalilstemmler.com/articles/typescript-domain-driven-design/repository-dto-mapper/) · Skill: `engineering-paved-path:zod` for the schema API.
