import { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Spinner,
    Center,
    VStack,
    Text,
    Button,
    useToast,
    useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';


const MotionBox = motion.create(Box);

interface Transaction {
    id: string;
    giftCardType: string;
    value: number;
    status: number;       // 0 | 1 | 2
    submittedAt: string;
}


const TransactionStatusMap: Record<number, { label: string; color: string }> = {
    0: { label: 'Pending', color: 'yellow.500' },
    1: { label: 'Approved', color: 'green.500' },
    2: { label: 'Rejected', color: 'red.500' },
};


const Transactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const toast = useToast();
    const navigate = useNavigate();

    


    const tableBg = useColorModeValue('white', 'gray.800');
    const tableBorder = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        const fetchTransactions = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                toast({
                    title: 'Authentication required',
                    description: 'Please log in to view your transactions',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                });
                navigate('/login');
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await axios.get<Transaction[]>(
                    'https://api.cardora.net/api/transactions/my',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log('Transactions: ', response.data);

                setTransactions(response.data);
            } catch (err: any) {
                let message = 'Failed to load your transactions';

                if (err.response) {
                    if (err.response.status === 401) {
                        message = 'Session expired. Please log in again.';
                        localStorage.removeItem('token');
                        navigate('/login');
                    } else if (err.response.status === 403) {
                        message = 'You do not have permission to view transactions';
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
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [toast, navigate]);

    if (loading) {
        return (
            <Center minH="80vh">
                <VStack spacing={4}>
                    <Spinner size="xl" thickness="4px" color="blue.500" />
                    <Text>Loading your transactions...</Text>
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
                    <Button colorScheme="blue" onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </VStack>
            </Center>
        );
    }

    return (
        <MotionBox initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            minW="100vw"
            p={{ base: 4, md: 8 }}
            maxW="100vw"
            mx="auto">
            <Heading mb={6} size="xl" textAlign="center">
                My Transactions
            </Heading>

            {transactions.length === 0 ? (
                <Center py={10}>
                    <VStack spacing={4}>
                        <Text fontSize="lg" color="gray.500">
                            You haven't submitted any gift cards yet.
                        </Text>
                        <Button
                            as={RouterLink}
                            to="/submit"
                            colorScheme="blue"
                            size="lg"
                        >
                            Submit Your First Gift Card
                        </Button>
                    </VStack>
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
                                <Th>Gift Card</Th>
                                <Th isNumeric>Value ($)</Th>
                                <Th>Status</Th>
                                <Th>Submitted</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {transactions.map((t) => {
                                const status = TransactionStatusMap[t.status] ?? {
                                    label: 'Unknown',
                                    color: 'gray.500',
                                };

                                return (
                                    <Tr key={t.id}>
                                        <Td fontWeight="medium">{t.giftCardType}</Td>

                                        <Td isNumeric>${t.value.toFixed(2)}</Td>

                                        <Td>
                                            <Text fontWeight="medium" color={status.color}>
                                                {status.label}
                                            </Text>
                                        </Td>

                                        <Td>
                                            {new Date(t.submittedAt).toLocaleString('en-NG', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>

                    </Table>
                </Box>
            )}
        </MotionBox>
    );
};

export default Transactions;