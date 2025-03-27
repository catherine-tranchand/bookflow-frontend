import { View, Text, TextInput, TouchableOpacity, Image} from 'react-native';
import React, { useState } from 'react';




export default function SearchInput({ title, value, placeholder, onChangeText, otherStyles, ...props }) {
    const [shownPassword, setShownPassword] = useState(false);

 
return (
      
    <View className="border-2 border-black-200 w-full h-16 px-4 bg-black-200 rounded-2xl focus:border-secondary-100 flex-row items-center space-x-4">
                <TextInput
                    className="text-base mt-0.5 text-white flex-1 font-pregular"
                    value={value}
                    placeholder="Seach for books"
                    placeholderTextColor="#7b7b8b"
                    onChangeText={onChangeText}  
                    secureTextEntry={title === 'Password' && !shownPassword}
                    {...props} // Pass additional props like keyboardType
                />
<TouchableOpacity>
    <Image 
    source={require('../assets/icons/search.png')} 
    className="w-5 h-5" 
    resizeMode='contain'
    />
</TouchableOpacity>

            </View>
      
    );
}