import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Platform,
} from 'react-native';
import GlobalStyles from '../styles/GlobalStyles';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ManageSubscriptions from '../screens/ManageSubscriptions.js';
import CustomSwipeTabs from '../constants/CustomSwipeTabs.js';
import ProfileTab from './ProfileTab.js';
import { useFocusEffect, useRouter } from 'expo-router';
import StorageTab from './StorageTab.js';
import { setStorageTab } from '../state/slices/subscriptionSlice.js';


const ProfileSettingsScreen = ({ route }) => {

  const user = useSelector((state) => state.auth);
  const { subscriptionAmount, subscriptionId, subscriptionIsActive } = useSelector(
    (state) => state.auth
  );

  const dispatch = useDispatch();
  const storagePlanPrice = useSelector((state) => state.auth.storagePlanPrice);
  const storagePlanId = useSelector((state) => state.auth.storagePlanId);
  const storagePlanExpired = useSelector((state) => state.auth.storagePlanExpired);

  const expired = useSelector((state) => state.subscription.expired);
  const storageTab = useSelector((state) => state.subscription.storageTab);
  const subscriptionActive = subscriptionIsActive
  const insets = useSafeAreaInsets();

  const { t } = useTranslation();

  //  useEffect(() => {
  //   if (expired) {
  //     // reset the flag once used
  //     dispatch(setSubscriptionExpired(false));
  //   }
  // }, [expired, dispatch]);

 useFocusEffect(
  useCallback(() => {
    // Screen focused, do nothing
    return () => {
      // Screen blurred/unmount: reset storageTab
      dispatch(setStorageTab(false));
    };
  }, [])
);

  const tabs = [
    { label: t("flix10k.profile"), icon: "person-circle", component: <ProfileTab /> },
  ];

if (subscriptionActive && subscriptionId) {
  tabs.push({
    label: t("flix10k.subscriptions"),
    icon: "card-outline",
    component: <ManageSubscriptions />,
  });
}

if (storagePlanPrice && storagePlanId) {
tabs.push({
  label: t("Storage"),
  icon: "cloud-outline",
  component: <StorageTab />,
});
}

let initialIndex = 0;
tabs.forEach((tab, index) => {
  if (storageTab && tab.label === "Storage") initialIndex = index;
  else if (!storageTab && expired && tab.label.toLowerCase().includes("subscription")) initialIndex = index;
});

// Add a key to force remount when tab changes
const swipeTabsKey = storageTab ? "storage-tab" : expired ? "subscription-tab" : "profile-tab";

  return (
    <View style={[GlobalStyles.container, Platform.OS === 'android' ? { paddingTop: insets.top } : null]}>
      <Header title={t('profileSettings.title')} showMenu={false} />

      {/* <Tab.Navigator
        initialRouteName={subscriptionActive ? "Subscriptions" : "Profile"}
        //initialRouteName=  {initialTab}
        screenOptions={{
          tabBarIndicatorStyle: { backgroundColor: Colors.primary },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.gray,
          tabBarLabelStyle: { fontFamily: 'Nunito700', fontSize: 16 },
          swipeEnabled: true,
          tabBarStyle: !subscriptionActive && { display: "none" },
        }}
      >
        <Tab.Screen
          name="Profile"
          options={{
            tabBarLabel: ({ color }) => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="person-circle" size={20} color={color} />
                <Text style={{ color, marginLeft: 6, fontFamily: "Nunito700" }}>
                  {t("flix10k.profile")}
                </Text>
              </View>
            ),
          }}
          component={ProfileTab}
        />
        {(subscriptionActive && subscriptionId) && (
          <Tab.Screen
            name="Subscriptions"
            options={{
              tabBarLabel: ({ color }) => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="card-outline" size={20} color={color} />
                  <Text style={{ color, marginLeft: 6, fontFamily: "Nunito700" }}>
                    {t("flix10k.subscriptions")}
                  </Text>
                </View>
              ),
            }}
            component={ManageSubscriptions}
          />
        )}
      </Tab.Navigator> */}

      <CustomSwipeTabs  key={swipeTabsKey}  tabs={tabs} initialIndex={initialIndex} />

    </View>
  );
};

export default ProfileSettingsScreen;
