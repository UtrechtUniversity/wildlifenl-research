import { InteractionType } from '../types/interactiontype';
const API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/interactions/';


const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getAllInteractions = async (): Promise<InteractionType[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      console.error('Failed to fetch interaction types:', errorData);
      throw new Error('Failed to fetch interaction types');
    }
  } catch (error) {
    console.error('Error fetching interaction types:', error);
    throw error;
  }
};