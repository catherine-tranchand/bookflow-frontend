import { View, Text, StatusBar, Image } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import logo1 from '../../assets/icons/logo1.png';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { Link } from 'expo-router';
import { router } from 'expo-router';
import { signIn, getCurrentUser } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';

export default function SignIn() {
    const { setUser, setIsLoggedIn } = useGlobalContext();
    const [form, setForm] = useState({
        email: '',
        password: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false)

    const submit = async () => {
           if (!form.email || !form.password) {
               Alert.alert('Error', 'All fields are required');
               return;
           }
           setIsSubmitting(true);
   
           try {
               await signIn(form.email, form.password);
               const currentUser = await getCurrentUser(); // ✅ manquait
               console.log("👤 currentUser:", JSON.stringify(currentUser));
                setUser(currentUser);
                setIsLoggedIn(true);                      
               router.replace('/home'); // Navigate after successful signup
           } catch (error) {
               Alert.alert('Error', error.message);
           } finally {
               setIsSubmitting(false);
           }
       };
   

    return (
        <SafeAreaView className="bg-primary h-full">
            <ScrollView keyboardShouldPersistTaps="handled">
                <View className="w-full justify-items-center min-h-[70vh] px-4 my-6">
                    <Image
                        source={logo1}
                        className="w-[115px] h-[70px] ml-0 mt-0 justify-start"
                        resizeMode='contain'
                    />
                    <Text className="text-2xl text-white text-semibold justify-center mt-5 font-psemibold ml-10">
                        Log in to BookFlow
                    </Text>

                    {/* Email Input */}
                    <FormField
                        title="Email"
                        value={form.email}
                        onChangeText={(text) => setForm({ ...form, email: text })} 
                        otherStyles="mt-7"
                        keyboardType="email-address"
                    />

                    {/* Password Input */}
                    <FormField
                        title="Password"
                        value={form.password}
                        onChangeText={(text) => setForm({ ...form, password: text })} 
                        otherStyles="mt-7"
                    />

                    <CustomButton 
                     title="Sign In"
                     handlePress={submit}
                     containerStyles="mt-7"
                     isLoading={isSubmitting}
                    
                    />

                <View className="justify-center pt-5 flex-row gap-2">
                    <Text className="text-lg text-gray-200 font-pregular">
                        Dont't have an account?

                    </Text>
                    <Link href="/sign-up"
                    className='text-lg font-psemibold text-secondary-200'
                    >Sign Up</Link>
                </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
