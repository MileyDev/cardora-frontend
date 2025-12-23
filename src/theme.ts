import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: 'Quicksand, sans-serif', 
    body: 'Quicksand, sans-serif',    
  },
  colors: {
    brand: {
      500: '#2B6CB0', 
    },
  },
});

export default theme;