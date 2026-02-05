import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Heading,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import axios from 'axios';

type Currency = 'USD' | 'CAD' | 'GBP' | 'EUR';

interface CreateRateProps {
  onCreated?: () => void; // callback to refresh rates list
}

const CreateRate = ({ onCreated }: CreateRateProps) => {
  const [giftCardType, setGiftCardType] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!giftCardType.trim()) {
      toast({ title: 'Gift card type required', status: 'warning' });
      return;
    }

    const rate = Number(ratePerUnit);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: 'Invalid rate',
        description: 'Rate must be greater than 0',
        status: 'warning',
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Unauthorized',
        description: 'Please log in again',
        status: 'error',
      });
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        'https://api.cardora.net/api/rates',
        {
          giftCardType: giftCardType.trim(),
          currency,
          ratePerUnit: rate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: 'Rate created',
        description: `${giftCardType} (${currency}) added successfully`,
        status: 'success',
        duration: 4000,
      });

      setGiftCardType('');
      setCurrency('USD');
      setRatePerUnit('');

      onCreated?.();
    } catch (err: any) {
      toast({
        title: 'Failed to create rate',
        description: err.response?.data?.message || 'Please try again',
        status: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      bg={cardBg}
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      boxShadow="md"
      maxW="full"
    >
      <Heading size="lg" mb={6}>
        Create New Rate
      </Heading>

      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Gift Card Type</FormLabel>
            <Input
              placeholder="e.g. Amazon"
              value={giftCardType}
              onChange={(e) => setGiftCardType(e.target.value)}
              isDisabled={submitting}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Currency</FormLabel>
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              isDisabled={submitting}
            >
              <option value="USD">USD</option>
              <option value="CAD">CAD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Rate (NGN per 1 unit)</FormLabel>
            <Input
              type="number"
              step="0.01"
              placeholder="e.g. 1150"
              value={ratePerUnit}
              onChange={(e) => setRatePerUnit(e.target.value)}
              isDisabled={submitting}
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="green"
            size="lg"
            isLoading={submitting}
            loadingText="Creating rate..."
          >
            Create Rate
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default CreateRate;
