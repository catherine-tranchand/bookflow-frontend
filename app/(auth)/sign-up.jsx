import { View, Text, StatusBar, Image } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import logo1 from '../../assets/icons/logo1.png';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { Link } from 'expo-router';

export default function SignUp() {
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false)

    const submit = () => {

    }

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

                     {/* Usename Input */}
                     <FormField
                        title="Username"
                        value={form.usernamel}
                        onChangeText={(text) => setForm({ ...form, email: text })} 
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
                    <Link href="/sign-in"
                    className='text-lg font-psemibold text-secondary-200'
                    >Sign in</Link>
                </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
