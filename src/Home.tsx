import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  useColorModeValue,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stack,
  StackDivider,
  useToast,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaGift, FaExchangeAlt, FaMoneyBillWave } from 'react-icons/fa';

const MotionBox = motion.create(Box);

interface Rate {
    id: number;
    giftCardType: string;
    exchangeRate: number;
    updatedAt: string;
};

function Home() {
  const viewBg = useColorModeValue('blue.500', 'blue.300');
  const buttonColor = useColorModeValue('white', 'gray.800');
  const [topRates, setTopRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://api.cardora.net/api/rates', {
          headers: { Authorization: 'Bearer ' + token },
        });
        setTopRates(response.data.slice(0, 3));
      } catch (error: any) {
        toast({
          title: 'Error fetching rates',
          description: error.response?.data?.message || 'Please log in again.',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, [toast]);

  return (
    <Box
      bgGradient="linear(to-b, rgba(173, 216, 230, 0.35), rgba(255, 255, 255, 1))"
      minH="100vh"
      p={8}
      textAlign="center"
    >
      {/* Hero Section */}
      <MotionBox
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Heading mb={4} fontWeight="bold">
          Welcome to Cardora
        </Heading>
        <Text mb={4} fontSize="lg" color="gray.800">
          Sell your gift cards for Naira quickly and securely.
        </Text>
        <Button as={Link} to="/rates" bg={viewBg} color={buttonColor}>
          View Rates
        </Button>
      </MotionBox>

      {/* How It Works Section */}
      <MotionBox
        mt={16}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Heading size="lg" mb={6}>
          How It Works
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {[
            {
              icon: FaGift,
              title: '1. Choose Your Card',
              text: 'Select from a wide range of supported gift cards.',
              color: 'blue.400',
            },
            {
              icon: FaExchangeAlt,
              title: '2. Get Instant Rate',
              text: 'See the best conversion rate for your card in seconds.',
              color: 'purple.400',
            },
            {
              icon: FaMoneyBillWave,
              title: '3. Get Paid Fast',
              text: 'Receive your money instantly after verification.',
              color: 'green.400',
            },
          ].map((step, idx) => (
            <MotionBox
              key={idx}
              as={Card}
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 200 }}
              shadow="md"
              borderRadius="xl"
              bg={useColorModeValue('white', 'gray.700')}
              p={6}
            >
              <CardHeader>
                <Icon as={step.icon} boxSize={10} color={step.color} />
                <Heading size="md" color={step.color} mt={4}>
                  {step.title}
                </Heading>
              </CardHeader>
              <CardBody>
                <Text color={useColorModeValue('gray.700', 'gray.300')}>{step.text}</Text>
              </CardBody>
            </MotionBox>
          ))}
        </SimpleGrid>
      </MotionBox>

      {/* Top Gift Card Rates */}
      <MotionBox
        mt={16}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Heading size="lg" mb={6}>
          Hot Rates
        </Heading>
        {loading ? (
          <Spinner size="lg" />
        ) : (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {topRates.map((rate) => (
              <Card
                key={rate.id}
                shadow="lg"
                borderRadius="xl"
                bg={useColorModeValue('white', 'gray.700')}
                p={6}
              >
                <CardHeader>
                  <Heading size="md" color={viewBg}>
                    {rate.giftCardType}
                  </Heading>
                </CardHeader>
                <CardBody>
                  <Text fontWeight="bold">₦{rate.exchangeRate} / $</Text>
                  <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')}>
                    Updated: {new Date(rate.updatedAt).toLocaleString()}
                  </Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </MotionBox>

      {/* FAQs */}
      <MotionBox
        mt={16}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Heading size="lg" mb={6}>
          FAQs
        </Heading>
        <Stack
          divider={<StackDivider />}
          spacing={4}
          maxW="700px"
          mx="auto"
          textAlign="left"
          bg={useColorModeValue('white', 'gray.700')}
          p={6}
          borderRadius="xl"
          shadow="md"
        >
          <Box>
            <Heading size="sm" mb={2}>
              How fast do I get paid?
            </Heading>
            <Text color={useColorModeValue('gray.700', 'white')}>
              Payments are processed instantly once your card is verified. Card verification takes 5 minutes or less.
            </Text>
          </Box>
          <Box>
            <Heading size="sm" mb={2}>
              What cards are supported?
            </Heading>
            <Text color={useColorModeValue('gray.700', 'white')}>
              We support popular cards like Amazon, Apple, Steam, and more.
            </Text>
          </Box>
          <Box>
            <Heading size="sm" mb={2}>
              Is Cardora secure?
            </Heading>
            <Text color={useColorModeValue('gray.700', 'white')}>
              Yes — all transactions are fully encrypted and handled securely.
            </Text>
          </Box>
        </Stack>
      </MotionBox>
    </Box>
  );
}

export default Home;
