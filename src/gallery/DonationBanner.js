import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import * as WebBrowser from 'expo-web-browser';
import { EXPO_PUBLIC_API_URL } from '@env';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SWITCH_DATE = new Date('2026-07-05T00:00:00');

const TICKER_HEIGHT = 34;
const CHAR_W = 8.2;
const TICKER_SPEED = 55;

const TICKER_JULY4 =
  '★  CELEBRATE THIS 4TH OF JULY BY HELPING ANOTHER MOM  ★  FREEDOM FROM FEAR.  ★  FREEDOM TO FEEL SUPPORTED.  ';

const TICKER_AFTER =
  '★  HELP ANOTHER MOM  ★  SUPPORT  ★  EDUCATION  ★  MENTAL HEALTH RESOURCES  ★  ADOPTION GUIDANCE  ★  LIFE-AFFIRMING CARE  ';

const PRESET_AMOUNTS = [1, 5, 10, 25];

const parseSegments = (text) => {
  const result = [];
  const parts = text.split('★');
  parts.forEach((part, i) => {
    if (i > 0) result.push({ t: '★', star: true });
    if (part.length > 0) result.push({ t: part, star: false });
  });
  return result;
};

const DonationBanner = ({ donationModalOpenRef }) => {
  const videoRef = useRef(null);
  const tickerX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [videoRatio, setVideoRatio] = useState(16 / 9);
  const [isMuted, setIsMuted] = useState(false);

  const user = useSelector((state) => state.auth);

  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [customMonthlyInput, setCustomMonthlyInput] = useState('10');
  const [showDonationSuccess, setShowDonationSuccess] = useState(false);
  const [showDonationFailure, setShowDonationFailure] = useState(false);

  const [showOneTimeModal, setShowOneTimeModal] = useState(false);
  const [customOneTimeInput, setCustomOneTimeInput] = useState('10');
  const [videoAvailable, setVideoAvailable] = useState(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
  }, []);

  const now = new Date();
  const isJuly4Phase = now < SWITCH_DATE;

  const singleTicker = isJuly4Phase ? TICKER_JULY4 : TICKER_AFTER;
  const singleW = singleTicker.length * CHAR_W;
  const totalW = singleW * 2;

  const segments = parseSegments(singleTicker);
  const doubled = [...segments, ...segments];

  const videoUri = isJuly4Phase
    ? `${EXPO_PUBLIC_API_URL}/donation-1.mp4`
    : `${EXPO_PUBLIC_API_URL}/donation-2.mp4`;

  useEffect(() => {
    fetch(videoUri, { method: 'HEAD' })
      .then(res => setVideoAvailable(res.ok))
      .catch(() => setVideoAvailable(false));
  }, [videoUri]);

  // const tickerGradient = isJuly4Phase
  //   ? ['#3C3B6E', '#B22234', '#3C3B6E']
  //   : ['#0a0640', '#1e1680', '#2a1e9a', '#1e1680', '#0a0640'];

  const tickerGradient = ['#3C3B6E', '#B22234', '#3C3B6E']

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(tickerX, {
        toValue: -totalW,
        duration: ((SCREEN_WIDTH + totalW) / TICKER_SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [totalW]);

  const openMonthlyModal = () => {
    if (donationModalOpenRef) donationModalOpenRef.current = true;
    setCustomMonthlyInput('10');
    setShowMonthlyModal(true);
  };

  const closeMonthlyModal = () => {
    if (donationModalOpenRef) donationModalOpenRef.current = false;
    setShowMonthlyModal(false);
  };

  const openOneTimeModal = () => {
    if (donationModalOpenRef) donationModalOpenRef.current = true;
    setCustomOneTimeInput('10');
    setShowOneTimeModal(true);
  };

  const closeOneTimeModal = () => {
    if (donationModalOpenRef) donationModalOpenRef.current = false;
    setShowOneTimeModal(false);
  };

  const buildDonationUrl = (amount, type) => {
    const base = 'https://babyflixfoundation.org/';
    const params = new URLSearchParams({
      source: 'app',
      uuid: user?.uuid || '',
      email: user?.email || '',
      amount: String(amount),
      type,
      env: __DEV__ ? 'dev' : 'prod',
      redirect_uri: 'babyflix://',
    });
    const url = `${base}?${params.toString()}`;
    //console.log('[DonationBanner] Opening URL:', url);
    return url;
  };

  const openDonationUrl = async (url) => {
    if (Platform.OS === 'ios') {
      await Linking.openURL(url);
    } else {
      await WebBrowser.openAuthSessionAsync(url, 'babyflix://');
    }
  };

  const handleGiftOneTime = async () => {
    const finalAmount = parseFloat(customOneTimeInput) || 0;
    if (finalAmount <= 0) return;
    closeOneTimeModal();
    await openDonationUrl(buildDonationUrl(finalAmount, 'once'));
  };

  const handleGiftOfHope = async () => {
    const finalAmount = parseFloat(customMonthlyInput) || 0;
    if (finalAmount <= 0) return;
    closeMonthlyModal();
    await openDonationUrl(buildDonationUrl(finalAmount, 'monthly'));
  };

  if (!videoAvailable) return null;

  return (
    <View style={styles.outerWrapper}>

      {/* Scrolling ticker strip */}
      <View style={styles.tickerBar}>
        <LinearGradient
          colors={tickerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={{
            position: 'absolute',
            flexDirection: 'row',
            alignItems: 'center',
            width: totalW,
            height: TICKER_HEIGHT,
            transform: [{ translateX: tickerX }],
          }}
        >
          {doubled.map((seg, i) => (
            <Text key={i} style={seg.star ? styles.tickerStar : styles.tickerText}>
              {seg.t}
            </Text>
          ))}
        </Animated.View>
      </View>

      {/* Main video card */}
      <View style={styles.cardWrapper}>
        <View style={[styles.cardContainer, { aspectRatio: videoRatio }]}>

          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={StyleSheet.absoluteFill}
            isLooping
            shouldPlay
            isMuted={isMuted}
            resizeMode={ResizeMode.COVER}
            onReadyForDisplay={({ naturalSize }) => {
              if (naturalSize?.width && naturalSize?.height) {
                setVideoRatio(naturalSize.width / naturalSize.height);
              }
            }}
          />

          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.30)']}
            start={{ x: 0, y: 0.45 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity
            style={styles.muteBtn}
            onPress={() => setIsMuted(prev => !prev)}
            activeOpacity={0.8}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={18} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.contentArea}>
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.donateMonthlyBtn} onPress={openMonthlyModal} activeOpacity={0.85}>
                <Text style={styles.donateMonthlyText}>♥ Donate Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.giveOneTimeBtn} onPress={openOneTimeModal} activeOpacity={0.85}>
                <Text style={styles.giveOneTimeText}>★ Give One Time</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>

      {/* Give One Time Modal */}
      <Modal
        visible={showOneTimeModal}
        transparent
        animationType="fade"
        onRequestClose={() => closeOneTimeModal()}
      >
        <TouchableWithoutFeedback onPress={() => closeOneTimeModal()}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKAV}
              >
                <View style={styles.modalCard}>

                  <LinearGradient
                    colors={['#1565c0', '#1e88e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalHeader}
                  >
                    <View style={styles.modalHeaderLeft}>
                      <View style={styles.modalHeaderIconWrap}>
                        <Ionicons name="star" size={18} color="#1565c0" />
                      </View>
                      <View>
                        <Text style={styles.modalTitle}>Give One Time</Text>
                        <Text style={styles.modalSubtitle}>One-time contribution</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => closeOneTimeModal()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close" size={22} color="#ffffff" />
                    </TouchableOpacity>
                  </LinearGradient>

                  <View style={styles.modalBody}>
                    <Text style={styles.modalDesc}>
                      Celebrate freedom by helping another mother receive support, education, mental health resources, adoption guidance, and life-affirming care.
                    </Text>
                    <Text style={styles.modalDescSub}>Your gift can help ensure no mom walks alone.</Text>

                    <Text style={styles.amountLabel}>SELECT AMOUNT</Text>

                    <View style={styles.amountRow}>
                      {PRESET_AMOUNTS.map(amt => (
                        <TouchableOpacity
                          key={amt}
                          style={[styles.amountBtn, parseFloat(customOneTimeInput) === amt && styles.amountBtnSelectedBlue]}
                          onPress={() => setCustomOneTimeInput(String(amt))}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.amountBtnText, parseFloat(customOneTimeInput) === amt && styles.amountBtnTextSelected]}>
                            ${amt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.orSeparator}>— OR ENTER CUSTOM AMOUNT —</Text>

                    <View style={[styles.customAmountWrap, styles.customAmountWrapBlue]}>
                      <Text style={styles.customAmountDollar}>$</Text>
                      <TextInput
                        style={styles.customAmountInput}
                        placeholder="0.00"
                        placeholderTextColor="#bbbbbb"
                        keyboardType="decimal-pad"
                        value={customOneTimeInput}
                        onChangeText={setCustomOneTimeInput}
                        maxLength={7}
                        returnKeyType="done"
                      />
                    </View>

                    <View style={styles.nonprofitRow}>
                      <Ionicons name="shield-checkmark" size={14} color="#1565c0" style={{ marginRight: 6 }} />
                      <Text style={styles.nonprofitText}>
                        100% of donations go to <Text style={styles.nonprofitBold}>BabyFlix Foundation</Text>, a registered 501(c)(3) nonprofit organization.
                      </Text>
                    </View>

                    <TouchableOpacity onPress={handleGiftOneTime} activeOpacity={0.85} style={styles.giftBtnOuter}>
                      <LinearGradient
                        colors={['#1565c0', '#1e88e5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.giftBtn}
                      >
                        <Text style={styles.giftBtnText}>★  Give the Gift of Hope</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.redirectNotice}>
                      You will be redirected to our secure donation page on babyflixfoundation.org
                    </Text>
                  </View>

                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Donate Monthly Modal */}
      <Modal
        visible={showMonthlyModal}
        transparent
        animationType="fade"
        onRequestClose={() => closeMonthlyModal()}
      >
        <TouchableWithoutFeedback onPress={() => closeMonthlyModal()}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKAV}
              >
                <View style={styles.modalCard}>

                  {/* Modal header */}
                  <LinearGradient
                    colors={['#b22234', '#d63c50']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalHeader}
                  >
                    <View style={styles.modalHeaderLeft}>
                      <View style={styles.modalHeaderIconWrap}>
                        <Ionicons name="heart" size={18} color="#b22234" />
                      </View>
                      <View>
                        <Text style={styles.modalTitle}>Donate Monthly</Text>
                        <Text style={styles.modalSubtitle}>Recurring monthly gift</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => closeMonthlyModal()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close" size={22} color="#ffffff" />
                    </TouchableOpacity>
                  </LinearGradient>

                  {/* Modal body */}
                  <View style={styles.modalBody}>
                    <Text style={styles.modalDesc}>
                      Celebrate freedom by helping another mother receive support, education, mental health resources, adoption guidance, and life-affirming care.
                    </Text>
                    <Text style={styles.modalDescSub}>Your gift can help ensure no mom walks alone.</Text>

                    <Text style={styles.amountLabel}>SELECT AMOUNT</Text>

                    <View style={styles.amountRow}>
                      {PRESET_AMOUNTS.map(amt => (
                        <TouchableOpacity
                          key={amt}
                          style={[styles.amountBtn, parseFloat(customMonthlyInput) === amt && styles.amountBtnSelected]}
                          onPress={() => setCustomMonthlyInput(String(amt))}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.amountBtnText, parseFloat(customMonthlyInput) === amt && styles.amountBtnTextSelected]}>
                            ${amt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.orSeparator}>— OR ENTER CUSTOM AMOUNT —</Text>

                    <View style={[styles.customAmountWrap, styles.customAmountWrapRed]}>
                      <Text style={styles.customAmountDollar}>$</Text>
                      <TextInput
                        style={styles.customAmountInput}
                        placeholder="0.00"
                        placeholderTextColor="#bbbbbb"
                        keyboardType="decimal-pad"
                        value={customMonthlyInput}
                        onChangeText={setCustomMonthlyInput}
                        maxLength={7}
                        returnKeyType="done"
                      />
                    </View>

                    <View style={styles.nonprofitRow}>
                      <Ionicons name="shield-checkmark" size={14} color="#b22234" style={{ marginRight: 6 }} />
                      <Text style={styles.nonprofitText}>
                        100% of donations go to <Text style={styles.nonprofitBold}>BabyFlix Foundation</Text>, a registered 501(c)(3) nonprofit organization.
                      </Text>
                    </View>

                    <TouchableOpacity onPress={handleGiftOfHope} activeOpacity={0.85} style={styles.giftBtnOuter}>
                      <LinearGradient
                        colors={['#b22234', '#d63c50']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.giftBtn}
                      >
                        <Text style={styles.giftBtnText}>♥  Give the Gift of Hope</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.redirectNotice}>
                      You will be redirected to our secure donation page on babyflixfoundation.org
                    </Text>
                  </View>

                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Donation Payment Success Modal */}
      <Modal
        visible={showDonationSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDonationSuccess(false)}
      >
        <View style={styles.statusOverlay}>
          <View style={[styles.statusCard, { borderColor: '#27ae60' }]}>
            <View style={[styles.statusIconWrap, { backgroundColor: '#eafaf1' }]}>
              <Ionicons name="checkmark-circle" size={48} color="#27ae60" />
            </View>
            <Text style={[styles.statusTitle, { color: '#27ae60' }]}>Thank You!</Text>
            <Text style={styles.statusMessage}>
              Your donation has been processed successfully.{'\n'}You are helping another mom today!
            </Text>
            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: '#27ae60' }]}
              onPress={() => setShowDonationSuccess(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.statusBtnText}>OK, Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Donation Payment Failure Modal */}
      <Modal
        visible={showDonationFailure}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDonationFailure(false)}
      >
        <View style={styles.statusOverlay}>
          <View style={[styles.statusCard, { borderColor: '#e74c3c' }]}>
            <View style={[styles.statusIconWrap, { backgroundColor: '#fdf2f2' }]}>
              <Ionicons name="close-circle" size={48} color="#e74c3c" />
            </View>
            <Text style={[styles.statusTitle, { color: '#e74c3c' }]}>Payment Failed</Text>
            <Text style={styles.statusMessage}>
              Something went wrong with your payment.{'\n'}Please try again.
            </Text>
            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: '#e74c3c' }]}
              onPress={() => setShowDonationFailure(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.statusBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    marginTop: 4,
    marginBottom: 4,
  },

  tickerBar: {
    width: '100%',
    height: TICKER_HEIGHT,
    overflow: 'hidden',
  },
  tickerText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Nunito700',
    letterSpacing: 0.6,
    lineHeight: TICKER_HEIGHT,
  },
  tickerStar: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: 'Nunito700',
    letterSpacing: 0.6,
    lineHeight: TICKER_HEIGHT,
  },

  cardWrapper: {
    width: '92%',
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  muteBtn: {
    position: 'absolute',
    top: 9,
    right: 9,
    backgroundColor: 'rgba(0,0,0,0.40)',
    borderRadius: 20,
    padding: 5,
    zIndex: 10,
  },

  contentArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: 5,
    paddingRight: 7,
    paddingLeft: 13,
    paddingTop: 13,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 5,
  },
  donateMonthlyBtn: {
    backgroundColor: '#c0392b',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  donateMonthlyText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Nunito700',
  },
  giveOneTimeBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1a1264',
  },
  giveOneTimeText: {
    color: '#1a1264',
    fontSize: 10,
    fontFamily: 'Nunito700',
  },

  // ── Modal ──────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 40,
  },
  modalKAV: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Nunito700',
    letterSpacing: 0.2,
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 12,
    fontFamily: 'Nunito400',
    marginTop: 2,
  },

  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  modalDesc: {
    color: '#2c2c2c',
    fontSize: 13,
    fontFamily: 'Nunito400',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  modalDescSub: {
    color: '#888888',
    fontSize: 12,
    fontFamily: 'Nunito400',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },

  amountLabel: {
    color: '#999999',
    fontSize: 11,
    fontFamily: 'Nunito700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  amountBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  amountBtnSelected: {
    borderColor: '#b22234',
    backgroundColor: '#b22234',
  },
  amountBtnSelectedBlue: {
    borderColor: '#1565c0',
    backgroundColor: '#1565c0',
  },
  amountBtnText: {
    color: '#333333',
    fontSize: 15,
    fontFamily: 'Nunito700',
  },
  amountBtnTextSelected: {
    color: '#ffffff',
  },

  giftBtnOuter: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  giftBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Nunito700',
    letterSpacing: 0.4,
  },

  orSeparator: {
    color: '#bbbbbb',
    fontSize: 10,
    fontFamily: 'Nunito700',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },

  customAmountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
  },
  customAmountWrapRed: {
    borderColor: '#b22234',
  },
  customAmountWrapBlue: {
    borderColor: '#1565c0',
  },
  customAmountDollar: {
    color: '#333333',
    fontSize: 17,
    fontFamily: 'Nunito700',
    marginRight: 4,
  },
  customAmountInput: {
    flex: 1,
    color: '#333333',
    fontSize: 16,
    fontFamily: 'Nunito400',
    padding: 0,
  },

  nonprofitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  nonprofitText: {
    flex: 1,
    color: '#444444',
    fontSize: 11,
    fontFamily: 'Nunito400',
    lineHeight: 16,
  },
  nonprofitBold: {
    fontFamily: 'Nunito700',
    color: '#222222',
  },

  redirectNotice: {
    color: '#aaaaaa',
    fontSize: 10,
    fontFamily: 'Nunito400',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 14,
  },

  autoRenewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  autoRenewText: {
    flex: 1,
    color: '#555555',
    fontSize: 10,
    fontFamily: 'Nunito400',
    lineHeight: 15,
  },
  autoRenewBold: {
    fontFamily: 'Nunito700',
    color: '#b22234',
  },

  // ── Payment status modals ──────────────────────────────
  statusOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 3,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
  },
  statusIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 22,
    fontFamily: 'Nunito700',
    marginBottom: 10,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 14,
    fontFamily: 'Nunito400',
    color: '#555555',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  statusBtn: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  statusBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Nunito700',
  },
});

export default DonationBanner;
