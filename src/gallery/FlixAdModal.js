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
import { MaterialIcons } from "@expo/vector-icons";
import { setShowFlix10KADSlice } from "../state/slices/subscriptionSlice";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  const adImageUrl = "https://dev.babyflix.net/flixad.png";

  // store calculated image style
  const [imageStyle, setImageStyle] = useState({ width: 200, height: 200 });

  useEffect(() => {
    if (adImageUrl) {
      Image.getSize(adImageUrl, (width, height) => {
        let finalWidth = width;
        let finalHeight = height;

        // scale down if larger than screen
        if (width > SCREEN_WIDTH * 0.9 || height > SCREEN_HEIGHT * 0.6) {
          const widthRatio = (SCREEN_WIDTH * 0.9) / width;
          const heightRatio = (SCREEN_HEIGHT * 0.6) / height;
          const scale = Math.min(widthRatio, heightRatio);

          finalWidth = width * scale;
          finalHeight = height * scale;
        }

        setImageStyle({
          width: finalWidth,
          height: finalHeight,
          borderRadius: 12,
        });
      });
    }
  }, [adImageUrl]);

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

     if (paymentStatusAddStorage) {
      return; // don't show modal
    }

    if (user?.firstTimeSubscription && user?.showFlixAd && paymentSuccess) {
      dispatch(setShowFlix10KADSlice(true));
      setTimeout(() => {
        setOpen(true);
        setMonths(2);
        setAutoRenew(false);
        setShowFlix10KAd(user?.showFlixAd);
      }, 1000);
    }

  }, [user?.firstTimeSubscription, paymentSuccess]);

  const handlePayRedirect = async () => {
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

  if (!user?.firstTimeSubscription || paymentStatusAddStorage) return null;

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
              <MaterialIcons name="close" size={24} color="black" />
            </TouchableOpacity>

            {/* Ad Image */}
            <TouchableOpacity onPress={handlePayRedirect} activeOpacity={0.8}>
              <Image source={{ uri: adImageUrl }} style={imageStyle} resizeMode="contain" />
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
    backgroundColor: "#fff",
    position: "relative",
    padding: 20,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 999,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: "50%",
    padding: 5
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

