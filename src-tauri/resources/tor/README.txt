Place platform tor binaries here for bundling:

- Windows x64: resources/tor/win64/tor.exe
- Linux x64:   resources/tor/linux/tor

The app will auto-detect Tor Browser SOCKS on 127.0.0.1:9150 first.
If not found, it will spawn the bundled tor binary and manage it via ControlPort.

