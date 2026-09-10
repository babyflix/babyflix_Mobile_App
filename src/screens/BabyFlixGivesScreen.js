import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import Colors from '../constants/Colors';
import GlobalStyles from '../styles/GlobalStyles';

// BabyFlix Gives — the Printify storefront vertical. Branded shop-style
// landing screen that opens the hosted store in the in-app browser
// (expo-web-browser, already a dependency — no native rebuild). Every
// button opens the same storefront; can be swapped for an embedded
// <WebView> later once react-native-webview is added and the app rebuilt.
const STORE_URL = 'https://babyflix.printify.me/';

const openStore = () => {
  WebBrowser.openBrowserAsync(STORE_URL).catch(() => {});
};

// Faint scattered shopping icons behind the content — gives the screen a
// "storefront" feel without needing any image assets.
const DECOR_TINT = 'rgba(162,53,134,0.06)';
const DECOR = [
  { Icon: Ionicons, icon: 'bag-handle', size: 96, style: { top: 30, left: -18, transform: [{ rotate: '-14deg' }] } },
  { Icon: Ionicons, icon: 'gift', size: 118, style: { top: 120, right: -26, transform: [{ rotate: '12deg' }] } },
  { Icon: MaterialCommunityIcons, icon: 'tshirt-crew', size: 104, style: { top: 300, left: -24, transform: [{ rotate: '8deg' }] } },
  { Icon: Ionicons, icon: 'pricetag', size: 76, style: { top: 430, right: 8, transform: [{ rotate: '-22deg' }] } },
  { Icon: Ionicons, icon: 'heart', size: 62, style: { top: 540, left: 18, transform: [{ rotate: '10deg' }] } },
  { Icon: Ionicons, icon: 'cart', size: 100, style: { bottom: 40, right: -20, transform: [{ rotate: '-10deg' }] } },
];

const BENEFITS = [
  { icon: 'ribbon', key: 'quality' },
  { icon: 'heart-circle', key: 'impact' },
];

const BabyFlixGivesScreen = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[GlobalStyles.container, Platform.OS === 'android' ? { paddingTop: insets.top } : null]}>
      <Header title={t('babyflixGives.title')} />

      {/* Decorative shopping-icon backdrop */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {DECOR.map(({ Icon, icon, size, style }, i) => (
          <Icon key={i} name={icon} size={size} color={DECOR_TINT} style={[styles.decor, style]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient
          colors={['#c85fb0', Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="bag-handle" size={26} color="#fff" />
          </View>
          <Text style={styles.heroHeadline}>{t('babyflixGives.headline')}</Text>
          <Text style={styles.heroSubhead}>{t('babyflixGives.subhead')}</Text>

          <TouchableOpacity activeOpacity={0.85} onPress={openStore} style={styles.heroCta}>
            <Text style={styles.heroCtaText}>{t('babyflixGives.shopNow')}</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Benefits */}
        <View style={styles.benefits}>
          {BENEFITS.map(({ icon, key }) => (
            <View key={key} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons name={icon} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.benefitText}>{t(`babyflixGives.benefits.${key}`)}</Text>
            </View>
          ))}
        </View>

        {/* Mission strip */}
        <View style={styles.mission}>
          <Ionicons name="heart" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
          <Text style={styles.missionText}>{t('babyflixGives.missionStrip')}</Text>
        </View>

        {/* Full-width CTA */}
        <TouchableOpacity activeOpacity={0.85} onPress={openStore} style={styles.browseWrap}>
          <LinearGradient
            colors={['#c85fb0', Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.browse}
          >
            <Ionicons name="storefront" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.browseText}>{t('babyflixGives.browseAll')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.note}>{t('babyflixGives.note')}</Text>
      </ScrollView>
    </View>
  );
};

export default BabyFlixGivesScreen;

const styles = StyleSheet.create({
  decor: {
    position: 'absolute',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },

  hero: {
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroHeadline: {
    fontSize: 22,
    fontFamily: 'Nunito700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubhead: {
    fontSize: 13,
    fontFamily: 'Nunito400',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  heroCtaText: {
    fontSize: 14,
    fontFamily: 'Nunito700',
    color: Colors.primary,
  },

  benefits: {
    marginTop: 22,
    marginBottom: 18,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Nunito400',
    color: Colors.textPrimary,
  },

  mission: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  missionText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'Nunito400',
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  browseWrap: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  browse: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  browseText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Nunito700',
  },

  note: {
    fontSize: 11,
    fontFamily: 'Nunito400',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
});
