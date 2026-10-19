# Storage

Supabase Storage holds files in buckets and serves them over a REST API, the TUS resumable protocol and the S3 protocol, behind a global CDN with on-the-fly image transformations. The Storage server is an S3-compatible object store that keeps its metadata in Postgres (`storage.buckets`, `storage.objects`), so access is decided by RLS policies on `storage.objects`: with no policies nothing can be uploaded, and every API method needs a specific set of table privileges. The bucket's public or private setting decides whether reads skip those policies. SECURITY.md has the short version; this file is the full treatment.

**Contents:** [How it is organised](#how-it-is-organised) · [Buckets: public or private](#buckets-public-or-private) · [File size limits](#file-size-limits) · [Standard uploads](#standard-uploads) · [Resumable uploads (TUS)](#resumable-uploads-tus) · [S3 protocol](#s3-protocol) · [Access control: RLS on storage.objects](#access-control-rls-on-storageobjects) · [The storage schema](#the-storage-schema) · [Downloading and listing](#downloading-and-listing) · [Signed URLs](#signed-urls) · [Copy, move, delete](#copy-move-delete) · [Image transformations](#image-transformations) · [CDN and caching](#cdn-and-caching) · [Egress and size](#egress-and-size) · [Edge Functions](#edge-functions) · [Local development and the CLI](#local-development-and-the-cli) · [Analytics buckets](#analytics-buckets) · [Vector buckets](#vector-buckets) · [Errors](#errors) · [Debugging](#debugging) · [Dated changes](#dated-changes) · [Prove it](#prove-it)

## How it is organised

- **Three bucket types.** Files buckets (general files, direct URL access, RLS), Analytics buckets (Apache Iceberg tables) and Vector buckets (embeddings and similarity search). Everything below is about Files buckets unless a section says otherwise.
- **Files, folders, buckets.** Buckets are "super folders". Create a separate bucket for each distinct set of security and access rules.
- **Names follow AWS object key naming guidelines.** Allowed characters in file names: `A-Z a-z 0-9`, `_ - . ' ,`, `! * & $ @ = ; : + ? ( )` and whitespace. Avoid any other character in file, folder and bucket names.
- **HTML files are returned as plain text,** for security.
- **Uploads, downloads and listings are interoperable** across the standard, resumable and S3 protocols: a file uploaded one way can be read or listed another way.
- **The API is open source** (`github.com/supabase/storage-api`) with an OpenAPI spec at `https://supabase.github.io/storage/`.

## Buckets: public or private

- **Buckets are private by default.** In a private bucket every operation, downloads included, goes through RLS.
- **A private file downloads only three ways:** the `download` method with the user's JWT in the `Authorization` header; a signed URL from `createSignedUrl`; or `GET https://[project_id].supabase.co/storage/v1/object/authenticated/[bucket]/[asset-name]` with the user's `Authorization` header.
- **A public bucket skips access control for reads only.** Anyone with the URL can read a file. Upload, delete, move and copy still go through RLS.
- **Public buckets perform better,** because they are cached differently (see CDN below).
- **Public URL:** `https://[project_id].supabase.co/storage/v1/object/public/[bucket]/[asset-name]`, built by `getPublicUrl`. `getPublicUrl` needs no RLS permissions and doesn't check that the bucket is public: on a private bucket it returns a URL that won't download.
- **Restrictions are per bucket:** maximum file size and allowed MIME types. Requests that break them are rejected.

```js
supabase.storage.createBucket('avatars', { public: true }) // default: false
```

```sql
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
```

```js
const { data, error } = await supabase.storage.createBucket('avatars', {
  public: true,
  allowedMimeTypes: ['image/*'],
  fileSizeLimit: '1MB',
})
```

- **`fileSizeLimit` type differs by source.** The bucket guide passes a string (`'1MB'`); the JS reference passes a number (`fileSizeLimit: 1024`, with `allowedMimeTypes: ['image/png']`) for `createBucket` and `updateBucket`. In the REST API (`POST /storage/v1/bucket`, used by the CLI, body `{name, public, file_size_limit?, allowed_mime_types?}`) `file_size_limit` is in bytes. Check the current JS reference before relying on either form.
- **Delete a bucket only when it is empty:** call `empty()` first.
- **List buckets:** `listBuckets({ limit, offset, sortColumn: 'created_at', sortOrder: 'desc', search: 'prod' })`.

## File size limits

| Limit | Value |
|---|---|
| Global limit (Storage Settings), Free | up to 50 MB |
| Global limit, Pro and Team | up to 500 GB (contact support for more) |
| Global limit, Enterprise | custom |
| Per-bucket limit | can't exceed the global limit |
| Standard upload, recommended | up to 6 MB (accepts up to 5 GB) |
| S3 `PutObject` and multipart, paid plans | 500 GB |
| Copy or move via the API | 5 GB |
| `remove()` per call | 1000 objects |
| Empty a bucket via Dashboard or API | 200,000 objects |
| TUS upload URL lifetime | 24 hours |
| Signed upload URL lifetime | 2 hours |
| S3 multipart upload auto-abort | 24 hours |

- **Set the global limit to the largest file the app accepts,** and smaller limits per bucket. Limiting upload size per bucket also stops users from uploading, then downloading, very large files (egress).
- **Too large:** `EntityTooLarge` (413); raise the limit in Storage settings. Wrong type: `InvalidMimeType` (400).
- **The 500 GB limit (raised from 50 GB on paid plans in July 2025)** needs the new upload limit set and the storage hostname `project-ref.storage.supabase.co`; the old URL format still works.

## Standard uploads

- **Use for files up to 6 MB** (`multipart/form-data`); above that, use TUS for reliability.

```js
supabase.storage.from('bucket_name').upload('file_path', file)
supabase.storage.from('bucket_name').upload(path, file, { cacheControl: '3600', upsert: false })
```

```sh
curl -X POST "https://{ref}.supabase.co/storage/v1/object/{bucket_name}/{file_path}" \
  -H "apikey: {anon_key}" -H "Authorization: Bearer {jwt}" --data-binary "@/local/path"
```

- **An existing path returns `400 Asset Already Exists`.** Pass `upsert: true` or the `x-upsert` header to overwrite.
- **Prefer a new path to overwriting.** The CDN takes time to propagate a change to its edge nodes, so an overwritten file can be served stale.
- **Content type comes from the file extension** unless you pass `contentType`.
- **Concurrent uploads to one path:** the first to finish wins and the rest get `400 Asset Already Exists`; with `x-upsert`, the last to finish wins.
- **`update()` always replaces the file,** whatever `upsert` says.
- **React Native:** `Blob`, `File` and `FormData` don't work as intended. Upload an `ArrayBuffer` decoded from base64 (`import { decode } from 'base64-arraybuffer'`).
- **Python** takes the upsert option as a string (`{'upsert': 'true'}`) and the content type under the key `'content-type'`.
- **Log the whole error object,** not only `error.message`, or `statusCode` and `error` (the Storage error name, such as "Duplicate") stay hidden.

## Resumable uploads (TUS)

- **Use TUS when files may exceed 6 MB,** the network is unreliable, or you want progress events. Clients: `tus-js-client`, Uppy and others; Kotlin (`resumable.createOrContinueUpload`) and C# (`UploadOrResume`) support it natively; Python uses `tus-py-client`.
- **Use the direct storage hostname for large uploads:** `https://project-id.storage.supabase.co`, not `https://project-id.supabase.co`. Endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`.
- **`chunkSize` must be 6 MB:** `chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it`.
- **Metadata fields:** `bucketName`, `objectName`, `contentType`, `cacheControl`, and `metadata` (a JSON string stored in the `user_metadata` column).
- **Options from the guide's example:** `retryDelays: [0, 3000, 5000, 10000, 20000]`, `uploadDataDuringCreation: true`, `removeFingerprintOnSuccess: true` (needed to upload the same file again), headers `authorization: Bearer <access_token>` and optionally `'x-upsert': 'true'`.
- **The access token from `getSession()` is fine here:** no auth decision is made on the client, and Storage validates the token on the server.
- **Each upload gets its own URL,** even repeat uploads to the same path; chunks go to it with `PATCH`. After 24 hours the upload must restart.
- **Concurrency:** only one client can use an upload URL; others get `409 Conflict`. With different upload URLs to the same path, the first to finish wins and the others get `409 Conflict`; with `x-upsert`, the last wins.
- **Existing-file status conflicts within the guide:** its "Overwriting files" section says `400 Asset Already Exists`, its Concurrency section says `409 Conflict`. Handle both, and check the current resumable uploads guide.
- **Presigned resumable uploads:** call `createSignedUploadUrl` and send the returned token in the `x-signature` header.
- **Fixed in March 2026:** a TUS zombie lock race in the S3 locker, and double slashes in TUS upload URLs.

## S3 protocol

- **Two kinds of credentials.** S3 access keys give full access to all S3 operations across all buckets and bypass RLS: server side only. A session token (the user's JWT) keeps RLS in force.
- **Generate access keys** at Storage > Configuration > S3, after enabling the S3 connection in Storage settings. The secret is shown once.

```js
const client = new S3Client({
  forcePathStyle: true,
  region: 'project_region',
  endpoint: 'https://project_ref.storage.supabase.co/storage/v1/s3',
  credentials: { accessKeyId: 'your_access_key_id', secretAccessKey: 'your_secret_access_key' }
})
```

- **Session token credentials:** `accessKeyId: project_ref`, `secretAccessKey: anonKey`, `sessionToken: <user JWT>`. The publishable key is "not yet supported" here (storage issue #750). Locally: `region: local`, an endpoint like `http://127.0.0.1:54321/storage/v1/s3`, `accessKeyId: stub` and `secretAccessKey` set to `ANON_KEY` from `supabase status -o env`. Self-hosted: `accessKeyId` is the `STORAGE_TENANT_ID` environment variable.
- **Presigned URLs use AWS Signature Version 4** query parameters.
- **`PutObject` is one request,** like a standard upload. **Multipart upload** (for example `Upload` from `@aws-sdk/lib-storage`) beats TUS for server-side uploads when speed matters more than resumability. The guide's multipart example names the object `upload` but calls `uploader.done()`; use one name.
- **Abort unfinished multipart uploads** with `AbortMultipartUpload`; otherwise they are aborted after 24 hours.
- **Supported:** ListBuckets, HeadBucket, CreateBucket, DeleteBucket, GetBucketLocation; HeadObject, ListObjects, ListObjectsV2, GetObject (with conditional headers and Range), PutObject, DeleteObject, DeleteObjects, ListMultipartUploads, CreateMultipartUpload, CompleteMultipartUpload, AbortMultipartUpload, CopyObject, UploadPart, UploadPartCopy, ListParts. PutObject system metadata: Content-Type, Cache-Control, Content-Disposition, Content-Encoding, Content-Language, Expires.
- **Not supported:** bucket CORS (Get/Put/DeleteBucketCors), GetBucketEncryption, Get/PutBucketLifecycleConfiguration; on objects, SSE-C and SSE headers, ACL headers, tagging, object locking, Content-MD5, request payer, expected bucket owner, storage class; and versioning (deleted objects are gone for good). The JS reference documents version-based lifecycle rules anyway (below).
- **Invalid response-header overrides** (such as `response-content-type`) are dropped silently instead of failing the request.

## Access control: RLS on storage.objects

- **No policies, no uploads.** Allow each operation with a policy on `storage.objects`.
- **Privileges each JS method needs** (on `storage.objects` unless noted):

| Method | Needs |
|---|---|
| `upload` (new file) | insert |
| `upload` with upsert | select, insert, update |
| `update` | select, update |
| `download`, `list`, `createSignedUrl(s)` | select |
| `createSignedUploadUrl` | insert |
| `uploadToSignedUrl`, `getPublicUrl` | none |
| `copy` | select (source), insert (destination); with update it can overwrite the destination |
| `move` | select, update |
| `remove` | select, delete (the delete guide lists only delete) |
| `createBucket` | `buckets` insert |
| `getBucket`, `listBuckets` | `buckets` select |
| `updateBucket` | `buckets` select, update |
| `deleteBucket` | `buckets` select, delete |
| `emptyBucket` | `buckets` select; `objects` select, delete |

- **Upload fails with 403 "new row violates row-level security policy" despite a correct insert policy:** Storage runs `INSERT ... RETURNING *`, so a select policy must cover the new object too. Mirror the insert conditions in a select policy.
- **A folder per user:**

```sql
create policy "Allow authenticated uploads"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'my_bucket_id' and
  (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);
```

- **Owner-only read:** `using ( (select auth.jwt()->>'sub') = owner_id )`.
- **Readable by anyone in a private bucket, without allowing listing:**

```sql
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars' and storage.allow_any_operation(array['object.get_authenticated_info', 'object.get_authenticated']));
```

  Without the `allow_any_operation()` filter, users could list the bucket. Public buckets don't need this.
- **The service key in the `Authorization` header bypasses RLS completely.** Use it only on trusted servers.
- **Custom roles:** `create role 'manager'; grant manager to authenticator; grant anon to manager;` then `create policy ... for select to manager using (bucket_id = 'teams')`, and test with a JWT signed with `JWT_SECRET` carrying `role: 'manager'`. The troubleshooting guide advises against custom Postgres roles for app users and suggests custom claims in `auth.users.raw_app_meta_data` instead.
- **Index the columns storage policies filter on** (but see the schema restrictions below).

### Ownership

- **Owners are set automatically** from the JWT `sub` claim into `owner_id`, on new buckets and objects. Anything created with the service key or in the Dashboard has no owner.
- **Ownership grants nothing by itself;** enforce it in a policy: `for delete to authenticated using ( owner_id = (select auth.uid()::text) )`.
- **A copied or moved object is owned by whoever ran the copy or move.**
- **`owner` is deprecated** and will be removed: use `owner_id`. The delete guide's example still uses `owner = (select auth.uid()::text)`, and the copy and move guide compares `owner_id` and `(storage.foldername(name))[1]` to `(select auth.uid())` without `::text`, although `owner_id` is `text`. Cast `auth.uid()` to text.

### Helper functions

| Function | Result |
|---|---|
| `storage.filename(name)` | `public/subfolder/avatar.png` -> `'avatar.png'` |
| `storage.foldername(name)` | -> `[ 'public', 'subfolder' ]`; first folder `(storage.foldername(name))[1]` |
| `storage.extension(name)` | -> `'png'`, e.g. `with check (bucket_id = 'cats' and storage.extension(name) = 'png')` |
| `storage.allow_only_operation(op)` | true when the current Storage operation matches exactly; tells listing apart from download under one select policy |
| `storage.allow_any_operation(array[...])` | true when the operation matches any element |

- **Operation names are normalised** (`storage.object.list` = `object.list`) but matched exactly: `object` doesn't match `object.list`. An unset operation or empty input returns false.
- **Operation names include** `storage.object.list`, `.list_v2`, `.get_authenticated`, `.get_public`, `.get_signed`, `.sign`, `.sign_many`, `.sign_upload_url`, `.upload`, `.upload_update`, `.upload_signed`, `.copy`, `.move`, `.delete`, `.delete_many`; legacy `object.get_authenticated_info` and `object.head_authenticated_info`; `storage.render.image_authenticated|image_public|image_sign`; `storage.tus.upload.create|part|get|delete`; `storage.s3.*`; `storage.bucket.*`; `storage.cdn.purge_object_cache|purge_bucket_cache`. The full list is the source of truth: `https://github.com/supabase/storage/blob/master/src/http/routes/operations.ts`.

## The storage schema

- **Tables:** `buckets` (id, name, created_at, updated_at, public, file_size_limit bigint, allowed_mime_types text[], owner_id), `objects` (id uuid, bucket_id, name, created_at, updated_at, metadata jsonb, path_tokens text[], version, owner_id) and `migrations`.
- **Read the tables freely; write only through the API.** Upload, copy, move and delete with the Storage API, never SQL. Deleting a metadata row leaves the file in the underlying store: it becomes unreachable but is still billed, and such orphans show up as unexpectedly high usage or `exceed_storage_size_quota` errors.
- **Since March 2026 direct SQL deletes are blocked by default:** a statement-level trigger rejects `DELETE` on Storage tables unless the session variable `storage.allow_delete_query` is `true`, which the Storage API sets.
- **Don't alter the `storage` schema;** changes can clash with future updates and cause downtime.
- **Since 2025-04-21** you can't create indexes on existing tables, or create or drop tables and functions, in `auth`, `storage` and `realtime`; inserts, updates, deletes and truncates on `storage.migrations` and revoking privileges from API roles are blocked too. Still allowed: foreign keys to storage tables, and RLS policies and triggers on `storage.buckets`, `storage.migrations`, `storage.objects`, `storage.s3_multipart_uploads` and `storage.s3_multipart_uploads_parts`. The schema page still encourages custom indexes and the scaling guide says to index RLS columns: check the current docs before planning an index there.
- **A policy that reads a table with recursive RLS** raises "infinite recursion detected in policy for relation". Remove the cycle, or move the check into a security definer function (SECURITY.md).
- **500 "relation "objects" does not exist" on upload:** the `authenticated` role's `search_path` lacks `storage`. Fix: `ALTER ROLE authenticated SET search_path = public, storage;`.
- **Back up both halves:** files and their metadata (`storage.buckets`, `storage.objects`) are stored separately.
- **March 2026 changes:** the prefixes table, its 6 triggers, the `level` column and two indexes were removed in favour of a skip-scan with cursor pagination (up to 14.8x faster deep pagination on 60M rows); Storage migrations are idempotent; Storage cancels in-flight queries when the client disconnects and has a configurable 30-second statement timeout (`DB_STATEMENT_TIMEOUT`).

## Downloading and listing

- **`download()` is for private buckets;** for public ones, fetch the `getPublicUrl` URL. Pass fetch options as the third argument: `download(path, {}, { cache: 'no-store' })` (useful in Edge Functions), or `{ signal: controller.signal }` to abort.
- **Force a browser download** with `?download` or `?download=customname.jpg`; in the SDK, `{ download: 'my-custom-name.png' }`, or `{ download: true }` on `createSignedUrl` and `getPublicUrl`.
- **`list(folder, { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' }, search: 'jon' })`.** Folder entries have null `id`, `updated_at`, `created_at`, `last_accessed_at` and `metadata`; the deprecated `bucket_id`, `owner` and `buckets` aren't returned.
- **Prefer `listV2` for large buckets.** `list()` fetches folders and objects in one query and slows as objects grow. `listV2({ prefix: 'folder/', limit: 100, cursor })` returns `objects`, `folders`, `hasNext` and `nextCursor`; its signature "might change in the future". The scaling guide also offers a custom `list_objects(bucketid, prefix, limits, offsets)` plpgsql function called through rpc; its example call passes `limit` and `offset`, which don't match the parameter names `limits` and `offsets`.
- **`info(path)`** returns size, content type and timestamps (the API returns `last_modified`, not `updated_at`); **`exists(path)`** checks for a file.
- **Bulk downloads:** S3 tools (rclone, Cyberduck) are much faster. The CLI has `supabase storage ls [path]`, `cp <src> <dst>`, `mv <src> <dst>`, `rm <file> ...`.

## Signed URLs

- **`createSignedUrl('private-document.pdf', 3600)`** takes the expiry in seconds and returns `data.signedUrl`; `createSignedUrls([paths], 60)` signs several. The path looks like `/storage/v1/object/sign/<bucket>/<path>?token=...`.
- **Signed URLs survive Auth key changes.** They use a per-project signing key separate from the Auth JWT key: rotating or revoking the JWT secret or signing key, disabling legacy keys, or moving from HS256 to ES256 doesn't affect them. They stay valid until they expire; only support can revoke them. To cut off access to a file, delete it (below).
- **Transform options are baked into the token** and can't be changed later.
- **Signed upload URLs:** `createSignedUploadUrl(path, { upsert: true })` (needs insert) returns a token valid for 2 hours; `uploadToSignedUrl(path, token, file)` then uploads with no further auth or RLS.

## Copy, move, delete

- **Copy or move up to 5 GB via the API.** The guide documents cross-bucket moves with `{ destinationBucket: 'avatars2' }`; the JS reference describes `copy` and `move` as "in the same bucket". Check the current JS reference.
- **Change only metadata with a copy:** `copy(src, dst, { copyMetadata: false, metadata: { contentEncoding: 'gzip' } })`; the source must already hold gzip bytes.
- **Deletes are permanent and unrecoverable.** Always delete through the Storage API.
- **`remove([...])` takes at most 1000 paths per call;** deprecated fields such as `bucket_id` may or may not be in the response.
- **Emptying a bucket via Dashboard or API fails above 200,000 objects.** Use the AWS CLI:

```sh
aws s3 sync empty-dir/ s3://your-bucket-name --delete --profile supabase-s3 --endpoint-url https://<project-ref>.supabase.co/storage/v1/s3 --region <your-region>
```

### Lifecycle rules and versions (JS reference only)

- **`getBucketLifecycle`, `updateBucketLifecycle`, `deleteBucketLifecycle`** exist for standard buckets and return `FeatureNotEnabled` when lifecycle is off for the project; `getBucketLifecycle` fails with `NoSuchLifecycleConfiguration` when no policy exists.
- **Rules expire previous versions only,** never the current one, so versioning must be on for them to do anything. `updateBucketLifecycle` replaces the whole policy (at least one rule) and supports only `noncurrentVersionExpiration` (e.g. `noncurrentDays: 30, newerNoncurrentVersions: 2`); `filter` must be `{}`; prefix and tag filters and current-object expiration are rejected; rule IDs must be unique.
- **`remove([{ path, versionId: 'noncurrent-version-id' }])`** deletes one version.
- **No guide documents turning versioning on,** and the S3 compatibility guide says versioning isn't supported. Treat this as unavailable until the current docs say otherwise.

## Image transformations

- **Pro Plan and above.** Toggle "Enable Image Transformations" in Storage > Settings; turning it off stops all transformation requests (a way to avoid unexpected cost).
- **`getPublicUrl`, `createSignedUrl` and `download` take `{ transform: { width, height, resize, quality, format } }`.** Render URL: `https://project_id.supabase.co/storage/v1/render/image/public/bucket/image.jpg?width=500&height=600`.

| Option or limit | Value |
|---|---|
| `width`, `height` | integers 1 to 2500 |
| `quality` | 20 to 100, default 80 |
| `resize` | `cover` (default: keeps aspect, fills, crops), `contain` (keeps aspect, fits), `fill` (ignores aspect) |
| Only width or height set | resized and cropped, keeping aspect ratio |
| `format` | automatic WebP when the client supports it (the only automatic format; AVIF "in the near future"); `'origin'` opts out (JS SDK v2.2.0+) |
| Source image size | 25 MB max |
| Resolution | 50 MP max |
| Formats, source and result | png, jpg, webp, avif, gif, ico, svg, bmp, tiff |
| Source only | HEIC |

- **Next.js loader:**

```js
return `https://${projectId}.supabase.co/storage/v1/render/image/public/${src}?width=${width}&quality=${quality || 75}`
```

  with `images: { loader: 'custom', loaderFile: './supabase-image-loader.js' }`.
- **Usage is counted per distinct origin image,** however many transformations each gets. Cut it by pre-generating common sizes, optimising originals, Smart CDN caching and Cache-Control.
- **Self-hosted:** imgproxy (`IMGPROXY_ENABLE_WEBP_DETECTION=true`, `IMGPROXY_JPEG_PROGRESSIVE=true`), Storage env `ENABLE_IMAGE_TRANSFORMATION=true` and `IMGPROXY_URL=...`. The official docker compose already runs imgproxy at `http://imgproxy:5001`. Keep imgproxy internal.
- **Local CLI:** `[storage.image_transformation] enabled = true` (commented out in the template, marked as a Pro plan feature).

## CDN and caching

- **Every asset is cached on the CDN;** the origin is the storage server in the project's region. The CDN may evict objects not requested from a region for a while, whatever their cache-control.
- **`cf-cache-status` shows the result:** `MISS` (from origin) or `HIT`. In logs, hits are `HIT`, `STALE`, `REVALIDATED`, `UPDATING`; misses are `MISS`, `NONE/UNKNOWN`, `EXPIRED`, `BYPASS`, `DYNAMIC`.
- **Private buckets check permissions per user,** so two users fetching the same object from one region both miss; in a public bucket the second one hits.
- **Smart CDN (automatic on Pro Plan and above)** syncs asset metadata to the edge and revalidates when an asset changes or is deleted, shields the origin even when query strings differ, keeps assets on the CDN as long as possible, and works for signed URLs. `cacheControl` at upload controls the browser cache. Invalidation (transformed images included) takes up to 60 seconds.
- **Browsers can keep stale copies after invalidation.** Upload frequently changing assets to a new path; give assets that may be deleted a shorter `cacheControl`. "The default TTL is typically set to 1 hour."
- **Bypass the cache** with a unique query string, e.g. `?cacheNonce=1` then `?cacheNonce=2`.
- **Each signed URL token is its own cache key.** A fresh signed URL per request never warms the cache: reuse URLs, or use a public bucket when there is no per-user restriction.
- **Expiring or revoking a token doesn't purge its cache entry.** `expiresIn` and `cacheControl` are independent, so a cached response can still be served after the token expires. To cut off access, delete the object: that invalidates every token's entry, within about a minute.
- **Manual purge (Pro Plan and above)** with the secret or service_role key only (anon key and user JWTs are rejected); up to 60 seconds to propagate; browser caches are unaffected.

```js
supabase.storage.from(b).purgeCache('path')        // exact path, no wildcards or recursion
supabase.storage.purgeBucketCache(b)
// { transformations: true } purges only the transformations
```

  REST: `DELETE /storage/v1/cdn/{bucket}/{path}` and `DELETE /storage/v1/cdn/{bucket}` with `apikey: {secret_key}` (legacy: `Authorization: Bearer {service_role_jwt}`), returning `{ message: 'success' }`. Self-hosted purge needs `CDN_PURGE_ENDPOINT_URL` and the `purgeCache` tenant feature.

## Egress and size

- **Egress is split into cached and origin,** each with its own quota (Free: 5 GB origin + 5 GB cached, shared across database, storage and functions; paid: 250 GB each). Cache hits are cheaper.
- **Cut egress** by resizing images, setting a high cache-control, limiting upload size and using Smart CDN.
- **Storage size is billed per GB-hour,** averaged over the period, so deleting late in a cycle lowers it only gradually.
- **Find what's large:**

```sql
select * from storage.objects where (metadata->>'size')::int > 1048576 * 5;
select bucket_id, sum((metadata->>'size')::int) from storage.objects group by bucket_id;
```

- **Logs explorer templates:** "Storage Top Cache Misses" and "Storage Egress Requests".

## Edge Functions

- **Upload from an Edge Function with a secret key:**

```ts
createClient(Deno.env.get('SUPABASE_URL')!, JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default'])
```

- **Cache-first pattern:** fetch the public URL first; on a miss, generate the file and upload it with `cacheControl: '86400'`.

## Local development and the CLI

```toml
[storage]
enabled = true
# The maximum file size allowed (e.g. "5MB", "500KB").
file_size_limit = "50MiB"
# [storage.buckets.images]
# public = false
# file_size_limit = "50MiB"
# allowed_mime_types = ["image/png", "image/jpeg"]
# objects_path = "./images"
[storage.s3_protocol]
enabled = true
# [storage.image_transformation]
# enabled = true
[storage.analytics]
enabled = false
max_namespaces = 5
max_tables = 10
max_catalogs = 2
[storage.vector]
enabled = true
max_buckets = 10
max_indexes = 5
```

- **Define buckets in `config.toml`, not migrations.** Buckets and objects are rows, not schema, so `db pull` won't capture them. `supabase seed buckets` creates the `[storage.buckets]` buckets and uploads each `objects_path` (relative paths resolve under `supabase/`, files upload recursively); `--linked` pushes to the hosted project. A bucket with no `file_size_limit` (or 0) inherits `[storage].file_size_limit`.
- **Storage RLS policies are captured by `db pull`** on the pg-delta engine; older CLIs need `supabase db pull --schema storage`. The legacy migra diff engine can miss changes to storage buckets.
- **`migration squash` drops DML,** bucket inserts included: add them back by hand.
- **Branching's `configure` step applies the `[storage]` section.**

## Analytics buckets

- **Alpha:** "Expect rapid changes, limited features, and possible breaking updates." Status differs by page: the creating guide says Private Alpha with a request form; the JS reference says Public alpha, and Public Alpha was announced on 2025-11-04. Check the current docs before depending on it.
- **Apache Iceberg tables,** used from PyIceberg, Spark or any Iceberg REST Catalog client, and from Postgres through the Iceberg Foreign Data Wrapper (Dashboard: "Query with Postgres"). Replication in through Supabase Pipelines is no longer supported: bring your own ingestion.
- **Create** with the service key: `supabase.storage.analytics.createBucket('analytics-data')`. A bucket must be empty to delete.
- **Auth needs** S3 credentials (data endpoint), a service key (REST catalog bearer token) and the project ref. Test with `GET https://<ref>.supabase.co/storage/v1/iceberg/v1/config?warehouse=<bucket-name>`.
- **PyIceberg:** `uri = https://{ref}.supabase.co/storage/v1/iceberg`, `s3.endpoint = https://{ref}.supabase.co/storage/v1/s3`, `warehouse = bucket name`, `token = SERVICE_KEY`, `"s3.force-virtual-addressing": False`.
- **`analytics.from(bucket)` returns an iceberg-js `IcebergRestCatalog`.** `dropTable(..., { purge: true })` deletes the data permanently; without it the table is marked deleted and the data remains. A namespace must be empty to drop.
- **Limits:** the limits page gives 2 buckets per project, 10 namespaces per bucket, 10 tables per namespace; the CLI template defaults are `max_namespaces = 5`, `max_tables = 10`, `max_catalogs = 2`.

## Vector buckets

See [vector bucket APIs, limits and SQL-surface conflicts](VECTORS-SCALE-AND-STORAGE.md#vector-buckets-storage-public-alpha).

## Errors

- **Body:** `{ "code": "error_code", "message": "error_message" }`; the legacy format adds `httpStatusCode`. JS errors expose `error.error`, `error.message`, `error.status`, `error.statusCode`; C# `SupabaseStorageException` exposes `Message`, `StatusCode`, `Reason`. Full list: `https://supabase.com/docs/guides/storage/debugging/error-codes.md`.

| Code | Status | Meaning or fix |
|---|---|---|
| `NoSuchBucket`, `NoSuchKey` | 404 | missing, or it exists and you lack permission |
| `NoSuchUpload` | 404 | upload missing or aborted |
| `InvalidJWT` | 401 | expired or malformed |
| `AccessDenied` | 403 | check RLS |
| `InvalidRequest`, `MissingParameter`, `InvalidBucketName`, `InvalidKey`, `InvalidUploadId` | 400 | bad request |
| `InvalidMimeType` | 400 | type not allowed by the bucket |
| `EntityTooLarge` | 413 | raise the file size limit |
| `ResourceAlreadyExists`, `KeyAlreadyExists` | 409 | use `x-upsert:true` |
| `BucketAlreadyExists` | 409 | |
| `InvalidRange` | 416 | |
| `MissingContentLength` | 411 | |
| `ResourceLocked`, `LockTimeout` | 423 | wait and retry |
| `InvalidUploadSignature` | 403 | the `MultiPartUpload` record changed mid-upload |
| `InvalidChecksum`, `MissingPart` | 400 | |
| `S3InvalidAccessKeyId` | 403 | |
| `S3MaximumCredentialsLimit` | 400 | |
| `SignatureDoesNotMatch` | 403 | check key id, secret and region |
| `InvalidSignature` | 403 | |
| `DatabaseTimeout` | 504 | raise pool size or upgrade the instance |
| `DatabaseError`, `InternalError` | 500 | |
| `TenantNotFound` | 404 | contact support |
| `SlowDown` | 503 | back off and retry |

- **Legacy codes:** 404 `not_found` (add an RLS policy, send the Authorization header, check the object exists); 409 `already_exists`; 403 `unauthorized`; 429 `too many requests` (the pooler hit `max_clients`); 544 `database_timeout` (raise the pooler `pool_size` or upgrade compute); 500 `internal_server_error`.

## Debugging

- **Logs > Storage** in the Dashboard shows service events. The Logs Explorer runs SQL on table `logs` with `source = 'storage_logs'` and a `log_attributes` map; filter further on `log_attributes['req.method']` and `log_attributes['req.remoteAddress']`. Request logs include server-side execution time (since March 2026).

```sql
select id, timestamp, event_message,
  toInt32OrZero(log_attributes['res.statusCode']) as statusCode,
  log_attributes['error.message'] as errorMessage,
  log_attributes['error.raw'] as rawError
from logs
where source = 'storage_logs'
  and toInt32OrZero(log_attributes['res.statusCode']) >= 500
order by timestamp desc limit 100;
```

- **Egress per object** comes from `source = 'edge_logs'` with a path like `%storage/v1/object/%` or `%storage/v1/render/%`. Cache hit ratio:

```sql
select toStartOfHour(timestamp) as timestamp,
  countIf(log_attributes['response.headers.cf_cache_status'] in ('HIT', 'STALE', 'REVALIDATED', 'UPDATING')) / count() as ratio
from logs
where source = 'edge_logs'
  and startsWith(log_attributes['request.path'], '/storage/v1/object')
  and log_attributes['request.method'] = 'GET'
group by timestamp order by timestamp desc limit 100;
```

- **The advisors** include service health checks covering Storage error rates (since 2026-09-18).

## Dated changes

| Date | Change |
|---|---|
| 2026-11-10 | Some outdated TLS 1.2 (CBC) ciphers disabled on project HTTP APIs, Storage included |
| 2026-06-30 | storage-js and the other client libraries drop Node.js 20: use Node 22+ |
| 2026-03-05 | Listing rewrite, trigger blocking direct SQL deletes, path traversal fix |
| 2025-08-22 | Egress split into cached and origin |
| July 2025 | Paid-plan max file size 50 GB -> 500 GB |
| 2025-04-21 | SQL restrictions on the `storage` schema |
| 2024-08-26 | Storage size billed hourly |
| April 2024 | S3 protocol launched |
| April 2023 | Storage v3: resumable uploads up to 50 GB |

## Prove it

- **Policies, as each role.** With a user JWT: upload a new file into your own folder (succeeds), into another user's folder (403), and upsert over an existing file (succeeds only with select, insert and update policies). Download and `list` someone else's file in a private bucket (denied or empty). With `anon`: a private file returns `NoSuchKey`/`NoSuchBucket` 404 or 403, never the bytes.
- **Listing stays closed** where a select policy uses `storage.allow_any_operation(...)`: a direct authenticated download works and `list` returns nothing.
- **Bucket restrictions:** an oversized upload returns `EntityTooLarge` (413), a disallowed type `InvalidMimeType` (400).
- **No orphans:** after deleting through the API, the row is gone from `storage.objects`; the per-bucket size query matches what usage shows.
- **Cache behaves:** request a public object twice and read `cf-cache-status` (`MISS`, then `HIT`); run the hit ratio query; after a delete, the object stops serving within about a minute.
- **Errors are clean:** the 5XX query on `storage_logs` returns nothing new, and the advisors report no Storage health issue.
- **Local matches hosted:** `supabase seed buckets` recreates every bucket from `config.toml`, and the storage policies appear in the pulled migration.
