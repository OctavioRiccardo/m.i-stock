import React from 'react';
import { Box, Flex } from '@mantine/core';
import { AdminSidebar } from '@/views/common/AdminSidebar';
import { Footer } from '@/views/common/Footer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex style={{ minHeight: '100vh', backgroundColor: '#dad7c3' }}>
      {/* Left Sidebar Menu */}
      <AdminSidebar />

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
