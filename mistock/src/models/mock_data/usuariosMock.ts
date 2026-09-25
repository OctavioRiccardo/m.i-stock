/**
 * ====================================================================
 * DATOS SIMULADOS INICIALES: USUARIOS Y PERFILES DEL SISTEMA
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar una lista representativa de usuarios sincronizada con
 * el esquema `public.usuario` y el enum `public.user_rol` en Supabase.
 */

import { Usuario } from '@/models/modelos_dominio/userModel';

export const initialUsuarios: Usuario[] = [
  {
    id: 'usr-001',
    email: 'octavio.admin@mistock.com',
    nombre: 'Octavio Riccardo',
    nombreCompleto: 'Octavio Riccardo',
    rol: 'admin',
    telefono: '+54 9 11 4521-8890',
    estado: 'activo',
    ultimoAcceso: new Date('2026-09-25T14:30:00'),
    fechaCreacion: new Date('2026-08-01'),
  },
  {
    id: 'usr-002',
    email: 'sofia.mendoza@mistock.com',
    nombre: 'Sofía Mendoza',
    nombreCompleto: 'Sofía Mendoza',
    rol: 'admin',
    telefono: '+54 9 11 5892-1144',
    estado: 'activo',
    ultimoAcceso: new Date('2026-09-25T11:15:00'),
    fechaCreacion: new Date('2026-08-10'),
  },
  {
    id: 'usr-003',
    email: 'lucas.benitez@mistock.com',
    nombre: 'Lucas Benítez',
    nombreCompleto: 'Lucas Benítez',
    rol: 'vendedor',
    telefono: '+54 9 11 3214-7788',
    estado: 'activo',
    ultimoAcceso: new Date('2026-09-25T16:45:00'),
    fechaCreacion: new Date('2026-08-15'),
  },
  {
    id: 'usr-004',
    email: 'camila.fernandez@mistock.com',
    nombre: 'Camila Fernández',
    nombreCompleto: 'Camila Fernández',
    rol: 'vendedor',
    telefono: '+54 9 11 6321-9900',
    estado: 'activo',
    ultimoAcceso: new Date('2026-09-24T19:20:00'),
    fechaCreacion: new Date('2026-08-20'),
  },
  {
    id: 'usr-005',
    email: 'mateo.rossi@mistock.com',
    nombre: 'Mateo Rossi',
    nombreCompleto: 'Mateo Rossi',
    rol: 'vendedor',
    telefono: '+54 9 11 7744-1234',
    estado: 'activo',
    ultimoAcceso: new Date('2026-09-23T18:00:00'),
    fechaCreacion: new Date('2026-09-01'),
  },
  {
    id: 'usr-006',
    email: 'valentina.romero@mistock.com',
    nombre: 'Valentina Romero',
    nombreCompleto: 'Valentina Romero',
    rol: 'vendedor',
    telefono: '+54 9 11 8899-5566',
    estado: 'inactivo',
    ultimoAcceso: new Date('2026-09-10T12:00:00'),
    fechaCreacion: new Date('2026-09-05'),
  },
  {
    id: 'usr-007',
    email: 'joaquin.gimenez@gmail.com',
    nombre: 'Joaquín Giménez',
    nombreCompleto: 'Joaquín Giménez',
    rol: 'no_rol',
    telefono: '+54 9 11 4123-6655',
    estado: 'activo',
    ultimoAcceso: new Date('2026-09-25T09:10:00'),
    fechaCreacion: new Date('2026-09-22'),
  },
  {
    id: 'usr-008',
    email: 'esteban.morales@mistock.com',
    nombre: 'Esteban Morales',
    nombreCompleto: 'Esteban Morales',
    rol: 'vendedor',
    telefono: '+54 9 11 9900-3322',
    estado: 'suspendido',
    ultimoAcceso: new Date('2026-09-02T15:30:00'),
    fechaCreacion: new Date('2026-07-15'),
  },
];
