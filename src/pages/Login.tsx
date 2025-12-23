import { useState, useEffect } from 'react';
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
    HStack,
    Divider,
    Text,
    Link as ChakraLink,
} from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const toast = useToast();

    const submitBg = useColorModeValue('blue.500', 'blue.300');
    const buttonColor = useColorModeValue('white', 'gray.800');

    // Google Sign-In initialization
    useEffect(() => {
        if (window.google) {
            window.google.id.initialize({
                client_id: "140117420800-2804u9ios3j2knjee7ocbmgt51su2gcm.apps.googleusercontent.com",
                callback: handleGoogleLogin,
            });
            window.google.id.renderButton(
                document.getElementById("googleButton"),
                { theme: "outline", size: "large", text: "continue_with" }
            );
        }
    }, []);

    const handleGoogleLogin = async (response: any) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const res = await axios.post(
                'https://api.cardora.net/api/googleauth/login',
                { token: response.credential },
                { headers: { 'Content-Type': 'application/json' } }
            );

            localStorage.setItem('token', res.data.token);
            toast({
                title: 'Google Login Success!',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            navigate('/upload');
        } catch (err: any) {
            toast({
                title: 'Google Login Failed',
                description: err.response?.data?.Message || 'Please try again',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const response = await axios.post(
                'https://api.cardora.net/api/auth/login',
                { username, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            localStorage.setItem('token', response.data.token);
            toast({
                title: 'Login successful',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            navigate('/submit');
        } catch (error: any) {
            toast({
                title: 'Login failed',
                description: error.response?.data?.Message || 'Invalid credentials or server error',
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
                    <Heading textAlign="center">Welcome Back</Heading>


                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                        <VStack spacing={5}>
                            <FormControl isRequired>
                                <FormLabel>Username</FormLabel>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    isDisabled={isSubmitting}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Password</FormLabel>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    isDisabled={isSubmitting}
                                />
                            </FormControl>

                            <Button
                                type="submit"
                                color={buttonColor}
                                bg={submitBg}
                                w="full"
                                isLoading={isSubmitting}
                                loadingText="Signing in..."
                                _hover={{ bg: useColorModeValue('blue.600', 'blue.400') }}
                            >
                                Login
                            </Button>
                        </VStack>
                    </form>

                    {/* Divider + Google */}
                    <HStack w="full">
                        <Divider />
                        <Text fontSize="sm" whiteSpace="nowrap" color="gray.500">
                            or
                        </Text>
                        <Divider />
                    </HStack>

                    <Box id="googleButton" w="full" display="flex" justifyContent="center" />

                    {/* Links */}
                    <VStack spacing={3} fontSize="sm">
                        <ChakraLink as={RouterLink} to="/signup" color="blue.500">
                            Create an account
                        </ChakraLink>
                        <ChakraLink as={RouterLink} to="/forgot-password" color="blue.500">
                            Forgot password?
                        </ChakraLink>
                    </VStack>
                </VStack>
            </Box>
        </MotionBox>
    );
};

export default Login;