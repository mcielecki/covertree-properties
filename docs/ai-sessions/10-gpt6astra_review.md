# GPT-6 Astra repository review

No critical findings. Typecheck, lint, all **436 tests**, and the Playwright smoke test passed. No code changed during the review. No committed API key was identified in the scanned files, including session exports.

Data access follows resolver → service → repository; Weatherstack is called only from `apps/api/src/property/property.service.ts:80` (`PropertyService.create`). Prisma outside the repository is limited to client construction and lifecycle wiring.

1. **Should fix — API-key redaction is incomplete (AC-5.13).**  
   `apps/api/src/weather/weatherstack/weatherstack.provider.ts:83` logs the provider’s unrestricted `error.type` and includes it in the thrown error. A mocked response with a sentinel key in `type` reproduced leakage into both. The existing secrecy tests use responses that do not echo the key.  
   **Fix:** redact the configured key from all external strings before logging or constructing errors, or log only allowlisted error types and numeric codes. Add echoed-key regression cases.

2. **Should fix — deleting from the list leaves deleted property details cached.**  
   `apps/web/src/features/properties/components/DeleteButton.tsx:20` only refetches the list. Eviction exists exclusively in `apps/web/src/features/properties/pages/PropertyDetailsPage.tsx:22`. Visit details, return to the list, delete, then navigate back: the default cache-first details query can display the deleted property. A read-only Apollo reproduction confirmed the entity survives list refetching.  
   **Fix:** centralize entity eviction for both deletion entry points, preserving the details page’s protection against an unwanted refetch. Test this navigation sequence.

3. **Should fix — cached data hides refresh failures and loading state (AC-W.7).**  
   `apps/web/src/features/properties/pages/PropertyListPage.tsx:56` renders errors only when `!data`, despite using `cache-and-network`. Apollo retains cached data when the network request fails; this was reproduced. Users see stale results without an error or retry control. Background loading is similarly invisible.  
   **Fix:** display refresh progress and an error/retry banner independently of existing data. Add tests with a populated cache followed by a delayed or failed network response.

4. **Should fix — details do not display every property field (AC-W.5).**  
   `apps/web/src/features/properties/pages/PropertyDetailsPage.tsx:39` omits `id`. The test named “shows every field” at `apps/web/src/features/properties/pages/PropertyDetailsPage.test.tsx:20` never asserts it.  
   **Fix:** display the property ID and assert its rendered value.

5. **Nice to have — URL pagination can generate invalid GraphQL integers.**  
   `apps/web/src/features/properties/hooks/usePropertyListParams.ts:46` accepts any positive JavaScript integer; line 71 multiplies it into an offset. For example, `?page=107374184` produces an offset above GraphQL’s signed 32-bit `Int` maximum. The request fails before the page-clamping logic can run.  
   **Fix:** require a safe integer and bound the page so its calculated offset fits GraphQL `Int`; test oversized and unsafe values.

6. **Nice to have — valid Unicode input can overflow the normalized city column.**  
   `cityKey` is `varchar(100)` in `apps/api/prisma/schema.prisma:71`, but `toCityKey` at `apps/api/src/property/keys.ts:11` lowercases Unicode text. A valid 100-character city consisting of `İ` produces a 200-character key. The shared validator accepts it, but persistence cannot.  
   **Fix:** store `cityKey` as unrestricted text, or size it for normalization expansion. Add a repository integration test using expanding Unicode lowercase mappings.

7. **Nice to have — optional weather integers can pass validation but fail GraphQL serialization.**  
   `apps/api/src/weather/weatherstack/weatherstack.schema.ts:48` uses `.int()` without GraphQL’s 32-bit bounds. A mocked `humidity: 2147483648` passed adapter validation but failed `GraphQLInt.serialize`. Such a value can be persisted before the response reports an error.  
   **Fix:** apply signed 32-bit bounds inside the optional-field schemas, so unsupported values are dropped and resolve to `null`. Test through the GraphQL response, not just the adapter.

8. **Nice to have — close the acceptance-test gaps rather than relying on AC-labelled test names.**  
   `apps/api/test/integration/properties-query.test.ts:247` and `apps/api/test/integration/create-property.test.ts:169` do not assert the required absence of `extensions.code`. `apps/web/src/components/ConfirmDialog.test.tsx:6` explicitly stubs native dialog behavior, while `apps/web/e2e/property-smoke.spec.ts:44` only confirms deletion.  
   **Fix:** assert absent error codes explicitly; extend Playwright coverage to Escape cancellation, focus restoration, and background inertness. Replace the race test’s timing assumption at `apps/api/test/integration/create-property.test.ts:253` with a barrier that releases both weather calls after both requests reach it.

   The complete acceptance audit follows. **Covered** means assertions exist and passed; partial implementation failures are identified separately. Multiple line numbers correspond to the criteria in the order listed unless the evidence describes combined coverage.

   | Acceptance criterion | Status | File:line evidence |
   |---|---|---|
   | AC-1.1, 1.2, 1.3, 1.4, 1.5, 1.6 | Covered | `apps/api/test/integration/properties-query.test.ts`: respectively **54, 60, 69, 78, 105, 113** |
   | AC-2.1, 2.2, 2.3, 2.4 | Covered | `apps/api/test/integration/properties-query.test.ts`: **126, 132, 138, 149** |
   | AC-3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7 | Covered | `apps/api/test/integration/properties-query.test.ts`: **191, 195, 201, 208, 214, 220, 233** |
   | AC-3.8 | Covered except **implemented but untested** absence of variable-error code | `apps/api/test/integration/properties-query.test.ts:240, 247` |
   | AC-3.9 | Covered | `apps/api/test/integration/properties-query.test.ts:258` |
   | AC-4.1, 4.2, 4.3, 4.4, 4.5 | Covered | `apps/api/test/integration/property-query.test.ts`: **87, 126, 134, 141, 141** |
   | AC-5.1 | Covered: persistence, generated values, weather storage and coordinate conversion | `apps/api/test/integration/create-property.test.ts:75`; `apps/api/src/weather/weatherstack/weatherstack.provider.test.ts:105` |
   | AC-5.2 | Covered: one call, ZIP query and Fahrenheit units | `apps/api/test/integration/create-property.test.ts:109`; `apps/api/src/weather/weatherstack/weatherstack.provider.test.ts:66` |
   | AC-5.3, 5.4 | Covered | `apps/api/test/integration/create-property.test.ts:115, 130` |
   | AC-5.5 | Covered except **implemented but untested** absence of variable-error code | `apps/api/test/integration/create-property.test.ts:156, 169` |
   | AC-5.6, 5.7 | Covered | `apps/api/test/integration/create-property.test.ts:178, 193` |
   | AC-5.8, 5.9 | Covered across adapter and persistence-error tests | `apps/api/src/weather/weatherstack/weatherstack.provider.test.ts:178, 187`; `apps/api/test/integration/create-property.test.ts:212` |
   | AC-5.10 | Covered: provider errors, malformed responses, logging and no persistence | `apps/api/src/weather/weatherstack/weatherstack.provider.test.ts:193`; `apps/api/test/integration/create-property.test.ts:228` |
   | AC-5.11 | Covered: timeout, no retry and no persistence | `apps/api/src/weather/weatherstack/weatherstack.provider.test.ts:299`; `apps/api/test/integration/create-property.test.ts:234` |
   | AC-5.12 | Covered; race setup is timing-dependent | `apps/api/test/integration/create-property.test.ts:251` |
   | AC-5.13 | **Missing in part:** echoed-key redaction; ordinary failure paths covered | `apps/api/src/weather/weatherstack/weatherstack.provider.ts:83`; secrecy tests at `apps/api/src/weather/weatherstack/weatherstack.provider.test.ts:333`; response test at `apps/api/test/integration/create-property.test.ts:268` |
   | AC-5.14 | Covered across adapter, resolver and integration tests; integer-range edge remains | `apps/api/src/weather/weatherstack/weatherstack.provider.test.ts:133, 141`; `apps/api/src/schema/property/resolvers/WeatherData.test.ts:92`; `apps/api/test/integration/create-property.test.ts:281` |
   | AC-6.1, 6.2, 6.3 | Covered | `apps/api/test/integration/delete-property.test.ts`: **31, 43, 55** |
   | AC-6.4 | Covered | `apps/api/test/integration/create-property.test.ts:313` |
   | AC-7.1, 7.2, 7.3 | Covered | `apps/api/test/integration/schema.test.ts:81, 116, 125`; generated-value assertions at `apps/api/test/integration/create-property.test.ts:97` |
   | AC-W.1 | Covered | `apps/web/src/features/properties/pages/PropertyListPage.test.tsx:27`; default query variables at `apps/web/src/features/properties/hooks/usePropertyListParams.test.ts:63` |
   | AC-W.2 | Covered | `apps/web/src/features/properties/pages/PropertyListPage.test.tsx:74, 94, 129, 143`; URL round-trip at `apps/web/src/features/properties/hooks/usePropertyListParams.test.ts:56` |
   | AC-W.3 | Covered | `apps/web/src/features/properties/pages/PropertyListPage.test.tsx:94, 160, 175` |
   | AC-W.4 | Covered | `apps/web/src/features/properties/pages/CreatePropertyPage.test.tsx:36, 70, 121, 136, 159` |
   | AC-W.5 | **Missing in part:** displayed ID. Weather card, null hiding and not-found state covered | `apps/web/src/features/properties/pages/PropertyDetailsPage.tsx:39`; details tests at `apps/web/src/features/properties/pages/PropertyDetailsPage.test.tsx:20, 42`; `apps/web/src/features/properties/components/WeatherCard.test.tsx:21, 34` |
   | AC-W.6 | Mutation/refetch/eviction paths covered; native inertness, Escape and focus restoration **implemented but untested in automated browser tests** | List deletion at `apps/web/src/features/properties/pages/PropertyListPage.test.tsx:212`; create refetch at `apps/web/src/features/properties/pages/CreatePropertyPage.test.tsx:91`; details eviction at `apps/web/src/features/properties/pages/PropertyDetailsPage.test.tsx:69`; native dialog at `apps/web/src/components/ConfirmDialog.tsx:34` |
   | AC-W.7 | **Missing in part:** background refresh feedback. Initial query and mutation states covered | `apps/web/src/features/properties/pages/PropertyListPage.tsx:56`; list tests at `apps/web/src/features/properties/pages/PropertyListPage.test.tsx:27, 43, 230`; details error at `apps/web/src/features/properties/pages/PropertyDetailsPage.test.tsx:58`; create loading at `apps/web/src/features/properties/pages/CreatePropertyPage.test.tsx:175`; delete busy state at `apps/web/src/components/ConfirmDialog.test.tsx:87` |
