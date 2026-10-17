# Testing by ring

The point of the dependency rule is that inner rings are testable **without** the HTTP framework, the database or the network. Follow the repo's testing guide for suite mechanics and file naming; this file says *what to test where*.

| Ring | Test type | Doubles | Typical file suffix |
|---|---|---|---|
| 1 Domain (`helpers.ts`, `status.ts`, mappers) | Pure unit | none | `*.test.ts` |
| 3 Services / executors / pipelines | Unit | in-memory fakes of ports (repository interface, `LLMProvider`, VCS client) | `*.test.ts` (hermetic) |
| 4 Repositories | Integration against a real database (for example testcontainers) | none | a separate suffix such as `*.it.test.ts` |
| 4 Routes | `app.inject()` with container overrides | fake adapters | unit or integration, depending on DB use |
| 4 Adapters | Contract tests against the port; SDK mocked at the HTTP boundary | SDK stub | `*.test.ts` |

## Rules

1. **A service unit test must not import the ORM, `db/*` or the HTTP framework.** If it has to, the service is in the wrong ring.
2. **Fake the port, not the ORM.** Write `class InMemoryOrdersRepo implements OrdersRepo`; do not mock query builders.
3. **Repositories are tested for real.** Mappers and tenant scoping are the value there; mocking the DB proves nothing.
4. **One contract, two implementations.** A port's fake and its real adapter should pass the same behavioural assertions where practical.
5. **Route tests assert the edge only:** status, envelope, schema validation errors, error mapping. Not business rules.
6. **Keep unit and integration lanes separate.** Anything that needs a database must use the repo's integration naming or folder, or the unit lane breaks without Docker.
7. **Boundary regressions are tests too.** Run the layering check in CI. A new violation fails the build; never "fix" it by growing the baseline.

## Sources

Palermo: "enables testing with mocks instead of real infrastructure" · Cockburn, [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) · Skills: `engineering-paved-path:fastify-best-practices` (inject), `engineering-paved-path:react-testing-library` (frontend).
