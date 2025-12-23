import { useEffect, useState } from "react";

interface StorageData {
  used?: number;
  quota?: number;
}

const useEstimateStorage = (): StorageData => {
  const [storageData, setStorageData] = useState<StorageData>({
    used: 0,
    quota: 0
  });

  useEffect(() => {
    const updateStorageUsage = () => {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        navigator.storage.estimate().then(({ usage, quota }) => {
          setStorageData({
            used: usage,
            quota: quota
          });
        });
      }
    };

    updateStorageUsage();

    // Optionally, you might want to implement polling
    const interval = setInterval(updateStorageUsage, 60000); // Update usage every minute

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return storageData;
};

export default useEstimateStorage;
