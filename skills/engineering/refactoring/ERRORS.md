# Expected failures as values

Split failures into two groups:
- **Expected:** you know they happen and how to answer them. Can't follow yourself, the profile is private, already following, the copy is on loan, the input is invalid.
- **Unexpected:** you can't handle them here. The database is down, a bug, a broken invariant.

Expected failures belong in the return type. A function declared to return a `User` that throws on a duplicate email lies in its signature: the caller has to read the implementation to learn what to handle, and usually forgets. Unexpected failures stay exceptions (or defects in Effect), caught at one boundary that logs them and returns a generic error.

The cost of values: the caller must handle the failure explicitly. That's the point.

## Plain TypeScript: a discriminated union

```ts
export type FollowError =
  | { code: "followers.same_user" }
  | { code: "followers.non_public_profile" }
  | { code: "followers.already_following" };

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export async function startFollowing(user: User, followed: User, now: Date): Promise<Result<void, FollowError>> {
  if (user.id === followed.id) return { ok: false, error: { code: "followers.same_user" } };
  if (!followed.hasPublicProfile) return { ok: false, error: { code: "followers.non_public_profile" } };
  if (await followers.isFollowing(user.id, followed.id)) return { ok: false, error: { code: "followers.already_following" } };
  await followers.insert({ followerId: user.id, followedId: followed.id, createdAt: now });
  return { ok: true, value: undefined };
}
```

- **Only two valid states.** A success never carries an error and a failure always does; the union makes any other combination unrepresentable.
- **One place lists every error of a feature** (`FollowError`, `followErrors.ts`), each with a stable code (`followers.already_following`) and a developer-facing description. A function can build an error with details (`notFound(id)`). Because they're data, they can be listed in documentation automatically.
- **Pass `now` in** instead of reading the clock inside, so the function is testable.
- **Handle every case at the edge** with an exhaustive `switch` on `error.code`; the compiler reports a missing case.

A small `match` keeps call sites from reaching into the union by hand:

```ts
export const match = <T, E, R>(r: Result<T, E>, on: { ok: (value: T) => R; err: (error: E) => R }): R =>
  r.ok ? on.ok(r.value) : on.err(r.error);

return match(await startFollowing(user, followed, new Date()), {
  ok: () => new Response(null, { status: 204 }),
  err: followErrorResponse,
});
```

## Effect: tagged errors in the error channel

With Effect, the error type is already part of `Effect<A, E, R>`:

```ts
import { Data, Effect } from "effect";

class SameUser extends Data.TaggedError("SameUser")<{}> {}
class NonPublicProfile extends Data.TaggedError("NonPublicProfile")<{ followedId: string }> {}
class AlreadyFollowing extends Data.TaggedError("AlreadyFollowing")<{ followedId: string }> {}

const startFollowing = (user: User, followed: User) =>
  Effect.gen(function* () {
    if (user.id === followed.id) return yield* Effect.fail(new SameUser());
    if (!followed.hasPublicProfile) return yield* Effect.fail(new NonPublicProfile({ followedId: followed.id }));
    const repo = yield* FollowerRepository;
    if (yield* repo.isFollowing(user.id, followed.id)) return yield* Effect.fail(new AlreadyFollowing({ followedId: followed.id }));
    yield* repo.insert(user.id, followed.id);
  });
// Effect<void, SameUser | NonPublicProfile | AlreadyFollowing, FollowerRepository>
```

- Expected failures go through `Effect.fail` with a tagged error and show up in the type. Unexpected ones are defects (`Effect.die`, or a thrown error inside `Effect.sync`) and stay out of the error channel.
- Recover per tag with `Effect.catchTag("AlreadyFollowing", ...)` or several at once with `Effect.catchTags({ ... })`; whatever you don't catch stays in the type, so nothing is silently dropped.

## Converting to an HTTP response

Map each expected error to a status and a Problem Details body in one function, at the edge (the `api-design` skill's CONTRACT.md):

```ts
function followErrorResponse(error: FollowError): Response {
  switch (error.code) {
    case "followers.same_user":
    case "followers.non_public_profile": return problem(422, error.code);
    case "followers.already_following": return problem(409, error.code);
  }
}
```

The codes are the stable `type` clients branch on; the database outage is not in this switch, because it never was an expected error.

## Prove it

Return success or a specific business error from reserving a book (already on loan, reader suspended, reservation limit reached). Map each to its API status. Then make the database fail: it surfaces as one generic 500 with a trace id, not as one of the business errors.
