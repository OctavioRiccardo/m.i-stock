/**
 * ====================================================================
 * USUARIOS INICIALES (RAMA TEST - CUENTA DE ADMINISTRADOR DIRECTA)
 * ====================================================================
 * 
 * Propósito:
 * Proveer únicamente la cuenta raíz de Administrador para pruebas sin datos
 * ficticios adicionales, permitiendo dar de alta colaboradores reales desde
 * el módulo de Gestión de Usuarios (/adminusuarios).
 */

import { Usuario } from '@/models/modelos_dominio/userModel';

export const initialUsuarios: Usuario[] = [
  {
    id: 'usr-admin',
    email: 'admin@mistock.com',
    nombre: 'Administrador',
    nombreCompleto: 'Administrador Principal',
    rol: 'admin',
    telefono: '+54 9 11 4521-8890',
    estado: 'activo',
    ultimoAcceso: new Date(),
    fechaCreacion: new Date(),
  },
  {
    id: 'usr-admin-test',
    email: 'admin@test.com',
    nombre: 'Admin Test',
    nombreCompleto: 'Administrador de Pruebas (Test)',
    rol: 'admin',
    telefono: '+54 9 11 5555-4321',
    estado: 'activo',
    ultimoAcceso: new Date(),
    fechaCreacion: new Date(),
  },
];
