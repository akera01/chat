# P2P Chat App

## Project Overview
This project is a minimal, peer-to-peer (P2P) chat application built with React Native, utilizing WebRTC for real-time communication (text chat via data channels, voice/video calls via media streams) and PeerJS for signaling. The app is designed to be blazing fast and responsive, with direct P2P connections to minimize latency. No backend server like Firebase is used—connections are established by manually sharing Peer IDs (e.g., via text or QR code in a production version).

Key features:
- Display your unique Peer ID.
- Connect to a remote peer by entering their ID.
- Send and receive text messages in real-time.
- Initiate voice-only or video calls (with auto-answer for simplicity).
- End calls to stop media streams.
- Responsive UI for browser/web environments.

The app is initially targeted at the web/browser for easy testing and development. It uses Expo for setup, which allows seamless porting to mobile (Android/iOS) and desktop platforms later.

**Tech Stack**:
- React Native (with React Native for Web aliases for browser compatibility).
- `react-native-webrtc`: Handles media streams and RTCView (renders as `<video>` on web).
- `react-native-peerjs`: Wrapper for PeerJS signaling (uses public server at peerjs.com).
- Expo: For project scaffolding, web bundling, and future mobile builds.

## Conversation History and Development Timeline
This project evolved through iterative feedback in a conversation starting on September 19, 2025 (based on initial code timestamps), up to September 23, 2025 (current date).

### Initial Proposal (September 19, 2025)
- The conversation began with a detailed guide for a React Native chat app using Expo, Firebase (for auth, real-time messaging, storage), react-native-gifted-chat (UI), expo-image-picker (media), and react-native-webrtc (calls).
- Features included: Private one-on-one chats, voice/video calls, image/video sending.
- Structure: Auth screens (Login/Register), Home (chat list), NewChat, ChatScreen, CallScreen.
- Setup involved Firebase config, navigation with @react-navigation, and custom dev client for WebRTC.
- Issues noted: User lookup by email, chat naming, message ordering, call handling (caller/callee), permissions, security rules.
- Updates provided: Code fixes for UID fetching, reversing messages, call invites via chat, initiator logic.

### Shift to P2P (No Firebase) - First Iteration
- User requested: Remove Firebase; focus on minimal P2P app with WebRTC, PeerJS for signaling; blazing fast/responsive; chat + voice/video calls.
- Platforms: Browser first, then desktop (Electron), mobile (React Native).
- Provided: Pure React (non-Native) web app setup with create-react-app, PeerJS code for browser testing.
- Code: App.js with Peer init, connect, send message, start/end calls; simple HTML-mapped UI.

### Clarification: React Native Only
- User clarified: Strictly React Native (no plain React).
- Response: Switched to React Native with Expo; included mobile setup but mentioned web testing via `--web`.
- Code: App.js in RN style; instructions for Expo dev client, running on mobile/web/desktop (Electron wrapper).

### Detour: React Native for Windows
- User shared info about React Native for Windows (RNW): Extension for building native Windows apps (PC, Xbox, tablets, etc.); uses Windows SDK; telemetry notes.
- Response: Explained RNW features, requirements (Visual Studio, Node), installation (new/existing projects), running, troubleshooting.
- Tied back to P2P app: How to add Windows support to the existing RN project.

### Final Refinement: Web/Browser First (React Native Web)
- User specified: React Native Web only (no Android/iOS for now); get it working in browser, then port.
- Response: Expo setup with `platforms: ["web"]`; RN code that runs in browser via `expo start --web`.
- Code: Same App.js as previous RN version, with styles adjusted for browser (e.g., maxWidth for centering).
- Testing: Open in two tabs, share IDs, chat/call.

Throughout, emphasis was on minimalism: No extra deps beyond essentials; P2P for speed; manual ID sharing for connections.

## Current Setup Instructions
### Prerequisites
- Node.js (v18+).
- Expo CLI: `npm install -g expo-cli`.
- Modern browser (Chrome/Firefox recommended for WebRTC).

### Installation
1. Create project:
   ```
   expo init p2p-chat-web --template blank
   cd p2p-chat-web
   ```

2. Install deps:
   ```
   expo install react-native-webrtc
   npm install react-native-peerjs
   ```

3. Update `app.json`:
   ```json
   {
     "expo": {
       "name": "p2p-chat-web",
       "slug": "p2p-chat-web",
       "platforms": ["web"],
       "web": {}
     }
   }
   ```

4. Replace `App.js` with the provided code (see Conversation History > Final Refinement for full code).

### Running in Browser
```
expo start --web
```
- Opens http://localhost:19006 (or similar).
- Test in two tabs: Share Peer ID, connect, chat, call.
- For production: `expo build:web` to generate static files for deployment (e.g., Vercel).

### Known Limitations (Current Version)
- Auto-answer for calls (no accept prompt—add later).
- No media sending (images/videos) beyond calls.
- Relies on public PeerJS server (may have limits; host your own for prod).
- Browser only—no native mobile/desktop yet.
- Error handling via Alerts; basic UI (no advanced styling like shadows/gradients).

## Future Plans
- **Port to Mobile (Android/iOS)**: Add `"platforms": ["ios", "android"]` to app.json; build custom dev client (`expo prebuild; expo run:android/ios`). Test on emulators/devices. Add mobile-specific permissions (mic/camera) in app.json.
- **Desktop Support**:
  - **Electron Wrapper**: Add Electron deps/scripts as in earlier instructions; run with `npm run electron:start`.
  - **React Native for Windows**: Run `npx react-native-windows-init` in project root; target Windows PC/Xbox via `npx react-native run-windows`. Integrate WebRTC Windows compat.
- **Feature Enhancements**:
  - Add call accept/reject (e.g., send invite via data channel, prompt user).
  - Image/video sending: Use expo-image-picker (on mobile) or file input (web); send via data channels (chunk large files).
  - Group chats: Support multiple peers/connections.
  - Discovery: Replace manual ID sharing with a simple lobby (e.g., via a custom PeerJS server or WebSocket room).
  - UI Polish: Integrate react-native-paper for modern design (buttons, shadows); add themes/gradients.
  - Security: Handle ICE/STUN/TURN for better NAT traversal (add custom servers).
  - Offline Handling: Basic message queuing if disconnected.
- **Testing/Optimization**: Add unit tests (Jest); profile for performance; support custom PeerJS server hosting.
- **Deployment**: Web to static hosting; mobile to app stores; desktop to installers via Electron Builder or RNW MSIX.
- **Timeline**: Start with browser stabilization (current); mobile ports next (1-2 weeks); desktop/features iterative.

## Contributing
Fork the repo, make changes, PR. Focus on keeping it minimal and P2P-focused.

## License
MIT (or specify as needed).