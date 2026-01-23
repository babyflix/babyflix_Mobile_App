// import RNFS from 'react-native-fs';
// import { logger } from 'react-native-logs';

// const config = {
//   severity: 'debug',
//   transport: async (props) => {
//     const logLine = `[${new Date().toISOString()}][${props.level.text}] ${props.msg.join(' ')}\n`;
//     console.log(logLine); // still print in console
//     await RNFS.appendFile(RNFS.DocumentDirectoryPath + '/app_logs.txt', logLine);
//   },
// };

// const log = logger.createLogger(config);
// export default log;

// logger.js
import * as FileSystem from 'expo-file-system';
import { logger } from 'react-native-logs';

// Path to your log file
const logFilePath = FileSystem.documentDirectory + 'app_logs.txt';

const config = {
  severity: 'debug',
  transport: async (props) => {
    const logLine = `[${new Date().toISOString()}][${props.level.text}] ${props.msg.join(' ')}\n`;
    
    // Print in console (still works)
    console.log(logLine);

    try {
      // Append log to file
      await FileSystem.writeAsStringAsync(logFilePath, logLine, {
        encoding: FileSystem.EncodingType.UTF8,
        append: true,
      });
    } catch (err) {
      console.error('Failed to write log to file:', err);
    }
  },
};

const log = logger.createLogger(config);

export default log;
