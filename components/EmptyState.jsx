import { Text, View, Image } from 'react-native';
import React from 'react';
import nightbook from '../assets/gifs/nightbook.gif';
import CustomButton from '../components/CustomButton';
import { router } from 'expo-router';


export default function EmptyState({ title, subtitle }) {
    return (
        <View className="justufy-center items-center">
            <Image 
            marginTop={20}
            source={nightbook}
            className="w-[270px] h-[200px]"
            resizeMode='contain'
            borderRadius={25}
            />
        <Text className="font-pmedium text-sm text-gray-200 mt-10">
                {subtitle}
            </Text>
        <Text className="text-xl text-center mt-2 font-psemibold text-white">
                {title}
        </Text>

        <CustomButton 
        title="Add a book"
        handrePress={() => router.push('/addbook')}
        containerStyles="w-full my-5"

        />

        </View>
    )}
    