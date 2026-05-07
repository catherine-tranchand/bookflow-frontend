import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  getBookById, updateBook, deleteBook, toggleWishlist, isInWishlist,
} from '../../lib/supabase';
import { useGlobalContext } from '../../context/GlobalProvider';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';

// ─── Options ──────────────────────────────────────────────────────────────────
const GENRE_OPTIONS = [
  { label: '🧙 Fantastique', value: 'fantastique' },
  { label: '📜 Classique', value: 'classique' },
  { label: '💬 Roman', value: 'roman' },
  { label: '🔍 Policier', value: 'policier' },
  { label: '🚀 SF', value: 'sf' },
  { label: '🏛️ Histoire', value: 'histoire' },
  { label: '👤 Biographie', value: 'biographie' },
  { label: '🌟 Jeunesse', value: 'jeunesse' },
  { label: '🧠 Psychologie', value: 'psychologie' },
];

const STATE_OPTIONS = [
  { label: '✨ Neuf', value: 'neuf' },
  { label: '👍 Bon état', value: 'bon_etat' },
  { label: '📖 Acceptable', value: 'acceptable' },
];

const OFFER_OPTIONS = [
  { label: '🎁 Don', value: 'don' },
  { label: '🔄 Échange', value: 'echange' },
  { label: '💶 Vente', value: 'vente' },
];

const DELIVERY_OPTIONS = [
  { label: '🤝 Mains propres', value: 'mains_propres' },
  { label: '📮 Par la poste', value: 'poste' },
];

// ─── Labels ───────────────────────────────────────────────────────────────────
const OFFER_LABELS = {
  don: '🎁 Don',
  echange: '🔄 Échange',
  vente: '💶 Vente',
};

const DELIVERY_LABELS = {
  mains_propres: '🤝 Mains propres',
  poste: '📮 Par la poste',
};

const STATE_LABELS = {
  neuf: '✨ Neuf',
  bon_etat: '👍 Bon état',
  acceptable: '📖 Acceptable',
};

// Label du créateur selon le type d'offre
const CREATOR_ROLE_LABEL = {
  don: 'Donneur',
  echange: 'Propriétaire',
  vente: 'Vendeur',
};

const GENRE_LABELS = Object.fromEntries(GENRE_OPTIONS.map((g) => [g.value, g.label]));

const cleanPrice = (text) => text.replace(/[^0-9.,]/g, '').replace(',', '.');

// ─── Date relative ────────────────────────────────────────────────────────────
const relativeDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? 's' : ''}`;
};

// ─── ToggleGroup ──────────────────────────────────────────────────────────────
const ToggleGroup = ({ label, options, selected, onSelect }) => (
  <View className="mt-6">
    <Text className="text-base text-gray-200 font-pmedium mb-3">{label}</Text>
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value === selected ? '' : option.value)}
            className={`px-4 py-2 rounded-xl border ${
              isSelected
                ? 'bg-secondary-100 border-secondary-100'
                : 'bg-black-200 border-gray-100'
            }`}
          >
            <Text className={`text-sm font-pmedium ${isSelected ? 'text-primary' : 'text-white'}`}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ─── Badge ───────────────────────────────────────────────────────────────────
const Badge = ({ label, accent = 'secondary' }) => {
  const styles = {
    secondary: {
      backgroundColor: 'rgba(255,156,1,0.15)',
      borderColor: 'rgba(255,156,1,0.35)',
      color: '#FF9C01',
    },
    soft: {
      backgroundColor: 'rgba(255,156,1,0.08)',
      borderColor: 'rgba(255,156,1,0.20)',
      color: '#FF9C01',
    },
    neutral: {
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderColor: 'rgba(255,255,255,0.10)',
      color: '#CDCDE0',
    },
  };
  const s = styles[accent] ?? styles.secondary;
  return (
    <View
      className="rounded-full px-3 py-1"
      style={{ backgroundColor: s.backgroundColor, borderWidth: 1, borderColor: s.borderColor }}
    >
      <Text className="font-pmedium" style={{ color: s.color, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// Screen
// ═════════════════════════════════════════════════════════════════════════════
export default function BookDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, setUser } = useGlobalContext();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);

  const [form, setForm] = useState(null);
  const [editImage, setEditImage] = useState(null);

  const fetchBook = useCallback(async () => {
    try {
      const data = await getBookById(id);
      setBook(data);
    } catch (err) {
      console.error('getBookById error:', err);
      Alert.alert('Erreur', 'Impossible de charger ce livre');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBook();
    }, [fetchBook])
  );

  const isOwner = book && user && book.creator_id === user.id;
  const inWishlist = isInWishlist(user, id);
  const isVente = form?.offerType === 'vente';
  const isBookVente = book?.offer_type === 'vente';

  const handleToggleWishlist = async () => {
    if (!user?.id || wishLoading) return;
    try {
      setWishLoading(true);
      const newWishlist = await toggleWishlist(user.id, id);
      setUser({ ...user, wishlist: newWishlist });
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setWishLoading(false);
    }
  };

  const enterEditMode = () => {
    setForm({
      title: book.title ?? '',
      author: book.author ?? '',
      description: book.description ?? '',
      genre: book.genre ?? '',
      state: book.state ?? '',
      offerType: book.offer_type ?? '',
      delivery: book.delivery ?? '',
      price: book.price != null ? String(book.price) : '',
    });
    setEditImage(null);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setForm(null);
    setEditImage(null);
  };

  const handleOfferChange = (val) => {
    setForm((prev) => {
      const next = { ...prev, offerType: val };
      if (val === 'don' || val === 'echange') {
        next.delivery = 'mains_propres';
        next.price = '';
      } else if (val === 'vente') {
        if (prev.delivery !== 'mains_propres' && prev.delivery !== 'poste') {
          next.delivery = '';
        }
      } else {
        next.delivery = '';
        next.price = '';
      }
      return next;
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
      aspect: [3, 4],
    });
    if (!result.canceled) setEditImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!form.title || !form.author || !form.genre || !form.state || !form.offerType) {
      return Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
    }

    let finalPrice = null;
    let finalDelivery = form.delivery;

    if (form.offerType === 'vente') {
      if (!form.delivery) {
        return Alert.alert('Erreur', 'Veuillez choisir le mode de remise');
      }
      if (!form.price) {
        return Alert.alert('Erreur', 'Veuillez indiquer le prix de vente');
      }
      const parsed = parseFloat(form.price);
      if (isNaN(parsed) || parsed <= 0) {
        return Alert.alert('Erreur', 'Le prix doit être supérieur à 0');
      }
      finalPrice = parsed;
    } else {
      finalDelivery = 'mains_propres';
    }

    try {
      setSaving(true);
      await updateBook(id, {
        title: form.title,
        author: form.author,
        description: form.description,
        genre: form.genre,
        state: form.state,
        offer_type: form.offerType,
        delivery: finalDelivery,
        price: finalPrice,
      });
      await fetchBook();
      setEditMode(false);
      setForm(null);
      Alert.alert('Succès', 'Livre mis à jour');
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer ce livre ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteBook(id);
              router.replace('/home');
            } catch (err) {
              Alert.alert('Erreur', err.message);
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="bg-primary h-full items-center justify-center">
        <ActivityIndicator size="large" color="#FF9C01" />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView className="bg-primary h-full items-center justify-center px-6">
        <Text className="text-5xl mb-4">📚</Text>
        <Text className="text-gray-100 text-center font-pmedium">Livre introuvable</Text>
        <CustomButton title="Retour" handlePress={() => router.back()} containerStyles="mt-6" />
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════════════════════════════════
  if (editMode && form) {
    return (
      <SafeAreaView className="bg-primary h-full">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={cancelEdit}>
              <Text className="text-gray-100 font-pmedium">Annuler</Text>
            </TouchableOpacity>
            <Text className="text-white text-lg font-pbold">Modifier</Text>
            <View style={{ width: 60 }} />
          </View>

          {(editImage || book.image) && (
            <Image
              source={{ uri: editImage || book.image }}
              className="w-full h-64 rounded-xl mb-4"
              resizeMode="cover"
            />
          )}

          <CustomButton
            title="Changer l'image (bientôt)"
            handlePress={() => Alert.alert('Info', "Le changement d'image arrive prochainement")}
            containerStyles="mb-4 opacity-50"
          />

          <FormField
            title="Titre *"
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
          />

          <FormField
            title="Auteur *"
            value={form.author}
            onChangeText={(text) => setForm({ ...form, author: text })}
            otherStyles="mt-6"
          />

          <ToggleGroup
            label="Genre *"
            options={GENRE_OPTIONS}
            selected={form.genre}
            onSelect={(val) => setForm({ ...form, genre: val })}
          />

          <ToggleGroup
            label="État du livre *"
            options={STATE_OPTIONS}
            selected={form.state}
            onSelect={(val) => setForm({ ...form, state: val })}
          />

          <ToggleGroup
            label="Type d'offre *"
            options={OFFER_OPTIONS}
            selected={form.offerType}
            onSelect={handleOfferChange}
          />

          {form.offerType && !isVente && (
            <View className="mt-6">
              <Text className="text-base text-gray-200 font-pmedium mb-3">Remise</Text>
              <View
                className="px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Text className="text-gray-100 font-pmedium text-sm">
                  🤝 Remise en mains propres uniquement
                </Text>
              </View>
            </View>
          )}

          {isVente && (
            <ToggleGroup
              label="Remise *"
              options={DELIVERY_OPTIONS}
              selected={form.delivery}
              onSelect={(val) => setForm({ ...form, delivery: val })}
            />
          )}

          {isVente && (
            <View className="mt-6">
              <Text className="text-base text-gray-200 font-pmedium mb-3">Prix *</Text>
              <View
                className="flex-row items-center px-4 rounded-xl"
                style={{
                  backgroundColor: '#232533',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                  height: 56,
                }}
              >
                <TextInput
                  value={form.price}
                  onChangeText={(text) => setForm({ ...form, price: cleanPrice(text) })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="rgba(205,205,224,0.4)"
                  className="flex-1 text-white font-pmedium"
                  style={{ fontSize: 16 }}
                />
                <Text className="text-secondary-100 font-pbold text-lg ml-2">€</Text>
              </View>
            </View>
          )}

          <FormField
            title="Description"
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
            otherStyles="mt-6"
            placeholder="Quelques mots sur le livre... (facultatif)"
            multiline
            numberOfLines={4}
          />

          <CustomButton
            title={saving ? 'Enregistrement...' : 'Enregistrer'}
            handlePress={handleSave}
            isLoading={saving}
            containerStyles="mt-8"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW MODE — redesign Vinted/Leboncoin
  // ═══════════════════════════════════════════════════════════════════════════
  const creatorName = book.creator?.username ?? '…';
  const city = book.city ?? book.creator?.city ?? '';
  const createdRelative = relativeDate(book.created_at);
  const creatorRole = CREATOR_ROLE_LABEL[book.offer_type] ?? 'Propriétaire';

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Top bar : back + owner actions */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <Text className="text-white text-lg">←</Text>
          </TouchableOpacity>

          {isOwner && (
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={enterEditMode}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,156,1,0.2)' }}
              >
                <Text style={{ fontSize: 16 }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Cover + heart en bas-droite sur l'image */}
        <View className="items-center px-6 mt-2">
          <View style={{ width: 220, height: 300, position: 'relative' }}>
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1E1E2D',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              {book.image ? (
                <Image source={{ uri: book.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text style={{ fontSize: 64 }}>📖</Text>
                </View>
              )}
            </View>

            {/* Heart button (visiteur uniquement) — style Vinted */}
            {!isOwner && user?.id && (
              <TouchableOpacity
                onPress={handleToggleWishlist}
                disabled={wishLoading}
                activeOpacity={0.8}
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {wishLoading ? (
                  <ActivityIndicator size="small" color="#FF9C01" />
                ) : (
                  <Text style={{ fontSize: 22 }}>{inWishlist ? '❤️' : '🤍'}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Infos principales — ordre Leboncoin : titre, auteur, prix, date/ville */}
        <View className="px-5 mt-6">
          <Text className="text-white text-2xl font-pbold" numberOfLines={3}>
            {book.title}
          </Text>
          <Text className="text-secondary-100 text-base font-pmedium mt-1">
            {book.author}
          </Text>

          {/* Prix gros si vente */}
          {isBookVente && book.price != null && (
            <Text className="text-secondary-100 font-pbold mt-3" style={{ fontSize: 26 }}>
              {book.price} €
            </Text>
          )}

          {/* Date + Ville */}
          <View className="flex-row items-center flex-wrap mt-3" style={{ gap: 8 }}>
            {createdRelative ? (
              <Text className="text-white font-plight text-xs" style={{ opacity: 0.7 }}>
                ajouté {createdRelative}
              </Text>
            ) : null}
            {createdRelative && city ? (
              <Text className="text-gray-100" style={{ opacity: 0.3, fontSize: 10 }}>●</Text>
            ) : null}
            {city ? (
              <Text className="text-gray-100 font-plight text-xs" style={{ opacity: 0.7 }}>
                📍 {city}
              </Text>
            ) : null}
          </View>

          {/* Badges */}
          <View className="flex-row flex-wrap gap-2 mt-4">
            {OFFER_LABELS[book.offer_type] && (
              <Badge label={OFFER_LABELS[book.offer_type]} accent="secondary" />
            )}
            {DELIVERY_LABELS[book.delivery] && (
              <Badge label={DELIVERY_LABELS[book.delivery]} accent="soft" />
            )}
            {STATE_LABELS[book.state] && (
              <Badge label={STATE_LABELS[book.state]} accent="neutral" />
            )}
          </View>

          {/* Section Créateur */}
          <View
            className="mt-6 pt-5"
            style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <Text
              className="font-pmedium mb-3"
              style={{ fontSize: 10, color: 'rgba(205,205,224,0.5)', letterSpacing: 0.5, textTransform: 'uppercase' }}
            >
              {creatorRole}
            </Text>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,156,1,0.25)' }}
              >
                <Text className="text-secondary-100 font-pbold" style={{ fontSize: 15 }}>
                  {creatorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text className="text-white font-pmedium text-sm">{creatorName}</Text>
                {book.creator?.city && (
                  <Text className="text-white font-plight text-xs" style={{ opacity: 0.5 }}>
                    📍 {book.creator.city}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Genre */}
          {book.genre && (
            <View
              className="mt-6 pt-5"
              style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <Text
                className="font-pmedium mb-2"
                style={{ fontSize: 10, color: 'rgba(205,205,224,0.5)', letterSpacing: 0.5, textTransform: 'uppercase' }}
              >
                Genre
              </Text>
              <Text className="text-white font-pmedium text-sm">
                {GENRE_LABELS[book.genre] ?? book.genre}
              </Text>
            </View>
          )}

          {/* Description */}
          {book.description ? (
            <View
              className="mt-6 pt-5"
              style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <Text
                className="font-pmedium mb-2"
                style={{ fontSize: 10, color: 'rgba(205,205,224,0.5)', letterSpacing: 0.5, textTransform: 'uppercase' }}
              >
                Description
              </Text>
              <Text className="text-white font-plight text-sm" style={{ lineHeight: 22 }}>
                {book.description}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Boutons d'action (non-owner) */}
        {!isOwner && (
          <View className="px-5 mt-8 flex-row" style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={() => Alert.alert('Bientôt disponible', 'La messagerie sera activée prochainement 💬')}
              activeOpacity={0.7}
              className="flex-1 rounded-xl py-4 items-center"
              style={{
                backgroundColor: 'rgba(255,156,1,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(255,156,1,0.35)',
              }}
            >
              <Text className="text-secondary-100 font-pbold text-sm">
               Contacter
              </Text>
            </TouchableOpacity>

            {isBookVente && (
              <TouchableOpacity
                onPress={() => Alert.alert('Bientôt disponible', "L'achat en ligne sera activé prochainement 🛒")}
                activeOpacity={0.85}
                className="flex-1 rounded-xl py-4 items-center"
                style={{ backgroundColor: '#FF9C01' }}
              >
                <Text className="text-primary font-pbold text-sm">
                  Acheter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}