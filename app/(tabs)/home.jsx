import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import logo1 from '../../assets/icons/logo1.png';
import SearchInput from '../../components/SearchInput';
import Newin from '../../components/Newin';
import EmptyState from '../../components/EmptyState';
import CustomButton from '../../components/CustomButton';
import useAppwrite from '../../lib/useAppwrite';
import { getAllBooks, logout } from '../../lib/appwrite';
import BookCard from '../../components/bookCard';

export default function Home() {
  const { data: books, refetch } = useAppwrite(getAllBooks);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const userName = books && books[0] ? books[0].creator?.username : 'User';

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={books}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => <BookCard book={item} />}
        ListHeaderComponent={() => (
          <View className="my-6 px-4 space-y-6">
            <View className="justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-gray-200">
                  Welcome back
                </Text>
                <Text className="text-2xl font-psemibold text-white">
                  {userName}
                </Text>
              </View>
              <View className="mt-1.5">
                <Image source={logo1} className="w-10 h-11" resizeMode="contain" />
              </View>
            </View>

            <SearchInput />

            <View className="w-full flex-1 pt-5 pb-2">
              <Text className="text-gray-200 text-lg font-pregular mb-3">
                Latest Books
              </Text>
              <Newin />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState title="No books found" subtitle="Add a new book to get started" />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <View className="px-4 mb-6">
        <CustomButton
          title="Log out"
          handlePress={async () => {
            const isLoggedOut = await logout();
            if (isLoggedOut) {
              router.replace('/'); // Go back to the index page
            }
          }}
          containerStyles="bg-red-500 mt-5"
        />
      </View>
    </SafeAreaView>
  );
}

