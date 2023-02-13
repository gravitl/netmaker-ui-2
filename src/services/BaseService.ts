import axios from 'axios';

export const baseService = axios.create({
  baseURL: process.env.REACT_BASE_URL,
});

// function to resolve the particular SaaS tenant's backend URL
export function getBaseUrl() {}
