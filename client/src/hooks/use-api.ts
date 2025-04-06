import { useEffect, useState } from 'react';
import axios from 'axios';

export const useApi = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const makeRequest = async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    token: string,
    data?: any,
    errorMessage: string = 'Request failed',
    showToast: boolean = method !== 'GET'
  ) => {
    setIsLoading(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const url = `${API_URL}${endpoint}`;

    try {
      const response = await axios.request({
        method,
        url,
        data,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { makeRequest, isLoading };
};
