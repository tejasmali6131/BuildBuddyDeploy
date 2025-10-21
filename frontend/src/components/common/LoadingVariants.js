import React from 'react';
import Loading from './Loading';

// Quick loading wrappers for common scenarios
export const PageLoading = ({ message = "Loading page..." }) => (
  <Loading 
    fullScreen={true}
    type="buildbuddy"
    message={message}
    size="large"
  />
);

export const ComponentLoading = ({ message = "Loading..." }) => (
  <Loading 
    type="spinner"
    message={message}
    size="medium"
  />
);

export const FormLoading = ({ message = "Processing..." }) => (
  <Loading 
    overlay={true}
    type="dots"
    message={message}
    size="medium"
  />
);

export const SmallLoading = ({ message = "" }) => (
  <Loading 
    type="spinner"
    message={message}
    size="small"
  />
);

export const ThemeLoading = ({ message = "Building your experience..." }) => (
  <Loading 
    fullScreen={true}
    type="buildbuddy"
    message={message}
    size="large"
  />
);

export default {
  PageLoading,
  ComponentLoading,
  FormLoading,
  SmallLoading,
  ThemeLoading
};