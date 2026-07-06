// app/(tabs)/messages.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import { fetchConversations } from '../../lib/chat';

// ─── Labels ───────────────────────────────────────────────────────────────────
const OFFER_LABELS = {
  don: '🎁',
  echange: '🔄',
  vente: '💶',
};

// ─── Date relative compacte (style WhatsApp) ──────────────────────────────────
const relativeShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours} h`;
  if (days === 1) return 'hier';
  if (days < 7) return `${days} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// ═════════════════════════════════════════════════════════════════════════════
// Screen
// ═════════════════════════════════════════════════════════════════════════════
export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useGlobalContext();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  // ─── Charge les conversations ───────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await fetchConversations(user.id);
      setConversations(data);
    } catch (err) {
      console.error('[messages] Erreur chargement:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // ─── Polling toutes les 5s quand l'écran est actif ─────────────────────────
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();

      // Démarre le polling
      intervalRef.current = setInterval(load, 5000);

      return () => {
        // Stoppe le polling quand on quitte l'écran
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // ─── Rendu d'une ligne de conversation ──────────────────────────────────────
  const renderItem = ({ item }) => {
    const hasUnread = item.unreadCount > 0;
    const otherName = item.otherUser?.username ?? 'Utilisateur';
    const book = item.books;
    const lastMsg = item.last_message;
    const time = relativeShort(item.last_message_at);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
        className="flex-row items-center px-4 py-3"
        style={{
          borderBottomWidth: 1,
          borderColor: 'rgba(255,255,255,0.05)',
          gap: 12,
        }}
      >
        {/* Image du livre (style BookFlow) */}
        <View
          style={{
            width: 56,
            height: 76,
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#1E1E2D',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          {book?.image ? (
            <Image
              source={{ uri: book.image }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text style={{ fontSize: 24 }}>📖</Text>
            </View>
          )}
        </View>

        {/* Contenu */}
        <View className="flex-1">
          {/* Ligne 1 : nom + type d'offre + horodatage */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1" style={{ gap: 6 }}>
              <Text
                className="text-white font-pbold"
                numberOfLines={1}
                style={{ fontSize: 15 }}
              >
                {otherName}
              </Text>
              {OFFER_LABELS[book?.offer_type] && (
                <Text style={{ fontSize: 13 }}>
                  {OFFER_LABELS[book.offer_type]}
                </Text>
              )}
            </View>
            <Text
              className="font-plight"
              style={{
                fontSize: 11,
                color: hasUnread ? '#FF9C01' : 'rgba(205,205,224,0.5)',
                marginLeft: 8,
              }}
            >
              {time}
            </Text>
          </View>

          {/* Ligne 2 : titre du livre */}
          {book?.title && (
            <Text
              className="font-pmedium"
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: 'rgba(255,156,1,0.8)',
                marginTop: 2,
              }}
            >
              📖 {book.title}
            </Text>
          )}

          {/* Ligne 3 : dernier message + badge non-lus */}
          <View className="flex-row items-center justify-between mt-1">
            <Text
              className={hasUnread ? 'font-pbold' : 'font-plight'}
              numberOfLines={1}
              style={{
                fontSize: 13,
                color: hasUnread ? '#FFFFFF' : 'rgba(205,205,224,0.6)',
                flex: 1,
              }}
            >
              {lastMsg || 'Aucun message'}
            </Text>

            {hasUnread && (
              <View
                className="ml-2 items-center justify-center"
                style={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: '#FF9C01',
                  paddingHorizontal: 7,
                }}
              >
                <Text
                  className="font-pbold"
                  style={{ color: '#161622', fontSize: 11 }}
                >
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── États ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="bg-primary h-full items-center justify-center">
        <ActivityIndicator size="large" color="#FF9C01" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary h-full" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-white font-pbold" style={{ fontSize: 26 }}>
          Messages
        </Text>
      </View>

      {/* Liste */}
      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 56 }}>💬</Text>
          <Text
            className="text-white font-pbold text-lg mt-4"
            style={{ textAlign: 'center' }}
          >
            Aucune conversation
          </Text>
          <Text
            className="text-gray-100 font-plight text-sm mt-2"
            style={{ textAlign: 'center', lineHeight: 20, opacity: 0.7 }}
          >
            Quand tu contacteras un autre lecteur,{'\n'}tes conversations apparaîtront ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF9C01"
              colors={['#FF9C01']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}