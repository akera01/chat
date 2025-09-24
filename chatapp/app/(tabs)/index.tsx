import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { mediaDevices, RTCView } from 'react-native-webrtc-web-shim';
import * as Clipboard from 'expo-clipboard';

export default function ChatScreen() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [message, setMessage] = useState('');
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<MediaConnection | null>(null);

  const peer = useRef<Peer | null>(null);
  const videoCallRef = useRef<MediaConnection | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    peer.current = new Peer();

    peer.current.on('open', (id: string) => {
      setPeerId(id);
      console.log('My Peer ID:', id);
    });

    peer.current.on('connection', (connection) => {
      setConn(connection);
      setupConnection(connection);
    });

    peer.current.on('call', (call) => {
      setIncomingCall(call);
      addStatusMessage('Incoming video call...');
    });

    peer.current.on('error', (err) => Alert.alert('Peer Error', err.message));

    return () => {
      peer.current?.destroy();
    };
  }, []);

  const setupConnection = (connection: DataConnection) => {
    connection.on('data', (data) => {
      setMessages((prev) => [...prev, { sender: 'remote', text: String(data) }]);
    });

    connection.on('open', () => console.log('Connection opened'));
    connection.on('error', (err) => Alert.alert('Connection Error', err.message));
  };

  const connectToPeer = () => {
    if (!remotePeerId) {
      Alert.alert('Error', 'Please enter a Peer ID to connect.');
      return;
    }
    const connection = peer.current?.connect(remotePeerId);
    if (connection) {
      setConn(connection);
      setupConnection(connection);
    }
  };

  const sendMessage = () => {
    if (conn && message.trim()) {
      conn.send(message);
      setMessages((prev) => [...prev, { sender: 'me', text: message }]);
      setMessage('');
    }
  };

  const startCall = async (videoEnabled: boolean) => {
    try {
      const stream = await mediaDevices.getUserMedia({ video: videoEnabled, audio: true });
      setLocalStream(stream);
      const call = peer.current?.call(remotePeerId, stream);
      if (call) {
        videoCallRef.current = call;
        call.on('stream', (remoteStream) => setRemoteStream(remoteStream));
        call.on('close', endCall);
      }
    } catch (err: any) {
      Alert.alert('Media Error', err.message);
    }
  };

  const acceptCall = async (call: MediaConnection) => {
    try {
      const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      call.answer(stream);
      videoCallRef.current = call;
      call.on('stream', (remoteStream) => setRemoteStream(remoteStream));
      call.on('close', endCall);
      setIncomingCall(null);
    } catch (err: any) {
      Alert.alert('Media Error', err.message);
    }
  };

  const declineCall = (call: MediaConnection) => {
    call.close();
    setIncomingCall(null);
    addStatusMessage('Call declined');
  };

  const endCall = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    videoCallRef.current?.close();
    videoCallRef.current = null;
    addStatusMessage('Call ended');
  };

  const copyPeerId = () => {
    Clipboard.setStringAsync(peerId);
    Alert.alert('Copied!', 'Your Peer ID has been copied to clipboard.');
  };

  const addStatusMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: 'status', text }]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.peerText}>Your Peer ID:</Text>
        <Text style={styles.peerId}>{peerId}</Text>
        <TouchableOpacity onPress={copyPeerId} style={styles.copyButton}>
          <Text style={styles.copyText}>Copy</Text>
        </TouchableOpacity>
      </View>

      {/* Remote ID input */}
      <View style={styles.connectRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter Peer ID to connect"
          value={remotePeerId}
          onChangeText={setRemotePeerId}
        />
        <TouchableOpacity style={styles.connectBtn} onPress={connectToPeer}>
          <Text style={styles.connectBtnText}>Connect</Text>
        </TouchableOpacity>
      </View>

      {/* Call controls */}
      {conn && !incomingCall && (
        <View style={styles.callButtons}>
          <TouchableOpacity style={styles.callBtn} onPress={() => startCall(false)}>
            <Text>Voice Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={() => startCall(true)}>
            <Text>Video Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={endCall}>
            <Text>End</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Incoming call UI */}
      {incomingCall && (
        <View style={styles.incomingCall}>
          <Text>Incoming video call...</Text>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.callBtn, { marginRight: 10 }]}
              onPress={() => acceptCall(incomingCall)}
            >
              <Text>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callBtn} onPress={() => declineCall(incomingCall)}>
              <Text>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Chat */}
      <ScrollView
        style={styles.chat}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.bubble,
              msg.sender === 'me'
                ? styles.myBubble
                : msg.sender === 'status'
                ? styles.statusBubble
                : styles.remoteBubble,
            ]}
          >
            <Text style={styles.bubbleText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Message input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.msgInput}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Video section */}
      {(localStream || remoteStream) && (
        <View style={styles.videoContainer}>
          {localStream && (
            <RTCView key={localStream.id} stream={localStream} style={styles.video} />
          )}
          {remoteStream && (
            <RTCView key={remoteStream.id} stream={remoteStream} style={styles.video} />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  peerText: { fontWeight: '600', marginRight: 6 },
  peerId: { flex: 1, color: '#333' },
  copyButton: { backgroundColor: '#eee', padding: 6, borderRadius: 5 },
  copyText: { color: '#007AFF' },
  connectRow: { flexDirection: 'row', padding: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 },
  connectBtn: { marginLeft: 8, backgroundColor: '#007AFF', padding: 10, borderRadius: 6 },
  connectBtnText: { color: '#fff', fontWeight: '600' },
  callButtons: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  callBtn: { backgroundColor: '#eee', padding: 10, borderRadius: 6 },
  incomingCall: { padding: 10, backgroundColor: '#ffc', alignItems: 'center', margin: 10, borderRadius: 6 },
  chat: { flex: 1, padding: 10 },
  bubble: { padding: 10, marginVertical: 4, borderRadius: 8, maxWidth: '75%' },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6' },
  remoteBubble: { alignSelf: 'flex-start', backgroundColor: '#eee' },
  statusBubble: { alignSelf: 'center', backgroundColor: '#ddd' },
  bubbleText: { fontSize: 16 },
  inputRow: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ddd' },
  msgInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, padding: 10 },
  sendBtn: { marginLeft: 8, backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  sendText: { color: '#fff', fontWeight: '600' },
  videoContainer: { flexDirection: 'row', height: 200, margin: 10 },
  video: { flex: 1, backgroundColor: '#000', marginHorizontal: 2 },
});
