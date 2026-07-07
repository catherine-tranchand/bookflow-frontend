// app/chat/[conversationId].jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  fetchMessages,
  fetchConversationDetails,
  sendMessage,
  markMessagesAsRead,  // ✨ AJOUT
} from '../../lib/chat';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import { supabase } from '../../lib/supabase';


// ─── Formatage horaire FR ─────────────────────────────────────────────────────
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) return `Aujourd'hui ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Hier ${time}`;

  return (
    date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
    ` ${time}`
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Screen
// ═════════════════════════════════════════════════════════════════════════════
export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useGlobalContext();
  const flatListRef = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  
  // ─── Chargement initial + Realtime ──────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    let cancelled = false;

    const initialLoad = async () => {
      try {
        setLoading(true);
        const [convo, msgs] = await Promise.all([
          fetchConversationDetails(conversationId, user.id),
          fetchMessages(conversationId),
        ]);
        if (cancelled) return;
        setConversation(convo);
        setMessages(msgs);
        await markMessagesAsRead(conversationId, user.id);
      } catch (error) {
        if (!cancelled) Alert.alert('Erreur', 'Impossible de charger la conversation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initialLoad();

    // Realtime: new message arrives → append + mark as read
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (cancelled) return;
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== user.id) {
            markMessagesAsRead(conversationId, user.id);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  // ─── Envoyer un message ─────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !user?.id) return;

    try {
      setSending(true);
      setInput('');

      const newMessage = await sendMessage(conversationId, user.id, trimmed);

      // Ajout optimiste : on évite le doublon si le polling l'a déjà ramené
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('[chat] Erreur envoi:', error);
      Alert.alert('Erreur', 'Message non envoyé');
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  };

  // ─── Rendu d'une bulle ──────────────────────────────────────────────────────
  
  const renderMessage = useCallback(
    ({ item, index }) => {
      const isMine = item.sender_id === user?.id;
      const prevMessage = messages[index - 1];
      const showTime =
        !prevMessage ||
        new Date(item.created_at) - new Date(prevMessage.created_at) >
          5 * 60 * 1000;

      return (
        <View className={`px-3 ${showTime ? 'mt-4' : 'mt-1'}`}>
          {showTime && (
            <Text
              className="text-center font-plight mb-2"
              style={{ fontSize: 11, color: 'rgba(205,205,224,0.5)' }}
            >
              {formatTime(item.created_at)}
            </Text>
          )}
          <View
            className={`max-w-[80%] px-4 py-2.5 ${
              isMine ? 'self-end' : 'self-start'
            }`}
            style={{
              borderRadius: 18,
              borderBottomRightRadius: isMine ? 4 : 18,
              borderBottomLeftRadius: isMine ? 18 : 4,
              backgroundColor: isMine
                ? '#FF9C01'
                : 'rgba(255,255,255,0.08)',
              borderWidth: isMine ? 0 : 1,
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text
              className="font-pmedium"
              style={{
                color: isMine ? '#161622' : '#FFFFFF',
                fontSize: 15,
                lineHeight: 20,
              }}
            >
              {item.content}
            </Text>
          </View>
        </View>
      );
    },
    [user?.id, messages]
  );

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="bg-primary h-full items-center justify-center">
        <ActivityIndicator size="large" color="#FF9C01" />
      </SafeAreaView>
    );
  }

  const otherName = conversation?.otherUser?.username || 'Utilisateur';
  const otherAvatar = conversation?.otherUser?.avatar;
  const bookTitle = conversation?.books?.title;

  return (
    <SafeAreaView className="bg-primary h-full" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <View
        className="flex-row items-center px-3 py-3"
        style={{
          borderBottomWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <Text className="text-white text-lg">←</Text>
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center ml-3" style={{ gap: 10 }}>
          {otherAvatar ? (
            <Image
              source={{ uri: otherAvatar }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : (
            <View
              className="items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,156,1,0.25)',
              }}
            >
              <Text className="text-secondary-100 font-pbold text-base">
                {otherName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View className="flex-1">
            <Text
              className="text-white font-pbold text-base"
              numberOfLines={1}
            >
              {otherName}
            </Text>
            {bookTitle && (
              <Text
                className="text-gray-100 font-plight text-xs"
                numberOfLines={1}
                style={{ opacity: 0.7 }}
              >
                📖 {bookTitle}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* ─── MESSAGES + INPUT ───────────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text style={{ fontSize: 48 }}>💬</Text>
            <Text
              className="text-gray-100 text-center font-pmedium mt-4"
              style={{ lineHeight: 22 }}
            >
              Démarre la conversation avec{'\n'}
              <Text className="text-secondary-100">{otherName}</Text>
              {bookTitle && (
                <>
                  {' à propos de\n'}
                  <Text className="text-white">"{bookTitle}"</Text>
                </>
              )}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingVertical: 12 }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input bar */}
        <View
          className="flex-row items-end px-3 py-3"
          style={{
            borderTopWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            gap: 8,
          }}
        >
          <View
            className="flex-1 px-4 py-2"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: 22,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
              maxHeight: 100,
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message..."
              placeholderTextColor="rgba(205,205,224,0.4)"
              multiline
              maxLength={1000}
              className="text-white font-pmedium"
              style={{ fontSize: 15, lineHeight: 20 }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.7}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: input.trim() ? '#FF9C01' : 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#161622" />
            ) : (
              <Text style={{ fontSize: 18 }}>{input.trim() ? '➤' : '✏️'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}