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
  Spinner,
  Center,
  Text,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import axios from 'axios';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

interface Transaction {
  id: number;
  userId: string;
  giftCardType: string;
  value: number;
  status: number;
  submittedAt?: string;
}

interface Withdrawal {
  id: number;
  userId: string;
  amount: number;
  status: number;
  requestedAt?: string;
}

interface Rate {
  id: number;
  giftCardType: string;
  exchangeRate: number;
  updatedAt: string;
}

const AdminDashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [newRate, setNewRate] = useState<{ giftCardType: string; exchangeRate: string }>({
    giftCardType: '',
    exchangeRate: '',
  });
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [loadingRates, setLoadingRates] = useState<boolean>(true);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState<boolean>(true);
  const [isSubmittingRate, setIsSubmittingRate] = useState<boolean>(false);

  const toast = useToast();

  // All dynamic colors at the very top (no conditionals before hooks)
  const submitBg = useColorModeValue('blue.500', 'blue.300');
  const buttonColor = useColorModeValue('white', 'gray.800');
  const approvedBg = useColorModeValue('green.500', 'green.300');
  const rejectedBg = useColorModeValue('red.500', 'red.300');
  const tableBg = useColorModeValue('white', 'gray.800');
  const tableBorder = useColorModeValue('gray.200', 'gray.700');
  const tableHeadBg = useColorModeValue('gray.50', 'gray.700');

  const formatTransactionStatus = (status: number) => {
    const map: Record<number, string> = {
      0: 'pending',
      1: 'approved',
      2: 'rejected',
    };


    const label = map[status] ?? 'unknown';
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const WithdrawalStatusMap: Record<number, string> = {
    0: "Pending",
    1: "Approved",
    2: "Rejected",
  };


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
        isClosable: true,
      });
      return;
    }

    try {
      setLoadingTransactions(true);
      const response = await axios.get<Transaction[]>('https://api.cardora.net/api/admin/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched transactions:', response.data);
      setTransactions(response.data);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (error.response?.status === 401 ? 'Session expired. Please log in again.' : 'Failed to fetch transactions');

      console.log('Fetch transactions error:', error.response);
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

  const fetchWithdrawals = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in as admin',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoadingWithdrawals(true);
      const response = await axios.get<Withdrawal[]>('https://api.cardora.net/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWithdrawals(response.data);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch withdrawals',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    finally {
      setLoadingWithdrawals(false);
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

  const approveWithdrawal = async (id: number) => {
    const token = localStorage.getItem('token');

    if (!token) return;

    try {
      await axios.post(
        `https://api.cardora.net/api/admin/withdrawals/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: 'Withdrawal approved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchWithdrawals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve withdrawal',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      fetchWithdrawals();
    }
  }

  const rejectWithdrawal = async (id: number) => {
    const token = localStorage.getItem('token');

    if (!token) return;

    try {
      await axios.post(
        `https://api.cardora.net/api/admin/withdrawals/${id}/reject`,
        { reason: 'Insufficient funds' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: 'Withdrawal rejected',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchWithdrawals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data || 'Failed to reject withdrawal',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });

      fetchWithdrawals();
    }
  }

  const handleReject = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(
        `https://api.cardora.net/api/admin/transactions/${id}/reject`,
        { reason: 'Invalid or used of gift card.' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: 'Transaction rejected',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchTransactions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject transaction',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });

      console.log(error.response);
      console.log(token);
    }
  }

  const handleApprove = async (id: number) => {
    const token = localStorage.getItem('token');
    console.log(token);

    if (!token) return;

    try {
       await axios.post(
        `https://api.cardora.net/api/admin/transactions/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast({
        title: 'Success',
        description: `Transaction approved`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchTransactions();
    } catch (error: any) {
      console.log('Error approving: ', error.response);

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
    <MotionBox initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      p={{ base: 4, md: 8 }}
      maxW="100vw"
      minW="100vw"
      mx="auto">
      <Heading mb={8} size="2xl" textAlign="center">
        Admin Dashboard
      </Heading>

      <VStack spacing={12}>
        {/* Transactions Section */}
        <MotionBox w="full">
          <Heading size="lg" mb={6}>
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
                No transactions found
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
                <Thead bg={tableHeadBg}>
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
                            t.status === 1
                              ? 'green.500'
                              : t.status === 2
                                ? 'red.500'
                                : 'yellow.600'
                          }
                        >
                          {formatTransactionStatus(t.status)}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={3}>
                          <Button
                            size="sm"
                            bg={approvedBg}
                            color={buttonColor}
                            onClick={() => handleApprove(t.id)}
                            isDisabled={t.status === 1}
                            _hover={{ bg: useColorModeValue('green.600', 'green.400') }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            bg={rejectedBg}
                            color={buttonColor}
                            onClick={() => handleReject(t.id)}
                            isDisabled={t.status === 2}
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
            </MotionBox>
          )}
        </MotionBox>

        {/* Withdrawals Section */}
        <MotionBox w="full">
          <Heading size="lg" mb={6}>
            Withdrawals
          </Heading>

          {loadingWithdrawals ? (
            <Center py={10}>
              <Spinner size="xl" />
            </Center>
          ) : (

            withdrawals.map(w => (
              <Tr key={w.id}>
                <Td>{w.user.fullName}</Td>
                <Td>₦{w.amount.toLocaleString()}</Td>
                <Td>{w.bank.bankName}</Td>
                <Td>{WithdrawalStatusMap[w.status]}</Td>
                <Td>
                  {w.status === 0 && (
                    <HStack>
                      <Button
                        size="sm"
                        colorScheme="green"
                        isDisabled={w.status !== 0}
                        onClick={() => approveWithdrawal(w.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        isDisabled={w.status !== 0}
                        onClick={() => rejectWithdrawal(w.id)}
                      >
                        Reject
                      </Button>
                    </HStack>
                  )}
                </Td>
              </Tr>
            ))
          )}

        </MotionBox>

        {/* Rates Management Section */}
        <MotionBox w="full">
          <Heading size="lg" mb={6}>
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
              <MotionBox
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                overflowX="auto"
                bg={tableBg}
                borderRadius="lg"
                border="1px solid"
                borderColor={tableBorder}
                boxShadow="md"
              >
                <Table variant="simple">
                  <Thead bg={tableHeadBg}>
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
              </MotionBox>
            </>
          )}
        </MotionBox>
      </VStack>
    </MotionBox>
  );
};

export default AdminDashboard;