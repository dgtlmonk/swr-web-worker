
import React, { useEffect, useState } from "react";
import { getDataFromDB, saveDataToDB } from "./db";

const REVALIDATION_INTERVAL = 30 * 1000; // 30 seconds
const CACHE_THRESHOLD = 5000; // 5 seconds


// Define the type for the data object stored in IndexedDB
interface DataItem {
  id: string;
  [key: string]: any;  // Generic object structure with an id field
}

const App: React.FC = () => {
  const [data, setData] = useState<DataItem[] | null>(null);  // Data can be an array of DataItem or null
  const [loading, setLoading] = useState<boolean>(true);

 // Function to fetch and cache fresh data
  const fetchFreshData = () => {
    console.log('revalidating data ...');
    
    const worker = new Worker(new URL("./worker.js", import.meta.url));
    worker.postMessage("fetchFreshData");

    worker.onmessage = (event: MessageEvent<DataItem[]>) => {
      const freshData = event.data;

      console.log('freshData ', freshData)

      // Update IndexedDB with fresh data and update the timestamp
      const dataWithTimestamp = freshData.map((item) => ({
        ...item,
        timestamp: Date.now(), // Add or update timestamp
      }));

      saveDataToDB(dataWithTimestamp).then(() => {
        setData(dataWithTimestamp);
        setLoading(()=>false)
      });
    };

    return () => worker.terminate();
  };
  

  useEffect(() => {
    // Step 1: Load stale data from IndexedDB
    getDataFromDB()
      .then((cachedData: DataItem[]) => {
        const now = Date.now();
        const isCachedDataStale = now - cachedData[0]?.timestamp < CACHE_THRESHOLD

        // Step 2: Check if cached data is fresh (less than 5 seconds old)
        if (cachedData.length > 0 && isCachedDataStale ) {
          setData(cachedData);
          setLoading(() => false);
        } else {
          // Data is stale, so fetch fresh data
          fetchFreshData();
        }
      })
      .catch((error) => {
        console.error("Failed to get data from IndexedDB", error);
      })

    // Step 3: Set up the revalidation interval every 30 seconds
    const interval = setInterval(() => {
      fetchFreshData();
    }, REVALIDATION_INTERVAL);

    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Data from IndexedDB (with Stale-While-Revalidate)</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default App;

