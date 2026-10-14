# Expo / React Native expertise

Treat Expo SDK compatibility as version-sensitive. Inspect `package.json`, app config, native folders, config plugins, and EAS config before selecting packages.

Prefer `npx expo install` for Expo-compatible versions. Serious apps normally use a development build. Rebuild after native dependency/configuration changes; JS/TS-only changes normally reuse the installed native build.
