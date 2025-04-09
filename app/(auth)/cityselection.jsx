import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import CustomButton from '../../components/CustomButton';

const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'];

export default function CitySelection() {
  const router = useRouter();
  const { language } = router.query;
  const [city, setCity] = useState(null);

  const handleContinue = () => {
    if (!city) {
      Alert.alert('Please select a city to continue.');
      return;
    }

    // Save the city and proceed to the next step (e.g., sign-up)
    router.push({
      pathname: '/sign-up',
      params: { language, city },
    });
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View className="w-full h-[85vh] px-4 justify-center items-center">
          <Text className="text-3xl text-white font-bold text-center">Choose Your City</Text>
          <Text className="text-lg text-white mt-4 text-center">Select Your City:</Text>

          <View className="flex-row justify-center justify-items-center gap-4 mt-6">
            {cities.map((c) => (
              <TouchableOpacity
                key={c}
                className={`p-3 rounded-xl mb-2 ${city === c ? 'bg-secondary' : 'bg-secondary-100'}`}
                onPress={() => setCity(c)}
              >
                <Text className="text-white text-center">{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Continue Button */}
          <CustomButton
            title="Continue"
            handlePress={handleContinue}
            containerStyles="w-full mt-6"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

