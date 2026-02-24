import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import CustomButton from '../../components/CustomButton';

const genres = [
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

export default function GenreSelection() {
  const { language, city } = useLocalSearchParams();
  const [selectedGenres, setSelectedGenres] = useState([]);

  const toggleGenre = (id) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    router.push({
      pathname: '/(auth)/sign-up',
      params: {
        language,
        city,
        genres: selectedGenres.join(','), // ex: "fantastique,classique,roman"
      },
    });
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full flex-1 px-4 justify-center items-center py-10">

          <Text className="text-3xl text-white font-pbold text-center">
            📚 Tes genres préférés ?
          </Text>
          <Text className="text-sm text-gray-100 mt-3 text-center font-pregular">
            Sélectionne un ou plusieurs genres
          </Text>

          {/* Genre grid */}
          <View className="flex-row flex-wrap justify-center gap-3 mt-10">
            {genres.map((genre) => {
              const isSelected = selectedGenres.includes(genre.id);
              return (
                <TouchableOpacity
                  key={genre.id}
                  onPress={() => toggleGenre(genre.id)}
                  className={`px-5 py-3 rounded-xl border ${
                    isSelected
                      ? 'bg-secondary-100 border-secondary-100'
                      : 'bg-black-200 border-gray-100'
                  }`}
                >
                  <Text className={`text-base font-pmedium ${
                    isSelected ? 'text-primary' : 'text-white'
                  }`}>
                    {genre.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <CustomButton
            title="Continue →"
            handlePress={handleContinue}
            containerStyles="w-full mt-12"
          />

          {/* Skip */}
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(auth)/sign-up',
              params: { language, city, genres: '' },
            })}
            className="mt-4"
          >
            <Text className="text-gray-100 font-pregular text-sm">
              Passer cette étape
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}