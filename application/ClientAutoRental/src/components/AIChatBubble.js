import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Share,
  Clipboard,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;
const STORAGE_KEY = '@adrware_chat_sessions_v1';

const ChatVectorIcon = ({ name, color = '#ffffff', size = 18 }) => {
  switch (name) {
    case 'sparkles-pro':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 3v3m0 12v3M3 12h3m12 0h3m-3.5-6.5l-2 2m-7 7l-2 2m0-11l2 2m7 7l2 2" />
          <Circle cx="12" cy="12" r="3" />
        </Svg>
      );
    case 'send':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M22 2L11 13" />
          <Path d="M22 2L15 22L11 13L2 9L22 2Z" />
        </Svg>
      );
    case 'menu':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 6h16M4 12h10M4 18h16" />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 6L6 18M6 6l12 12" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      );
    case 'copy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="9" y="9" width="13" height="13" rx="2" />
          <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </Svg>
      );
    case 'share':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <Path d="M16 6l-4-4-4 4" />
          <Path d="M12 2v13" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </Svg>
      );
    case 'pin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 17v5M9 2h6l-1 7 4 3v2H6v-2l4-3-1-7z" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </Svg>
      );
    case 'mic':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <Path d="M12 19v4" />
          <Path d="M8 23h8" />
        </Svg>
      );
    case 'arrow-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 5v14M19 12l-7 7-7-7" />
        </Svg>
      );
    default:
      return null;
  }
};

export default function AIChatBubble() {
  const { theme, t } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets?.HIGH_QUALITY || undefined);
  const [isRecordingState, setIsRecordingState] = useState(false);

  const scrollViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const defaultSession = { 
    id: '1', 
    title: 'Conseiller Réseau Adrware', 
    pinned: true, 
    messages: [
      { sender: 'ai', text: t?.aiGreeting || "Bonjour. Je suis l'assistant intelligent d'Adrware. Comment puis-je vous accompagner dans vos réservations, la gestion de votre solde ou le choix de votre véhicule ?" }
    ] 
  };

  const [sessions, setSessions] = useState([defaultSession]);
  const [currentSessionId, setCurrentSessionId] = useState('1');
  const [renamingId, setRenamingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const loadSessions = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
        }
      }
    } catch (e) {
      console.log('Erreur chargement sessions chat', e);
    }
  };

  const saveSessions = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('Erreur sauvegarde sessions chat', e);
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0] || defaultSession;

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 60;
    setShowScrollBottom(!isCloseToBottom);
  };

  const handleToggleRecord = async () => {
    try {
      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
        setIsRecordingState(false);
        const uri = audioRecorder.uri;
        if (uri) {
          setInputMessage("[Audio enregistré]");
        }
      } else {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          Alert.alert("Permission refusée", "L'accès au microphone est requis.");
          return;
        }
        await audioRecorder.record();
        setIsRecordingState(true);
      }
    } catch (error) {
      console.error("Erreur enregistrement audio:", error);
      setIsRecordingState(false);
      Alert.alert("Erreur", "Impossible d'accéder au microphone.");
    }
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newSess = {
      id: newId,
      title: `${t?.discussion || 'Session'} ${sessions.length + 1}`,
      pinned: false,
      messages: [{ sender: 'ai', text: t?.aiNewChatGreeting || "Nouvelle session ouverte. En quoi puis-je vous assister ?" }]
    };
    const updated = [newSess, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newId);
    setShowHistory(false);
  };

  const handleDeleteSession = (idToDelete, event) => {
    event?.stopPropagation?.();
    Alert.alert(
      "Supprimer la discussion",
      "Voulez-vous vraiment supprimer cet échange de votre historique ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: () => {
            const filteredSessions = sessions.filter(s => s.id !== idToDelete);
            if (filteredSessions.length === 0) {
              setSessions([defaultSession]);
              setCurrentSessionId(defaultSession.id);
            } else {
              setSessions(filteredSessions);
              if (currentSessionId === idToDelete) {
                setCurrentSessionId(filteredSessions[0].id);
              }
            }
          }
        }
      ]
    );
  };

  const togglePin = (id, event) => {
    event?.stopPropagation?.();
    const updated = sessions.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s);
    setSessions(updated);
  };

  const handleRename = (id) => {
    if (!newTitle.trim()) {
      setRenamingId(null);
      return;
    }
    const updated = sessions.map(s => s.id === id ? { ...s, title: newTitle } : s);
    setSessions(updated);
    setRenamingId(null);
    setNewTitle('');
  };

  const sendMessage = async (textToSend) => {
    const textQuery = textToSend || inputMessage;
    if (!textQuery.trim()) return;

    const userMsgObj = { sender: 'user', text: textQuery };
    const updatedMessages = [...currentSession.messages, userMsgObj];
    let updatedSessions = sessions.map(s => s.id === currentSessionId ? { ...s, messages: updatedMessages } : s);
    
    setSessions(updatedSessions);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    setTimeout(() => scrollToBottom(), 100);

    try {
      const response = await api.post('chatbot/ask/', { message: textQuery });
      const aiReply = response.data.reply || t?.aiDefaultError || "Je n'ai pas pu analyser votre demande.";
      
      const finalMessages = [...updatedMessages, { sender: 'ai', text: aiReply }];
      updatedSessions = updatedSessions.map(s => s.id === currentSessionId ? { ...s, messages: finalMessages } : s);
      setSessions(updatedSessions);
    } catch (error) {
      const errorMessages = [...updatedMessages, { sender: 'ai', text: t?.aiServerError || "Le service d'assistance rencontre une perturbation temporaire." }];
      updatedSessions = updatedSessions.map(s => s.id === currentSessionId ? { ...s, messages: errorMessages } : s);
      setSessions(updatedSessions);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const handleCopy = (text) => {
    Clipboard.setString(text);
    Alert.alert(t?.success || "Copié", t?.textCopied || "Le message a été copié.");
  };

  const handleShare = async (text) => {
    try {
      await Share.share({ message: text });
    } catch (error) {
      Alert.alert(t?.error || "Erreur", t?.shareError || "Échec du partage.");
    }
  };

  return (
    <>
      <Animated.View style={[styles.bubbleWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity 
          style={styles.bubbleButton} 
          onPress={() => setIsOpen(true)} 
          activeOpacity={0.88}
        >
          <View style={styles.iconCircle}>
            <ChatVectorIcon name="sparkles-pro" color="#38bdf8" size={18} />
          </View>
          <Text style={styles.bubbleLabel}>Assistant IA</Text>
          <View style={styles.activeDot} />
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={isOpen} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={styles.chatContainer}>
            
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => setShowHistory(!showHistory)} style={styles.iconBtn}>
                  <ChatVectorIcon name="menu" color="#f1f5f9" size={18} />
                </TouchableOpacity>
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.chatTitle} numberOfLines={1}>{currentSession.title}</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.liveIndicator} />
                    <Text style={styles.statusText}>IA Adrware • Active</Text>
                  </View>
                </View>
              </View>

              <View style={styles.headerRight}>
                <TouchableOpacity onPress={handleNewChat} style={styles.newChatBtn}>
                  <ChatVectorIcon name="plus" color="#38bdf8" size={12} />
                  <Text style={styles.newChatText}>{t?.newChat || 'Nouveau'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                  <ChatVectorIcon name="close" color="#64748b" size={18} />
                </TouchableOpacity>
              </View>
            </View>

            {showHistory && (
              <View style={styles.historyDrawer}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>Historique des échanges</Text>
                  <TouchableOpacity onPress={() => setShowHistory(false)}>
                    <ChatVectorIcon name="close" color="#94a3b8" size={16} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.historyList}>
                  {sessions.sort((a, b) => b.pinned - a.pinned).map(sess => (
                    <TouchableOpacity 
                      key={sess.id} 
                      style={[styles.historyItem, sess.id === currentSessionId && styles.activeHistoryItem]}
                      onPress={() => { setCurrentSessionId(sess.id); setShowHistory(false); }}
                    >
                      <View style={{ flex: 1, marginRight: 8 }}>
                        {renamingId === sess.id ? (
                          <TextInput
                            style={styles.renameInput}
                            value={newTitle}
                            onChangeText={setNewTitle}
                            autoFocus
                            onBlur={() => handleRename(sess.id)}
                            onSubmitEditing={() => handleRename(sess.id)}
                          />
                        ) : (
                          <TouchableOpacity onPress={() => { setRenamingId(sess.id); setNewTitle(sess.title); }}>
                            <Text style={[styles.historyItemText, sess.id === currentSessionId && { color: '#ffffff', fontWeight: 'bold' }]} numberOfLines={1}>
                              {sess.title}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity onPress={(e) => togglePin(sess.id, e)} style={styles.pinBtn}>
                          <ChatVectorIcon name="pin" color={sess.pinned ? '#f59e0b' : '#475569'} size={14} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={(e) => handleDeleteSession(sess.id, e)} style={styles.deleteBtn}>
                          <ChatVectorIcon name="trash" color="#ef4444" size={14} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <ScrollView 
                ref={scrollViewRef}
                style={styles.chatBody} 
                contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {currentSession.messages.map((msg, index) => (
                  <View 
                    key={index} 
                    style={[styles.messageRow, msg.sender === 'user' ? styles.rowUser : styles.rowAi]}
                  >
                    <View style={[styles.messageBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                      
                      {!!msg.text && (
                        <Text style={msg.sender === 'user' ? styles.userText : styles.aiText}>
                          {msg.text}
                        </Text>
                      )}

                      {msg.sender === 'ai' && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleCopy(msg.text)}>
                            <ChatVectorIcon name="copy" color="#38bdf8" size={11} />
                            <Text style={styles.actionText}>{t?.copy || 'Copier'}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(msg.text)}>
                            <ChatVectorIcon name="share" color="#38bdf8" size={11} />
                            <Text style={styles.actionText}>{t?.share || 'Partager'}</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {msg.sender === 'user' && (
                        <View style={styles.actionRowUser}>
                          <TouchableOpacity style={styles.actionBtnUser} onPress={() => handleCopy(msg.text)}>
                            <ChatVectorIcon name="copy" color="#cbd5e1" size={11} />
                            <Text style={styles.actionTextUser}>Copier</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.actionBtnUser} onPress={() => setInputMessage(msg.text)}>
                            <ChatVectorIcon name="edit" color="#cbd5e1" size={11} />
                            <Text style={styles.actionTextUser}>Éditer</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                {loading && (
                  <View style={[styles.messageBubble, styles.aiBubble, { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }]}>
                    <ActivityIndicator size="small" color="#38bdf8" style={{ marginRight: 8 }} />
                    <Text style={styles.loadingText}>Analyse en cours par l'IA...</Text>
                  </View>
                )}
              </ScrollView>

              {showScrollBottom && (
                <TouchableOpacity 
                  style={styles.scrollToBottomBtn} 
                  onPress={scrollToBottom}
                  activeOpacity={0.8}
                >
                  <ChatVectorIcon name="arrow-down" color="#FFFFFF" size={16} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.chatFooter}>
              <TouchableOpacity 
                style={[styles.mediaBtn, isRecordingState && styles.recordingActive]} 
                onPress={handleToggleRecord}
                activeOpacity={0.7}
              >
                <ChatVectorIcon name="mic" color={isRecordingState ? "#ef4444" : "#94a3b8"} size={18} />
              </TouchableOpacity>

              <TextInput
                style={styles.chatInput}
                placeholder={isRecordingState ? "🔴 Enregistrement audio..." : "Posez votre question..."}
                placeholderTextColor={isRecordingState ? "#ef4444" : "#64748b"}
                value={inputMessage}
                onChangeText={setInputMessage}
              />

              <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()} activeOpacity={0.8}>
                <ChatVectorIcon name="send" color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubbleWrapper: { 
    position: 'absolute', 
    bottom: isSmallDevice ? 72 : 82, 
    right: 14, 
    zIndex: 9998 
  },
  bubbleButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0f172a', 
    paddingVertical: 7, 
    paddingHorizontal: 11, 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: 'rgba(56, 189, 248, 0.3)', 
    elevation: 8 
  },
  iconCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(56, 189, 248, 0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  bubbleLabel: { color: '#f8fafc', fontSize: 11, fontWeight: '700', marginRight: 5 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end' },
  chatContainer: { height: '88%', backgroundColor: '#0b0f19', borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#0f172a', borderBottomWidth: 1, borderColor: '#1e293b' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBtn: { padding: 6, borderRadius: 8, backgroundColor: '#1e293b' },
  chatTitle: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  liveIndicator: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#22c55e', marginRight: 4 },
  statusText: { color: '#64748b', fontSize: 10, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
  newChatText: { color: '#38bdf8', fontSize: 10, fontWeight: '600' },
  closeBtn: { padding: 4 },
  historyDrawer: { position: 'absolute', top: 56, left: 0, width: '82%', height: '100%', backgroundColor: '#0f172a', zIndex: 100, borderRightWidth: 1, borderColor: '#1e293b', padding: 14 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderColor: '#1e293b', paddingBottom: 8 },
  historyTitle: { color: '#f8fafc', fontWeight: 'bold', fontSize: 12 },
  historyList: { flex: 1 },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, marginBottom: 6, backgroundColor: '#1e293b' },
  activeHistoryItem: { backgroundColor: '#2563eb' },
  historyItemText: { color: '#94a3b8', fontSize: 11 },
  renameInput: { backgroundColor: '#0b0f19', color: '#fff', fontSize: 11, padding: 3, borderRadius: 6 },
  pinBtn: { padding: 3 },
  deleteBtn: { padding: 3 },
  chatBody: { flex: 1 },
  messageRow: { marginVertical: 4, width: '100%' },
  rowUser: { alignItems: 'flex-end' },
  rowAi: { alignItems: 'flex-start' },
  messageBubble: { padding: 12, borderRadius: 16, maxWidth: '88%' },
  userBubble: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#1e293b', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  userText: { color: '#ffffff', fontSize: 13, lineHeight: 18 },
  aiText: { color: '#e2e8f0', fontSize: 13, lineHeight: 18 },
  actionRow: { flexDirection: 'row', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderColor: '#334155', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 6, backgroundColor: '#0f172a', borderRadius: 6 },
  actionText: { color: '#38bdf8', fontSize: 9.5, fontWeight: '600' },
  actionRowUser: { flexDirection: 'row', marginTop: 6, paddingTop: 5, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: 8 },
  actionBtnUser: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 6 },
  actionTextUser: { color: '#cbd5e1', fontSize: 9.5 },
  loadingText: { color: '#94a3b8', fontSize: 11, fontStyle: 'italic' },
  scrollToBottomBtn: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  chatFooter: { flexDirection: 'row', padding: 10, backgroundColor: '#0f172a', alignItems: 'center', borderTopWidth: 1, borderColor: '#1e293b' },
  mediaBtn: { padding: 8, borderRadius: 10, backgroundColor: '#1e293b', marginRight: 6 },
  recordingActive: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: '#ef4444' },
  chatInput: { flex: 1, backgroundColor: '#1e293b', color: '#fff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1, borderColor: '#334155', fontSize: 12.5, marginRight: 6 },
  sendBtn: { backgroundColor: '#2563eb', width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});