import React from 'react';
import { Box, Flex } from '@mantine/core';
import { UserSidebar } from '@/views/user/UserSidebar';
import { Footer } from '@/views/common/Footer';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex style={{ minHeight: '100vh', backgroundColor: '#F8F7F2' }}>
      {/* Left Sidebar Menu */}
      <UserSidebar />

      {/* Main Content Area */}
      <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
        <Box component="main" style={{ flex: 1, paddingBottom: 24 }}>
          {children}
        </Box>
        <Footer />
      </Flex>
    </Flex>
  );
}
