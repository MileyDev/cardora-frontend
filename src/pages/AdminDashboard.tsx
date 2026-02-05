import { useState, useEffect, type FormEvent, useMemo } from 'react';
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
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import CreateRate from '../components/CreateRate';

const MotionBox = motion.create(Box);

interface Transaction {
  id: number;
  userId: string;
  giftCardType: string;
  value: number;
  status: number;
  submittedAt?: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  status: number;
  requestedAt: string;

  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };

  bank: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

type Currency = 'USD' | 'CAD' | 'GBP' | 'EUR';

interface Rate {
  id: number;
  giftCardType: string;
  currency: Currency | string;
  // backend might return either field name depending on where you are in the refactor
  exchangeRate?: number;
  ratePerUnit?: number;
  updatedAt: string;
}

const currencyOptions: Currency[] = ['USD', 'CAD', 'GBP', 'EUR'];

const AdminDashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [newRate, setNewRate] = useState<{ giftCardType: string; currency: Currency; exchangeRate: string }>({
    giftCardType: '',
    currency: 'USD',
    exchangeRate: '',
  });
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [loadingRates, setLoadingRates] = useState<boolean>(true);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState<boolean>(true);
  const [isSubmittingRate, setIsSubmittingRate] = useState<boolean>(false);

  const toast = useToast();
  const navigate = useNavigate();

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
    0: 'Pending',
    1: 'Approved',
    2: 'Rejected',
  };

  useEffect(() => {
    fetchTransactions();
    fetchWithdrawals();
    fetchRates();
  }, []);

  const fetchTransactions = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in as admin',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoadingTransactions(true);
      const response = await axios.get<Transaction[]>('https://api.cardora.net/api/admin/transactions', {
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
        duration: 3000,
        isClosable: true,
      });

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
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
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoadingWithdrawals(true);

      const { data } = await axios.get<Withdrawal[]>('https://api.cardora.net/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWithdrawals(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch withdrawals',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
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
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingRates(false);
    }
  };

  // Unique gift card types for the dropdown (no duplicates across currencies)
  const giftCardOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rates) {
      if (r?.giftCardType) set.add(r.giftCardType);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rates]);

  const approveWithdrawal = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(`https://api.cardora.net/api/admin/withdrawals/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
        duration: 3000,
        isClosable: true,
      });

      fetchWithdrawals();
    }
  };

  const rejectWithdrawal = async (id: string) => {
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
  };

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
    }
  };

  const handleApprove = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(
        `https://api.cardora.net/api/admin/transactions/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: `Transaction approved`,
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
        duration: 3000,
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

    const parsedRate = parseFloat(newRate.exchangeRate);
    if (!newRate.giftCardType || Number.isNaN(parsedRate) || parsedRate <= 0) {
      toast({
        title: 'Invalid input',
        description: 'Select gift card type, currency, and enter a valid rate',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSubmittingRate(true);

    try {
      await axios.put(
        'https://api.cardora.net/api/rates',
        {
          giftCardType: newRate.giftCardType,
          currency: newRate.currency,     // ✅ required now
          ratePerUnit: parsedRate,       // backend maps to RatePerUnit
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: `Rate updated for ${newRate.giftCardType} (${newRate.currency})`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchRates();
      setNewRate({ giftCardType: '', currency: 'USD', exchangeRate: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update rate',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingRate(false);
    }
  };

  const displayRate = (r: Rate) => (r.ratePerUnit ?? r.exchangeRate ?? 0);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      p={{ base: 4, md: 8 }}
      maxW="100vw"
      minW="100vw"
      mx="auto"
    >
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
                            t.status === 1 ? 'green.500' : t.status === 2 ? 'red.500' : 'yellow.600'
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
              <VStack spacing={4}>
                <Spinner size="xl" />
                <Text>Loading withdrawals...</Text>
              </VStack>
            </Center>
          ) : withdrawals.length === 0 ? (
            <Center py={10}>
              <Text color="gray.500">No withdrawals found</Text>
            </Center>
          ) : (
            <MotionBox
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
                    <Th>User</Th>
                    <Th>Amount</Th>
                    <Th>Bank</Th>
                    <Th>Account No</Th>
                    <Th>Account Name</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {withdrawals.map((w) => (
                    <Tr key={w.id}>
                      <Td>
                        {w.user.firstName} {w.user.lastName}
                      </Td>

                      <Td fontWeight="bold">₦{w.amount.toLocaleString()}</Td>

                      <Td>{w.bank.bankName}</Td>
                      <Td>{w.bank.accountNumber}</Td>
                      <Td>{w.bank.accountName}</Td>

                      <Td>
                        <Text
                          fontWeight="bold"
                          color={
                            w.status === 1 ? 'green.500' : w.status === 2 ? 'red.500' : 'yellow.600'
                          }
                        >
                          {WithdrawalStatusMap[w.status]}
                        </Text>
                      </Td>

                      <Td>
                        {w.status === 0 && (
                          <HStack>
                            <Button size="sm" colorScheme="green" onClick={() => approveWithdrawal(w.id)}>
                              Approve
                            </Button>
                            <Button size="sm" colorScheme="red" onClick={() => rejectWithdrawal(w.id)}>
                              Reject
                            </Button>
                          </HStack>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </MotionBox>
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
                      {giftCardOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      value={newRate.currency}
                      onChange={(e) => setNewRate({ ...newRate, currency: e.target.value as Currency })}
                      isDisabled={isSubmittingRate}
                    >
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>New Rate (NGN per 1 unit)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={newRate.exchangeRate}
                      onChange={(e) => setNewRate({ ...newRate, exchangeRate: e.target.value })}
                      placeholder="e.g. 1450"
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

              <CreateRate onCreated={fetchRates} />

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
                      <Th>Currency</Th>
                      <Th isNumeric>Rate (NGN/unit)</Th>
                      <Th>Updated</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rates.map((r) => (
                      <Tr key={r.id}>
                        <Td>{r.id}</Td>
                        <Td fontWeight="medium">{r.giftCardType}</Td>
                        <Td>{String(r.currency || 'USD')}</Td>
                        <Td isNumeric fontWeight="bold">
                          ₦{displayRate(r).toLocaleString('en-NG', { maximumFractionDigits: 2 })}
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
