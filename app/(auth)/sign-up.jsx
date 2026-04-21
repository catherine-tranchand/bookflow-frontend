import { View, Text, Image, Alert } from 'react-native';
import { React,  useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { router, useLocalSearchParams, Link } from 'expo-router';
import logo1 from '../../assets/icons/logo1.png';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { createUser } from '../../lib/supabase';
import { useGlobalContext } from '../../context/GlobalProvider';

export default function SignUp() {
    const { language, city, genres } = useLocalSearchParams();
    const genresArray = genres ? genres.split(',').filter(Boolean) : [];
    const { setUser, setIsLoggedIn } = useGlobalContext();


    const [form, setForm] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async () => {
        if (!form.username || !form.email || !form.password) {
            Alert.alert('Error', 'All fields are required');
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await createUser({
                username: form.username,
                email: form.email,
                password: form.password,
                city,
                language,
                genres: genresArray,
            });
            setUser(result);
            setIsLoggedIn(true);
            router.replace('/home');
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
                        Sign up to BookFlow
                    </Text>

                    {/* Recap langue + ville*/}
                    {(language || city ) && (
                         <View className="flex-row gap-2 mt-3">
                            {language && (
                                <View className="bg-black-200 px-3 py-1 rounded-full">
                                    <Text className="text-secondary-100 font-pmedium text-sm">
                                        {language === 'fr' ? '🇫🇷 Français' : language === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
                                    </Text>
                                </View>
                            )}
                            {city && (
                                <View className="bg-black-200 px-3 py-1 rounded-full">
                                    <Text className="text-secondary-100 font-pmedium text-sm">
                                        📍 {city}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                    
                
                    {/* Username Input */}
                    <FormField
                        title="Username"
                        value={form.username} // Fixed typo
                        onChangeText={(text) => setForm({ ...form, username: text })} // Fixed update
                        otherStyles="mt-10"
                    />

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
                        title="Sign Up"
                        handlePress={submit}
                        containerStyles="mt-7"
                        isLoading={isSubmitting}
                    />

                    <View className="justify-center pt-5 flex-row gap-2">
                        <Text className="text-lg text-gray-200 font-pregular">
                            Have an account already?
                        </Text>
                        <Link href="/sign-in" className='text-lg font-psemibold text-secondary-200'>
                            Sign in
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

