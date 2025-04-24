 {/*import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View, Image} from 'react-native';
import nightbook from '../assets/gifs/nightbook.gif';
import CustomButton from '../components/CustomButton';
import { Redirect, router } from 'expo-router';
import 'react-native-url-polyfill/auto';
import { useGlobalContext } from '../context/GlobalProvider';





export default function Index() {

  const { isLoading, isLoggedIn } = useGlobalContext();
  

  if (!isLoading && isLoggedIn) {
    return <Redirect href="/home" />
  } 

  const nightbook = require('../assets/gifs/nightbook.gif');
  const logo = require('../assets/icons/logo1.png');
  const fallingBooks = require('../assets/gifs/books.gif');


  return (

    <SafeAreaView className="bg-primary h-full">

      <ScrollView contentContainerStyle={{height: '100%'}}>
      <View className="w-full h-[85vh] px-4 justify-center items-center">
     
     
        <Image
         source={fallingBooks}
         className="w-[200px] h-[150px]"
         resizeMode='contain'
         />
       <View className="relative mt-5">
     
        <Text className="text-3xl text-white font-bold text-center">Welcome to</Text>
     
        <Text className="text-2xl text-secondary-200 font-bold italic">BookFlow
         </Text>
       </View>
       <Text className="text-m font-pregular text-gray-50 mt-7 text-center">The best place to find and share  

       </Text>
       <Text className="text-m font-pregular text-gray-50 mt-2 text- ">your favorite books

       </Text>

     <CustomButton 
     title="Continue with email"
     handlePress={() => router.push('/sign-in')}
     containerStyles="w-full mt-7"
     />
       </View>
      </ScrollView>
      <StatusBar backgroundColor='#161622' style='light'/>
    </SafeAreaView>
  
  );
} */}

import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View, Image, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useGlobalContext } from '../context/GlobalProvider';
import CustomButton from '../components/CustomButton';

const languages = [
  { code: 'fr', label: 'Français 🇫🇷' },
  { code: 'ru', label: 'Русский 🇷🇺' },
  { code: 'en', label: 'English 🇬🇧' },
];

const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice']; // Add more if needed

export default function Index() {
  const { isLoading, isLoggedIn, setIsLoggedIn } = useGlobalContext();
  const [language, setLanguage] = useState(null);

  useEffect(() => {
    // If already logged in, navigate to home page
    if (!isLoading && isLoggedIn) {
      router.replace('/home'); // Navigate to the home page if logged in
    }
  }, [isLoading, isLoggedIn]);

  const handleContinue = () => {
    if (!language) {
      Alert.alert('Please select language to continue');
      return;
    }

    // Navigate to the onboarding screen with the selected language
    router.push({
      pathname: '(auth)/cityselection',
      params: { language },
    });
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View className="w-full h-[85vh] px-4 justify-center items-center">
          <Image
            source={require('../assets/gifs/books.gif')}
            className="w-[200px] h-[150px]"
            resizeMode="contain"
          />

          <View className="mt-5">
            <Text className="text-3xl text-white font-bold text-center">Welcome to</Text>
            <Text className="text-2xl text-secondary-200 font-bold italic text-center">BookFlow</Text>
          </View>

          <Text className="text-m font-pregular text-gray-50 mt-7 text-center">
            The best place to find and
          </Text>
          <Text className="text-m font-pregular text-gray-50 mt-2 text-center">
            share your favorite books in Russian
          </Text>

          {/* Language Selector */}
          <View className="w-full mt-20">
            <View className="flex-row justify-center">
              <Text className="text-white font-bold text-xl mb-2 justify-center justify-items-center">New in? </Text>
              <Text className="text-white text-lg mb-2 justify-center justify-items-center">Select Language:</Text>
            </View>

            <View className="flex-row w-50% h-50% mb-20 justify-center items-center gap-4">
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  className={`p-3 rounded-xl mb-2 space-y-5 ${language === lang.code ? 'bg-secondary' : 'bg-secondary-100'}`}
                  onPress={() => setLanguage(lang.code)}
                >
                  <Text className="text-white text-center">{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Continue Button */}
          <CustomButton
            title="Continue"
            handlePress={handleContinue}
            containerStyles="w-full mt-6"
          />

          {/* Sign-in Button */}
          <CustomButton
            title="Sign In"
            handlePress={() => router.push('/sign-in')}
            containerStyles="w-full mt-6"
          />
        </View>
      </ScrollView>

      <StatusBar backgroundColor="#161622" style="light" />
    </SafeAreaView>
  );
}
