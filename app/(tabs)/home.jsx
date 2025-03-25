import React from 'react';
import { View, Text, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
    return (
       <SafeAreaView className="bg-primary ">
        <FlatList 
          data={[{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]}
          keyExtractor={(item) => item.$id} 
          renderItem={({ item }) => (
            <Text className="text-3xl text-white">{item.id}</Text>
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
                        />

                    </View>
                </View>

            </View>
    )}
        />
     </SafeAreaView>
    );
}

