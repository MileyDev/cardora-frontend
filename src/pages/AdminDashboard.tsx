import { useState, useEffect, type FormEvent } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  VStack,
  Input,
  FormControl,
  FormLabel,
  Select,
  useToast,
  useColorModeValue,
  Spinner,
  Center,
  Text,
  HStack,
} from '@chakra-ui/react';
import axios from 'axios';

interface Transaction {
  id: number;
  userId: string;
  giftCardType: string;
  value: number;
  status: string;
  // submittedAt?: string; // if you want to show it later
}

interface Rate {
  id: number;
  giftCardType: string;
  exchangeRate: number;
  updatedAt: string;
}

const AdminDashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [newRate, setNewRate] = useState<{ giftCardType: string; exchangeRate: string }>({
    giftCardType: '',
    exchangeRate: '',
  });
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [loadingRates, setLoadingRates] = useState<boolean>(true);
  const [isSubmittingRate, setIsSubmittingRate] = useState<boolean>(false);

  const toast = useToast();

  // Dynamic colors
  const submitBg = useColorModeValue('blue.500', 'blue.300');
  const buttonColor = useColorModeValue('white', 'gray.800');
  const approvedBg = useColorModeValue('green.500', 'green.300');
  const rejectedBg = useColorModeValue('red.500', 'red.300');
  const tableBg = useColorModeValue('white', 'gray.800');
  const tableBorder = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchTransactions();
    fetchRates();
  }, []);

  const fetchTransactions = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in as admin',
        status: 'warning',
        duration: 5000,
      });
      return;
    }

    try {
      setLoadingTransactions(true);
      const response = await axios.get<Transaction[]>('https://api.cardora.net/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (error.response?.status === 401 ? 'Session expired. Please log in again.' : 'Failed to fetch transactions');

      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        // Optional: navigate('/login');
      }
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchRates = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoadingRates(true);
      const response = await axios.get<Rate[]>('https://api.cardora.net/api/rates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRates(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch rates',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingRates(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.put(
        `https://api.cardora.net/api/transactions/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: `Transaction ${status}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchTransactions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update transaction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateRate = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmittingRate) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Error',
        description: 'Authentication required',
        status: 'error',
      });
      return;
    }

    if (!newRate.giftCardType || !newRate.exchangeRate || isNaN(parseFloat(newRate.exchangeRate))) {
      toast({
        title: 'Invalid input',
        description: 'Please select a gift card type and enter a valid rate',
        status: 'warning',
        duration: 4000,
      });
      return;
    }

    setIsSubmittingRate(true);

    try {
      await axios.put(
        'https://api.cardora.net/api/rates',
        {
          giftCardType: newRate.giftCardType,
          exchangeRate: parseFloat(newRate.exchangeRate),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: `Rate for ${newRate.giftCardType} updated`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      fetchRates();
      setNewRate({ giftCardType: '', exchangeRate: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update rate',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingRate(false);
    }
  };

  return (
    <Box minW="100vw" p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
      <Heading mb={8} size="2xl" textAlign="center">
        Admin Dashboard
      </Heading>

      <VStack spacing={12}>
        {/* Transactions Section */}
        <Box w="full">
          <Heading textAlign="center" size="lg" mb={6}>
            Transactions
          </Heading>

          {loadingTransactions ? (
            <Center py={10}>
              <VStack spacing={4}>
                <Spinner size="xl" thickness="4px" color="blue.500" />
                <Text>Loading transactions...</Text>
              </VStack>
            </Center>
          ) : transactions.length === 0 ? (
            <Center py={10}>
              <Text fontSize="lg" color="gray.500">
                No transactions yet
              </Text>
            </Center>
          ) : (
            <Box
              overflowX="auto"
              bg={tableBg}
              borderRadius="lg"
              border="1px solid"
              borderColor={tableBorder}
              boxShadow="md"
            >
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Tr>
                    <Th>ID</Th>
                    <Th>User</Th>
                    <Th>Gift Card</Th>
                    <Th>Value ($)</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactions.map((t) => (
                    <Tr key={t.id}>
                      <Td>{t.id}</Td>
                      <Td>{t.userId}</Td>
                      <Td fontWeight="medium">{t.giftCardType}</Td>
                      <Td isNumeric>${t.value.toFixed(2)}</Td>
                      <Td>
                        <Text
                          fontWeight="bold"
                          color={
                            t.status === 'approved'
                              ? 'green.500'
                              : t.status === 'rejected'
                              ? 'red.500'
                              : 'yellow.600'
                          }
                        >
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={3}>
                          <Button
                            size="sm"
                            bg={approvedBg}
                            color={buttonColor}
                            onClick={() => handleUpdateStatus(t.id, 'approved')}
                            isDisabled={t.status === 'approved'}
                            _hover={{ bg: useColorModeValue('green.600', 'green.400') }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            bg={rejectedBg}
                            color={buttonColor}
                            onClick={() => handleUpdateStatus(t.id, 'rejected')}
                            isDisabled={t.status === 'rejected'}
                            _hover={{ bg: useColorModeValue('red.600', 'red.400') }}
                          >
                            Reject
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>

        {/* Rates Management Section */}
        <Box w="full">
          <Heading textAlign="center" size="lg" mb={6}>
            Manage Rates
          </Heading>

          {loadingRates ? (
            <Center py={10}>
              <Spinner size="xl" />
            </Center>
          ) : (
            <>
              {/* Update Form */}
              <form onSubmit={handleUpdateRate}>
                <VStack spacing={5} align="stretch" mb={8}>
                  <FormControl isRequired>
                    <FormLabel>Gift Card Type</FormLabel>
                    <Select
                      placeholder="Select gift card type"
                      value={newRate.giftCardType}
                      onChange={(e) => setNewRate({ ...newRate, giftCardType: e.target.value })}
                      isDisabled={isSubmittingRate || rates.length === 0}
                    >
                      {rates.map((r) => (
                        <option key={r.id} value={r.giftCardType}>
                          {r.giftCardType}
                        </option>
                      ))}
                    </Select>
                    {rates.length === 0 && (
                      <Text color="yellow.500" mt={2} fontSize="sm">
                        No rates available yet. Add new rates using POST /api/rates.
                      </Text>
                    )}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>New Rate (USD)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={newRate.exchangeRate}
                      onChange={(e) => setNewRate({ ...newRate, exchangeRate: e.target.value })}
                      placeholder="e.g. 0.85"
                      isDisabled={isSubmittingRate}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    bg={submitBg}
                    color={buttonColor}
                    w="full"
                    isLoading={isSubmittingRate}
                    loadingText="Updating..."
                    isDisabled={isSubmittingRate || !newRate.giftCardType || !newRate.exchangeRate}
                    _hover={{ bg: useColorModeValue('blue.600', 'blue.400') }}
                  >
                    Update Rate
                  </Button>
                </VStack>
              </form>

              {/* Rates Table */}
              <Box
                overflowX="auto"
                bg={tableBg}
                borderRadius="lg"
                border="1px solid"
                borderColor={tableBorder}
                boxShadow="md"
              >
                <Table variant="simple">
                  <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Gift Card</Th>
                      <Th isNumeric>Rate (USD)</Th>
                      <Th>Updated</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rates.map((r) => (
                      <Tr key={r.id}>
                        <Td>{r.id}</Td>
                        <Td fontWeight="medium">{r.giftCardType}</Td>
                        <Td isNumeric fontWeight="bold">
                          ${r.exchangeRate.toFixed(4)}
                        </Td>
                        <Td fontSize="sm" color="gray.500">
                          {new Date(r.updatedAt).toLocaleString('en-NG', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default AdminDashboard;