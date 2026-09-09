import axiosInstance from '../utils/axiosInstance';

/**
 * Fetch authenticated user profile details from MySQL
 */
export const getProfile = async () => {
  const response = await axiosInstance.get('/profile');
  return response.data?.data || response.data;
};

/**
 * Update permitted personal details (name, phone)
 */
export const updateProfile = async (profileData) => {
  const response = await axiosInstance.put('/profile', profileData);
  return response.data?.data || response.data;
};

/**
 * Change current user password
 */
export const changePassword = async (passwordData) => {
  const response = await axiosInstance.put('/profile/password', passwordData);
  return response.data?.data || response.data;
};

export default {
  getProfile,
  updateProfile,
  changePassword,
};
