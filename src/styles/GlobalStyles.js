import { StyleSheet, Platform } from 'react-native';
import Colors from '../constants/Colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
        elevation: 2,
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