import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface Rate {
  id: number;
  giftCardType: string;
  exchangeRate: number;
  updatedAt: string;
}

const Rates = () => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const response = await axios.get<Rate[]>('https://api.cardora.net/api/rates', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRates(response.data);
      } catch (err: any) {
        console.error('Error fetching rates:', err);

        let message = 'Failed to load gift card rates';

        if (err.response) {
          // Server responded with error
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

  if (loading) {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Spinner size="xl" thickness="4px" color="blue.500" />
          <Text>Loading latest rates...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center minH="80vh">
        <VStack spacing={4}>
          <Text color="red.500" fontSize="xl" fontWeight="bold">
            Oops!
          </Text>
          <Text color="gray.600" maxW="md" textAlign="center">
            {error}
          </Text>
          <Button
            colorScheme="blue"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
      <Heading mb={6} size="xl" textAlign="center">
        Gift Card Exchange Rates
      </Heading>

      {rates.length === 0 ? (
        <Center py={10}>
          <Text color="gray.500" fontSize="lg">
            No rates available at the moment
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
                <Th isNumeric>Rate (NGN per USD)</Th>
                <Th>Updated</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rates.map((rate) => (
                <Tr key={rate.id}>
                  <Td fontWeight="medium">{rate.giftCardType}</Td>
                  <Td isNumeric fontWeight="bold">
                    ₦{rate.exchangeRate.toFixed(2)}
                  </Td>
                  <Td>
                    {new Date(rate.updatedAt).toLocaleString('en-NG', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
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