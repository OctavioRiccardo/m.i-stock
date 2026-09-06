import React from 'react';
import { Box, Flex } from '@mantine/core';
import { Footer } from '@/views/common/Footer';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex
      direction="column"
      style={{
        minHeight: '100vh',
        backgroundColor: '#dad7c3',
      }}
    >
      {/* Main content centered without Navbar */}
      <Box
        component="main"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        {children}
      </Box>

      {/* Footer displayed at bottom */}
      <Footer />
    </Flex>
  );
}
