import React from 'react'
import { View, Text} from 'react-native'
import { FlatList } from 'react-native'

const Newin = ({ posts }) => {
  return (

    <FlatList 
    data={posts}
    keyExtractor={(item) => item.$id}
    renderItem={({ item}) => (
        <Text className="text-3xl text-white">{item.id}</Text>
    )}
    horizontal
    />
  )
}

export default Newin

