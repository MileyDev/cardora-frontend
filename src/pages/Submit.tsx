// src/pages/Submit.tsx
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Select,
  Button,
  VStack,
  useToast,
  useColorModeValue,
  Spinner,
  Image,
  Text,
  HStack,
  Badge,
  FormHelperText,
  Alert,
  AlertIcon,
  Skeleton,
  Input,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface Rate {
  giftCardType: string;
  exchangeRate: number; // NGN per unit (usually per $1)
  currency?: string; // e.g. "USD" – optional
  updatedAt?: string; // optional
}

const Submit = () => {
  const [giftCardType, setGiftCardType] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const accentColor = useColorModeValue('green.600', 'green.400');

  // Fetch live rates from backend
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoadingRates(true);
        setRatesError(null);

        const token = localStorage.getItem('token');
        const response = await axios.get<Rate[]>('https://api.cardora.net/api/rates', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        console.log('Fetched rates:', response.data);

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setRates(response.data);
        } else {
          throw new Error('No rates available');
        }
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to load current rates';
        setRatesError(message);
        console.log(message);
        toast({
          title: 'Rates Unavailable',
          description: `${message}. Using fallback rates.`,
          status: 'warning',
          duration: 6000,
        });
        // Optional fallback rates
        setRates([
          { giftCardType: 'Amazon', exchangeRate: 1450 },
          { giftCardType: 'iTunes', exchangeRate: 1380 },
          { giftCardType: 'Google Play', exchangeRate: 1320 },
          { giftCardType: 'Steam', exchangeRate: 1500 },
          // ... more fallback if needed
        ]);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
  }, [toast]);

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast({ title: 'Maximum 5 images allowed', status: 'warning' });
      return;
    }

    const newPreviews: string[] = [];
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') newPreviews.push(reader.result);
      };
      reader.readAsDataURL(file);
    });

    setImages(prev => [...prev, ...files.filter(f => f.type.startsWith('image/'))]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const getEstimatedNgn = (): number | null => {
    if (!value || !giftCardType || rates.length === 0) return null;

    const usdValue = parseFloat(value);
    if (isNaN(usdValue) || usdValue <= 0) return null;

    const rateObj = rates.find(r => r.giftCardType === giftCardType);
    if (!rateObj) return null;

    return usdValue * rateObj.exchangeRate;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!giftCardType || !value || parseFloat(value) <= 0 || images.length === 0) {
      toast({ title: 'Please complete all required fields', status: 'warning' });
      return;
    }

    if (ratesError && rates.length === 0) {
      toast({ title: 'Cannot submit', description: 'Rates not available', status: 'error' });
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const formData = new FormData();
      formData.append('giftCardType', giftCardType);
      formData.append('value', value);

      images.forEach(file => {
        formData.append('images', file);
      });

      await axios.post('https://api.cardora.net/api/transactions', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Submitted Successfully',
        description: 'Gift card received. Well review and credit your wallet in NGN soon.',
        status: 'success',
        duration: 7000,
      });

      // Reset form
      setGiftCardType('');
      setValue('');
      setImages([]);
      setImagePreviews([]);

      navigate('/profile');
    } catch (err: any) {
      toast({
        title: 'Submission Failed',
        description: err.response?.data?.message || 'Please try again',
        status: 'error',
        duration: 6000,
      });
      console.log('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimated = getEstimatedNgn();

  return (
    <MotionBox initial={{ opacity: 0, y: 40 }} w="100vw" animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Box p={{ base: 6, md: 8 }} maxW="container.lg" mx="auto">
        <Heading mb={8} textAlign="center">
          Submit Gift Card
        </Heading>

        {loadingRates ? (
          <VStack spacing={4} align="center" py={10}>
            <Spinner thickness="4px" color="blue.500" size="xl" />
            <Text>Loading current exchange rates...</Text>
          </VStack>
        ) : ratesError && rates.length === 0 ? (
          <Alert status="error">
            <AlertIcon />
            {ratesError} - Submission may be limited.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              {/* Gift Card Type */}
              <FormControl isRequired>
                <FormLabel>Gift Card Type</FormLabel>
                <Select
                  placeholder="Select gift card type"
                  value={giftCardType}
                  onChange={(e) => setGiftCardType(e.target.value)}
                  isDisabled={isSubmitting}
                >
                  {rates.map(rate => (
                    <option key={rate.giftCardType} value={rate.giftCardType}>
                      {rate.giftCardType}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Value */}
              <FormControl isRequired>
                <FormLabel>Value ($)</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 50.00"
                  isDisabled={isSubmitting}
                />
              </FormControl>

              {/* Live Estimated NGN – with skeleton while loading */}
              <Skeleton isLoaded={!loadingRates} startColor="gray.100" endColor="gray.200">
                {giftCardType && value && estimated !== null ? (
                  <HStack
                    justify="space-between"
                    bg={useColorModeValue('green.50', 'green.900')}
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={accentColor}
                  >
                    <Text fontWeight="medium">Estimated wallet credit:</Text>
                    <Badge fontSize="xl" colorScheme="green" px={5} py={2} borderRadius="md">
                      ₦{estimated.toLocaleString('en-NG', { minimumFractionDigits: 0 })}
                    </Badge>
                  </HStack>
                ) : (
                  giftCardType && (
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Enter value to see estimated NGN credit
                    </Text>
                  )
                )}
              </Skeleton>

              {/* Image Upload */}
              <FormControl isRequired>
                <FormLabel>Upload Proof (max 5 images)</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  isDisabled={isSubmitting}
                />
                <FormHelperText>
                  Upload clear photos of the gift card front, back, and code/receipt.
                </FormHelperText>
              </FormControl>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <HStack spacing={4} wrap="wrap" mt={4}>
                  {imagePreviews.map((preview, idx) => (
                    <Box key={idx} position="relative">
                      <Image
                        src={preview}
                        alt={`preview ${idx + 1}`}
                        boxSize="120px"
                        objectFit="cover"
                        borderRadius="md"
                        border="2px solid"
                        borderColor="gray.200"
                      />
                      <Button
                        size="xs"
                        colorScheme="red"
                        position="absolute"
                        top="-2"
                        right="-2"
                        borderRadius="full"
                        onClick={() => removeImage(idx)}
                        isDisabled={isSubmitting}
                      >
                        ×
                      </Button>
                    </Box>
                  ))}
                </HStack>
              )}

              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                w="full"
                isLoading={isSubmitting}
                loadingText="Submitting Gift Card..."
                isDisabled={isSubmitting || images.length === 0 || !value || !giftCardType}
              >
                Submit for Review
              </Button>
            </VStack>
          </form>
        )}
      </Box>
    </MotionBox>
  );
};

export default Submit;