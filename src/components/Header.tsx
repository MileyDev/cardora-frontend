import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useColorModeValue,
  useColorMode,
  Text,
  Divider,
  VStack,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Rates', path: '/rates' },
  { name: 'Submit', path: '/submit' },
  { name: 'Transactions', path: '/transactions', auth: true },
  { name: 'Admin', path: '/admin', auth: true, admin: true },
];

interface NavItemProps {
  name: string;
  path: string;
  auth?: boolean;
  admin?: boolean;
  onClick?: () => void;
}

const NavItem = ({ name, path, auth, admin, onClick }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  const color = useColorModeValue('gray.700', 'gray.200');
  const activeColor = useColorModeValue('blue.600', 'blue.300');

  
  const isAuthenticated = !!localStorage.getItem('token'); 
  const isAdmin = true; 

  if ((auth && !isAuthenticated) || (admin && !isAdmin)) return null;

  return (
    <RouterLink to={path} style={{ textDecoration: 'none' }} onClick={onClick}>
      <Text
        fontWeight={isActive ? 'bold' : 'medium'}
        color={isActive ? activeColor : color}
        _hover={{ color: activeColor }}
        transition="color 0.2s"
      >
        {name}
      </Text>
    </RouterLink>
  );
};

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem('token'); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    onClose();
  };

  return (
    <>
      <MotionBox
        as="header"
        position="sticky"
        top={0}
        zIndex="banner"
        bg={bg}
        borderBottom="1px solid"
        borderColor={borderColor}
        px={{ base: 4, md: 8 }}
        py={4}
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center" maxW="7xl" mx="auto">
          {/* Logo */}
          <RouterLink to="/">
            <Text
              fontSize="2xl"
              fontWeight="bold"
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
            >
              Cardora
            </Text>
          </RouterLink>

          {/* Desktop Navigation */}
          <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}

            {/* Theme Toggle - Desktop */}
            <IconButton
              aria-label="Toggle theme"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              size="lg"
            />

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Button colorScheme="red" size="md" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Button as={RouterLink} to="/login" colorScheme="blue" size="md">
                Login
              </Button>
            )}
          </HStack>

          {/* Mobile Menu Button */}
          <HStack display={{ base: 'flex', md: 'none' }} spacing={4}>
            <IconButton
              aria-label="Toggle theme"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
            />

            <IconButton
              aria-label="Open menu"
              icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
              onClick={onOpen}
              variant="ghost"
            />
          </HStack>
        </Flex>
      </MotionBox>

      {/* Mobile Drawer */}
      <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent bg={useColorModeValue('white', 'gray.800')}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Text fontSize="xl" fontWeight="bold">
              Cardora
            </Text>
          </DrawerHeader>

          <DrawerBody>
            <VStack align="stretch" spacing={6} mt={8}>
              {navItems.map((item) => (
                <NavItem key={item.path} {...item} onClick={onClose} />
              ))}

              <Divider my={4} />

              {isAuthenticated ? (
                <Button
                  colorScheme="red"
                  onClick={handleLogout}
                  w="full"
                  size="lg"
                >
                  Logout
                </Button>
              ) : (
                <Button
                  as={RouterLink}
                  to="/login"
                  colorScheme="blue"
                  onClick={onClose}
                  w="full"
                  size="lg"
                >
                  Login
                </Button>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Header;