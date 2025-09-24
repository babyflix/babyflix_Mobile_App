// import React, { useState, useEffect } from "react";
// import { Modal, View, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
// import { useDispatch, useSelector } from "react-redux";
// import * as WebBrowser from "expo-web-browser";
// import { MaterialIcons } from "@expo/vector-icons";
// import { NEXT_PUBLIC_SHOWFLIXAD, } from '@env';
// import { setShowFlix10KADSlice } from "../state/slices/subscriptionSlice";
// import { useTranslation } from "react-i18next";

// const FlixAdModal = ({
//   paymentSuccess,
//   handleSubscribe,
//   months,
//   setMonths,
//   autoRenew,
//   setAutoRenew,
//   setShowFlix10KAd,
//   setMessage
// }) => {
//  const { t } = useTranslation();
//  const user = useSelector((state) => state.auth);
//  const dispatch = useDispatch();
//   const [open, setOpen] = useState(false);
//   const [loader, setLoader] = useState(false);
//   //const [message, setMessage] = useState("");
//   //const adImageUrl = require("../../assets/flixad.png"); // replace with your local image path
// const adImageUrl = "https://dev.babyflix.net/flixad.png";
//   useEffect(() => {
//     console.log("Flix10KAdd",user?.firstTimeSubscription, user?.showFlixAd, paymentSuccess)
//     if (
//       user?.firstTimeSubscription &&
//       user?.showFlixAd &&
//       paymentSuccess
//     ) {
//       dispatch(setShowFlix10KADSlice(true));
//       setTimeout(() => {
//       setOpen(true);
//       setMonths(2);
//       setAutoRenew(false);
//       setShowFlix10KAd(user?.showFlixAd)
//        }, 1000);
//     }
//   }, [user?.firstTimeSubscription, paymentSuccess]);

//   // Use the passed handleSubscribe instead of a hardcoded handle
//   const handlePayRedirect = async () => {
//     if (!handleSubscribe) return;

//     setLoader(true);
//     try {
//       await handleSubscribe(); // pass months and autoRenew from parent

//       if (
//         user?.firstTimeSubscription &&
//         user?.showFlixAd &&
//         paymentSuccess && months === 2 && !autoRenew
//       ) {
//         setMessage(t("flix10k.subscriptionSuccessWithMonths"));
//         }else{
//         setMessage(t("flix10k.subscriptionSuccess"))
//       }
//     } catch (err) {
//       console.error("Subscription error:", err);
//       alert("Something went wrong with subscription.");
//     } finally {
//       setLoader(false);
//       setOpen(false); // close modal after subscription
//       setTimeout(() => {
//       dispatch(setShowFlix10KADSlice(false));
//       }, 1000);
//     }
//   };

//   const handleClose = () => {
//     setOpen(false);
//     setTimeout(() => {
//         dispatch(setShowFlix10KADSlice(false));
//     }, 1000);
//   };

//   if (!user?.firstTimeSubscription) return null;

//   return (
//     <>
//       {loader && (
//         <View style={styles.loaderContainer}>
//           <ActivityIndicator size="large" color="#000" />
//         </View>
//       )}
//       <Modal
//         visible={open}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => {}} // disable Android back button close
//       >
//         <View style={styles.overlay}>
//           <View style={[styles.modalContainer, {justifyContent:'center'}]}>
//             {/* Close Button */}
//             <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
//               <MaterialIcons name="close" size={24} color="black" />
//             </TouchableOpacity>

//             {/* Ad Image */}
//             <View>
//             <TouchableOpacity style={{justifyContent:'center', alignItems:'center'}} onPress={handlePayRedirect} activeOpacity={0.8}>
//                 <Image
//                 source={adImageUrl }
//                 style={styles.adImage}
//                 resizeMode="contain"
//                 />
//             </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalContainer: {
//     width: "90%",
//     height: "60%", 
//     borderRadius: 16,
//     overflow: "hidden",
//     backgroundColor: "#fff",
//     position: "relative",
//   },
//   closeButton: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     zIndex: 999,
//   },
//   adImage: {
//     width: "90%",
//     //height: "90%", 
//     height: 350,  // fixed height
//     borderRadius: 12,
//   },
//   loaderContainer: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(255,255,255,0.7)",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 10,
//   },
// });

// export default FlixAdModal;

import React, { useState, useEffect } from "react";
import { Modal, View, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { setShowFlix10KADSlice } from "../state/slices/subscriptionSlice";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";

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
}) => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const paymentStatusAdd = useSelector((state) => state.subscription.paymentStatusAdd);
  const [open, setOpen] = useState(false);
  const [loader, setLoader] = useState(false);
  const [paymentStatusAddStorage, setPaymentStatusAddStorage] = useState(null);
const [paymentStatus, setPaymentStatus] = useState(false);
const [muted, setMuted] = useState(true);

  const adVideoUrl  = "https://dev.babyflix.net/flixad.mp4";

  // store calculated image style
  const [videoStyle, setVideoStyle] = useState({ width: SCREEN_WIDTH * 0.95,
  height: (SCREEN_WIDTH * 0.95) * 15/16, // 16:9 aspect ratio
  borderRadius: 16 });

useEffect(() => {
  const getPaymentStatus = async () => {
    const status = await AsyncStorage.getItem('forAdd');
    console.log(status)
    if (status === 'done' || status === 'fail') {
      setPaymentStatus(true); // already paid
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
          setPaymentStatusAddStorage(status); // "done" or "fail"
  
        }
      } catch (err) {
        console.error("Error reading AsyncStorage flix10kPaymentForAdd:", err);
      }
    };
    fetchPaymentStatus();
  }, []);

  useEffect(() => {

     if (paymentStatusAddStorage || paymentStatus) {
      return; // don't show modal
    }

    if (user?.firstTimeSubscription && user?.showFlixAd && paymentSuccess) {
      dispatch(setShowFlix10KADSlice(true));
      setTimeout(() => {
        setOpen(true);
        setMonths(1);
        setAutoRenew(false);
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
      // if (user?.firstTimeSubscription && user?.showFlixAd && paymentSuccess && months === 2 && !autoRenew) {
      //   setMessage(t("flix10k.subscriptionSuccessWithMonths"));
      // } else {
      //   setMessage(t("flix10k.subscriptionSuccess"));
      // }
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
    }, 1000);
  };

  if (!user?.firstTimeSubscription || paymentStatusAddStorage || paymentStatus) return null;

  return (
    <>
      {loader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}
      <Modal visible={open} transparent={true} animationType="fade" onRequestClose={() => {}}>
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { justifyContent: "center", alignItems: "center" }]}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <MaterialIcons name="close" size={26} color="white" />
            </TouchableOpacity>

            {/* Ad Image */}
            {/*<TouchableOpacity onPress={handlePayRedirect} activeOpacity={0.8}>
              <Image source={{ uri: adImageUrl }} style={imageStyle} resizeMode="contain" />
            </TouchableOpacity>*/}
            <TouchableOpacity onPress={handlePayRedirect} activeOpacity={0.9}>
              <Video
                source={{ uri: adVideoUrl }}
                style={[videoStyle, { backgroundColor: "black" }]}
                resizeMode="contain"
                shouldPlay       // auto play
                isLooping  
                isMuted={muted}    
                useNativeControls={false} // hide play/pause controls
              />
            </TouchableOpacity>

             <TouchableOpacity
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 20,
            padding: 6,
            zIndex: 999,
          }}
          onPress={() => setMuted(!muted)}
        >
          <Ionicons
            name={muted ? "volume-mute" : "volume-high"}
            size={22}
            color="white"
          />
        </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    height: "auto",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "black",
    position: "relative",
    padding: 10,
    paddingTop: 40
  },
  closeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 999,
    backgroundColor: "black",
    borderRadius: "50%",
    padding: 3,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});

export default FlixAdModal;

