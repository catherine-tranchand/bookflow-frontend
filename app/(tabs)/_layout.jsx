// app/(tabs)/_layout.jsx
import React from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useUnreadCount } from '../../hooks/useUnreadCount';

// ─── Badge component pour le tab Messages ────────────────────────────────────
function MessagesTabIcon({ color, focused, unreadCount }) {
  return (
    <View>
      <Ionicons
        name={focused ? 'chatbubble' : 'chatbubble-outline'}
        color={color}
        size={24}
      />
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -8,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#FF9C01',
            paddingHorizontal: 5,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: '#161622',
          }}
        >
          <Text
            style={{
              color: '#161622',
              fontSize: 10,
              fontFamily: 'Poppins-Bold',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { user } = useGlobalContext();
  const { count: unreadCount } = useUnreadCount(user?.id, 5000);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffd33d',
        tabBarStyle: {
          backgroundColor: '#161622',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home-sharp' : 'home-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      {/* ✨ NOUVEAU TAB MESSAGES */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <MessagesTabIcon
              color={color}
              focused={focused}
              unreadCount={unreadCount}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="addbook"
        options={{
          title: 'Add Book',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person-sharp' : 'person-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
