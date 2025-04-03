import React, { useEffect } from 'react';
import { useState } from 'react';
import { View, Text, FlatList, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import anna from  '../../assets/images/anna.jpg';
import logo1 from '../../assets/icons/logo1.png';
import SearchInput from '../../components/SearchInput';
import Newin from '../../components/Newin';
import EmptyState from '../../components/EmptyState';
import CustomButton from '../../components/CustomButton';
import { RefreshControl } from 'react-native';
import  useAppwrite  from '../../lib/useAppwrite';
import { getAllBooks } from '../../lib/appwrite';
import BookCard from '../../components/BookCard';

export default function Home() {

  const { data: books, refetch } = useAppwrite(getAllBooks);

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true);
    // re call books-> if any new books are added
    await refetch();
    setRefreshing(false);
  }


    return (
       <SafeAreaView className="bg-primary h-full">
        <FlatList 
          data={books}
          keyExtractor={(item) => item.$id} 
          renderItem={({ item }) => (
          <BookCard book={item} />
          )} 
          ListHeaderComponent={() => (
            <View className="my-6 px-4 space-y-6">
                <View className="justify-between items-start flex-row mb-6">
                    <View>
                        <Text className="font-pmedium text-sm text-gray-200">
                          Welcome back
                        </Text>
                        <Text className="text-2xl font-psemibold text-white">
                          CatTranchand  
                        </Text>
                    </View>
                    <View className="mt-1.5">
                        <Image 
                        source={logo1}
                        className="w-10 h-11"
                        resizeMode='contain'
                        

                        />
                     </View>

                </View>
            <View>
                <SearchInput />
                <View className="w-full flex-1 pt-5 pb-8">
                <Text className="text-gray-200 text-lg font-pregular mb-3 ">
                    Latest Books
                </Text>
                < Newin posts={[{ id: 1 }, { id: 2}, { id: 3}] ?? []} />
                </View>
            </View>

            </View>
    )}
        ListEmptyComponent={() =>( /* FlatList property  */
        <EmptyState 
        title="No books found"
        subtitle="Add a new book to get started"
        />
      )}

      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> }
   
    />
     </SafeAreaView>
    );
}

