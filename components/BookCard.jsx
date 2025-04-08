import React, { useState } from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import { getAllBooks, getCurrentUser, getAllUsers } from '../lib/appwrite';

const BookCard = ({ book }) => {
  const { title, author, creator, thumbnail } = book || {};
  const { username, avatar } = creator || {};


 

  const [showBook, setShowBook] = useState(false);


  return (
    <View className="bg-secondary-100 rounded-xl p-4 mb-4 mx-4"> 
      {/* Header Section */}
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 rounded-full overflow-hidden border border-secondary mr-3">
          <Image
            source={{ uri: avatar }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        <View className="flex-1">
          <Text className="text-white text-lg font-semibold" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-gray-300 text-sm" numberOfLines={1}>
            {author}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setShow(!show)}>
          <Image
            source={require('../assets/icons/menu.png')}
            className="w-5 h-5"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Thumbnail Section */}
      <TouchableOpacity onPress={() => {}} className="rounded-lg overflow-hidden">
        <Image
          source={{ uri: thumbnail }}
          className="w-full h-48 rounded-lg"
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Optional Expanded Section */}
      {showBook && (
        <View className="mt-2">
          <Text className="text-white text-sm">More actions here...</Text>
        </View>
      )}
    </View>
  );
};

export default BookCard;
