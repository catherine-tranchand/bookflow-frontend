import React, { useState } from 'react';
import { View, Text, Alert, Image, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Modal } from 'react-native';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { addBook } from '../../lib/supabase';
import { useGlobalContext } from '../../context/GlobalProvider';
import AutocompleteField from '../../components/AutocompleteField';

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

const cleanText = (text) => text.replace(/[^a-zA-Zа-яА-ЯёЁ\s\-]/g, '');
const cleanAuthor = (text) => cleanText(text).split(' ').slice(0, 3).join(' ');
const cleanPrice = (text) => text.replace(/[^0-9.,]/g, '').replace(',', '.');

const ToggleGroup = ({ label, options, selected, onSelect, multi = false }) => {
  const handlePress = (value) => {
    if (multi) {
      const current = Array.isArray(selected) ? selected : [];
      onSelect(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
    } else {
      onSelect(value === selected ? '' : value);
    }
  };

  const isSelected = (value) =>
    multi ? (Array.isArray(selected) && selected.includes(value)) : selected === value;

  return (
    <View className="mt-6">
      <Text className="text-base text-gray-200 font-pmedium mb-3">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => handlePress(option.value)}
            className={`px-4 py-2 rounded-xl border ${
              isSelected(option.value)
                ? 'bg-secondary-100 border-secondary-100'
                : 'bg-black-200 border-gray-100'
            }`}
          >
            <Text className={`text-sm font-pmedium ${isSelected(option.value) ? 'text-primary' : 'text-white'}`}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function AddBook() {
  const { user } = useGlobalContext();

  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    state: '',
    offerType: '',
    delivery: '',
    price: '',
    city: user?.city ?? '',
  });

  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [addedBook, setAddedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const isVente = form.offerType === 'vente';

  // Quand on change le type d'offre, on reset delivery/price selon la règle métier
  const handleOfferChange = (val) => {
    setForm((prev) => {
      const next = { ...prev, offerType: val };
      if (val === 'don' || val === 'echange') {
        next.delivery = 'mains_propres';
        next.price = '';
      } else if (val === 'vente') {
        // Si on passe à vente, on laisse delivery vide pour forcer le choix
        next.delivery = '';
      } else {
        next.delivery = '';
        next.price = '';
      }
      return next;
    });
  };

  const pickImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
      aspect: [3, 4],
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre iPhone.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    // Champs de base
    if (!form.title || !form.author || !form.genre || !form.state || !form.offerType) {
      return Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
    }

    const authorWords = form.author.trim().split(' ').filter(Boolean);
    if (authorWords.length < 2) {
      return Alert.alert('Erreur', "Veuillez entrer le prénom et le nom\nEx: Лев Толстой");
    }

    // Validation spécifique à la vente
    let finalPrice = null;
    let finalDelivery = form.delivery;

    if (isVente) {
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
      // Don ou échange → forcé mains propres, pas de prix
      finalDelivery = 'mains_propres';
    }

    try {
      setUploading(true);
      const newBook = await addBook({
        title: form.title,
        author: form.author,
        description: form.description,
        imageUri: image,
        userId: user.id,
        genre: form.genre,
        state: form.state,
        offerType: form.offerType,
        delivery: finalDelivery,
        price: finalPrice,
        city: form.city,
      });
      setAddedBook(newBook);
      setShowModal(true);

      setForm({
        title: '', author: '', description: '',
        genre: '', state: '',
        offerType: '', delivery: '', price: '',
        city: user?.city ?? '',
      });
      setImage(null);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text className="text-white text-2xl font-pbold mb-6">Ajouter un livre</Text>

        <AutocompleteField
          title="Titre *"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: cleanText(text) })}
          onSelectBook={(book) => setForm({ ...form, title: book.title, author: book.author })}
          searchType="title"
          placeholder="например: Анна Каренина"
        />

        <AutocompleteField
          title="Auteur *"
          value={form.author}
          onChangeText={(text) => setForm({ ...form, author: cleanAuthor(text) })}
          onSelectBook={(book) => setForm({ ...form, author: book.author })}
          searchType="author"
          otherStyles="mt-6"
          placeholder="например: Лев Толстой"
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

        {/* Type d'offre */}
        <ToggleGroup
          label="Type d'offre *"
          options={OFFER_OPTIONS}
          selected={form.offerType}
          onSelect={handleOfferChange}
        />

        {/* Remise : affichée uniquement si offre choisie */}
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

        {/* Prix : uniquement si vente */}
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
                className="flex-1 text-white font-pmedium text-base"
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

        {image && (
          <Image source={{ uri: image }} className="w-full h-64 mt-6 rounded-xl" resizeMode="cover" />
        )}

        <View className="flex-row justify-between mt-6 gap-3">
          <CustomButton title="Galerie" handlePress={pickImageFromLibrary} containerStyles="flex-1" />
          <CustomButton title="Photo" handlePress={takePhoto} containerStyles="flex-1" />
        </View>

        <CustomButton
          title={uploading ? 'Envoi en cours...' : 'Ajouter le livre'}
          handlePress={handleSubmit}
          isLoading={uploading}
          containerStyles="mt-8"
        />
      </ScrollView>

      {/* Modal confirmation */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-black-200 rounded-t-3xl px-6 pt-8 pb-10">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-secondary-100 items-center justify-center mb-3">
                <Text className="text-3xl">✅</Text>
              </View>
              <Text className="text-white text-xl font-pbold text-center">
                Livre ajouté !
              </Text>
            </View>

            {addedBook && (
              <View className="bg-primary rounded-2xl p-4 mb-6">
                {addedBook.image && (
                  <Image
                    source={{ uri: addedBook.image }}
                    className="w-full h-40 rounded-xl mb-4"
                    resizeMode="cover"
                  />
                )}
                <Text className="text-white font-pbold text-lg" numberOfLines={2}>
                  {addedBook.title}
                </Text>
                <Text className="text-secondary-100 font-pmedium text-sm mt-1">
                  {addedBook.author}
                </Text>
                <View className="flex-row gap-2 mt-3 flex-wrap">
                  <View className="bg-black-200 px-3 py-1 rounded-full">
                    <Text className="text-gray-100 text-xs font-pmedium">{addedBook.genre}</Text>
                  </View>
                  <View className="bg-black-200 px-3 py-1 rounded-full">
                    <Text className="text-gray-100 text-xs font-pmedium">{addedBook.state}</Text>
                  </View>
                  {addedBook.offer_type === 'vente' && addedBook.price != null && (
                    <View className="bg-secondary-100 px-3 py-1 rounded-full">
                      <Text className="text-primary text-xs font-pbold">
                        {addedBook.price} €
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <CustomButton
              title="Voir mon profil 👤"
              handlePress={() => { setShowModal(false); router.replace('/profile'); }}
              containerStyles="mb-3"
            />
            <CustomButton
              title="Retour à l'accueil 🏠"
              handlePress={() => { setShowModal(false); router.replace('/home'); }}
              containerStyles="bg-black-100"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}