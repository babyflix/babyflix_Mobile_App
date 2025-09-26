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
  const [muted, setMuted] = useState(false);

  const adVideoUrl = "https://babyflix.ai/flixad.mp4";

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
  };

  if (!user?.firstTimeSubscription || paymentStatusAddStorage || paymentStatus) return null;

  return (
    <>
      {loader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}
      <Modal visible={open} transparent={true} animationType="fade" onRequestClose={() => { }}>
        <View style={styles.overlay}>
          {/* <View style={[styles.modalContainer, { justifyContent: "center", alignItems: "center" }]}> */}

          {/* Ad Image */}
          {/*<TouchableOpacity onPress={handlePayRedirect} activeOpacity={0.8}>
              <Image source={{ uri: adImageUrl }} style={imageStyle} resizeMode="contain" />
            </TouchableOpacity>*/}
          <TouchableOpacity onPress={handlePayRedirect} activeOpacity={0.9}>
            <Video
              source={{ uri: adVideoUrl }}
              style={[videoStyle, { backgroundColor: "black", borderRadius: 16, }]}
              resizeMode="cover"
              shouldPlay
              isLooping
              isMuted={muted}
              useNativeControls={false}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close-circle" size={38} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.muteButton}
            onPress={() => setMuted(!muted)}
          >
            <Ionicons
              name={muted ? "volume-mute" : "volume-high"}
              size={28}
              color="white"
            />
          </TouchableOpacity>
          {/* </View> */}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
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
    top: 40,
    right: 20,
    zIndex: 10,
  },
  muteButton: {
    position: "absolute",
    top: 40,
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
});

export default FlixAdModal;

