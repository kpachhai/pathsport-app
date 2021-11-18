### Prerequisites

Latest versions of: Git, Node.js, npm, Python, Cordova, Ionic

#### Github

- Upload your SSH public key to your GitHub profile if not already done - https://github.com/settings/keys

#### For Android:

- Java JDK 1.8 or greater
- Android SDK
- Android NDK (android-ndk-r16b or higher)

The supported way of doing this nowadays is to use Android Studio.

Set the ANDROID_HOME environment variable to match the Android SDK path.

on Mac and Linux, add the following line to your login script (e.g., ~/.bashrc, ~/.bash_profile, etc...):

```
export ANDROID_HOME="YOUR-PATH/sdk"
```

### How to run

- clone the repo
- `npm i` (node version: v14.17.5 LTS recommended)
- `ionic cordova platform add android`
- `cordova requirements android --verbose`
- `sudo ionic cordova run android --verbose`

Generating the resources (splash screen and app icons)

- `ionic cordova resources -f`

Check if your device is connected

- `adb devices`

Run with live reload

- `ionic cordova run android -l`

Connect to the API

- Modify `src/environments/environment.ts` file with your configurations.

## FATAL ERROR: ... JavaScript heap out of memory

NODE_OPTIONS=--max_old_space_size=8192 ionic cordova run android --livereload --external

## Analyze and reduce dependencies size

- npm run bundle-size-verifier-source-map

or

- npm run bundle-size-verifier-webpack-json
