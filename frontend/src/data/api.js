// API service for fetching dynamic content
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Export the base URL for use in other components
export const API_BASE_URL_EXPORT = API_BASE_URL;

export const api = {
  // Fetch platform statistics
  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalProjects: 0,
        totalArchitects: 0,
        avgRating: 0,
        totalUsers: 0
      };
    }
  },

  // Fetch testimonials
  getTestimonials: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/testimonials`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      return [];
    }
  },

  // Fetch features
  getFeatures: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/features`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching features:', error);
      return [];
    }
  },

  // Submit contact form
  submitContact: async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error submitting contact:', error);
      throw error;
    }
  },

  // Submit project
  submitProject: async (projectData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error submitting project:', error);
      throw error;
    }
  }
};

export default api;