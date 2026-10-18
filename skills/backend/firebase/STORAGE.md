# Cloud Storage downloads in Flutter

Flutter download guidance from [ApparenceKit](https://apparencekit.dev/flutter-tips/download-file-firebase-flutter-progress/), corrected against the [Firebase download guide](https://firebase.google.com/docs/storage/flutter/download-files) and the FlutterFire API. This topic covers downloads, task progress and errors. Project and SDK setup stays in [SETUP.md](SETUP.md).

## References and download methods

[Firebase: download files in Flutter](https://firebase.google.com/docs/storage/flutter/download-files)

- Create a reference from the root with `FirebaseStorage.instance.ref()` and `child`, or use `refFromURL` for an existing `gs://` or HTTPS object URL.
- `getData` downloads the entire file into memory. Set its maximum byte count to a size the app can handle; a file larger than available memory can crash the app. Use another download method when that bound is unsuitable.
- `writeToFile` downloads to a local `File` and returns a `DownloadTask`. The official example uses an application documents directory; do not treat the article's hard-coded Android public Downloads path or blanket storage-permission request as a portable prerequisite.
- For existing URL-based download infrastructure or sharing a URL, call `getDownloadURL`. The guide's introductory prose spells it `getDownloadUrl`, but its dedicated section and code use `getDownloadURL`.
- Cloud Storage buckets require Firebase Authentication by default. Keep production access restricted through appropriate Cloud Storage Security Rules; a file reference alone does not grant access.

## Task progress and errors

[Firebase: download files in Flutter](https://firebase.google.com/docs/storage/flutter/download-files), [DownloadTask](https://pub.dev/documentation/firebase_storage/latest/firebase_storage/DownloadTask-class.html), [TaskSnapshot](https://pub.dev/documentation/firebase_storage/latest/firebase_storage/TaskSnapshot-class.html)

- Listen to `downloadTask.snapshotEvents` for ongoing `TaskSnapshot` updates. Inspect the snapshot's `state`: `running`, `paused`, `success`, `canceled` or `error`.
- Read `bytesTransferred` and `totalBytes` from a `TaskSnapshot`; `DownloadTask.snapshot` exposes the latest snapshot. P2 correction: ApparenceKit reads those fields directly from the task and presents `task.asStream()` as progress updates. `asStream()` contains the future's completion result; the progress stream is `snapshotEvents`.
- Handle download failures, including missing objects and insufficient permissions. The official in-memory example catches `FirebaseException`; do not report success just because a task was created.

## Prove it

- The chosen download method matches the memory bound or local-file requirement, and the requested object is allowed by the bucket's authentication and rules. [Firebase download guide](https://firebase.google.com/docs/storage/flutter/download-files)
- Progress comes from `snapshotEvents` and snapshot fields; the UI distinguishes success, cancellation and error. [DownloadTask](https://pub.dev/documentation/firebase_storage/latest/firebase_storage/DownloadTask-class.html), [TaskSnapshot](https://pub.dev/documentation/firebase_storage/latest/firebase_storage/TaskSnapshot-class.html)
- A missing or unauthorized object follows the download error path. [Firebase download guide](https://firebase.google.com/docs/storage/flutter/download-files)
