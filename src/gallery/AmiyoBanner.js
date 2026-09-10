import React, { useEffect, useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Platform, Linking, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXPO_PUBLIC_API_URL } from '@env';

const AMIYO_IMAGE_URL = `${EXPO_PUBLIC_API_URL}/amoyo_compact.jpeg`;
//const AMIYO_IMAGE_URL = `https://babyflix.ai/amoyo_compact.jpeg`;

const AMIYO_URL = Platform.select({
  android: 'https://play.google.com/store/apps/details?id=com.nurtr.app',
  ios: 'https://apps.apple.com/us/app/amiyo/id6774092558',
  default: 'https://apps.apple.com/us/app/amiyo/id6774092558',
});

const CARD_WIDTH = Dimensions.get('window').width * 0.92;

const AmiyoBanner = () => {
  const [dims, setDims] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Image.getSize(
      AMIYO_IMAGE_URL,
      (w, h) => { if (!cancelled) setDims(w > 0 && h > 0 ? { w, h } : false); },
      () => { if (!cancelled) setDims(false); }
    );
    return () => { cancelled = true; };
  }, []);

  if (!dims) return null;

  const cardHeight = Math.round(CARD_WIDTH * (dims.h / dims.w));

  const openAmiyo = () => {
    Linking.openURL(AMIYO_URL).catch(() => {});
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity activeOpacity={0.9} style={[styles.card, { height: cardHeight }]}>
        <Image
          source={{ uri: AMIYO_IMAGE_URL }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setDims(false)}
        />

        <TouchableOpacity onPress={openAmiyo} style={styles.btn}>
          <Text style={styles.btnText}>Download Amiyo</Text>
          <Ionicons name="arrow-forward" size={12} color="#fff" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

export default AmiyoBanner;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginTop: 4,
    marginBottom: 4,
  },
  card: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#efe4f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  btn: {
    position: 'absolute',
    // Percentages of the card (which is screen-relative), so the button
    // holds the same spot over the artwork on every device / platform,
    // not just the one it was tuned on. Tune '36%' once if needed.
    bottom: '3%',
    right: '36%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#241640',
    paddingVertical: 2.5,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 7,
    fontFamily: 'Nunito700',
  },
});
