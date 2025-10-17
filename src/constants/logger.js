import RNFS from 'react-native-fs';
import { logger } from 'react-native-logs';

const config = {
  severity: 'debug',
  transport: async (props) => {
    const logLine = `[${new Date().toISOString()}][${props.level.text}] ${props.msg.join(' ')}\n`;
    console.log(logLine); // still print in console
    await RNFS.appendFile(RNFS.DocumentDirectoryPath + '/app_logs.txt', logLine);
  },
};

const log = logger.createLogger(config);
export default log;
