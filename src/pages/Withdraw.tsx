import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Card,
  CardBody,
  VStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  useToast,
  Spinner,
  Center,
  HStack,
  Alert,
  AlertIcon,
  Stat,
  StatNumber,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaMoneyBillWave } from 'react-icons/fa';

const MotionCard = motion.create(Card);

interface BankDetail {
  id: string;           
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface BalanceInfo {
  availableBalance: number;
  lockedBalance: number;
}

const Withdraw = () => {
  const [banks, setBanks] = useState<BankDetail[]>([]);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();
  const navigate = useNavigate();

  const cardBg = useColorModeValue('white', 'gray.800');
  const accentColor = useColorModeValue('green.600', 'green.400');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        const profileRes = await axios.get('https://api.cardora.net/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBalance(profileRes.data.balance);

        
        const banksRes = await axios.get<BankDetail[]>('https://api.cardora.net/api/user/bank-details', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBanks(banksRes.data);

        if (banksRes.data.length > 0) {
          setSelectedBankId(banksRes.data[0].id);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to load data';
        setError(msg);
        toast({ title: 'Error', description: msg, status: 'error' });
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!selectedBankId) {
      toast({ title: 'Select bank account', status: 'warning' });
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Enter valid amount', status: 'warning' });
      return;
    }
    if (balance && numAmount > balance.availableBalance) {
      toast({ title: 'Insufficient balance', status: 'warning' });
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post(
        'https://api.cardora.net/api/user/withdraw',
        { bankDetailId: selectedBankId, amount: numAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: 'Withdrawal request submitted! Funds will be processed soon.',
        status: 'success',
        duration: 6000,
      });

      setAmount('');
      navigate('/history'); 
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit withdrawal';
      toast({ title: 'Error', description: msg, status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Center minH="100vh" minW="100vw">
        <Spinner thickness="4px" speed="0.65s" color="green.500" size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center minH="100vh">
        <Alert status="error" maxW="md">
          <AlertIcon />
          {error}
        </Alert>
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="container.md" mx="auto" minH="100vh">
      <Heading mb={8} textAlign="center">
        Withdraw Funds
      </Heading>

      <VStack spacing={8} align="stretch">
        {/* Balance Overview */}
        {balance && (
          <MotionCard
            bg={cardBg}
            shadow="lg"
            borderRadius="xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Text fontWeight="medium">Available Balance</Text>
                <FaMoneyBillWave size={24} color={accentColor} />
              </HStack>
              <Stat>
                <StatNumber color={accentColor}>
                  ₦{balance.availableBalance.toLocaleString('en-NG')}
                </StatNumber>
              </Stat>
            </CardBody>
          </MotionCard>
        )}

        {/* Form Card */}
        <MotionCard
          bg={cardBg}
          shadow="xl"
          borderRadius="2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CardBody p={8}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel>Select Bank Account</FormLabel>
                  <Select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    placeholder="Choose account"
                  >
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.bankName} •  ******{bank.accountNumber.slice(-4)}  ({bank.accountName})
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Amount (₦)</FormLabel>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={100} // adjust min withdrawal if needed
                  />
                </FormControl>

                <Divider my={4} />

                <Button
                  type="submit"
                  colorScheme="green"
                  size="lg"
                  w="full"
                  isLoading={submitting}
                  loadingText="Submitting..."
                  leftIcon={<FaMoneyBillWave />}
                >
                  Request Withdrawal
                </Button>
              </VStack>
            </form>
          </CardBody>
        </MotionCard>

        <Text fontSize="sm" color="gray.500" textAlign="center">
          Processing usually takes 5-30 minutes during business hours.
        </Text>
      </VStack>
    </Box>
  );
};

export default Withdraw;