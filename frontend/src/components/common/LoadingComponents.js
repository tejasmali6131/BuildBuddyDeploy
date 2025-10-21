// Main loading components
export { default as Loading } from './Loading';
export { default as LoadingButton } from './LoadingButton';

// Loading variants
export {
  PageLoading,
  ComponentLoading,
  FormLoading,
  SmallLoading,
  ThemeLoading
} from './LoadingVariants';

// Re-export everything as default for convenience
import Loading from './Loading';
import LoadingButton from './LoadingButton';
import {
  PageLoading,
  ComponentLoading,
  FormLoading,
  SmallLoading,
  ThemeLoading
} from './LoadingVariants';

export default {
  Loading,
  LoadingButton,
  PageLoading,
  ComponentLoading,
  FormLoading,
  SmallLoading,
  ThemeLoading
};