import React, { useState, useEffect } from "react";
import { Modal, View, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, Text } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { setShowFlix10KADSlice } from "../state/slices/subscriptionSlice";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FlixAdModal = ({
  paymentSuccess,
  handleSubscribe,
  months,
  setMonths,
  autoRenew,
  setAutoRenew,
  setShowFlix10KAd,
  setMessage,
  //setModalLock
}) => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth);
  const planData = useSelector((state) => state.plan.planData);
  const dispatch = useDispatch();
  const paymentStatusAdd = useSelector((state) => state.subscription.paymentStatusAdd);
  const [open, setOpen] = useState(false);
  const [loader, setLoader] = useState(false);
  const [paymentStatusAddStorage, setPaymentStatusAddStorage] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const insets = useSafeAreaInsets();

  const adVideoUrl = "https://babyflix.ai/flixad.mp4";
  const adImageUrl = "https://babyflix.ai/flix10klogo.png"; // Your static image

  const [videoStyle, setVideoStyle] = useState({ width: SCREEN_WIDTH * 0.9, height: SCREEN_HEIGHT * 0.7 });

  useEffect(() => {
    const videoWidth = SCREEN_WIDTH * 0.9;
    const videoHeight = videoWidth * (16 / 9);
    setVideoStyle({ width: videoWidth, height: videoHeight });
  }, []);

  useEffect(() => {
    const getPaymentStatus = async () => {
      const status = await AsyncStorage.getItem('forAdd');
      console.log(status)
      if (status === 'done' || status === 'fail') {
        setPaymentStatus(true);
        setTimeout(() => {
          dispatch(setShowFlix10KADSlice(false));
        }, 1000);
      } else {
        setPaymentStatus(false);
      }
    };

    getPaymentStatus();
  }, []);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const status = await AsyncStorage.getItem("flix10kPaymentForAdd");
        if (status) {
          setPaymentStatusAddStorage(status);

        }
      } catch (err) {
        console.error("Error reading AsyncStorage flix10kPaymentForAdd:", err);
      }
    };
    fetchPaymentStatus();
  }, []);

  useEffect(() => {

    if (paymentStatusAddStorage || paymentStatus) {
      return;
    }

    if (user?.firstTimeSubscription && user?.showFlixAd && paymentSuccess) {
      dispatch(setShowFlix10KADSlice(true));
      setTimeout(() => {
        setOpen(true);
        setMonths(1);
        setAutoRenew(true);
        setShowFlix10KAd(user?.showFlixAd);
      }, 1000);
    }

  }, [user?.firstTimeSubscription, paymentSuccess, paymentStatus]);

  const handlePayRedirect = async () => {
    //await AsyncStorage.removeItem('forAdd');
    setPaymentStatus(false);
    if (!handleSubscribe) return;

    setLoader(true);
    try {
      await handleSubscribe();
    } catch (err) {
      console.error("Subscription error:", err);
      alert("Something went wrong with subscription.");
    } finally {
      setLoader(false);
      setOpen(false);
      // setTimeout(() => {
      //   dispatch(setShowFlix10KADSlice(false));
      // }, 1000);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      dispatch(setShowFlix10KADSlice(false));
    }, 500);
    //setModalLock(false);
  };

  if (!user?.firstTimeSubscription || paymentStatusAddStorage || paymentStatus) return null;

  return (
    <>
      {loader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000"/>
        </View>
      )}
      <Modal visible={open} transparent={true} animationType="fade" statusBarTranslucent>
        <View
          style={[
            styles.overlay,
            { paddingTop: insets.top, backgroundColor: "rgba(0,0,0,0.7)" },
          ]}
        >

          {/* <View style={[styles.modalContainer, { justifyContent: "center", alignItems: "center" }]}> */}

          {/* Ad Image */}
          {/*<TouchableOpacity onPress={handlePayRedirect} activeOpacity={0.8}>
              <Image source={{ uri: adImageUrl }} style={imageStyle} resizeMode="contain" />
            </TouchableOpacity>*/}
          {!videoEnded ? (
             <View
                style={{
                  width: SCREEN_WIDTH * 0.9,
                  height: (SCREEN_WIDTH * 0.9) * (16 / 9),
                  backgroundColor: "black",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
            <Video
              source={{ uri: adVideoUrl }}
              style={[videoStyle, { borderRadius: 16, backgroundColor: "black", }]}
              resizeMode="contain"
              shouldPlay
              isLooping={false}
              isMuted={muted}
              useNativeControls={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) setVideoEnded(true);
              }}
            />
            </View>
          ) : (
            <View style={styles.adContent}>
              <Image source={{ uri: adImageUrl }} style={styles.adImage} resizeMode="contain" />
              <Text style={styles.priceText}>{t('flix10k.onlyAt')} ${planData.amount} 🎉</Text>
              <Text style={styles.descText}>{t('flix10k.subscriptionNow')}</Text>
              <TouchableOpacity style={styles.subscribeBtn} onPress={handlePayRedirect}>
                <Text style={styles.subscribeBtnText}>{t('flix10k.subscribeNow')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.closeButton, videoEnded ? { top: insets.top + 150, right: 60 } : { top: insets.top + 25, right: 20 }]}
            onPress={handleClose}
          >
            <Ionicons name="close-circle" size={38} color={"white"} />
          </TouchableOpacity>

          {!videoEnded && (
            <TouchableOpacity
              style={[styles.muteButton, { top: insets.top + 25 }]}
              onPress={() => setMuted(!muted)}
            >
              <Ionicons name={muted ? "volume-mute" : "volume-high"} size={28} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    //backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    //top: 40,
    //right: 20,
    zIndex: 10,
  },
  muteButton: {
    position: "absolute",
    //top: 40,
    left: 22,
    zIndex: 10,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  adContent: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  adImage: {
    width: "65%",
    height: "35%",
    //marginBottom: 10,
  },
  priceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
  descText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  loginNowBtn: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  loginNowText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  subscribeBtn: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 30,
  },
  subscribeBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default FlixAdModal;


// import React, { useState, useEffect } from "react";
// import { Modal, View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
// import { useDispatch, useSelector } from "react-redux";
// import { Ionicons } from "@expo/vector-icons";
// import { setShowFlix10KADSlice } from "../state/slices/subscriptionSlice";
// import { Video } from "expo-av";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// const FlixAdModal = ({ handleSubscribe }) => {
//   const dispatch = useDispatch();
//   const user = useSelector((state) => state.auth);
//   const [open, setOpen] = useState(true);
//   const [muted, setMuted] = useState(false);
//   const [videoEnded, setVideoEnded] = useState(false);
//   const insets = useSafeAreaInsets();

//   const adVideoUrl = "https://babyflix.ai/flixad.mp4";
//   const adImageUrl = "https://babyflix.ai/flix10klogo.png"; // Your static image

//   const handleClose = () => {
//     setOpen(false);
//     setTimeout(() => dispatch(setShowFlix10KADSlice(false)), 500);
//   };

//   if (!user?.firstTimeSubscription) return null;

// return (
//   <Modal visible={open} transparent={true} animationType="fade">
//     <View
//       style={[
//         styles.overlay,
//         { paddingTop: insets.top, backgroundColor: "rgba(0,0,0,0.7)" },
//       ]}
//     >
//       {!videoEnded ? (
//         <Video
//           source={{ uri: adVideoUrl }}
//           style={[styles.videoStyle]}
//           resizeMode="cover"
//           shouldPlay
//           isLooping={false}
//           isMuted={muted}
//           useNativeControls={true}
//           onPlaybackStatusUpdate={(status) => {
//             if (status.didJustFinish) setVideoEnded(true);
//           }}
//         />
//       ) : (
//         <View style={styles.adContent}>
//           <Image source={{ uri: adImageUrl }} style={styles.adImage} resizeMode="contain" />
//           <Text style={styles.priceText}>Only at $19.99 🎉</Text>
//           <Text style={styles.descText}>Subscribe today and unlock full access.</Text>
//           <TouchableOpacity style={styles.subscribeBtn} onPress={handlePayRedirect}>
//             <Text style={styles.subscribeBtnText}>Subscription</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <TouchableOpacity
//         style={[styles.closeButton, videoEnded ? { top: insets.top + 140, right: 60 } : { top: insets.top + 10, right: 20 }]}
//         onPress={handleClose}
//       >
//         <Ionicons name="close-circle" size={38} color={"white"} />
//       </TouchableOpacity>

//       {!videoEnded && (
//         <TouchableOpacity
//           style={[styles.muteButton, { top: insets.top + 15 }]}
//           onPress={() => setMuted(!muted)}
//         >
//           <Ionicons name={muted ? "volume-mute" : "volume-high"} size={28} color="white" />
//         </TouchableOpacity>
//       )}
//     </View>
//   </Modal>
// );
// };

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   videoStyle: {
//     width: SCREEN_WIDTH * 0.9,
//     height: SCREEN_HEIGHT * 0.7,
//     borderRadius: 16,
//     backgroundColor: "black",
//   },
//   adContent: {
//     width: SCREEN_WIDTH * 0.7, // smaller width
//     height: SCREEN_HEIGHT * 0.4, // smaller height
//     borderRadius: 16,
//     backgroundColor: "#fff",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 15,
//   },
//   adImage: {
//     width: "65%",
//     height: "35%",
//     //marginBottom: 0,
//   },
//   priceText: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#000",
//     marginBottom: 16,
//     textAlign: "center",
//   },
//   descText: {
//     fontSize: 14,
//     color: "#333",
//     textAlign: "center",
//     marginBottom: 15,
//   },
//   subscribeBtn: {
//     backgroundColor: "#FF6B6B",
//     paddingVertical: 10,
//     paddingHorizontal: 30,
//     borderRadius: 8,
//     marginTop: 30,
//   },
//   subscribeBtnText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   closeButton: {
//     position: "absolute",
//     //right: 20,
//     zIndex: 10,
//   },
//   muteButton: {
//     position: "absolute",
//     left: 22,
//     zIndex: 10,
//   },
// });

// export default FlixAdModal;
