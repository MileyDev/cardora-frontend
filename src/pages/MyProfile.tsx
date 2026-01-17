import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Card,
  CardBody,
  VStack,
  Text,
  Avatar,
  Divider,
  Button,
  SimpleGrid,
  Icon,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Badge,
  Spacer,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaWallet, FaExchangeAlt, FaUserCircle, FaSignOutAlt, FaCreditCard, FaLock, FaHeadset } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { requestPushPermission } from '../pwa/push';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

interface LedgerEntry {
  amount: number;
  type: string; // e.g., "credit", "debit", "deposit", "withdrawal"
  reference: string;
  createdAt: string;
}

interface ProfileInfo {
  username: string;
  avatarUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  isKycVerified: boolean;
  createdAt: string;
}

interface ProfileData {
  id: string;
  balance: {
    availableBalance: number;
    lockedBalance: number;
  };
  ledger: LedgerEntry[];
}

const MyProfile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [basicInfo, setBasicInfo] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const accentBg = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const balanceColor = useColorModeValue('green.600', 'green.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to view your profile',
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

        const response = await axios.get<ProfileData>('https://api.cardora.net/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const basicInfoRes = await axios.get<ProfileInfo>('https://api.cardora.net/api/user/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        })

        setProfile(response.data);
        setBasicInfo(basicInfoRes.data);
      } catch (err: any) {
        let message = 'Failed to load profile';

        if (err.response) {
          if (err.response.status === 401) {
            message = 'Session expired. Please log in again.';
            localStorage.removeItem('token');
            navigate('/login');
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

    fetchProfile();
  }, [toast, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
      status: 'info',
      duration: 3000,
    });
    navigate('/login');
  };

  const allowPush = async () => {
    const token = localStorage.getItem('token');

    const sub = await requestPushPermission();

    if (sub) {
      await axios.post(
        "https://api.cardora.net/api/push/subscribe",
        { subscriptionJson: sub },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
  }

  const settingsNav = [
    {
      title: "Manage Bank Accounts",
      icon: FaCreditCard,
      path: "/bank-details",
      color: "purple.500",
    },
    {
      title: "Withdrawal History",
      icon: FaExchangeAlt,
      path: "/history",
      color: "blue.500",
    },
    {
      title: "Security & Password",
      icon: FaLock,
      path: "/security", // todo: implement later
      color: "orange.500",
    },
    {
      title: "Contact Support",
      icon: FaHeadset,
      path: "/support",
      color: "teal.500",
    },
    {
      title: "Logout",
      icon: FaSignOutAlt,
      onClick: handleLogout,
      color: "red.500",
    },
  ];

  const totalBalance = profile ? profile.balance.availableBalance + profile.balance.lockedBalance : 0;
  const totalTransactions = profile ? profile.ledger.length : 0;

  if (loading) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" thickness="4px" color="blue.500" />
          <Text>Loading your profile...</Text>
        </VStack>
      </Center>
    );
  }

  if (error || !profile) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Text color="red.500" fontSize="xl" fontWeight="bold">
            Oops!
          </Text>
          <Text color="gray.600" maxW="md" textAlign="center">
            {error || 'Unable to load profile'}
          </Text>
          <Button colorScheme="blue" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="100vw" minW="100vw" minH="100vh" mx="auto">
      <Heading mb={8} size="2xl" textAlign="center">
        My Profile
      </Heading>

      <VStack spacing={10} align="stretch">
        {/* User Info Card */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="xl"
          border="1px solid"
          borderColor={borderColor}
          overflow="hidden"
        >
          <CardBody p={{ base: 6, md: 8 }}>
            <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={8}>
              <Avatar size="2xl" name={basicInfo?.username} src={basicInfo?.avatarUrl} icon={<FaUserCircle />} bg="blue.500" color="white" />
              <VStack align={{ base: 'center', md: 'start' }} spacing={2}>
                <Heading size="2xl">{basicInfo?.username}</Heading>
                <Text fontSize="lg" color={textColor}>
                  {basicInfo?.email}
                </Text>
                <HStack spacing={4}>
                  <Badge colorScheme="green">Active</Badge>
                  {/* You can add KYC status badge if added to endpoint */}
                </HStack>
              </VStack>
            </Flex>
          </CardBody>
        </MotionCard>

        {/* Balance Display Card */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          bg={accentBg}
          borderRadius="2xl"
          boxShadow="2xl"
          border="1px solid"
          borderColor={useColorModeValue('blue.200', 'blue.800')}
          overflow="hidden"
        >
          <CardBody p={{ base: 6, md: 10 }}>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <Heading size="lg">Wallet Balance</Heading>
                <Icon as={FaWallet} color={balanceColor} boxSize={8} />
              </HStack>

              <Stat textAlign="center">
                <StatNumber fontSize={{ base: '4xl', md: '6xl' }} color={balanceColor}>
                  ₦{totalBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </StatNumber>
                <StatHelpText fontSize="md">
                  Available: ₦{profile.balance.availableBalance.toLocaleString('en-NG')}
                  {'  •  '}
                  Locked: ₦{profile.balance.lockedBalance.toLocaleString('en-NG')}
                </StatHelpText>
              </Stat>

              <Divider />

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={4}>
                <Stat>
                  <StatLabel>Total Transactions</StatLabel>
                  <StatNumber>{totalTransactions}</StatNumber>
                </Stat>

                <Stat>
                  <StatLabel>Last Activity</StatLabel>
                  <StatNumber>
                    {/*profile.lastTransactionDate
                      ? new Date(profile.lastTransactionDate).toLocaleDateString('en-NG')
                      : 'N/A'*/}
                  </StatNumber>
                </Stat>

                <Stat>
                  <StatLabel>Account Type</StatLabel>
                  <StatNumber>User</StatNumber>
                </Stat>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </MotionCard>

        <Box>
          <Heading size="lg" mb={6}>
            Wallet Actions
          </Heading>
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={6}>
            {[
              {
                title: "Withdraw Funds",
                icon: FaCreditCard,
                path: "/withdraw",
                color: "green.500",
              },
              {
                title: "Wallet History",
                icon: FaExchangeAlt,
                path: "/history", // or "/transactions" if you prefer
                color: "blue.500",
              },
            ].map((item, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                cursor="pointer"
                onClick={() => navigate(item.path)}
                bg={cardBg}
                borderRadius="xl"
                boxShadow="md"
                border="1px solid"
                borderColor={borderColor}
                _hover={{
                  boxShadow: "xl",
                  transform: "translateY(-4px)",
                  transition: "all 0.2s",
                }}
              >
                <CardBody>
                  <VStack spacing={4} align="center">
                    <Icon as={item.icon} boxSize={12} color={item.color} />
                    <Text fontWeight="bold" fontSize="lg" textAlign="center">
                      {item.title}
                    </Text>
                  </VStack>
                </CardBody>
              </MotionCard>
            ))}
          </SimpleGrid>
        </Box>

        {/* Profile & Settings Navigation */}
        <Box>
          <Heading size="lg" mb={6}>
            Profile & Settings
          </Heading>

          <Card bg={cardBg} borderRadius="xl" boxShadow="md" overflow="hidden">
            <CardBody p={0}>
              <VStack spacing={0} divider={<Divider />} align="stretch">
                {settingsNav.map((item, index) => (
                  <MotionBox
                    key={index}
                    as="button"
                    p={5}
                    display="flex"
                    alignItems="center"
                    gap={4}
                    cursor="pointer"
                    _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                    onClick={item.onClick || (() => navigate(item.path))}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Icon as={item.icon} boxSize={6} color={item.color} />
                    <Text fontSize="lg" fontWeight="medium">
                      {item.title}
                    </Text>
                    {!item.onClick && <Spacer />}
                    {!item.onClick && <Icon as={ChevronRightIcon} color="gray.400" />}
                  </MotionBox>
                ))}
              </VStack>


              <Button
                mt={4}
                colorScheme="blue"
                onClick={async () => allowPush()}
                w="70%"
                textAlign="center"
              >
                Enable Notifications
              </Button>

            </CardBody>
          </Card>
        </Box>

        {/* Recent Activity (Optional - expand later) */}
        {profile.ledger && profile.ledger.length > 0 && (
          <Box mt={12}>
            <Heading size="lg" mb={6}>
              Recent Activity
            </Heading>
            {/* You can add a small table or list of ledger entries here */}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default MyProfile;