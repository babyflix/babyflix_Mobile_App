import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Linking,
  AppState,
} from "react-native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector, useDispatch } from "react-redux";
import { enableSelectionMode } from "../state/slices/flix10kSlice";
import Colors from "../constants/Colors";
import MonthSelector from "../constants/MonthSelector";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from 'expo-web-browser';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUD_API_URL, NEXT_PUBLIC_SHOWFLIXAD } from '@env';
import * as Updates from 'expo-updates';
import { generateImage } from "../constants/generateApi";
import sendDeviceUserInfo, { USERACTIONS } from "../components/deviceInfo";
import { setPaymentStatusAdd, setShowFlix10KADSlice, setSubscriptionExpired } from "../state/slices/subscriptionSlice";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import FlixAdModal from "./FlixAdModal";
import AIGenerationModal from "./AIGenerationModal";
import DisableAutoRenewModal from "../constants/DisableAutoRenewModal";
//import * as RNIap from 'react-native-iap';

const Flix10kBanner = ({
  mediaData,
  setFlix10kSelectionMode,
  selectedItemsForAi,
  setSelectedItemsForAi,
  toggleItemSelection,
  handleCancelSelection,
  selectedType,
  setSelectedType,
  flix10kGenerating,
  setFlix10kGenerating,
  flix10kResults,
  setFlix10kResults,
  flix10kAiImages,
  setFlix10kAiImages,
  setSnackbarVisible,
  setSnackbarMessage,
  setSnackbarType
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth);
  const { subscriptionAmount, subscriptionId, subscriptionIsActive, subscriptionExpired } = useSelector(
    (state) => state.auth
  );
  const { storagePlanId, storagePlanPayment, } =
    useSelector((state) => state.storagePlan || {});
  const subscriptionActive = subscriptionIsActive

  console.log("EXPO_PUBLIC_CLOUD_API_URL", EXPO_PUBLIC_CLOUD_API_URL)

  console.log('subscriptionAmount, subscriptionId, subscriptionIsActive ', subscriptionAmount, subscriptionId, subscriptionIsActive)

  const [showModal, setShowModal] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [months, setMonths] = useState(1);
  const [autoRenew, setAutoRenew] = useState(false);

  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentFailure, setShowPaymentFailure] = useState(false);

  const [showGenerationTypeModal, setShowGenerationTypeModal] = useState(false);

  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [showFlix10KAd, setShowFlix10KAd] = useState(false);
  const [message, setMessage] = useState("");
  const [showAfterAdd, setShowafterAdd] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAutoRenewModal, setShowAutoRenewModal] = useState(false);

  const selectionCount = selectedItemsForAi.length;

  //  useEffect(() => {
  //   const fetchPaymentStatus = async () => {
  //     try {
  //       const status = await AsyncStorage.getItem("flix10KPaying");
  //       console.log("status of paying",status)
  //       if (status) {
  //         console.log("status of paying",status)
  //         await AsyncStorage.removeItem('flix10kPaymentForAdd');
  //          setShowafterAdd(false);
  //         await AsyncStorage.removeItem("flix10KPaying");
  //       }
  //     } catch (err) {
  //       console.error("Error reading AsyncStorage flix10KPaying:", err);
  //     }
  //   };
  //   fetchPaymentStatus();
  // }, []);

  //   useFocusEffect(
  //   useCallback(() => {
  //     const fetchPaymentStatus = async () => {
  //       try {
  //         const status = await AsyncStorage.getItem("flix10KPaying");
  //         console.log("status of paying", status);
  //         if (status) {
  //           console.log("status of paying", status);
  //           await AsyncStorage.removeItem("flix10kPaymentForAdd");
  //           setShowafterAdd(false);
  //           //await AsyncStorage.removeItem("flix10KPaying");
  //         }
  //       } catch (err) {
  //         console.error("Error reading AsyncStorage flix10KPaying:", err);
  //       }
  //     };

  //     fetchPaymentStatus();

  //     // No cleanup needed here
  //   }, [])
  // );

  useEffect(() => {
    const checkFlixAdSeen = async () => {
      if (subscriptionActive && isSubscriptionId) {
        await AsyncStorage.setItem("flixAdSeen", "true");
        console.log('flixAdSeen set to true');
      } else {
        await AsyncStorage.setItem("flixAdSeen", "false");
        console.log('flixAdSeen set to false');
      }
    };

    checkFlixAdSeen();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        try {
          const paying = await AsyncStorage.getItem("flix10KPaying");
          const addPayment = await AsyncStorage.getItem("flix10kPaymentForAdd");

          // If user was paying but didn't finish, clean up
          if (paying || addPayment) {
            console.log("User returned without completing Stripe payment, clearing state...");
            await AsyncStorage.removeItem("flix10KPaying");
            //await AsyncStorage.removeItem("flix10kPaymentForAdd");

            dispatch(setShowFlix10KADSlice(false));
          }
        } catch (err) {
          console.error("Error clearing payment state:", err);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);


  useEffect(() => {
    const checkPaymentStatus = async () => {
      const status = await AsyncStorage.getItem('flix10k_payment_status');

      const uuid = user.uuid;
      const subscriptionId = await AsyncStorage.getItem('flix10k_subscriptionId');
      const autoRenewal = await AsyncStorage.getItem('flix10k_autoRenewal');
      const subscribedMonths = await AsyncStorage.getItem('flix10k_subscribedMonths');
      const stripeSessionId = await AsyncStorage.getItem('flix10k_stripeSessionId');
      const storedStatus = await AsyncStorage.getItem('flix10k_status');
      const apiStatus = storedStatus === "failed" ? "PAYMENT_FAILED" : "SUCCESS";

      const payload = {
        uuid,
        subscriptionId,
        autoRenewal,
        subscribedMonths,
        stripeSessionId,
        status: apiStatus,
        //showFlix10KAd: showFlix10KAd,
      };
      console.log("Calling subscription API with:", payload);

      if (status === 'done') {
        //await AsyncStorage.setItem('flix10kPaymentForAdd', 'done');
        setShowafterAdd(true);
        //dispatch(setPaymentStatusAdd(true))
        console.log("flix10k payment success");
        setTimeout(() => {          
        setShowPaymentSuccess(true);
        }, 1000);

        console.log("Calling subscription API with:", payload);

        try {
          const response = await axios.post(
            `${EXPO_PUBLIC_API_URL}/api/subscription/subscription`,
            payload
          );
          console.log("Subscription API response:", response.data);

          if (subscriptionIsActive) {
            try {
              await sendDeviceUserInfo({
                action_type: USERACTIONS.UPDATESUBSCRIPTION,
                action_description: `Existing user upgrade subscribe for Flix10K`,
              });
              console.log("Existing user upgrade subscribe for Flix10K");
            } catch (err) {
              console.error("Failed to send user action for existing subscription:", err);
            }
          } else {
            try {
              await sendDeviceUserInfo({
                action_type: USERACTIONS.NEWSUBCRIPTION,
                action_description: `New user subscribe for Flix10K`,
              });
              console.log("New user subscribe for Flix10K");
            } catch (err) {
              console.error("Failed to send user action for new subscription:", err);
            }
          }
        } catch (error) {
          console.log("Error calling subscription API:", error);
        }

        await AsyncStorage.removeItem('flix10k_payment_status');
      }

      else if (status === 'fail') {
        //await AsyncStorage.setItem('flix10kPaymentForAdd', 'fail');
        setShowafterAdd(true);
        console.log("flix10k payment failed");
        //dispatch(setPaymentStatusAdd(true))
        setTimeout(() => {
          setShowPaymentFailure(true);
        }, 1000);

        // console.log("Calling subscription API with:", payload);
        //  //Alert.alert("Calling subscription API with:", payload);

        // try {
        //   const response = await axios.post(
        //     `${EXPO_PUBLIC_API_URL}/api/subscription/subscription`,
        //     payload
        //   );
        //   console.log("Subscription API response:", response.data);
        //   //Alert.alert("Subscription API response:", response.data);

        //   //Alert.alert("User payment failed for Flix10K");

        // sendDeviceUserInfo({
        //   action_type: "payment failed",
        //   action_description: `User payment failed for Flox10K plan`,
        // });
        // } catch (error) {
        //   console.log("Error calling subscription API:", error);
        //    Alert.alert("Error calling subscription API:");
        // }

        try {
          await sendDeviceUserInfo({
            action_type: "payment failed",
            action_description: `User payment failed for Flox10K plan`,
          });
        } catch (err) {
          console.error("Error sending user action:", err);
          Alert.alert("Error sending user action:");
        }

        await AsyncStorage.removeItem('flix10k_payment_status');
      }
    };

    checkPaymentStatus();
  }, []);

  const isSubscriptionId = subscriptionId
  const handlePress = async () => {
    if (subscriptionExpired) {
      dispatch(setSubscriptionExpired(true));
      router.push({
        pathname: "/profile",
        params: { screen: "Subscriptions" },
      });
      return;
    }

    if (subscriptionActive && isSubscriptionId) {
      setSelecting(true);
      setFlix10kSelectionMode(true);
      await AsyncStorage.setItem("flixAdSeen", "true");
      console.log('flixAdSeen set to true');
    } else {
      setShowModal(true);
      await AsyncStorage.setItem("flixAdSeen", "false");
      console.log('flixAdSeen set to false');
    }
  };

  const increaseMonths = () => {
    if (months < 12) setMonths(months + 1);
  };

  const decreaseMonths = () => {
    if (months > 1) setMonths(months - 1);
  };

  const handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.error("Failed to reload app:", e);
    }
  };

  const handlePaymentClose = async (type) => {
    if (type === "success") {
      setShowPaymentSuccess(false);
      await AsyncStorage.removeItem("flix10k_payment_status");
      await AsyncStorage.removeItem('flix10kPaymentForAdd');
      //dispatch(setPaymentStatusAdd(false))
      setShowafterAdd(false);
      handleRestart();
    } else if (type === "failure") {
      setShowPaymentFailure(false);
      await AsyncStorage.removeItem("flix10k_payment_status");
      await AsyncStorage.removeItem('flix10kPaymentForAdd');
      //dispatch(setPaymentStatusAdd(false))
      setShowafterAdd(false);
    }
  };

  const cancelFlix10KPress = () => {
    setSelecting(false);
    setFlix10kSelectionMode(false);
    setSelectedItemsForAi([]);
    handleCancelSelection();
  };

  const handleProcess = async () => {
    if (!selectedType || selectedItemsForAi.length === 0) return;

    setShowGenerationTypeModal(false)
    setLoadingAnalyze(true);
    setFlix10kGenerating(true);
    setIsGenerating(true);

    try {
      const updatedItems = [];

      const vedioUrl = `${EXPO_PUBLIC_CLOUD_API_URL}/analyze-video?gcs_uri=`;
      const imageUrl = `${EXPO_PUBLIC_CLOUD_API_URL}/analyze?url=`;

      for (const item of selectedItemsForAi) {

        const alreadyExists = flix10kResults.some(result => result.id === item.id);
        if (alreadyExists) {
          continue;
        }

        const itemUrl = item.object_type === "video" ? vedioUrl : imageUrl
        try {
          const response = await axios.get(
            `${itemUrl}${encodeURIComponent(item.object_url)}`
          );

          const newItem = { ...item, flix10kResult: response.data };
          updatedItems.push(newItem);

          setFlix10kResults(prev => [...prev, newItem]);

          await AsyncStorage.setItem(
            'flix10kResults',
            JSON.stringify([...updatedItems])
          );

        } catch (err) {
          console.error('Error processing item', item.id, err);
        }
      }
      cancelFlix10KPress();

    } catch (err) {
      console.error('Error in handleProcess:', err);
    } finally {
      setFlix10kGenerating(false);
      setIsGenerating(false);
      setLoadingAnalyze(false);
      setShowGenerationTypeModal(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedType || selectedItemsForAi.length === 0) return;

    setShowGenerationTypeModal(false);
    setLoadingAnalyze(true);
    setFlix10kGenerating(true);
    setIsGenerating(true);

    const updatedItems = [];
    const failedItems = [];

    try {
      for (const item of selectedItemsForAi) {
        console.log('generating for', item)
        if (item.object_type !== "image") {
          console.log("Skipping non-image item:", item.id);
          continue;
        }

        const alreadyExists = flix10kResults.some(result => result.id === item.id);
        if (alreadyExists) {
          console.log("Skipping item, already exists:", item.id);
          continue;
        }

        try {
          const response = await generateImage(item.object_url, item.object_type, user, item.id);
          console.log("API Response for item:", item.id, response);

          // const newItem = { ...item, flix10kAiImages: response };

          // updatedItems.push(newItem);

          // sendDeviceUserInfo({
          //   action_type: USERACTIONS.FLIX10KBABYPREDICTIVEIMAGE,
          //   action_description: `Flox10K generate predictiveimage for ${item}`,
          // });
          if (response?.output_path) {
            const newItem = { ...item, flix10kAiImages: response };
            updatedItems.push(newItem);

            sendDeviceUserInfo({
              action_type: USERACTIONS.FLIX10KBABYPREDICTIVEIMAGE,
              action_description: `Flix10K generate predictive image for ${item}`,
            });
          } else {
            // 🚨 no output_path → add to failedItems
            failedItems.push(item.title);
          }

        } catch (err) {
          console.error("❌ Error generating item", item.id, err);
          failedItems.push(item.object_name || item.id);
        }
      }

      if (updatedItems.length > 0) {
        setFlix10kAiImages(prev => [...updatedItems, ...(prev || [])]);
      }

      if (failedItems.length > 0) {
        const msg =
          failedItems.length === 1
            ? `Image with image name "${failedItems[0]}" is already generated. Please try another.`
            : `Images with image names "${failedItems.join(
              ", "
            )}" are already generated. Please try another.`;
        //showSnackbar(errorMessage, "error"); // assuming you have a snackbar util
        setSnackbarVisible(true);
        setSnackbarMessage(msg);
        setSnackbarType("error")
      }

      console.log("🎉 All items processed:", updatedItems);
      cancelFlix10KPress();

    } catch (err) {
      console.error("Error in handleGenerate:", err);
      throw err;
    } finally {
      setFlix10kGenerating(false);
      setIsGenerating(false);
      setLoadingAnalyze(false);
      setShowGenerationTypeModal(false);
    }
  };

  const handleSubscribe = async () => {
    await AsyncStorage.setItem('flix10KPaying', 'true');
    try {
      const payload = {
        subscriptionId: 1,
        autoRenewal: autoRenew,
        subscribedMonths: months,
        platform: Platform.OS,
      };

      console.log("Subscription Payload:", payload);

      const response = await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/subscription/create-checkout-session-subscription-app`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Subscription Response:", response.data);

      const sessionData = response.data;

      if (!sessionData.sessionId) throw new Error("No session ID returned");

      const stripeUrl = sessionData.sessionUrl;

      //const result = await WebBrowser.openAuthSessionAsync(stripeUrl, "babyflix://");
      let result;

      if (Platform.OS === 'ios') {
        await Linking.openURL(stripeUrl);
        // const result = await WebBrowser.openAuthSessionAsync(
        //   stripeUrl, // Stripe checkout URL
        //   "babyflix://payment/redirect"
        // );
      } else {
        result = await WebBrowser.openAuthSessionAsync(
          stripeUrl,
          "babyflix://"
        );
      }

      await WebBrowser.dismissBrowser();

      if (result?.type === 'success') {
        console.log("Payment success");
        setShowModal(false);
      } else if (result?.type === 'cancel') {
        console.log("Payment canceled or failed");
        setShowModal(false);
      }

      await AsyncStorage.removeItem('flix10kPaymentForAdd');
      setShowafterAdd(false);
      setShowModal(false);
    } catch (error) {
      console.error("Subscription error:", error.response?.data || error.message);
    }
  };

  //   const subscriptionSkus = Platform.select({
  //   ios: [
  //     'com.babyflix.flix10k.monthly',  // 1 month
  //     'com.babyflix.flix10k.quarterly', // 3 months
  //     'com.babyflix.flix10k.yearly',    // 12 months
  //   ],
  //   android: [
  //     'com.babyflix.flix10k.monthly',
  //     'com.babyflix.flix10k.quarterly',
  //     'com.babyflix.flix10k.yearly',
  //   ],
  // });

  // /**
  //  * Handle subscription purchase
  //  * @param {string} sku - subscription SKU for chosen duration
  //  * @param {boolean} autoRenew - user choice for auto-renewal
  //  */
  // export const handleSubscribe = async (sku, autoRenew) => {
  //   try {
  //     await RNIap.initConnection();

  //     const products = await RNIap.getSubscriptions(subscriptionSkus);
  //     console.log('Available subscriptions:', products);

  //     // Request subscription
  //     const purchase = await RNIap.requestSubscription(
  //       sku,
  //       false,       // iOS: default behavior, cannot disable programmatically
  //       autoRenew    // Android: enable/disable auto-renew
  //     );

  //     console.log("Purchase successful:", purchase);

  //     // Save locally
  //     await AsyncStorage.setItem('flix10KPaying', 'true');
  //     await AsyncStorage.setItem('flix10KAutoRenew', autoRenew ? 'true' : 'false');
  //     await AsyncStorage.setItem('flix10KSku', sku);

  //     // Send to backend for validation
  //     await axios.post(`${EXPO_PUBLIC_API_URL}/api/subscription/validate`, {
  //       platform: Platform.OS,
  //       sku,
  //       purchaseToken: purchase.purchaseToken,       // Android
  //       transactionReceipt: purchase.transactionReceipt, // iOS
  //       autoRenew,
  //     });

  //     // iOS auto-renew: cannot disable programmatically
  //     if (Platform.OS === 'ios' && !autoRenew) {
  //       // Show modal or link for user to disable in App Store
  //       //Linking.openURL('itms-apps://apps.apple.com/account/subscriptions');
  //       setShowAutoRenewModal(true);
  //     }

  //   } catch (err) {
  //     console.error("Subscription error:", err);
  //   } finally {
  //     await RNIap.endConnection();
  //   }
  // };

  console.log("showAfterAdd", showAfterAdd)
  return (
    <View style={styles.container}>

      {!showAfterAdd && <FlixAdModal
        paymentSuccess={subscriptionAmount == "" || null}
        handleSubscribe={handleSubscribe} // from parent
        //months={months}
        setMonths={setMonths}
        //autoRenew={autoRenew}
        setAutoRenew={setAutoRenew}
        setShowFlix10KAd={setShowFlix10KAd}
        setMessage={setMessage}
      />}

      {/* CASE 1: Not selecting */}
      {!selecting && (
        <LinearGradient
          colors={subscriptionExpired ? ["#f86977ff", "#dc3545"] : ["#a23586", "#d16ba5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.caseContainer}
        >
          {subscriptionExpired && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('header.expired')}</Text>
            </View>
          )}
          <LinearGradient
            colors={['rgba(253, 225, 241, 1)', 'rgba(244, 237, 252, 1)', 'rgba(234, 247, 255, 1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.caseInner}
          >
            <Text style={[styles.message, subscriptionExpired && { marginTop: 3 }]}>{t("flix10k.babyFirstMoments")}</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => {
              handlePress();
              setSelectedType("")
            }}>
              <LinearGradient
                colors={["#d63384", "#9b2c6f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  ✨ {t("flix10k.flix10kDesigner")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </LinearGradient>
      )}

      {/* CASE 2: Selecting but no items selected */}
      {selecting && selectionCount === 0 && (
        <LinearGradient
          colors={["#a23586", "#d16ba5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.caseContainer}
        >
          <View style={[styles.case2Inner, { flexDirection: 'row' }]}>
            <Text style={styles.dottedText}>
              {t("flix10k.selectImages")}
            </Text>

            <TouchableOpacity onPress={cancelFlix10KPress} style={[
              styles.button,
              {
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 6,
              },
            ]}>
              <Ionicons name="close-outline" size={20} color="black" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      {/* CASE 3: Items selected */}
      {selecting && selectionCount > 0 && (
        <LinearGradient
          colors={["#a23586", "#d16ba5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.caseContainer}
        >
          <View style={styles.caseInner}>
            <View style={[styles.actionRow, { marginBottom: 10 }]}>
              <TouchableOpacity onPress={() => { setShowGenerationTypeModal(true); setSelectedType("predictiveBaby"); }}>
                <LinearGradient
                  colors={["#d63384", "#9b2c6f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Text style={styles.primaryText}>{t("flix10k.convertToAI")}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { cancelFlix10KPress(); setSelectedType(null); }}>
                <LinearGradient
                  colors={["#eee", "#eee"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.canButton}
                >
                  <Text style={styles.secondaryText}>{t("flix10k.cancel")}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <LinearGradient
              colors={['#fcc2e2ff', '#ead8fdff', '#d5effdff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientSection}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.rightBox}>
                  <Text style={styles.headerTitle}>{t("flix10k.unlockTitle")}</Text>
                  <Text style={styles.modalText}>
                    {t("flix10k.unlockText")}
                  </Text>
                  <Text style={styles.price}>{t("flix10k.pricePerMonth")}</Text>

                  <MonthSelector months={months} setMonths={setMonths} autoRenew={autoRenew} mode="dropdown" />

                  {/* { (user?.firstTimeSubscription &&
                    user?.showFlixAd &&
                    (subscriptionAmount == "" || null) && 
                    months === 2 &&
                    autoRenew === false ) ? (
                    <Text style={styles.offer}>🎉 {t("flix10k.offerApplied")}</Text>
                    ) : (
                      <Text style={styles.offer}>⚠️ {t("flix10k.offerNotApplicable")}</Text>
                    )
                  } */}

                  {user?.firstTimeSubscription && user?.showFlixAd &&
                    <Text style={styles.offer}>🎉 {t("flix10k.offerApplied")}</Text>
                  }

                  <TouchableOpacity
                    style={styles.autoRenewRow}
                    onPress={() => setAutoRenew(!autoRenew)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.toggleSwitch,
                        autoRenew ? styles.toggleOn : styles.toggleOff,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleCircle,
                          autoRenew ? styles.circleOn : styles.circleOff,
                        ]}
                      />
                    </View>
                    <Text style={styles.autoRenewText}>{t("flix10k.autoRenew")}</Text>
                  </TouchableOpacity>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowModal(false);
                        handleSubscribe();
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={["#d63384", "#9b2c6f"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryGradient}
                      >
                        <Text style={styles.primaryText}>{t("flix10k.subscribeNow")}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => setShowModal(false)}
                    >
                      <Text style={styles.secondaryText}>{t("flix10k.cancel")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </LinearGradient>

            <View style={styles.whySection}>
              <Text style={styles.sectionTitle}>{t("flix10k.whyTitle")}</Text>

              <View style={styles.bulletRow}>
                <MaterialIcons name="emoji-people" size={20} color="#d63384" />
                <Text style={styles.bulletText}>
                  {t("flix10k.reason1")}
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <MaterialIcons name="child-care" size={20} color="#f59e0b" />
                <Text style={styles.bulletText}>
                  {t("flix10k.reason2")}
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <MaterialIcons name="photo-camera" size={20} color="#3b82f6" />
                <Text style={styles.bulletText}>
                  {t("flix10k.reason3")}
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <MaterialIcons name="videocam" size={20} color="#10b981" />
                <Text style={styles.bulletText}>
                  {t("flix10k.reason4")}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>


      <Modal visible={showPaymentSuccess} transparent animationType="fade" onRequestClose={() => setShowStorage2(false)}>
        <View style={[styles.modalBackground, { zIndex: 999 }]}>
          <View style={[styles.modalContainerStatus, { borderColor: "green" }]}>
            <Text style={[styles.title, { color: "green", textAlign: 'center' }]}>{t('storage.paymentSuccess')}</Text>
            {subscriptionAmount !== "" && subscriptionAmount !== null && subscriptionIsActive ? (
              <Text style={styles.subtitle}>
                {t("flix10k.upgradeSuccess")}
              </Text>
            ) : (
              <Text style={styles.subtitle}>
                {t("flix10k.subscriptionSuccess")}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.filledButton, { paddingHorizontal: 20 }]}
              onPress={() => handlePaymentClose("success")}
            >
              <Text style={styles.filledText}>{t('storage.okGotIt')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPaymentFailure} transparent animationType="fade">
        <View style={[styles.modalBackground, { zIndex: 999 }]}>
          <View style={[styles.modalContainerStatus, { borderColor: Colors.error, }]}>
            <Text style={[styles.title, { color: Colors.error, textAlign: 'center' }]}>{t('storage.paymentFailed')}</Text>
            <Text style={styles.subtitleFailed}>{t('storage.paymentError')}</Text>
            <TouchableOpacity
              style={[styles.filledButton, { paddingHorizontal: 20 }]}
              onPress={() => handlePaymentClose("failure")}
            >
              <Text style={styles.filledText}>{t('storage.okIGotIt')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={showGenerationTypeModal}
        animationType="fade"
        onRequestClose={() => setShowGenerationTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.genModalBox}>
            <Text style={styles.genModalTitle}>{t("flix10k.generationType")}</Text>

            {/* Option 1 */}
            {/* <TouchableOpacity
              style={styles.radioWrapper}
              onPress={() => setSelectedType("babyProfile")}
            >
            <View style={styles.radioDot}>
              {selectedType === "babyProfile" && <View style={styles.radioInnerDot} />}
            </View>
              <Text style={styles.radioText}>{t("flix10k.tabs.babyProfile")}</Text>
            </TouchableOpacity> */}

            {/* Option 2 */}
            <TouchableOpacity
              style={styles.radioWrapper}
              onPress={() => setSelectedType("predictiveBaby")}
            >
              <View style={styles.radioDot}>
                {selectedType === "predictiveBaby" && <View style={styles.radioInnerDot} />}
              </View>
              <Text style={styles.radioText}>{t("flix10k.predictiveBabys")}</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowGenerationTypeModal(false)}
              >
                <Text style={styles.cancelBtnText}>{t("flix10k.cancel")}</Text>
              </TouchableOpacity>

              <LinearGradient
                colors={["#d63384", "#9b2c6f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.processBtnGradient,
                  (!selectedType || loadingAnalyze) && { opacity: 0.5 },
                ]}
              >
                <TouchableOpacity
                  style={styles.processBtn}
                  disabled={!selectedType || loadingAnalyze}
                  onPress={() => {
                    if (selectedType === "babyProfile") {
                      handleProcess();
                    } else {
                      handleGenerate();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.processBtnText}>
                    {t("flix10k.process")}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>
      </Modal>

      <AIGenerationModal visible={isGenerating} />
      {/* <DisableAutoRenewModal visible={showAutoRenewModal} onClose={() => setShowAutoRenewModal(false)} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
  },
  container: {
    width: "100%",
    alignItems: "center",
    //marginHorizontal: 2,
  },
  caseContainer: {
    borderRadius: 20,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: 12,
    marginBottom: 5,
    width: "92%",
    alignSelf: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "red",
    borderRadius: 20,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 12,
    zIndex: 1,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Nunito700",
  },

  caseInner: {
    borderRadius: 18,
    backgroundColor: "#f8d4e9ff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  case2Inner: {
    borderRadius: 18,
    backgroundColor: "#f8d4e9ff",
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: "Nunito400",
    color: "#444",
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 5,
    borderRadius: 16,
    //alignItems: "center",
  },
  canButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 5,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "black",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontFamily: "Nunito700",
    //fontWeight: "700",
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: 'space-around',
    //width: "100%",
    marginTop: 10,
  },
  selectionMessageContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD54F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dottedText: {
    fontFamily: "Nunito400",
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    //fontStyle: "italic",
    padding: 5,
    marginBottom: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 70,
    borderRadius: 25,
    backgroundColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: "Nunito700",
    color: 'gray',
    //fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "95%",
  },
  modalContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftBox: {
    flex: 1,
    paddingRight: 10,
  },
  rightBox: {
    flex: 1,
    paddingLeft: 10,
    alignItems: "center",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderColor: 'lightgrey',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  monthText: {
    fontSize: 14,
    fontFamily: "Nunito700",
    //fontWeight: "600",
    color: "#444",
  },
  disabledText: {
    color: "#aaa",
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#d63384",
  },
  monthInputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  monthLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "Nunito700",
    //fontWeight: "600",
    color: "#444",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 0,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalText: {
    fontFamily: "Nunito400",
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  price: {
    fontFamily: "Nunito700",
    fontSize: 16,
    //fontWeight: "bold",
    color: "#d63384",
    marginBottom: 16,
  },
  offer: {
    fontFamily: "Nunito400",
    fontSize: 12,
    //fontWeight: "bold",
    color: "#19b804ff",
    //marginBottom: 0,
    marginTop: 5,
  },
  primaryButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Nunito700",
    textAlign: "center",
  },

  secondaryButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "#444",
    fontFamily: "Nunito700",
    //fontWeight: "600",
    fontSize: 15
  },
  bullet: {
    fontSize: 14,
    fontFamily: "Nunito400",
    color: "#444",
    marginBottom: 8,
    lineHeight: 20,
  },
  gradientSection: {
    borderRadius: 16,
    //borderTopRightRadius: 16,
    padding: 10,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Nunito700",
    fontSize: 18,
    //fontWeight: "700",
    color: "#9b2c6f",
    textAlign: "center",
    marginBottom: 8,
  },
  primaryGradient: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    height: 45,
  },
  monthOption: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  monthOptionSelected: {
    borderColor: "#d63384",
    backgroundColor: "#fce7f3",
  },

  monthOptionDisabled: {
    opacity: 0.5,
  },

  monthOptionText: {
    fontFamily: "Nunito700",
    fontSize: 14,
    color: "#444",
  },

  monthOptionTextSelected: {
    color: "#d63384",
    fontFamily: "Nunito700",
  },

  monthOptionTextDisabled: {
    color: "#aaa",
  },

  autoRenewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },

  toggleSwitch: {
    width: 40,
    height: 20,
    borderRadius: 12,
    justifyContent: "center",
    marginRight: 10,
    padding: 2,
  },

  toggleOn: {
    backgroundColor: "#d63384",
  },

  toggleOff: {
    backgroundColor: "#ccc",
  },

  toggleCircle: {
    width: 15,
    height: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  circleOn: {
    alignSelf: "flex-end",
  },

  circleOff: {
    alignSelf: "flex-start",
  },

  autoRenewText: {
    fontFamily: "Nunito700",
    fontSize: 14,
    color: "#333",
  },
  monthSelectorBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },

  arrowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  arrowText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d63384",
  },

  monthInput: {
    width: 160,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Nunito700",
    marginHorizontal: 8,
    color: "#333",
    backgroundColor: "#fff",
  },

  disabledArrow: {
    opacity: 0.4,
  },

  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#999",
  },
  whySection: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: "Nunito700",
    fontSize: 18,
    //fontWeight: "700",
    marginBottom: 12,
    color: "#9b2c6f",
    textAlign: "center",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletText: {
    flex: 1,
    fontFamily: "Nunito400",
    fontSize: 14,
    color: "#444",
    marginLeft: 8,
  },
  genModalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "85%",
    //alignItems: "center",
  },
  genModalTitle: {
    fontFamily: "Nunito700",
    fontSize: 18,
    color: "#9b2c6f",
    marginBottom: 20,
    paddingLeft: 10,
    //textAlign: "center",
  },
  radioWrapper: {
    flexDirection: "row",
    alignItems: "center",
    //justifyContent: "center",
    paddingLeft: 10,
    marginBottom: 14,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9b2c6f",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#fff",
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#9b2c6f",
  },
  radioText: {
    fontFamily: "Nunito700",
    fontSize: 16,
    color: "#444",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    marginRight: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#444",
    fontFamily: "Nunito700",
  },
  processBtnGradient: {
    flex: 1,
    borderRadius: 12,
    ///paddingHorizontal: 20,
    //marginTop: 20,
  },
  processBtn: {
    marginLeft: 6,
    paddingVertical: 12,
    //paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  processBtnText: {
    color: "#fff",
    fontFamily: "Nunito700",
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },

  modalContainerStatus: {
    width: '90%',
    height: 'auto',
    backgroundColor: '#fff',
    borderWidth: 3,
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito700',
    //fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    marginTop: 10,
    fontFamily: 'Nunito400',
    color: '#444',
    textAlign: 'center',
  },
  subtitleFailed: {
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
    fontFamily: 'Nunito400',
    color: '#b00020',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: 'Nunito400',
    textAlign: 'left',

  },
  filledButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  filledText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Nunito400',
    fontSize: 14,
  },
});

export default Flix10kBanner;
