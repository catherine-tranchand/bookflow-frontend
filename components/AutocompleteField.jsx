import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';

export default function AutocompleteField({ title, value, onChangeText, onSelectBook, otherStyles, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timer = useRef(null);

  const searchBooks = async (query) => {
    if (!query || query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=6&fields=title,author_name,first_publish_year`
      );
      const data = await response.json();
      const results = (data.docs || [])
        .filter((b) => b.title && b.author_name)
        .map((b) => ({ title: b.title, author: b.author_name?.[0] || '', year: b.first_publish_year || '' }));
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.log('Autocomplete error:', error.message);
      setSuggestions([]);
    } finally { setIsLoading(false); }
  };

  const handleChange = (text) => {
    onChangeText(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => searchBooks(text), 400);
  };

  const handleSelect = (book) => {
    onSelectBook(book);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View className={`${otherStyles}`}>
      <Text className="text-base text-gray-200 font-pmedium mb-2">{title}</Text>
      <View className="border-2 border-black-200 w-full h-16 px-4 bg-black-200 rounded-2xl flex-row items-center">
        <TextInput
          className="flex-1 text-white font-psemibold text-base"
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#7b7b8b"
          onChangeText={handleChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {isLoading && <ActivityIndicator size="small" color="#FF9C01" />}
      </View>
      {showSuggestions && (
        <View className="bg-black-200 rounded-2xl border border-gray-100 mt-1 overflow-hidden">
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.title}-${index}`}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                className={`px-4 py-3 ${index < suggestions.length - 1 ? 'border-b border-black-100' : ''}`}
              >
                <Text className="text-white font-pmedium text-sm" numberOfLines={1}>{item.title}</Text>
                <Text className="text-secondary-100 font-pregular text-xs mt-0.5">
                  {item.author}{item.year ? ` · ${item.year}` : ''}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={() => setShowSuggestions(false)} className="px-4 py-2 border-t border-black-100 items-center">
            <Text className="text-gray-100 font-pregular text-xs">Fermer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}