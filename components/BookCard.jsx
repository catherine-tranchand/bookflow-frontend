import React, { Component } from 'react'
import { Text, View } from 'react-native'

const BookCard = ({ book }) => {
    const { title, thumbnail, description, author, creator } = book || {};
    const username = creator?.username || "Unknown User";
    const avatar = creator?.avatar || "default_avatar.png"; // Replace with a valid default image path
    return (
        <View className="flex-col items-center px-4 mb-14">
            <View className="flex-row gap-3 items-start">
                <View className="justify-center items-center flex-row flex-1">

                
                <View className="w-[46px] h-[46px] rounded-lg border border-secondary-100 justify-center items-center">

                </View>
                </View>

            </View>

            <Text className="text-2xl text-white">{title}</Text>
          
            <Text className="text-2xl text-white">{author}</Text>
       
        </View>
    );
}
export default BookCard
