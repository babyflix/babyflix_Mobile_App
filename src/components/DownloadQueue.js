// // DownloadQueue.js
// let queue = [];
// let isProcessing = false;

// const addToQueue = (item, options) => {
//   queue.push({ item, options });
//   processQueue();
// };

// const processQueue = async () => {
//   if (isProcessing || queue.length === 0) return;

//   isProcessing = true;
//   const { item, options } = queue.shift();

//   try {
//     await options.downloadHandler(item, options);
//   } catch (error) {
//     console.error('Download failed:', error.message);
//     options.setSnackbarMessage(`Failed to download ${item.title}. Skipping...`);
//     options.setSnackbarType('error');
//     options.setSnackbarVisible(true);
//   } finally {
//     isProcessing = false;
//     processQueue(); // Continue with next
//   }
// };

// export default {
//   addToQueue,
// };


// let queue = [];
// let isProcessing = false;

// const addToQueue = (item, options) => {
//   queue.push({ item, options });
//   processQueue();
// };

// const processQueue = async () => {
//   if (isProcessing || queue.length === 0) return;

//   isProcessing = true;
//   const { item, options } = queue.shift();

//   // ✅ Show floating progress bar immediately
//   options.setDownloadTitle(item.title);
//   options.setProgressValue(0);
//   options.setDownloadingProgress(true);

//   try {
//     await options.downloadHandler(item, {
//       ...options,
//       setDownloadTitle: options.setDownloadTitle,
//       setProgressValue: options.setProgressValue,
//       setDownloadingProgress: options.setDownloadingProgress,
//     });
//   } catch (error) {
//     console.error('Download failed:', error.message);
//     options.setSnackbarMessage(`Failed to download ${item.title}. Skipping...`);
//     options.setSnackbarType('error');
//     options.setSnackbarVisible(true);
//   } finally {
//     isProcessing = false;

//     // ✅ Hide progress bar if no more downloads pending
//     if (queue.length === 0) {
//       options.setDownloadingProgress(false);
//       options.setDownloadTitle('');
//       options.setProgressValue(0);
//     }

//     processQueue(); // 🔁 Next item
//   }
// };

// export default {
//   addToQueue,
// };

let queue = [];
let isProcessing = false;

const addToQueue = (item, options) => {
  queue.push({ item, options });
  processQueue();
};

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;
  const { item, options } = queue.shift();

  // ✅ Show progress UI
  options.setDownloadTitle(item.title);
  options.setProgressValue(0);
  options.setDownloadingProgress(true);

  try {
    // ✅ Pick correct download handler
    await options.downloadHandler(item, {
      ...options,
      setDownloadTitle: options.setDownloadTitle,
      setProgressValue: options.setProgressValue,
      setDownloadingProgress: options.setDownloadingProgress,
    });
  } catch (error) {
    console.error('Download failed:', error.message);
    options.setSnackbarMessage(`Failed to download ${item.title}. Skipping...`);
    options.setSnackbarType('error');
    options.setSnackbarVisible(true);
  } finally {
    isProcessing = false;

    // ✅ If queue empty, reset floating bar
    if (queue.length === 0) {
      options.setDownloadingProgress(false);
      options.setDownloadTitle('');
      options.setProgressValue(0);
    }

    processQueue(); // ➡️ Next item
  }
};

export default {
  addToQueue,
};

