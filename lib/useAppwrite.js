import { useEffect, useState } from 'react';
import { Alert } from 'react-native'; // Import Alert for correct usage

const useAppwrite = (fn) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fn(); // Calling the function passed as an argument
      setData(response);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Call the function when the component mounts
  }, [fn]); // Include fn as a dependency

  const refetch = () => fetchData(); // Function to manually refetch data

  return { data, isLoading, refetch }; // Return refetch function
};

export default useAppwrite;

