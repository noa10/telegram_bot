/**
 * Format error message from API response
 * @param {Error} error - Error object from axios
 * @returns {string} - Formatted error message
 */
export const formatErrorMessage = (error) => {
  // Default error message
  let message = 'An unexpected error occurred. Please try again.';
  
  if (!error) {
    return message;
  }
  
  // Handle axios error
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { data } = error.response;
    
    if (data.error && typeof data.error === 'string') {
      // Simple error message
      message = data.error;
    } else if (data.error && data.error.message) {
      // Structured error message
      message = data.error.message;
      
      // Add field-specific errors if available
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        const fieldErrors = data.errors
          .map(err => `${err.field}: ${err.message}`)
          .join(', ');
        
        message = `${message} (${fieldErrors})`;
      }
    } else if (data.message) {
      // Direct message property
      message = data.message;
    }
  } else if (error.request) {
    // The request was made but no response was received
    message = 'No response from server. Please check your internet connection.';
  } else if (error.message) {
    // Something happened in setting up the request that triggered an Error
    message = error.message;
  }
  
  return message;
};

/**
 * Create an error handler for API requests
 * @param {Function} setError - Function to set error state
 * @param {Function} setLoading - Function to set loading state (optional)
 * @returns {Function} - Error handler function
 */
export const createErrorHandler = (setError, setLoading = null) => {
  return (error) => {
    const errorMessage = formatErrorMessage(error);
    setError(errorMessage);
    
    if (setLoading) {
      setLoading(false);
    }
    
    // Log error for debugging
    console.error('API Error:', error);
  };
};
