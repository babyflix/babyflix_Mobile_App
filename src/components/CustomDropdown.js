import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../constants/Colors';

const CustomDropdown = ({
  label,
  selectedValue,
  onSelect,
  options,
  placeholder,
  iconName = 'public',
}) => {
  const [showDropdown, setShowDropdown] = React.useState(false);

  return (
    <View style={{ marginBottom: 15 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 55,
          paddingLeft: 35,
          position: 'relative',
          backgroundColor: 'white',
          borderWidth:1,
          borderColor:Colors.border,
          borderRadius: 8,
          zIndex: 8,
        }}
      >
        <Ionicons name={iconName} size={20} color="#888" style={{ position: 'absolute', left: 10, top: 17 }} />
        <TouchableOpacity
          onPress={() => setShowDropdown(true)}
          style={{ flex: 1, height: '100%', justifyContent: 'center' }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: selectedValue ? 'black' : 'gray',
              paddingLeft: 5,
            }}
          >
            {
              selectedValue
                ? options.find((c) => c.value === selectedValue)?.label
                : placeholder
            }
          </Text>
        </TouchableOpacity>
        <Ionicons name="chevron-down-outline" size={20} color="#888" style={{ position: 'absolute', right: 10, top: 17 }} />
      </View>

      <Modal visible={showDropdown} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            paddingHorizontal: 20,
          }}
          onPress={() => setShowDropdown(false)}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              maxHeight: 300,
              padding: 10,
            }}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => `${item.label}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item.value);
                    setShowDropdown(false);
                  }}
                  style={{ paddingVertical: 12 }}
                >
                  <Text style={{ fontFamily: 'Poppins_400Regular' }}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default CustomDropdown;
