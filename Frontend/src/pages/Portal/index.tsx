import {
  Flex,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  useDisclosure,
  useBreakpointValue,
  DrawerCloseButton,
  Divider,
} from "@chakra-ui/react";
import { useRef } from "react";
import { FaBars } from "react-icons/fa";
import Navbar from "@components/organisms/Navbar";
import { Outlet } from "react-router-dom";
import ProfileMenu from "@components/organisms/ProfileMenu";
import SwitchTheme from "@components/molecules/SwitchTheme";
import LocaleSwap from "@components/atoms/LocaleSwap";
import Breadcrumb from "@components/molecules/Breadcrumb";

function Dashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Flex flexDir="column" position="relative" minHeight="100vh">
      {isMobile ? (
        <>
          <IconButton
            ref={btnRef}
            icon={<FaBars />}
            onClick={onOpen}
            display="flex"
            position="fixed"
            bottom="20px"
            right="20px"
            zIndex="overlay"
            aria-label="Open menu"
          />
          <Drawer
            isOpen={isOpen}
            placement="bottom"
            onClose={onClose}
            finalFocusRef={btnRef}
          >
            <DrawerOverlay />
            <DrawerContent>
              <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
              <DrawerCloseButton />
              <DrawerBody>
                <Flex direction="column" h="100%" gap={2}>
                  <Navbar />
                  <LocaleSwap />
                  <SwitchTheme />
                  <Divider />
                  <ProfileMenu />
                </Flex>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
          <Flex
            flex="1"
            minH="100vh"
            w="100%"
            bg="bg.page"
            paddingTop={{ base: 4, md: 0 }}
          >
            <Outlet />
          </Flex>
        </>
      ) : (
        <Flex flexDir="row" position="relative">
          <Flex
            justifyContent="space-between"
            alignItems="center"
            flexDir="column"
            h="100vh"
            position="fixed"
            bg="bg.navbar"
          >
            <Navbar />
            <Flex direction="column" mb="4" gap="2">
              <SwitchTheme />
              <LocaleSwap />
              <ProfileMenu />
            </Flex>
          </Flex>
          <Flex minH="100vh" w="100%" ml={12} bg="bg.page" direction="column">
            <Breadcrumb />
            <Outlet />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}

export default Dashboard;
