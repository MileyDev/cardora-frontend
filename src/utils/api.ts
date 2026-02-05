import axios from "axios";

export const API_BASE_URL = 'https://api.cardora.net/api';

const token = localStorage.getItem('token');

export const fetchRates = async () => {
    if (!token) return;

    try {
        const response = await axios.get(`${API_BASE_URL}/rates`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        return response.data;
    } catch (error: any) {
        throw error;
    }
}