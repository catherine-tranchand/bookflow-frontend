import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';

export default function FormField({ 
  title, 
  value, 
  placeholder, 
  onChangeText, 
  otherStyles, 
  fieldType = "text", // "text" by default
  options = [],       // array of options for pickers
  ...props 
}) {
  const [shownPassword, setShownPassword] = useState(false);

  const eye = require("../assets/icons/eye.png");
  const eyehide = require("../assets/icons/eyehide.png");

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text className="text-base text-gray-200 font-pmedium">{title}</Text>

      <View className="border-2 border-black-200 w-full h-16 px-4 bg-black-200 rounded-2xl flex-row items-center justify-between">
        
        {/* Only ONE of these two renders */}
        {fieldType === "text" ? (
          <>
            <TextInput
              className="flex-1 text-white font-psemibold text-base"
              value={value}
              placeholder={placeholder}
              placeholderTextColor="#7b7b8b"
              onChangeText={onChangeText}  
              secureTextEntry={title === 'Password' && !shownPassword}
              {...props}
            />
            {title === 'Password' && (
              <TouchableOpacity onPress={() => setShownPassword(!shownPassword)}>
                <Image source={!shownPassword ? eye : eyehide} className="w-6 h-6" resizeMode="contain" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Picker
            selectedValue={value}
            onValueChange={onChangeText}
            style={{ 
              flex: 1, 
              color: 'white', 
              backgroundColor: 'transparent',
            }}
            dropdownIconColor="white"
          >
            <Picker.Item label="Select option..." value="" color="gray" />
            {options.map((option) => (
              <Picker.Item 
                key={option.value} 
                label={option.label} 
                value={option.value} 
                color="white" // fix picker text color
              />
            ))}
          </Picker>
        )}
        
      </View>
    </View>
  );
}
