# Recomp para Android

A native shell around the dashboard: a full-screen WebView pointed at the jsx-render server
(`http://jfubuntu:3000` by default). Everything the dashboard does lives on the server, so a
deploy shows up in the app on the next load — the APK only needs rebuilding when this folder
changes.

What the shell adds over a browser tab:

- its own launcher icon (a competition plate in the four pattern colors) and dark status /
  navigation bars, no browser chrome;
- pull to refresh from the top of the page, and an automatic reload when you come back after
  more than 5 minutes (the coach may have logged a meal, or the day changed);
- an offline screen ("Sin conexion con el servidor") with **Reintentar** and **Cambiar
  servidor** — also shown for 502/503/504 while the container restarts;
- the server address as a setting: long-press the icon → **Servidor**, or from the offline
  screen. Stored on the phone; must be `http(s)://host[:port]`;
- back keeps the app alive in the background instead of closing it (a set half-typed
  mid-workout survives); links that leave the server open in the browser.

Plain HTTP is allowed (`res/xml/network_security_config.xml`) because the server is on the
private network.

## Build

Needs JDK 17 and the Android SDK (platform 34, build-tools 34). From this folder:

```sh
export JAVA_HOME=/path/to/jdk-17 ANDROID_HOME=$HOME/Android/Sdk
echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew assembleRelease
# → app/build/outputs/apk/release/app-release.apk
```

The release build is signed with this machine's debug key (`~/.android/debug.keystore`), so
a new APK installs over the previous one. Built on another machine (other key), Android
refuses the update: uninstall first. Bump `versionCode` / `versionName` in
`app/build.gradle` on each release.

## Install

- USB: `adb install -r app/build/outputs/apk/release/app-release.apk`
- Or copy the APK to the phone and open it (allow "install unknown apps" for the file
  manager / browser once).

Java, no Kotlin; one dependency (`androidx.swiperefreshlayout`). minSdk 26 (Android 8),
targetSdk 34. Package `com.belta1.recomp`; code in `app/src/main/java/com/belta1/recomp/MainActivity.java`.
