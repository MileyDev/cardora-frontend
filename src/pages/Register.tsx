import { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  useToast,
  useColorModeValue,
  Text,
} from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const submitBg = useColorModeValue('blue.500', 'blue.300');
  const buttonColor = useColorModeValue('white', 'gray.800');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('Register payload:', { username, email, password });

      const response = await axios.post(
        'https://api.cardora.net/api/auth/register',
        { username, email, password, isAdmin: false },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('Register response:', response.data);

      localStorage.setItem('token', response.data.token);

      toast({
        title: 'Registration successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/submit');
    } catch (error: any) {
      console.error('Register error:', error.response?.data, error.message);

      const errorMessage =
        error.response?.data?.Message ||
        error.response?.data?.message ||
        'An error occurred during registration';

      toast({
        title: 'Registration failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      minW="100vw">
      <Box p={{ base: 6, md: 8 }} maxW="400px" mx="auto">
        <VStack spacing={8}>
          <Heading textAlign="center">Join Cardora</Heading>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim())}
                  placeholder="Choose a username"
                  isDisabled={isSubmitting}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="your.email@example.com"
                  isDisabled={isSubmitting}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Must contain a number & a special character"
                  isDisabled={isSubmitting}
                />
              </FormControl>

              <Button
                type="submit"
                w="full"
                bg={submitBg}
                color={buttonColor}
                isLoading={isSubmitting}
                loadingText="Creating account..."
                _hover={{ bg: useColorModeValue('blue.600', 'blue.400') }}
              >
                Register
              </Button>
            </VStack>
          </form>

          <Text fontSize="sm" textAlign="center">
            Already have an account?{' '}
            <RouterLink to="/login" style={{ color: '#3182ce' }}>
              Login here
            </RouterLink>
          </Text>
        </VStack>
      </Box>
    </MotionBox>
  );
};

export default Register;