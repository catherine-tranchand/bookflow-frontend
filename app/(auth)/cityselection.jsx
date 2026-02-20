import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import CustomButton from '../../components/CustomButton';

const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux', 'Strasbourg'];

export default function CitySelection() {
  const { language } = useLocalSearchParams();
  const [city, setCity] = useState(null);

  const handleContinue = () => {
    if (!city) {
      Alert.alert('Please select a city to continue.');
      return;
    }

    // Save the city and proceed to the next step (e.g., sign-up)
    router.push({
      pathname: '/(auth)/sign-up',
      params: { language, city },
    });
  };

  return (

     <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full flex-1 px-4 justify-center items-center py-10">

          <Text className="text-3xl text-white font-pbold text-center">
            📍 Where are you?
          </Text>
          <Text className="text-base text-gray-100 mt-3 text-center font-pregular">
            This helps connect you with readers nearby
          </Text>

          {/* City grid */}
          <View className="flex-row flex-wrap justify-center gap-3 mt-10">
            {cities.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCity(c)}
                className={`px-5 py-3 rounded-xl border ${
                  city === c
                    ? 'bg-secondary-100 border-secondary-100'
                    : 'bg-black-200 border-gray-100'
                }`}
              >
                <Text className={`text-base font-pmedium ${city === c ? 'text-primary' : 'text-white'}`}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <CustomButton
            title="Continue →"
            handlePress={handleContinue}
            containerStyles="w-full mt-12"
          />
   
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

