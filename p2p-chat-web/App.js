import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import Peer from 'react-native-peerjs';
import { mediaDevices, RTCView } from 'react-native-webrtc';

export default function App() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [conn, setConn] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const peer = useRef(null);

  useEffect(() => {
    // Initialize PeerJS with public server (works in browser)
    peer.current = new Peer({
      host: 'peerjs.com',
      port: 443,
      path: '/',
      secure: true,
    });

    peer.current.on('open', (id) => {
      setPeerId(id);
      console.log('My Peer ID:', id);
    });

    peer.current.on('connection', (connection) => {
      setConn(connection);
      setupConnection(connection);
    });

    peer.current.on('call', (call) => {
      mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        setLocalStream(stream);
        call.answer(stream);
        call.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
        });
      }).catch((err) => Alert.alert('Media Error', err.message));
    });

    peer.current.on('error', (err) => Alert.alert('Peer Error', err.message));

    return () => {
      peer.current.destroy();
    };
  }, []);

  const setupConnection = (connection) => {
    connection.on('data', (data) => {
      setMessages((prev) => [...prev, { sender: 'remote', text: data }]);
    });

    connection.on('open', () => {
      console.log('Connection opened');
    });

    connection.on('error', (err) => Alert.alert('Connection Error', err.message));
  };

  const connectToPeer = () => {
    const connection = peer.current.connect(remotePeerId);
    setConn(connection);
    setupConnection(connection);
  };

  const sendMessage = () => {
    if (conn && message) {
      conn.send(message);
      setMessages((prev) => [...prev, { sender: 'me', text: message }]);
      setMessage('');
    } else {
      Alert.alert('Error', 'No connection established');
    }
  };

  const startCall = (videoEnabled) => {
    mediaDevices.getUserMedia({ video: videoEnabled, audio: true }).then((stream) => {
      setLocalStream(stream);
      const call = peer.current.call(remotePeerId, stream);
      call.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });
      call.on('error', (err) => Alert.alert('Call Error', err.message));
    }).catch((err) => Alert.alert('Media Error', err.message));
  };

  const endCall = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Peer ID: {peerId}</Text>
      <TextInput
        style={styles.input}
        placeholder="Remote Peer ID"
        value={remotePeerId}
        onChangeText={setRemotePeerId}
      />
      <Button title="Connect" onPress={connectToPeer} />

      <ScrollView style={styles.chatContainer}>
        {messages.map((msg, idx) => (
          <Text key={idx} style={msg.sender === 'me' ? styles.myMessage : styles.remoteMessage}>
            {msg.sender}: {msg.text}
          </Text>
        ))}
      </ScrollView>
      <TextInput
        style={styles.input}
        placeholder="Type message"
        value={message}
        onChangeText={setMessage}
      />
      <Button title="Send" onPress={sendMessage} />

      <View style={styles.callButtons}>
        <Button title="Voice Call" onPress={() => startCall(false)} />
        <Button title="Video Call" onPress={() => startCall(true)} />
        <Button title="End Call" onPress={endCall} />
      </View>

      <View style={styles.videoContainer}>
        {localStream && <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />}
        {remoteStream && <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f0f0', maxWidth: 600, margin: 'auto' },  // Centered for browser
  label: { fontSize: 16, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  chatContainer: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 10 },
  myMessage: { color: 'blue', textAlign: 'right' },
  remoteMessage: { color: 'green' },
  callButtons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  videoContainer: { flexDirection: 'row', height: 200 },
  localVideo: { flex: 1, backgroundColor: '#000', marginRight: 5 },
  remoteVideo: { flex: 1, backgroundColor: '#000' },
});