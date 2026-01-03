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
  Button,
  useToast,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import React from 'react';
import { type FocusableElement } from '@chakra-ui/utils';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

interface BankDetail {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const BankDetails = () => {
  const [banks, setBanks] = useState<BankDetail[]>([]);
  const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const toast = useToast();
  const navigate = useNavigate();

  const cardBg = useColorModeValue('white', 'gray.800');

  const cancelRef = React.useRef<FocusableElement | null>(null);

  const fetchBanks = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const res = await axios.get<BankDetail[]>('https://api.cardora.net/api/user/bank-details', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBanks(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load bank details';
      setError(msg);
      console.log(error);
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
    fetchBanks();
  }, []);

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.bankName || !newBank.accountNumber || !newBank.accountName) {
      toast({ title: 'Please fill all fields', status: 'warning' });
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post(
        'https://api.cardora.net/api/user/bank-details',
        newBank,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({ title: 'Bank account added', status: 'success' });
      setNewBank({ bankName: '', accountNumber: '', accountName: '' });
      fetchBanks();
    } catch (err: any) {
      toast({
        title: 'Failed to add bank',
        description: err.response?.data?.message || 'An error occurred',
        status: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const token = localStorage.getItem('token');

    try {
      await axios.delete(`https://api.cardora.net/api/user/bank-details/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({ title: 'Bank account removed', status: 'success' });
      fetchBanks();
    } catch (err: any) {
      toast({
        title: 'Failed to delete',
        description: err.response?.data?.message || 'An error occurred',
        status: 'error',
      });
    } finally {
      setDeleteId(null);
      onClose();
    }
  };

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner thickness="4px" color="blue.500" size="xl" />
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="100vw" mx="auto" minH="100vh">
      <Heading mb={8} textAlign="center">
        Manage Bank Accounts
      </Heading>

      <VStack spacing={10} align="stretch">
        {/* Add New Bank Form */}
        <MotionCard bg={cardBg} shadow="lg" borderRadius="xl">
          <CardBody>
            <Heading size="md" mb={6}>
              <HStack>
                <AddIcon />
                <Text>Add New Bank Account</Text>
              </HStack>
            </Heading>

            <form onSubmit={handleAddBank}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel>Bank Name</FormLabel>
                  <Input
                    value={newBank.bankName}
                    onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                    placeholder="e.g. GTBank, Zenith Bank"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Account Number</FormLabel>
                  <Input
                    value={newBank.accountNumber}
                    onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                    placeholder="0123456789"
                    type="tel"
                    maxLength={10}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Account Name</FormLabel>
                  <Input
                    value={newBank.accountName}
                    onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                    placeholder="John Doe"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="green"
                  w="full"
                  isLoading={submitting}
                  loadingText="Adding..."
                >
                  Add Bank Account
                </Button>
              </VStack>
            </form>
          </CardBody>
        </MotionCard>

        {/* Saved Banks List */}
        <MotionCard bg={cardBg} shadow="lg" borderRadius="xl">
          <CardBody>
            <Heading size="md" mb={6}>
              Saved Bank Accounts
            </Heading>

            {banks.length === 0 ? (
              <Center py={10}>
                <Text color="gray.500">No bank accounts added yet</Text>
              </Center>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Bank</Th>
                    <Th>Account Number</Th>
                    <Th>Account Name</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {banks.map((bank) => (
                    <Tr key={bank.id}>
                      <Td fontWeight="medium">{bank.bankName}</Td>
                      <Td>{bank.accountNumber}</Td>
                      <Td>{bank.accountName}</Td>
                      <Td>
                        <IconButton
                          aria-label="Delete bank"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteId(bank.id);
                            onOpen();
                          }}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </MotionCard>
      </VStack>

      {/* Delete Confirmation */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Bank Account
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default BankDetails;