import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';



export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffd33d',
        tabBarStyle: {
          backgroundColor: '#161622'
        }
      }}
    >

<Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      /> 
      <Tabs.Screen
        name="addbook"
        options={{
          title: 'Add Book',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={24} />
          ),
        }}
      />

      <Tabs.Screen 
        name="search"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarIcon: ({ color, focused}) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={24}/>
          )
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-sharp' : 'person-outline'} color={color} size={24}/>
          ),
        }}
      />
    </Tabs>
  );
}
