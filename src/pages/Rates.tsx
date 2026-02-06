import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Text,
  Center,
  VStack,
  useToast,
  useColorModeValue,
  Select,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

type Currency = 'USD' | 'CAD' | 'GBP' | 'EUR';

interface RateApi {
  id: number;
  giftCardType: string;
  // backend model: Currency enum (could come as number or string depending on JSON settings)
  currency: number | string;
  // backend model: RatePerUnit (NGN per 1 unit of that currency)
  ratePerUnit: number;
  updatedAt: string;
}

const currencyLabel = (value: number | string): Currency | 'UNKNOWN' => {
  if (typeof value === 'string') {
    const v = value.trim().toUpperCase();
    if (v === 'USD' || v === 'CAD' || v === 'GBP' || v === 'EUR') return v;
    return 'UNKNOWN';
  }

  // enum mapping from your backend:
  // USD=1, CAD=2, GBP=3, EUR=4
  const map: Record<number, Currency> = {
    1: 'USD',
    2: 'CAD',
    3: 'GBP',
    4: 'EUR',
  };

  return map[value] ?? 'UNKNOWN';
};

const Rates = () => {
  const [rates, setRates] = useState<RateApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | Currency>('ALL');

  const toast = useToast();
  const navigate = useNavigate();

  const tableBg = useColorModeValue('white', 'gray.800');
  const tableBorder = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchRates = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to view rates',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<RateApi[]>('https://api.cardora.net/api/rates', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRates(Array.isArray(response.data) ? response.data : []);
      } catch (err: any) {
        console.error('Error fetching rates:', err);

        let message = 'Failed to load gift card rates';

        if (err.response) {
          if (err.response.status === 401) {
            message = 'Session expired. Please log in again.';
            localStorage.removeItem('token');
            navigate('/login');
          } else if (err.response.status === 403) {
            message = 'You do not have permission to view rates';
          } else {
            message = err.response.data?.message || message;
          }
        } else if (err.request) {
          message = 'Network error. Please check your connection.';
        } else {
          message = err.message || message;
        }

        setError(message);
        toast({
          title: 'Error',
          description: message,
          status: 'error',
          duration: 6000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [toast, navigate]);

  const normalized = useMemo(() => {
    return rates.map((r) => ({
      ...r,
      currencyText: currencyLabel(r.currency),
    }));
  }, [rates]);

  const filtered = useMemo(() => {
    const list =
      currencyFilter === 'ALL'
        ? normalized
        : normalized.filter((r) => r.currencyText === currencyFilter);

    // Sort: GiftCardType ASC, Currency ASC, UpdatedAt DESC
    return [...list].sort((a, b) => {
      const g = a.giftCardType.localeCompare(b.giftCardType);
      if (g !== 0) return g;

      const c = String(a.currencyText).localeCompare(String(b.currencyText));
      if (c !== 0) return c;

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [normalized, currencyFilter]);

  const hasUnknownCurrency = useMemo(
    () => normalized.some((r) => r.currencyText === 'UNKNOWN'),
    [normalized]
  );

  if (loading) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" thickness="4px" color="blue.500" />
          <Text>Loading latest rates...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center minH="100vh" minW="100vw">
        <VStack spacing={4}>
          <Text color="red.500" fontSize="xl" fontWeight="bold">
            Oops!
          </Text>
          <Text color="gray.600" maxW="md" textAlign="center">
            {error}
          </Text>
          <Button colorScheme="blue" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} minW="100vw" mx="auto">
      <HStack justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <Heading size="xl">Gift Card Exchange Rates</Heading>

        <HStack gap={3}>
          <Select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value as 'ALL' | Currency)}
            w={{ base: 'full', md: '220px' }}
          >
            <option value="ALL">All currencies</option>
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </Select>

          <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="md">
            {filtered.length} rate{filtered.length === 1 ? '' : 's'}
          </Badge>
        </HStack>
      </HStack>

      {hasUnknownCurrency && (
        <Box mb={4}>
          <Text fontSize="sm" color="yellow.600">
            Some rates have an unknown currency value (likely older rows with currency=0). Your backend patch will fix this.
          </Text>
        </Box>
      )}

      {filtered.length === 0 ? (
        <Center py={10}>
          <Text color="gray.500" fontSize="lg">
            No rates available for this filter
          </Text>
        </Center>
      ) : (
        <MotionBox
          overflowX="auto"
          bg={tableBg}
          borderRadius="lg"
          border="1px solid"
          borderColor={tableBorder}
          boxShadow="md"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Table variant="simple">
            <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
              <Tr>
                <Th>Gift Card</Th>
                <Th>Currency</Th>
                <Th isNumeric>Rate (NGN per unit)</Th>
              </Tr>
            </Thead>

            <Tbody>
              {filtered.map((rate) => (
                <Tr key={rate.id}>
                  <Td fontWeight="medium">{rate.giftCardType}</Td>

                  <Td>
                    <Badge
                      colorScheme={
                        rate.currencyText === 'USD'
                          ? 'blue'
                          : rate.currencyText === 'GBP'
                          ? 'purple'
                          : rate.currencyText === 'EUR'
                          ? 'orange'
                          : rate.currencyText === 'CAD'
                          ? 'teal'
                          : 'gray'
                      }
                    >
                      {rate.currencyText}
                    </Badge>
                  </Td>

                  <Td isNumeric fontWeight="bold">
                    ₦{Number(rate.ratePerUnit).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </MotionBox>
      )}
    </Box>
  );
};

export default Rates;
