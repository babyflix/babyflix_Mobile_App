import { useEffect } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/Colors';
import useAndroidNavBarHeight from './useAndroidNavBarHeight';

// `keepHidden`: while true, keyboardDidHide won't restore the tab bar.
// Needed because MessagesScreen also hides the tab bar for the entire time
// a chat is open (independent of keyboard state) — without this, closing
// the keyboard while inside a chat made this hook's keyboardDidHide handler
// unconditionally restore the tab bar (display:'flex' + real height),
// overriding that "stay hidden" rule and reserving that space again at the
// bottom of the chat screen.
const useKeyboardTabBarEffect = (keepHidden = false) => {
  const navigation = useNavigation();
  const androidNavBarExtra = useAndroidNavBarHeight();

  useEffect(() => {
    const parent = navigation.getParent();
    // Must match app/(app)/_layout.js's own tabBarStyle sizing — this hook
    // replaces that style wholesale on keyboard hide, so without the same
    // Android 3-button-nav-bar adjustment here, coming back from the
    // Messages screen re-introduces the exact bug that was just fixed
    // globally.

    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      if (!parent) return;
      if (keepHidden) {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
        return;
      }
      parent.setOptions({
        tabBarStyle: {
          display: 'flex',
          // Deliberately NOT position: 'absolute' — that pulled the bar
          // out of the normal safe-area-aware layout flow and let it
          // anchor to the literal screen edge, behind the system nav
          // bar, regardless of the height/padding math below. The
          // default tab bar (app/(app)/_layout.js) doesn't use absolute
          // positioning either, so this now matches it.
          backgroundColor: 'white',
          height: 65 + androidNavBarExtra,
          paddingBottom: 5 + androidNavBarExtra,
          paddingTop: 5,
          borderTopColor: Colors.border,
        },
      });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [androidNavBarExtra, keepHidden]);
};

export default useKeyboardTabBarEffect;
