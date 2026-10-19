# Data and networking

How a Flutter app fetches data over HTTP, turns JSON into typed models, and keeps data on the device. The rules the sources repeat: every request goes through a service and fails loudly (throw or return an error `Result`, never `null`), JSON is decoded into typed classes with explicit casts, heavy parsing leaves the main isolate, and a repository decides whether the local copy or the network wins. Where these classes sit in the app is in [ARCHITECTURE.md](ARCHITECTURE.md); the Dart language (records, patterns, async) is in [dart SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/SKILL.md).

**Contents:** [Setup for http](#setup-for-http) · [Making requests](#making-requests) · [Showing a request in the UI](#showing-a-request-in-the-ui) · [JSON by hand](#json-by-hand) · [Parsing off the main isolate](#parsing-off-the-main-isolate) · [Generated models](#generated-models) · [Choosing local storage](#choosing-local-storage) · [Key-value data](#key-value-data) · [SQL](#sql) · [Offline first](#offline-first) · [Server reachability](#server-reachability) · [Prove it](#prove-it)

## Setup for http

- **Add the package:** `flutter pub add http`, then `import 'package:http/http.dart' as http;`.
- **Android:** add `<uses-permission android:name="android.permission.INTERNET" />` to `android/app/src/main/AndroidManifest.xml`.
- **macOS:** add `<key>com.apple.security.network.client</key><true/>` to both `macos/Runner/DebugProfile.entitlements` and `macos/Runner/Release.entitlements`.

## Making requests

- **Build every URL with `Uri.parse('your_url')`.** For GET, append query parameters to the URI.
- **Headers go in the `headers` map;** use `HttpHeaders.authorizationHeader` for auth tokens.
- **POST and PUT bodies:** encode with `jsonEncode()` and set `'Content-Type': 'application/json; charset=UTF-8'`.

| Method | Success status | Note |
|---|---|---|
| GET | `200 OK` | |
| PUT | `200 OK` | |
| DELETE | `200 OK` | Return an empty model instance |
| POST | `201 CREATED` | |

- **Throw on any other status. Never return `null` on failure:** it stops `FutureBuilder` from reaching its error state and leaves an infinite loading indicator. In the layered architecture the service returns `Result.error(...)` instead (see [ARCHITECTURE.md](ARCHITECTURE.md#the-result-type)).
- **Inject an `http.Client`** (as `fetchUser(http.Client client, ...)` below does) rather than calling the static `http.get()`, which is difficult to mock. Mocking it with Mockito is in [TESTING.md](TESTING.md).

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<User> fetchUser(http.Client client, int userId) async {
  final response = await client.get(
    Uri.parse('https://api.example.com/users/$userId'),
    headers: {'Accept': 'application/json'},
  );

  if (response.statusCode == 200) {
    // Decode returns dynamic, cast to Map<String, dynamic>
    final Map<String, dynamic> jsonMap = jsonDecode(response.body) as Map<String, dynamic>;
    return User.fromJson(jsonMap);
  } else {
    throw Exception('Failed to load user');
  }
}
```

## Showing a request in the UI

- **Use `FutureBuilder`.** Handle `snapshot.hasData` and `snapshot.hasError`; default to a `CircularProgressIndicator`.
- **Create the Future once in `initState`,** so rebuilds do not fetch again.
- **A different fix, same problem:** ApparenceKit says `FutureBuilder` is "designed to run the `future` function every single time the widget is rebuilt", which "can lead to unnecessary requests and costs", and wraps it in a custom `SingleExecutionFutureBuilder` that holds the first result ("useful for implementing retry logic or manual refreshes") ([ApparenceKit](https://apparencekit.dev/flutter-tips/single-execution-future-builder-flutter/); the code is only in an image). The API docs place the cause elsewhere: "If the future is created at the same time as the FutureBuilder, then every time the FutureBuilder's parent is rebuilt, the asynchronous task will be restarted"; "The future must have been obtained earlier, e.g. during State.initState, State.didUpdateWidget, or State.didChangeDependencies" (https://api.flutter.dev/flutter/widgets/FutureBuilder-class.html). The article's description is wrong on that point; the docs' rule above fixes it without a custom widget.

The `flutter-use-http-package` skill's full example, from request to list:

```dart
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

// 1. Top-level parsing function for Isolate
List<Photo> parsePhotos(String responseBody) {
  final parsed = (jsonDecode(responseBody) as List<Object?>)
      .cast<Map<String, Object?>>();
  return parsed.map<Photo>(Photo.fromJson).toList();
}

// 2. Network execution with background parsing
Future<List<Photo>> fetchPhotos() async {
  final response = await http.get(
    Uri.parse('https://jsonplaceholder.typicode.com/photos'),
    headers: {
      HttpHeaders.authorizationHeader: 'Bearer your_token_here',
      HttpHeaders.acceptHeader: 'application/json',
    },
  );

  if (response.statusCode == 200) {
    // Offload heavy parsing to a background isolate
    return compute(parsePhotos, response.body);
  } else {
    throw Exception('Failed to load photos. Status: ${response.statusCode}');
  }
}

// 3. Strongly typed model
class Photo {
  final int id;
  final String title;
  final String thumbnailUrl;

  const Photo({
    required this.id,
    required this.title,
    required this.thumbnailUrl,
  });

  factory Photo.fromJson(Map<String, dynamic> json) {
    return Photo(
      id: json['id'] as int,
      title: json['title'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String,
    );
  }
}

// 4. UI Integration
class PhotoGallery extends StatefulWidget {
  const PhotoGallery({super.key});

  @override
  State<PhotoGallery> createState() => _PhotoGalleryState();
}

class _PhotoGalleryState extends State<PhotoGallery> {
  late Future<List<Photo>> _futurePhotos;

  @override
  void initState() {
    super.initState();
    // Initialize Future once to prevent re-fetching on rebuilds
    _futurePhotos = fetchPhotos();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Photo>>(
      future: _futurePhotos,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          final photos = snapshot.data!;
          return ListView.builder(
            itemCount: photos.length,
            itemBuilder: (context, index) => ListTile(
              leading: Image.network(photos[index].thumbnailUrl),
              title: Text(photos[index].title),
            ),
          );
        } else if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }
        
        // Default loading state
        return const Center(child: CircularProgressIndicator());
      },
    );
  }
}
```

`Image.network` here caches only in memory: "Restart the app and every image downloads again" ([FlutterPro](https://flutterpro.design/details/cache-network-images); disk caching in [flutter-ui IMAGES-AND-TYPOGRAPHY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/IMAGES-AND-TYPOGRAPHY.md#cache-network-images-on-disk)).

The Compass app's views instead listen to a view model command with `ListenableBuilder`; see [ARCHITECTURE.md](ARCHITECTURE.md#commands).

## JSON by hand

- **Encode and decode with `dart:convert`:** `jsonEncode` and `jsonDecode`.
- **Always cast `jsonDecode()`'s `dynamic` result,** usually to `Map<String, dynamic>` for an object or `List<dynamic>` for an array.
- **Models are plain classes with `final` fields,** a `factory Model.fromJson(Map<String, dynamic> json)` and a `Map<String, dynamic> toJson()`. In `fromJson` use pattern matching or explicit casts; a pattern that does not match throws a `FormatException`.
- **Write unit tests for both `fromJson` and `toJson`.**

```dart
import 'dart:convert';

class User {
  final int id;
  final String name;
  final String email;

  const User({
    required this.id,
    required this.name,
    required this.email,
  });

  // Factory constructor for deserialization
  factory User.fromJson(Map<String, dynamic> json) {
    return switch (json) {
      {
        'id': int id,
        'name': String name,
        'email': String email,
      } => 
        User(
          id: id,
          name: name,
          email: email,
        ),
      _ => throw const FormatException('Failed to load User.'),
    };
  }

  // Method for serialization
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
    };
  }
}
```

## Parsing off the main isolate

- **The threshold is 16 ms.** If parsing takes longer, move it to an isolate with `compute()` to avoid jank. Parse small payloads (a single object) synchronously on the main thread; parse large ones (thousands of objects) with `compute(parseFunction, response.body)`.
- **Import `package:flutter/foundation.dart`** for `compute()`.
- **The callback, input and result must be sendable across isolates.** A closure can capture extra state, so its captured objects matter too. [compute](https://api.flutter.dev/flutter/foundation/compute.html)
  - P2 correction: the source and old line here categorically required a top-level or static callback and forbade closures and instance methods. The source-original block below retains its incorrect "Top-level function required for compute()" comment; the official contract is sendability, not that restriction.

```dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

// Top-level function required for compute()
List<User> parseUsers(String responseBody) {
  final parsed = (jsonDecode(responseBody) as List<dynamic>).cast<Map<String, dynamic>>();
  return parsed.map<User>((json) => User.fromJson(json)).toList();
}

Future<List<User>> fetchUsers(http.Client client) async {
  final response = await client.get(
    Uri.parse('https://api.example.com/users'),
    headers: {'Accept': 'application/json'},
  );

  if (response.statusCode == 200) {
    // Offload expensive parsing to a background isolate
    return compute(parseUsers, response.body);
  } else {
    throw Exception('Failed to load users');
  }
}
```

`Isolate.run`, long-lived worker isolates, the web's lack of isolates and what a spawned isolate cannot touch are in [PERFORMANCE.md](PERFORMANCE.md).

## Generated models

- **`freezed` or `built_value`** generate immutable models with JSON serialization, deep equality and copy methods. They can add significant build time if you have a lot of models. Compass uses `freezed` (its `@freezed class User` with `factory User.fromJson(Map<String, Object?> json) => _$UserFromJson(json)` is in [ARCHITECTURE.md](ARCHITECTURE.md#building-a-feature-in-order)).
- **`json_serializable`** "can make this decoding much simpler, especially for complex data" ([ApparenceKit](https://apparencekit.dev/flutter-tips/fetching-data-http-client/)).
- **Separate API models from domain models in large apps:** the service returns the API model, the repository converts it to the domain model the rest of the app uses.

### Code generation

- **Rerun the generator** with `dart run build_runner build` "whenever you make changes to your database or tables" ([ApparenceKit](https://apparencekit.dev/flutter-tips/local-database-flutter-drift-guide/), for Drift).
- **Scope it in a root `build.yaml`** to speed it up: tell the generators which folders to include and which files or folders to skip (tests, already generated `.g.dart` and `.freezed.dart`), "especially helpful in larger projects" ([ApparenceKit](https://apparencekit.dev/flutter-tips/optimize-flutter-code-generation/); the article shows no `build.yaml` content).
- **The article's command** is `flutter packages pub run build_runner build --delete-conflicting-outputs`; build_runner's package page runs a build with `dart run build_runner build` (https://pub.dev/packages/build_runner), as [dart TESTING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/TESTING.md) does.

## Choosing local storage

| Need | Options named by the docs |
|---|---|
| Cloud NoSQL with offline sync | Cloud Firestore (recommended default) |
| Cloud PostgreSQL with generated type-safe Dart SDKs | Firebase SQL Connect (recommended default) |
| On-device SQL | `sqflite`, `drift` (also `sqlite3`, `firebase_database` as a `DatabaseService` backend) |
| Key-value | `shared_preferences`, `flutter_secure_storage` |

- **Files to share** (an invoice to send on) go in the app cache from `getTemporaryDirectory()` (`path_provider`), which needs no permission on any platform ([FlutterPro](https://flutterpro.design/details/share-instead-of-download); the share sheet recipe is in [flutter-ux PAINTING-AND-MEDIA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/PAINTING-AND-MEDIA.md#share-instead-of-download)).

The data layer case study fetches any data the app does not create itself from within service classes, and the key-value recipe's service wraps the plugin, "hiding this third-party dependency from the rest of the application".

## Key-value data

- **The pieces:** a view (`ThemeSwitch`), a view model (`ThemeSwitchViewModel` with commands `load = Command0(_load)..execute(); toggle = Command0(_toggle);`), a repository as the SSOT (`ThemeRepository`, exposing `Stream<bool> observeDarkMode()` through a `StreamController<bool>.broadcast()` and wrapping errors in `Result`), and a service wrapping the plugin:

```dart
class SharedPreferencesService {
  static const String _kDarkMode = 'darkMode';

  Future<void> setDarkMode(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kDarkMode, value);
  }

  Future<bool> isDarkMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_kDarkMode) ?? false;
  }
}
```

- **App-level listeners clean up:** `MainAppViewModel` subscribes to `observeDarkMode()` and cancels the `StreamSubscription` in `dispose()`.
- **What `shared_preferences` is not for** [ApparenceKit](https://apparencekit.dev/flutter-tips/store-user-preferences-flutter/): it holds simple key-value pairs, is "not built for complex data like lists of objects" and "not designed for fast reading and writing many items"; "don't store sensitive information here". The package page agrees: "there is no guarantee that writes will be persisted to disk after returning," and "this plugin must not be used for storing critical data" (https://pub.dev/packages/shared_preferences).
- **The API in the recipe above is the legacy one.** The package page: "SharedPreferences is a legacy API that will be deprecated in the future", and new users should use `SharedPreferencesAsync` (no local cache, "should always provide the latest data stored on the native platform") or `SharedPreferencesWithCache` (https://pub.dev/packages/shared_preferences). ApparenceKit also names them as the suggested alternatives.
- **Load before the first screen:** `SharedPreferences.getInstance()` is a future, so await it "early in your app before showing your main screen"; with Provider or Riverpod, initialize it in a service class so it is ready before the app shows anything [ApparenceKit](https://apparencekit.dev/flutter-tips/store-user-preferences-flutter/).

## SQL

- **Packages:** `sqflite` plus `sqflite_common_ffi` for mobile and desktop. The web needs the experimental `sqflite_common_ffi_web` (not covered by the recipe).
- **Define table and column names as constants** to avoid typos.
- **The repository checks `_database.isOpen()`** before every request.
- **The database generates IDs,** so the repository creates the item, not the view model.
- **Deleting nothing is an error:** return `Result.error(Exception('No todo found with id $id'))` when `rowsDeleted == 0`.

```dart
Future<void> open() async {
  _database = await databaseFactory.openDatabase(
    join(await databaseFactory.getDatabasesPath(), 'app_database.db'),
    options: OpenDatabaseOptions(
      onCreate: (db, version) {
        return db.execute(
          'CREATE TABLE $_todoTableName($_idColumnName INTEGER PRIMARY KEY AUTOINCREMENT, $_taskColumnName TEXT)',
        );
      },
      version: 1,
    ),
  );
}
```

- **Pick the factory in `main()`:** on the web, `if (kIsWeb) throw UnsupportedError(...)`; on desktop, `sqfliteFfiInit(); DatabaseService(databaseFactory: databaseFactoryFfi)`; otherwise `databaseFactory`.

### Drift

Drift (named in the storage table above) set up for offline use, from [ApparenceKit](https://apparencekit.dev/flutter-tips/local-database-flutter-drift-guide/).

- **Packages:** the article adds the main package, the Flutter integration and the code-generation tools as plain dependencies:

```bash
dart pub add drift
dart pub add drift_flutter
dart pub add drift_dev
```

  Drift's setup page (https://drift.simonbinder.eu/setup/) makes `drift_dev` and `build_runner` dev dependencies and adds `path_provider`: `dart pub add drift drift_flutter path_provider dev:drift_dev dev:build_runner`.
- **The database class** extends `_$Database`, lists its tables in `@DriftDatabase`, takes an optional `QueryExecutor`, and sets `schemaVersion` and a `MigrationStrategy`:

```dart
@DriftDatabase(tables: [
  TaskTable,
])
class Database extends _$Database {
  Database([QueryExecutor? e]) : super(
    e ??
      DriftDatabase(
        name: 'todo-app',
        native: const DriftNativeOptions(
          databaseDirectory: getApplicationSupportDirectory,
        ),
      ),
  );

  @override
  int get schemaVersion => 2; // Your database version

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (m) async {
        await m.createAll();
      },
      // Push any migration here if version is new
    );
  }
}
```

- **Tables** extend `Table`; `@DataClassName('TaskEntry')` names the generated row class; static query methods can live on the table, and `.watch()` returns a `Stream`:

```dart
@DataClassName('TaskEntry')
class TaskTable extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get description => text()();

  // Add your queries like this
  static Stream<List<TaskEntry>> getAllItems(Database database) =>
      database.select(database.taskTable).watch();
}
```

- **`build.yaml`** at the project root points `drift_dev` at the database and sets SQL options:

```yaml
targets:
  $default:
    builders:
      ## Add this
      drift_dev:
        # These options change how drift generates code
        options:
          databases:
            default: lib/modules/drift/database.dart
            sql:
              dialect: sqlite
              options:
                version: "3.38"
                modules: [fts5]
```

  Drift's setup page puts `sql:` directly under `options:`, not inside `databases:` (its example: `options: sql: dialects: [...]`, https://drift.simonbinder.eu/setup/); check the builder options page for your drift version before copying the nesting.
- **Regenerate** with `dart run build_runner build` after every change to the database or tables ([Code generation](#code-generation)).

## Offline first

- **The repository combines local and remote sources** into one access point that works whatever the connectivity. Example: `UserProfileRepository` over an `ApiClientService` (HTTP) and a `DatabaseService` (SQL).
- **Separate classes for complex data:** `UserProfileLocal` (database entity), `UserProfileRemote` (API response), `UserProfile` (UI model); the repository converts between them.

| Read strategy | How |
|---|---|
| Local fallback | Try the API, write to the database, return; on failure read the database, and throw `Exception('User profile not found')` if it is empty |
| Cached then fresh (the better alternative) | A `Stream` that yields the database copy, then the API result |
| Local only plus `sync()` | For data like weather updated once a day; sync on pull-to-refresh, a `Timer`, or a background process |

```dart
Stream<UserProfile> getUserProfile() async* {
  // Fetch the user profile from the database
  final userProfile = await _databaseService.fetchUserProfile();
  // Returns the database result if it exists
  if (userProfile != null) {
    yield userProfile;
  }

  // Fetch the user profile from the API
  try {
    final apiUserProfile = await _apiClientService.getUserProfile();
    //Update the database with the API result
    await _databaseService.updateUserProfile(apiUserProfile);
    // Return the API result
    yield apiUserProfile;
  } catch (e) {
    // Handle the error
  }
}
```

  The view model consumes it with `.listen((userProfile) { _userProfile = userProfile; notifyListeners(); }, onError: ...).asFuture<void>();`.
- **Writes:** online only (API first, then the database; offline works only for reads) or offline first (database first, then the API; the two can go out of sync).
- **Sync task:** `Timer.periodic(const Duration(minutes: 5), (timer) => sync());` with a freezed flag `@Default(false) bool synchronized`. Send only records where `synchronized == false`, then store `copyWith(synchronized: true)`.
- **Background sync** with the `workmanager` plugin. Running background work continuously can drain the battery dramatically, and some devices limit background processing: sync only when the network is available (`connectivity_plus`) and the battery is not low (`battery_plus`). Push-based sync uses Firebase Cloud Messaging background messages; you can combine both.

## Server reachability

Device connectivity (`connectivity_plus`: Wi-Fi or mobile data on) only says the device has internet access, not that your backend is reachable. For apps like multiplayer games or chatbots, check the backend itself. All from [ApparenceKit](https://apparencekit.dev/flutter-tips/continuous-network-monitoring-flutter/).

- **Model the status as a sealed class** and poll the backend with a `HEAD` request in an `async*` loop; `HEAD` asks only for the headers, so it "is super fast and uses less data". Status 200 to 299 means reachable.

```dart
sealed class NetworkStatus {}
class NetworkStatusOk extends NetworkStatus {}
class NetworkStatusError extends NetworkStatus {}
```

```dart
class NetworkChecker {
  final String url;
  final Duration interval;

  const NetworkChecker({
    required this.url,
    required this.interval,
  });

  Stream<NetworkStatus> start() async* {
    while (true) {
      final status = await hasConnection();
      yield switch (status) {
        true => NetworkStatusOk(),
        false => NetworkStatusError(),
      };
      await Future.delayed(interval);
    }
  }

  Future<bool> hasConnection() async {
    final client = HttpClient();
    try {
      final res = await client.headUrl(Uri.parse(url));
      return res.statusCode >= 200 && res.statusCode < 300;
    } catch (e) {
      return false;
    } finally {
      client.close();
    }
  }
}
```

  As published, `hasConnection()` doesn't compile: `headUrl` returns `Future<HttpClientRequest>` (https://api.dart.dev/dart-io/HttpClient/headUrl.html), which has no `statusCode`; the request's `close()` returns the `Future<HttpClientResponse>` (https://api.dart.dev/dart-io/HttpClientRequest-class.html). Corrected lines:

```dart
      final req = await client.headUrl(Uri.parse(url));
      final res = await req.close();
      return res.statusCode >= 200 && res.statusCode < 300;
```

- **One instance:** "use only one instance of `NetworkChecker` to avoid unnecessary resource usage." The article's example polls every 30 seconds:

```dart
void testIt() async {
  const networkChecker = NetworkChecker(
    url: "https://yourbackend.com",
    interval: Duration(seconds: 30),
  );

  networkChecker.start().listen((status) {
    switch (status) {
      case NetworkStatusOk():
        print('Network is up!');
        break;
      case NetworkStatusError():
        // Handle network down: maybe show a message or lock the app.
        print('Network is down');
        break;
    }
  });
}
```

- **`HttpClient` is `dart:io`,** so this checker doesn't run on the web as written ([PLATFORM-INTEGRATION.md](PLATFORM-INTEGRATION.md#pick-the-mechanism)).

## Prove it

- **No silent failures:** a request against a URL that returns 404 or 500 ends in the error state (error text, or `load.error`), never an endless spinner.
- **Every request uses `Uri.parse`** and every POST/PUT sets `'Content-Type': 'application/json; charset=UTF-8'`.
- **Every platform can reach the network:** `android/app/src/main/AndroidManifest.xml` has the `INTERNET` permission, and macOS has `com.apple.security.network.client` in both entitlements files.
- **No refetch on rebuild:** the Future is created in `initState` (or a command runs once); rotating the device or a parent rebuild sends no new request.
- **Bad JSON fails fast:** feeding `fromJson` a map with a missing or mistyped key throws `FormatException` (or a cast error) in a unit test, and `toJson` round-trips a model.
- **Heavy parsing is off the main isolate:** parsing that takes over 16 ms runs through `compute()` with a top-level or static function.
- **Offline read works:** with the network off, a screen backed by an offline-first repository shows the stored data; turning it back on yields fresh data.
- **Backend down is not network down:** with Wi-Fi on and the backend stopped, the app shows its network-down state within one polling interval, and recovers within one interval after the backend returns.
- **Drift is regenerated:** `dart run build_runner build` after the last table change leaves `git diff` empty.
- **Sync is idempotent:** after a sync, every sent record has `synchronized == true` and the next sync sends nothing.
