import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import {
    Box,
    Heading,
    FormControl,
    FormLabel,
    Input,
    Select,
    Button,
    VStack,
    useToast,
    useColorModeValue,
    Spinner,
    Image,
    Text,
    FormHelperText,
    FormErrorMessage,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';


const MotionBox = motion.create(Box);

interface Bank {
    name: string;
    code: string;
}

const banks: Bank[] = [
    { name: 'Access Bank', code: '044' },
    { name: 'GTBank', code: '058' },
    { name: 'First Bank', code: '011' },
    { name: 'FCMB', code: '785' },
    { name: 'UBA', code: '033' },
    { name: 'Kuda Bank', code: '50211' },
    { name: 'Moniepoint MFB', code: '50515' },
    { name: 'Opay', code: '999992' },
    { name: 'PalmPay', code: '999991' },
    { name: 'Paga', code: '547' },
    { name: 'EcoBank', code: '65587' },
    { name: 'Fidelity Bank', code: '66537' },
    { name: 'Keystone Bank', code: '9866' },
    { name: 'Polaris Bank', code: '7545' },
    { name: 'Wema Bank', code: '0997' },
    { name: 'Union Bank', code: '09846' },
    { name: 'Sterling Bank', code: '7859' },
    { name: 'VFD', code: '7654' },
    { name: 'Zenith Bank', code: '057' },
];

const Submit = () => {
    const [giftCardType, setGiftCardType] = useState<string>('');
    const [value, setValue] = useState<string>('');
    const [bankCode, setBankCode] = useState<string>('');
    const [accountNumber, setAccountNumber] = useState<string>('');
    const [accountName, setAccountName] = useState<string>('');
    const [loadingName, setLoadingName] = useState<boolean>(false);
    const [images, setImages] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const toast = useToast();
    const navigate = useNavigate();

    const submitBg = useColorModeValue('blue.500', 'blue.300');
    const buttonColor = useColorModeValue('white', 'gray.800');

    // Fetch account name when account number is 10 digits and bank is selected
    useEffect(() => {
        if (accountNumber.length === 10 && bankCode) {
            fetchAccountName();
        } else {
            setAccountName('');
        }
    }, [accountNumber, bankCode]);

    const fetchAccountName = async () => {
        try {
            setLoadingName(true);
            setAccountName('');

            const response = await axios.get(
                `https://api.cardora.net/api/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`
            );

            const name = response.data?.accountName || '';
            setAccountName(name);

            if (name) {
                toast({
                    title: 'Account Verified',
                    description: `Account name: ${name}`,
                    status: 'success',
                    duration: 3000,
                });
            }
        } catch (error: any) {
            setAccountName('');
            toast({
                title: 'Verification Failed',
                description: error.response?.data?.message || 'Could not verify account name',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setLoadingName(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImages(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file)
        } else {
            toast({
                title: 'Invalid File',
                description: 'Please select an image file',
                status: 'warning',
                duration: 3000,
            });
            setImages(null);
            setImagePreview(null);
        }
    };

    const isFormValid = (): boolean => {
        return (
            !!giftCardType &&
            !!value &&
            Number(value) > 0 &&
            !!bankCode &&
            accountNumber.length === 10 &&
            !!accountName &&
            !!images &&
            !isSubmitting &&
            !loadingName
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!isFormValid()) return;
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');

            const formData = new FormData();
            formData.append('giftCardType', giftCardType);
            formData.append('value', value);

            const bankName = banks.find((b) => b.code === bankCode)?.name || '';
            const combinedBankDetails = `${bankName} | ${accountNumber} | ${accountName}`;
            formData.append('bankDetails', combinedBankDetails);

            if (images) {
                formData.append('images[0]', images);
            }

            await axios.post('https://api.cardora.net/api/transactions', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast({
                title: 'Success',
                description: 'Gift card submitted successfully',
                status: 'success',
                duration: 4000,
                isClosable: true,
            });

            // Reset form
            setGiftCardType('');
            setValue('');
            setBankCode('');
            setAccountNumber('');
            setAccountName('');
            setImages(null);

            navigate('/transactions');
        } catch (error: any) {
            toast({
                title: 'Submission Failed',
                description: error.response?.data?.message || 'Something went wrong. Please try again.',
                status: 'error',
                duration: 6000,
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
            <Box p={{ base: 6, md: 8 }} maxW="container.lg" mx="auto">
                <Heading mb={8} textAlign="center">
                    Submit Gift Card
                </Heading>

                <form onSubmit={handleSubmit}>
                    <VStack spacing={6} align="stretch">
                        {/* Gift Card Type */}
                        <FormControl isRequired>
                            <FormLabel>Gift Card Type</FormLabel>
                            <Select
                                placeholder="Select gift card type"
                                value={giftCardType}
                                onChange={(e) => setGiftCardType(e.target.value)}
                                isDisabled={isSubmitting}
                            >
                                <option value="Amazon">Amazon</option>
                                <option value="iTunes">iTunes</option>
                                <option value="Google Play">Google Play</option>
                                <option value="Razer Gold">Razer Gold</option>
                                <option value="Footlocker">Footlocker</option>
                                <option value="Steam">Steam</option>
                                <option value="Sephora">Sephora</option>
                                <option value="XBox">XBox</option>
                                <option value="eBay">eBay</option>
                                <option value="Vanilla">Vanilla</option>
                                <option value="Macy">Macy's</option>
                                <option value="Nike">Nike</option>
                            </Select>
                        </FormControl>

                        {/* Value */}
                        <FormControl isRequired>
                            <FormLabel>Value ($)</FormLabel>
                            <Input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Enter card value"
                                isDisabled={isSubmitting}
                            />
                            {value && Number(value) <= 0 && (
                                <FormErrorMessage>Value must be greater than 0</FormErrorMessage>
                            )}
                        </FormControl>

                        {/* Bank Selection */}
                        <FormControl isRequired>
                            <FormLabel>Select Bank</FormLabel>
                            <Select
                                placeholder="Choose your bank"
                                value={bankCode}
                                onChange={(e) => setBankCode(e.target.value)}
                                isDisabled={isSubmitting}
                            >
                                {banks.map((bank) => (
                                    <option key={bank.code} value={bank.code}>
                                        {bank.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Account Number */}
                        <FormControl isRequired>
                            <FormLabel>Account Number</FormLabel>
                            <Input
                                type="text"
                                maxLength={10}
                                value={accountNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setAccountNumber(val);
                                }}
                                placeholder="10-digit account number"
                                isDisabled={isSubmitting}
                            />
                            {accountNumber.length > 0 && accountNumber.length !== 10 && (
                                <FormHelperText color="yellow.600">
                                    Please enter a 10-digit account number
                                </FormHelperText>
                            )}
                        </FormControl>

                        {/* Account Name (Auto-filled) */}
                        <FormControl>
                            <FormLabel>Account Name</FormLabel>
                            <Input
                                value={accountName}
                                isReadOnly
                                placeholder={loadingName ? 'Verifying...' : 'Account name will appear here'}
                                bg={useColorModeValue('gray.100', 'gray.700')}
                            />
                            {loadingName && <Spinner size="sm" mt={2} color="blue.500" />}
                        </FormControl>

                        {/* Image Upload */}
                        <FormControl isRequired>
                            <FormLabel>Upload Gift Card Image</FormLabel>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    handleFileChange(e)
                                }}
                                isDisabled={isSubmitting}
                                multiple={true}
                            />
                            {images && (
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                    Selected: {images.name}
                                </Text>
                            )}
                        </FormControl>

                        {imagePreview && (
                            <MotionBox
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                mt={3}>
                                <Text fontSize="sm" mb={2}>Preview:</Text>
                                <Image
                                    src={imagePreview}
                                    alt="Gift card preview"
                                    maxH="160px"
                                    objectFit="contain"
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                                />
                            </MotionBox>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            w="full"
                            bg={submitBg}
                            color={buttonColor}
                            isDisabled={!isFormValid() || isSubmitting}
                            isLoading={isSubmitting}
                            loadingText="Submitting..."
                            _hover={{ bg: useColorModeValue('blue.600', 'blue.400') }}
                            size="lg"
                        >
                            Submit Gift Card
                        </Button>
                    </VStack>
                </form>
            </Box>
        </MotionBox>
    );
};

export default Submit;