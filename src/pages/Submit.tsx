import { useState, useEffect, type ChangeEvent, type FormEvent, useMemo } from 'react';
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
  IconButton,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

type Currency = 'USD' | 'CAD' | 'GBP' | 'EUR';

interface Rate {
  giftCardType: string;
  ratePerUnit?: number;      // new backend field
  exchangeRate?: number;     // legacy field (fallback)
  currency?: Currency | string;
  updatedAt?: string;
}

const currencyOptions: Currency[] = ['USD', 'CAD', 'GBP', 'EUR'];

const Submit = () => {
  const [giftCardType, setGiftCardType] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('USD');
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

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

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

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setRates(response.data);
        } else {
          throw new Error('No rates available');
        }
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to load current rates';
        setRatesError(message);

        toast({
          title: 'Rates Unavailable',
          description: `${message}. Using fallback rates.`,
          status: 'warning',
          duration: 6000,
        });

        // Fallback rates (USD only by default; you can expand)
        setRates([
          { giftCardType: 'Amazon', exchangeRate: 1450, currency: 'USD' },
          { giftCardType: 'iTunes', exchangeRate: 1380, currency: 'USD' },
          { giftCardType: 'Google Play', exchangeRate: 1320, currency: 'USD' },
          { giftCardType: 'Steam', exchangeRate: 1500, currency: 'USD' },
        ]);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
  }, [toast]);

  // GiftCard options should be unique (regardless of currency)
  const giftCardOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rates) {
      if (r?.giftCardType) set.add(r.giftCardType);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rates]);

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    if (files.length + images.length > 5) {
      toast({ title: 'Maximum 5 images allowed', status: 'warning' });
      return;
    }

    const isImageFile = (f: File) => {
      if (f.type?.startsWith('image/')) return true;
      const name = f.name?.toLowerCase() ?? '';
      return /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(name);
    };

    const validImages = files.filter(isImageFile);
    if (validImages.length === 0) return;

    const newPreviews = validImages.map((file) => URL.createObjectURL(file));

    setImages((prev) => [...prev, ...validImages]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== index);
    });
  };

  const getEstimatedNgn = (): number | null => {
    if (!value || !giftCardType || rates.length === 0 || !currency) return null;

    const unitValue = parseFloat(value);
    if (isNaN(unitValue) || unitValue <= 0) return null;

    const rateObj = rates.find(
      (r) =>
        r.giftCardType === giftCardType &&
        String(r.currency || '').toUpperCase() === currency
    );

    if (!rateObj) return null;

    const ratePerUnit = rateObj.ratePerUnit ?? rateObj.exchangeRate ?? 0;
    if (!ratePerUnit || ratePerUnit <= 0) return null;

    return unitValue * ratePerUnit;
  };

  const estimated = getEstimatedNgn();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!giftCardType || !currency || !value || parseFloat(value) <= 0 || images.length === 0) {
      toast({ title: 'Please complete all required fields', status: 'warning' });
      return;
    }

    if (ratesError && rates.length === 0) {
      toast({ title: 'Cannot submit', description: 'Rates not available', status: 'error' });
      return;
    }

    if (!estimated || estimated <= 0) {
      toast({
        title: 'Cannot submit',
        description: `No rate found for ${giftCardType} (${currency}). Ask admin to set it.`,
        status: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const formData = new FormData();
      formData.append('giftCardType', giftCardType);
      formData.append('currency', currency); // ✅ REQUIRED by new backend
      formData.append('value', value);
      formData.append('nairaEst', estimated.toString());

      images.forEach((file) => {
        formData.append('images', file, file.name);
      });

      await axios.post('https://api.cardora.net/api/transactions', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Submitted Successfully',
        description: 'Gift card received. We’ll review and credit your wallet in NGN soon.',
        status: 'success',
        duration: 7000,
      });

      setGiftCardType('');
      setCurrency('USD');
      setValue('');
      setImages([]);
      setImagePreviews([]);

      navigate('/my-profile');
    } catch (err: any) {
      toast({
        title: 'Submission Failed',
        description: err.response?.data?.message || 'Please try again',
        status: 'error',
        duration: 6000,
      });
      // eslint-disable-next-line no-console
      console.log('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 40 }}
      w="100vw"
      minH="100vh"
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
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
                  {giftCardOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Currency */}
              <FormControl isRequired>
                <FormLabel>Currency</FormLabel>
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  isDisabled={isSubmitting}
                >
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <FormHelperText>
                  Select the currency your gift card is denominated in (USD/CAD/GBP/EUR).
                </FormHelperText>
              </FormControl>

              {/* Value */}
              <FormControl isRequired>
                <FormLabel>Value ({currency})</FormLabel>
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

              {/* Estimated NGN */}
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
                      No rate found for {giftCardType} ({currency}). Select another currency or ask admin to set the rate.
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
                  required={images.length === 0}
                />
                <FormHelperText>
                  Upload clear photos of the gift card front, back, and code/receipt.
                </FormHelperText>
              </FormControl>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <Wrap spacing="14px" pt={2}>
                  {imagePreviews.map((src, idx) => (
                    <WrapItem key={src}>
                      <Box position="relative">
                        <Image
                          src={src}
                          alt={`proof ${idx + 1}`}
                          boxSize="120px"
                          objectFit="cover"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.200"
                        />

                        <IconButton
                          aria-label="Remove image"
                          icon={<CloseIcon />}
                          size="xs"
                          colorScheme="red"
                          variant="solid"
                          position="absolute"
                          top="6px"
                          right="6px"
                          borderRadius="full"
                          onClick={() => removeImage(idx)}
                          isDisabled={isSubmitting}
                        />
                      </Box>
                    </WrapItem>
                  ))}
                </Wrap>
              )}

              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                w="full"
                isLoading={isSubmitting}
                loadingText="Submitting Gift Card..."
                isDisabled={isSubmitting || images.length === 0 || !value || !giftCardType || !currency}
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
