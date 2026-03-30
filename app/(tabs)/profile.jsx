import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import { logout, updateUser, getUserBooks } from '../../lib/appwrite';
import { router, useFocusEffect } from 'expo-router';
import useAppwrite from '../../lib/useAppwrite';
import { useCallback } from 'react';

const GENRES = [
  { id: 'fantastique', label: '🧙 Fantastique' },
  { id: 'classique', label: '📜 Classique' },
  { id: 'roman', label: '💬 Roman' },
  { id: 'policier', label: '🔍 Policier' },
  { id: 'sf', label: '🚀 Science-Fiction' },
  { id: 'histoire', label: '🏛️ Histoire' },
  { id: 'biographie', label: '👤 Biographie' },
  { id: 'jeunesse', label: '🌟 Jeunesse' },
  { id: 'psychologie', label: '🧠 Psychologie' },
];

const LANGUAGE_LABELS = {
  fr: '🇫🇷 Français',
  ru: '🇷🇺 Русский',
  en: '🇬🇧 English',
};

export default function Profile() {
  const { user, setUser, setIsLoggedIn } = useGlobalContext();

  // Parse genres from string "fantastique,classique" → array
  const userGenres = user?.genres ? user.genres.split(',').filter(Boolean) : [];

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [wishlist, setWishlist] = useState(user?.wishlist || '');
  const [selectedGenres, setSelectedGenres] = useState(userGenres);
  const { data: myBooks, refetch } = useAppwrite(() => getUserBooks(user.$id));

useFocusEffect(
  useCallback(() => { refetch(); }, [])
);  // re-fetch les livres et les mettre à jour

  const toggleGenre = (id) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
        const updated = await updateUser(user.$id, {
            bio,
            wishlist,
            genres: selectedGenres.join(','),
        });
        console.log("✅ Updated user:", updated.genres);
        setUser({ ...user, ...updated });
        setIsEditing(false);
        Alert.alert('✅ Profil mis à jour !');
    } catch (error) {
        Alert.alert('Erreur', error.message);
    }
};

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      setUser(null);
      setIsLoggedIn(false);
      router.replace('/');
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-4 py-6">

          {/* ── Header ── */}
          <View className="items-center mb-6">
            {/* Avatar */}
            <View className="w-24 h-24 rounded-full bg-secondary-100 items-center justify-center mb-3">
              {user?.avatar && user.avatar.startsWith('http') ? (
                <Image
                  source={{ uri: user.avatar }}
                  className="w-24 h-24 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-4xl font-pbold text-primary">
                  {user?.username?.charAt(0).toUpperCase() || '?'}
                </Text>
              )}
            </View>
            <Text className="text-2xl font-pbold text-white">{user?.username}</Text>
            <Text className="text-sm text-gray-100 font-pregular mt-1">{user?.email}</Text>

            {/* Badges ville + langue */}
            <View className="flex-row gap-2 mt-3">
              {user?.city && (
                <View className="bg-black-200 px-3 py-1 rounded-full">
                  <Text className="text-secondary-100 font-pmedium text-sm">📍 {user.city}</Text>
                </View>
              )}
              {user?.language && (
                <View className="bg-black-200 px-3 py-1 rounded-full">
                  <Text className="text-secondary-100 font-pmedium text-sm">
                    {LANGUAGE_LABELS[user.language] || user.language}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Edit / Save button ── */}
          <TouchableOpacity
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
            className="bg-secondary-100 rounded-xl py-3 mb-6 items-center"
          >
            <Text className="text-primary font-psemibold text-base">
              {isEditing ? '✅ Sauvegarder' : '✏️ Modifier le profil'}
            </Text>
          </TouchableOpacity>

          {/* ── Genres préférés ── */}
          <View className="mb-6">
            <Text className="text-white font-psemibold text-lg mb-3">📚 Genres préférés</Text>
            <View className="flex-row flex-wrap gap-2">
              {GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre.id);
                const isUserGenre = userGenres.includes(genre.id);

                // En mode lecture, afficher seulement les genres sélectionnés
                if (!isEditing && !isUserGenre) return null;

                return (
                  <TouchableOpacity
                    key={genre.id}
                    onPress={() => isEditing && toggleGenre(genre.id)}
                    className={`px-4 py-2 rounded-xl border ${
                      isSelected
                        ? 'bg-secondary-100 border-secondary-100'
                        : 'bg-black-200 border-gray-100'
                    }`}
                  >
                    <Text className={`text-sm font-pmedium ${
                      isSelected ? 'text-primary' : 'text-white'
                    }`}>
                      {genre.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {!isEditing && userGenres.length === 0 && (
                <Text className="text-gray-100 font-pregular text-sm italic">
                  Aucun genre sélectionné
                </Text>
              )}
            </View>
          </View>

          {/* ── Bio ── */}
          <View className="mb-6">
            <Text className="text-white font-psemibold text-lg mb-3">🖊️ Bio</Text>
            {isEditing ? (
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Parle de toi... (facultatif)"
                placeholderTextColor="#CDCDE0"
                multiline
                numberOfLines={4}
                className="bg-black-200 text-white font-pregular p-4 rounded-xl border border-gray-100"
                style={{ textAlignVertical: 'top' }}
              />
            ) : (
              <Text className="text-white font-pregular text-sm">
                {bio || <Text className="italic">Aucune bio renseignée</Text>}
              </Text>
            )}
          </View>

          {/* ── Wishlist ── */}
          <View className="mb-6">
            <Text className="text-white font-psemibold text-lg mb-3">🔖 Livres à lire</Text>
            {isEditing ? (
              <TextInput
                value={wishlist}
                onChangeText={setWishlist}
                placeholder="Ex: Crime et Châtiment, Le Maître et Marguerite..."
                placeholderTextColor="#CDCDE0"
                multiline
                numberOfLines={3}
                className="bg-black-200 text-white font-pregular p-4 rounded-xl border border-gray-100"
                style={{ textAlignVertical: 'top' }}
              />
            ) : (
              <Text className="text-white font-pregular text-sm">
                {wishlist || <Text className="italic">Aucun livre dans la wishlist</Text>}
              </Text>
            )}
          </View>

 {/* ── MyBooks ── */}

<View className="mb-6">
  <View className="flex-row justify-between items-center mb-3">
    <Text className="text-white font-psemibold text-lg">📖 Mes livres</Text>
    <TouchableOpacity onPress={() => router.push('/(tabs)/add-book')}>
      <Text className="text-secondary-100 font-pmedium text-sm">+ Ajouter</Text>
    </TouchableOpacity>
  </View>

  {myBooks && myBooks.length > 0 ? (
    <View className="flex-row flex-wrap gap-3">
      {myBooks.map((book) => (
        <TouchableOpacity key={book.$id} className="bg-black-200 rounded-2xl overflow-hidden" style={{ width: '47%' }}>
          {book.image ? (
            <Image source={{ uri: book.image }} className="w-full h-36" resizeMode="cover" />
          ) : (
            <View className="w-full h-36 bg-black-100 items-center justify-center">
              <Text className="text-4xl">📚</Text>
            </View>
          )}
          <View className="p-3">
            <Text className="text-white font-pmedium text-sm" numberOfLines={2}>{book.title}</Text>
            <Text className="text-secondary-100 font-pregular text-xs mt-1">{book.author}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  ) : (
    <View className="bg-black-200 rounded-2xl p-6 items-center">
      <Text className="text-4xl mb-2">📭</Text>
      <Text className="text-white font-pmedium text-center">Tu n'as pas encore ajouté de livres</Text>
      <TouchableOpacity onPress={() => router.push('/(tabs)/add-book')} className="bg-secondary-100 px-6 py-2 rounded-xl mt-4">
        <Text className="text-primary font-psemibold">Ajouter un livre</Text>
      </TouchableOpacity>
    </View>
  )}
</View>

          {/* ── Logout ── */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-black-200 border border-red-500 rounded-xl py-3 items-center mt-4"
          >
            <Text className="text-red-500 font-psemibold text-base">🚪 Se déconnecter</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}