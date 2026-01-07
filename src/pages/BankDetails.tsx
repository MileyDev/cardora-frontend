import { useEffect, useState, useRef } from 'react';
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
  Select,
  FormHelperText,
  Badge,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

interface BankDetail {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface BankInfo {
  name: string;
  code: string;
}

const bankInfos: BankInfo[] = [
  { name: 'Access Bank', code: '044' },
  { name: 'Zenith bank PLC', code: '057' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'First Bank PLC', code: '011' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'EcoBank PLC', code: '050' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Union Bank PLC', code: '032' },

  { name: 'Wema Bank PLC', code: '035' },
  { name: 'Sterling Bank PLC', code: '232' },
  { name: 'Polaris bank', code: '076' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Standard Chaterted bank PLC', code: '068' },
  { name: 'ProvidusBank PLC', code: '101' },
  { name: 'Titan Trust Bank', code: '000025' },
  { name: 'PremiumTrust Bank', code: '000031' },
  { name: 'Lotus Bank', code: '000029' },
  { name: 'Optimus Bank', code: '000036' },

  { name: 'Opay', code: '100004' },
  { name: 'PALMPAY', code: '100033' },
  { name: 'Kuda', code: '090267' },
  { name: 'Moniepoint Microfinance Bank', code: '090405' },
  { name: 'Fairmoney Microfinance Bank Ltd', code: '090551' },
  { name: 'Carbon', code: '100026' },
  { name: 'RenMoney Microfinance Bank', code: '090198' },
  { name: 'VFD Micro Finance Bank', code: '090110' },
  { name: 'Sparkle', code: '090325' },
  { name: "GoMoney", code: "100022" },

  { name: 'Paycom', code: '305' },
  { name: 'Paga', code: '327' },
  { name: 'Paystack Payments Limited', code: '110006' },
  { name: 'Flutterwave Technology Solutions Limited', code: '110002' },
  { name: 'Interswitch Limited', code: '110003' },
  { name: 'TeamApt', code: '110007' },

  { name: 'Unity Bank PLC', code: '215' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Suntrust Bank', code: '100' },
  { name: 'Globus Bank', code: '103' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Taj Bank Limited', code: '000026' },
  { name: 'Stanbic IBTC Ease wallet', code: '100007' },
  { name: 'GTMobile', code: "100009" }
]
;

const BankDetails = () => {
  const [banks, setBanks] = useState<BankDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resolvingName, setResolvingName] = useState(false);

  const [newBank, setNewBank] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });

  const toast = useToast();
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.800');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteIdRef = useRef<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  /* =========================
     Fetch saved bank accounts
     ========================= */
  const fetchBanks = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const res = await axios.get<BankDetail[]>(
        'https://api.cardora.net/api/user/bank-details',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBanks(res.data);
    } catch (err: any) {
      toast({
        title: 'Failed to load bank accounts',
        description: err.response?.data || 'Please re-login',
        status: 'error',
      });
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

  const nubanApiKey = import.meta.env.VITE_NUBAN_KEY;
  useEffect(() => {
    if (newBank.accountNumber.length === 10 && newBank.bankCode) {
      resolveAccountName();
    } else {
      setNewBank(prev => ({ ...prev, accountName: '' }));
    }
  }, [newBank.accountNumber, newBank.bankCode]);

  const resolveAccountName = async () => {
    try {
      setResolvingName(true);

      const res = await axios.get(
        `https://app.nuban.com.ng/api/${nubanApiKey}?bank_code=${newBank.bankCode}&acc_no=${newBank.accountNumber}`,
      );

      const result = Array.isArray(res.data) ? res.data[0] : null;

      if (!result?.account_name) {
        throw new Error('Account name not found');
      }
      console.log(res.data);

      setNewBank(prev => ({
        ...prev,
        accountName: result.account_name.toUpperCase(),
      }));
    } catch {
      setNewBank(prev => ({ ...prev, accountName: '' }));
      toast({
        title: 'Invalid account details',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setResolvingName(false);
    }
  };

  /* =========================
     Add bank account
     ========================= */
  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBank.bankName || !newBank.accountNumber || !newBank.accountName) {
      toast({ title: 'Complete all fields', status: 'warning' });
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post(
        'https://api.cardora.net/api/user/bank-details',
        {
          bankName: newBank.bankName,
          accountNumber: newBank.accountNumber,
          accountName: newBank.accountName,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({ title: 'Bank account added', status: 'success' });
      setNewBank({ bankName: '', bankCode: '', accountNumber: '', accountName: '' });
      fetchBanks();
    } catch (err: any) {
      toast({
        title: 'Failed to add bank',
        description: err.response?.data || 'Try again',
        status: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     Delete bank account
     ========================= */
  const handleDelete = async () => {
    if (!deleteIdRef.current) return;
    const token = localStorage.getItem('token');

    try {
      await axios.delete(
        `https://api.cardora.net/api/user/bank-details/${deleteIdRef.current}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Bank account removed', status: 'success' });
      fetchBanks();
    } catch {
      toast({ title: 'Failed to delete bank', status: 'error' });
    } finally {
      deleteIdRef.current = null;
      onClose();
    }
  };

  /* =========================
     UI
     ========================= */
  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} minH="100vh">
      <Heading mb={8} textAlign="center">
        Bank Accounts
      </Heading>

      <VStack spacing={10} align="stretch">
        {/* Add Bank */}
        <MotionCard bg={cardBg} shadow="lg" borderRadius="xl">
          <CardBody>
            <Heading size="md" mb={6}>
              <HStack>
                <AddIcon />
                <Text>Add Bank Account</Text>
              </HStack>
            </Heading>

            <form onSubmit={handleAddBank}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel>Bank</FormLabel>
                  <Select
                    placeholder="Select bank"
                    value={newBank.bankCode}
                    onChange={(e) => {
                      const bank = bankInfos.find(b => b.code === e.target.value);
                      if (!bank) return;
                      setNewBank(prev => ({
                        ...prev,
                        bankCode: bank.code,
                        bankName: bank.name,
                        accountName: '',
                      }));
                    }}
                  >
                    {bankInfos.map(b => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Account Number</FormLabel>
                  <Input
                    value={newBank.accountNumber}
                    maxLength={10}
                    onChange={(e) =>
                      setNewBank(prev => ({
                        ...prev,
                        accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                        accountName: '',
                      }))
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Account Name</FormLabel>
                  <Input
                    value={newBank.accountName}
                    isReadOnly
                    placeholder="Fetched automatically"
                  />
                  {resolvingName && <Spinner size="sm" mt={2} />}
                  {newBank.accountName && (
                    <Badge mt={2} colorScheme="green">
                      Verified
                    </Badge>
                  )}
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="green"
                  w="full"
                  isLoading={submitting}
                  isDisabled={!newBank.accountName}
                >
                  Add Bank
                </Button>
              </VStack>
            </form>
          </CardBody>
        </MotionCard>

        {/* Saved Banks */}
        <MotionCard bg={cardBg} shadow="lg" borderRadius="xl">
          <CardBody>
            <Heading size="md" mb={6}>
              Saved Banks
            </Heading>

            {banks.length === 0 ? (
              <Center py={8}>
                <Text color="gray.500">No bank accounts added</Text>
              </Center>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Bank</Th>
                    <Th>Account No</Th>
                    <Th>Name</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {banks.map(b => (
                    <Tr key={b.id}>
                      <Td>{b.bankName}</Td>
                      <Td>{b.accountNumber}</Td>
                      <Td>{b.accountName}</Td>
                      <Td>
                        <IconButton
                          aria-label="Delete"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => {
                            deleteIdRef.current = b.id;
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

      {/* Confirm Delete */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Bank</AlertDialogHeader>
            <AlertDialogBody>This action cannot be undone.</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
              <Button colorScheme="red" ml={3} onClick={handleDelete}>
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
