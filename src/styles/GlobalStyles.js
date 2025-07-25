import { StyleSheet, Platform } from 'react-native';
import Colors from '../constants/Colors';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: Colors.white,
    paddingLeft: 40,
    fontFamily: 'Poppins_400Regular',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    //marginTop:3,
  },
  resetButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIconPosition: {
    marginTop: 2,
    marginEnd: 5,
    paddingBlockEnd: 10,
    position: 'relative',
    top: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 15,
    marginTop: 40,
  },
  bolttext: {
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'left',
    color: Colors.black,
    marginBottom: 15,
    marginTop: 60,
  },
  error: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 10,
  },
  link: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textDecorationLine: 'underline',
  },
  screenPadding: {
    padding: 20,
  },
  registrationScreenPadding: {
    paddingLeft: 20,
    paddingRight: 20
  },
  row: {
    flexDirection: 'row',
    alignItems: 'end',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  textInputIcon: {
    paddingLeft: 38,
    color: Colors.textSecondary,
    height: 55,
    fontFamily: 'Poppins_400Regular',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  svgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  svgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    zIndex: 1,
  },
  allMarginLeft: {
    marginLeft: 3,
  },
  allMarginRight: {
    marginRight: 3,
  },
  registerButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    height: 55,
  },
  resetButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'center',
    height: 55,
  },
});

import { Dimensions } from 'react-native';
const screenWidth = Dimensions.get('window').width;

export const modalStyles = {
  delModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  delModalContainer: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
  },

  delModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 10,
    textAlign: 'center',
    color: 'black', // override in modal if needed (e.g., red for delete)
  },

  delModalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: 20,
    color: '#444',
  },

  delModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },

  delModalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
  },

  delModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_500Medium',
  },

  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 1,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 10,
  },
  messageBox: {
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 5,
  },
  mobileInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  countryCodeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    padding: 8,
    marginHorizontal: 5,
    textAlign: "center",
    borderRadius: 8,
  },
  mobileInput: {
    height: 50,
    width: 185,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    padding: 8,
    paddingLeft: 37,
    borderRadius: 8,
    marginRight: 5,
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  addMoreText: {
    marginLeft: 5,
    color: Colors.primary,
    fontSize: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginLeft: 5,
    marginTop: 10,
  },
  preview: {
  width: '100%',
  height: 200,
  alignItems: 'center',  // Center content horizontally
  padding: 15,
  borderRadius: 12,
  backgroundColor: Colors.white,
  ...Platform.select({
    ios: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
},

previewImage: {
  width: '100%',
  height: 100,
  aspectRatio: 16 / 9,  // This gives 16:9 ratio (e.g., 300x168), works for both video & image
  borderRadius: 8,
},

previewImages: {
  width: screenWidth * 0.65,  // 80% of screen width
  height: (screenWidth * 0.7) * 9 / 16,  // maintain 16:9 ratio
  borderRadius: 8,
},

};
