import React, { useState } from 'react';
import { View, Text, Alert, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Modal } from 'react-native';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
/*import { uploadImage, addBook } from '../../lib/appwrite';*/
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



const TYPE_OPTIONS = [
  { label: '🎁 Don', value: 'don' },
  { label: '🔄 Echange', value: 'echange' },
  { label: '💶 Vente', value: 'vente' },
  { label: '📮 Par la poste', value: 'poste' },
  { label: '🤝 Mains propres', value: 'mains_propres' },
];

const cleanText = (text) => text.replace(/[^a-zA-Zа-яА-ЯёЁ\s\-]/g, '');
const cleanAuthor = (text) => cleanText(text).split(' ').slice(0, 3).join(' ');

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
    type: [],
    city: user?.city ?? '', 
  });

  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [addedBook, setAddedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
    // ✅ Demande la permission caméra
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre iPhone.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ 
      allowsEditing: true, 
      quality: 1 
    });
    
    if (!result.canceled) setImage(result.assets[0].uri);
};

  const handleSubmit = async () => {
  if (!form.title || !form.author || !form.genre || !form.state || form.type.length === 0) {
    return Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
  }
  const authorWords = form.author.trim().split(' ').filter(Boolean);
  if (authorWords.length < 2) {
    return Alert.alert('Erreur', "Veuillez entrer le prénom et le nom\nEx: Лев Толстой");
  }
  try {
    setUploading(true);
    /*const imageUrl = image ? await uploadImage(image) : null; -> appwrite*/
    const newBook = await addBook({
      title: form.title,
      author: form.author,
      description: form.description,
      /*image: imageUrl* -appwite), */
      imageUri: image,
      userId: user.id,
      /*creator: user.$id, -> appwrite*/
      genre: form.genre,
      state: form.state,
      type: /*form.type.join(','), -> appwrite*/ form.type,
      city: form.city,
    });
    setAddedBook(newBook);  // ✅ sauvegarde le livre créé
    setShowModal(true);     // ✅ affiche le modal

    // ✅ Reset du formulaire
   
    setForm({ title: '', author: '', description: '', genre: '', state: '', type: [], city: user?.city ?? '' });
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
      label="Etat du livre *"
      options={STATE_OPTIONS}
      selected={form.state}
      onSelect={(val) => setForm({ ...form, state: val })}
    />

     
        <ToggleGroup
          label="Type d'offre * (plusieurs choix possibles)"
          options={TYPE_OPTIONS}
          selected={form.type}
          onSelect={(val) => setForm({ ...form, type: val })}
          multi={true}
        />

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
      
      {/* Check icon */}
      <View className="items-center mb-6">
        <View className="w-16 h-16 rounded-full bg-secondary-100 items-center justify-center mb-3">
          <Text className="text-3xl">✅</Text>
        </View>
        <Text className="text-white text-xl font-pbold text-center">
          Livre ajouté !
        </Text>
      </View>

      {/* Recap du livre */}
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
          <View className="flex-row gap-2 mt-3">
            <View className="bg-black-200 px-3 py-1 rounded-full">
              <Text className="text-gray-100 text-xs font-pmedium">{addedBook.genre}</Text>
            </View>
            <View className="bg-black-200 px-3 py-1 rounded-full">
              <Text className="text-gray-100 text-xs font-pmedium">{addedBook.state}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Boutons */}
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