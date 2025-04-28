import React, { useState } from 'react';
import { View, Text, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { uploadImage, addBook } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';

export default function AddBook() {
  const { user } = useGlobalContext();

  const [form, setForm] = useState({
    title: '',
    author: '',
    description: ''
  });

  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
      aspect: [4, 3]
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.author || !form.description || !image) {
      return Alert.alert('Please fill all fields and choose an image');
    }

    try {
      setUploading(true);
      const fileId = await uploadImage(image);
      const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/67d18ae8001e30162f31/files/${fileId}/preview?project=67c721280013e7517446`;

    

      await addBook({
        title: form.title,
        author: form.author,
        description: form.description,
        image: imageUrl,
        creator: user.$id,
      });

      Alert.alert('Success', 'Book added successfully');
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-white text-2xl font-pbold mb-6">Add New Book</Text>

        <FormField
          title="Title"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
        />

        <FormField
          title="Author"
          value={form.author}
          onChangeText={(text) => setForm({ ...form, author: text })}
          otherStyles="mt-6"
        />

        <FormField
          title="Description"
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
          otherStyles="mt-6"
          multiline
          numberOfLines={4}
        />

        {/* Image Preview */}
        {image && (
          <Image source={{ uri: image }} className="w-full h-64 mt-6 rounded-xl" resizeMode="cover" />
        )}

        {/* Image Buttons */}
        <View className="flex-row justify-between mt-6">
          <CustomButton title="Choose from Library" handlePress={uploadImage} containerStyles="w-[48%]" />
          <CustomButton title="Take Photo" handlePress={takePhoto} containerStyles="w-[48%]" />
        </View>

        <CustomButton
          title={uploading ? 'Uploading...' : 'Add Book'}
          handlePress={handleSubmit}
          isLoading={uploading}
          containerStyles="mt-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
