# Data and networking

How a Flutter app fetches data over HTTP, turns JSON into typed models, and keeps data on the device. The rules the sources repeat: every request goes through a service and fails loudly (throw or return an error `Result`, never `null`), JSON is decoded into typed classes with explicit casts, heavy parsing leaves the main isolate, and a repository decides whether the local copy or the network wins. Where these classes sit in the app is in [ARCHITECTURE.md](ARCHITECTURE.md); the Dart language (records, patterns, async) is in [../dart/SKILL.md](../dart/SKILL.md).

**Contents:** [Setup for http](#setup-for-http) · [Making requests](#making-requests) · [Showing a request in the UI](#showing-a-request-in-the-ui) · [JSON by hand](#json-by-hand) · [Parsing off the main isolate](#parsing-off-the-main-isolate) · [Generated models](#generated-models) · [Choosing local storage](#choosing-local-storage) · [Key-value data](#key-value-data) · [SQL](#sql) · [Offline first](#offline-first) · [Prove it](#prove-it)

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
- **The function passed to `compute()` must be top-level or static:** closures and instance methods cannot be passed across isolates.

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
- **Separate API models from domain models in large apps:** the service returns the API model, the repository converts it to the domain model the rest of the app uses.

## Choosing local storage

| Need | Options named by the docs |
|---|---|
| Cloud NoSQL with offline sync | Cloud Firestore (recommended default) |
| Cloud PostgreSQL with generated type-safe Dart SDKs | Firebase SQL Connect (recommended default) |
| On-device SQL | `sqflite`, `drift` (also `sqlite3`, `firebase_database` as a `DatabaseService` backend) |
| Key-value | `shared_preferences`, `flutter_secure_storage` |

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

## Prove it

- **No silent failures:** a request against a URL that returns 404 or 500 ends in the error state (error text, or `load.error`), never an endless spinner.
- **Every request uses `Uri.parse`** and every POST/PUT sets `'Content-Type': 'application/json; charset=UTF-8'`.
- **Every platform can reach the network:** `android/app/src/main/AndroidManifest.xml` has the `INTERNET` permission, and macOS has `com.apple.security.network.client` in both entitlements files.
- **No refetch on rebuild:** the Future is created in `initState` (or a command runs once); rotating the device or a parent rebuild sends no new request.
- **Bad JSON fails fast:** feeding `fromJson` a map with a missing or mistyped key throws `FormatException` (or a cast error) in a unit test, and `toJson` round-trips a model.
- **Heavy parsing is off the main isolate:** parsing that takes over 16 ms runs through `compute()` with a top-level or static function.
- **Offline read works:** with the network off, a screen backed by an offline-first repository shows the stored data; turning it back on yields fresh data.
- **Sync is idempotent:** after a sync, every sent record has `synchronized == true` and the next sync sends nothing.
