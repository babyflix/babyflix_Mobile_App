let queue = [];
let isProcessing = false;

const addToQueue = (item, options) => {
  // queue.push({ item, options });
  // processQueue();
  const exists = queue.some(q => q.item.id === item.id);
  if (!exists) {
    queue.push({ item, options });
    processQueue();
  }
};

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;
  const { item, options } = queue.shift();

  options.setDownloadTitle(item.title);
  options.setProgressValue(0);
  options.setDownloadingProgress(true);

  try {
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

    if (queue.length === 0) {
      options.setDownloadingProgress(false);
      options.setDownloadTitle('');
      options.setProgressValue(0);
    }

    processQueue();
  }
};

export default {
  addToQueue,
};