// lib/chat.js

import { supabase } from './supabase';

/**
 * Récupère ou crée une conversation entre un acheteur et un vendeur pour un livre.
 */
export async function getOrCreateConversation(bookId, buyerId, sellerId) {
  if (!bookId || !buyerId || !sellerId) {
    throw new Error('Paramètres manquants pour la conversation');
  }
  if (buyerId === sellerId) {
    throw new Error("Tu ne peux pas te contacter toi-même");
  }

  // Optimistic insert: one round-trip in the happy path.
  // If two taps race and both reach INSERT simultaneously, the second gets a
  // unique-constraint error (23505) and we fall back to fetching the winner.
  const { data: created, error: createError } = await supabase
    .from('conversations')
    .insert({
      book_id: bookId,
      buyer_id: buyerId,
      seller_id: sellerId,
      status: 'active',
    })
    .select('id')
    .single();

  if (!createError) return created;

  // '23505' = unique_violation — conversation already exists
  if (createError.code === '23505') {
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .eq('book_id', bookId)
      .eq('buyer_id', buyerId)
      .single();

    if (fetchError) throw fetchError;
    return existing;
  }

  throw createError;
}

/**
 * Charge tous les messages d'une conversation, ordre chronologique.
 */
export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[chat] Erreur chargement messages:', error);
    throw error;
  }

  return data || [];
}

/**
 * Charge les infos d'une conversation : livre + acheteur + vendeur.
 */
export async function fetchConversationDetails(conversationId, currentUserId) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      book_id,
      buyer_id,
      seller_id,
      status,
      books (id, title, author, image, offer_type, price, city, delivery),
      buyer:buyer_id (id, username, avatar, city),
      seller:seller_id (id, username, avatar, city)
    `)
    .eq('id', conversationId)
    .single();

  if (error) {
    console.error('[chat] Erreur chargement conversation:', error);
    throw error;
  }

  const otherUser = data.buyer_id === currentUserId ? data.seller : data.buyer;

  return {
    ...data,
    otherUser,
  };
}

/**
 * Envoie un message dans une conversation.
 */
export async function sendMessage(conversationId, senderId, content) {
  const trimmed = (content ?? '').trim();
  if (!trimmed) {
    throw new Error("Le message ne peut pas être vide");
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: trimmed,
    })
    .select()
    .single();

  if (error) {
    console.error('[chat] Erreur envoi message:', error);
    throw error;
  }

  return data;
}

// ═════════════════════════════════════════════════════════════════════════════
// ✨ NOUVELLES FONCTIONS pour la liste des conversations + badge non-lus
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Récupère toutes les conversations d'un user (acheteur OU vendeur),
 * triées par dernier message.
 * Pour chaque conversation : infos livre, autre user, dernier message,
 * et nombre de messages non lus.
 */
export async function fetchConversations(currentUserId) {
  if (!currentUserId) return [];

  // 1. Toutes les conversations où l'user est buyer ou seller
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      book_id,
      buyer_id,
      seller_id,
      status,
      last_message,
      last_message_at,
      created_at,
      books (id, title, author, image, offer_type, price, city),
      buyer:buyer_id (id, username, avatar, city),
      seller:seller_id (id, username, avatar, city)
    `)
    .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('[chat] Erreur chargement conversations:', error);
    throw error;
  }

  if (!conversations || conversations.length === 0) return [];

  // 2. Pour chaque conversation, compte les messages non lus
  //    (= messages reçus par l'user, donc sender != user, et read_at IS NULL)
  const conversationIds = conversations.map((c) => c.id);

  const { data: unreadMessages, error: unreadError } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', conversationIds)
    .neq('sender_id', currentUserId)
    .is('read_at', null);

  if (unreadError) {
    console.error('[chat] Erreur comptage non-lus:', unreadError);
  }

  // Groupe par conversation_id
  const unreadByConv = {};
  (unreadMessages || []).forEach((m) => {
    unreadByConv[m.conversation_id] = (unreadByConv[m.conversation_id] || 0) + 1;
  });

  // 3. Enrichit chaque conversation
  return conversations.map((c) => ({
    ...c,
    otherUser: c.buyer_id === currentUserId ? c.seller : c.buyer,
    unreadCount: unreadByConv[c.id] || 0,
  }));
}

/**
 * Compte tous les messages non-lus de l'user (pour le badge sur le tab).
 */
export async function countUnreadMessages(currentUserId) {
  if (!currentUserId) return 0;

  // 1. Récupère les ids des conversations où l'user est buyer ou seller
  const { data: convs, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`);

  if (convError || !convs || convs.length === 0) return 0;

  const ids = convs.map((c) => c.id);

  // 2. Compte les messages non-lus dans ces conversations (qui ne sont pas envoyés par l'user)
  const { count, error: countError } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', ids)
    .neq('sender_id', currentUserId)
    .is('read_at', null);

  if (countError) {
    console.error('[chat] Erreur countUnread:', countError);
    return 0;
  }

  return count || 0;
}

/**
 * Marque tous les messages d'une conversation comme lus
 * (seulement ceux que l'user n'a pas envoyés).
 */
export async function markMessagesAsRead(conversationId, currentUserId) {
  if (!conversationId || !currentUserId) return;

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', currentUserId)
    .is('read_at', null);

  if (error) {
    console.error('[chat] Erreur markAsRead:', error);
  }
}