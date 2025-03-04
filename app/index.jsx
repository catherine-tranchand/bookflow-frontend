import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View, Image} from 'react-native';
import nightbook from '../assets/gifs/nightbook.gif';
import CustomButton from '../components/CustomButton';
import { Redirect, router } from 'expo-router';





export default function Index() {

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
}

 

 