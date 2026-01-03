import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Card,
  CardBody,
  VStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Center,
  HStack,
  Button,
  useToast,
  useColorModeValue,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const MotionCard = motion.create(Card);

interface Withdrawal {
  id: string;
  amount: number;
  status: string; // e.g. "Pending", "Approved", "Rejected", "Completed"
  bank: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  requestedAt: string;
  processedAt: string | null;
}

interface PaginationData {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  data: Withdrawal[];
}

const Withdrawals = () => {
  const [withdrawalsData, setWithdrawalsData] = useState<PaginationData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 10;
  const toast = useToast();
  const navigate = useNavigate();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchWithdrawals = async (page: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<PaginationData>(
        `https://api.cardora.net/api/user/withdrawals?page=${page}&pageSize=${pageSize}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setWithdrawalsData(response.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load withdrawal history';
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

  useEffect(() => {
    fetchWithdrawals(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (withdrawalsData?.totalPages ?? 1)) {
      setCurrentPage(newPage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'green';
      case 'approved': return 'blue';
      case 'rejected': return 'red';
      case 'pending':
      default: return 'yellow';
    }
  };

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner thickness="4px" speed="0.65s" color="blue.500" size="xl" />
      </Center>
    );
  }

  if (error || !withdrawalsData) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Text color="red.500">{error || 'Unable to load withdrawals'}</Text>
          <Button colorScheme="blue" onClick={() => fetchWithdrawals(1)}>
            Retry
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="90vw" mx="auto" minH="100vh">
      <Heading mb={8} textAlign="center">
        Withdrawal History
      </Heading>

      <MotionCard
        bg={cardBg}
        shadow="xl"
        borderRadius="2xl"
        border="1px solid"
        borderColor={borderColor}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CardBody p={{ base: 4, md: 8 }}>
          {withdrawalsData.data.length === 0 ? (
            <Center py={12}>
              <Text fontSize="lg" color="gray.500">
                No withdrawal requests yet
              </Text>
            </Center>
          ) : (
            <>
              <Table variant="simple" size={{ base: 'md', md: 'lg' }}>
                <Thead>
                  <Tr>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Bank</Th>
                    <Th>Requested</Th>
                    <Th>Processed</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {withdrawalsData.data.map((wd) => (
                    <Tr key={wd.id}>
                      <Td fontWeight="medium">
                        ₦{wd.amount.toLocaleString('en-NG')}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(wd.status)} px={3} py={1}>
                          {wd.status}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">{wd.bank.bankName}</Text>
                          <Text fontSize="sm" color="gray.500">
                            ****{wd.bank.accountNumber} • {wd.bank.accountName}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>{format(new Date(wd.requestedAt), 'MMM dd, yyyy • HH:mm')}</Td>
                      <Td>
                        {wd.processedAt
                          ? format(new Date(wd.processedAt), 'MMM dd, yyyy • HH:mm')
                          : '—'}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {/* Pagination */}
              <Flex justify="center" mt={8}>
                <HStack spacing={4}>
                  <IconButton
                    aria-label="Previous page"
                    icon={<ChevronLeftIcon />}
                    isDisabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                  <Text>
                    Page {currentPage} of {withdrawalsData.totalPages}
                  </Text>
                  <IconButton
                    aria-label="Next page"
                    icon={<ChevronRightIcon />}
                    isDisabled={currentPage === withdrawalsData.totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                </HStack>
              </Flex>
            </>
          )}
        </CardBody>
      </MotionCard>

      <Center mt={8}>
        <Button colorScheme="green" onClick={() => navigate('/withdraw')}>
          New Withdrawal
        </Button>
      </Center>
    </Box>
  );
};

export default Withdrawals;