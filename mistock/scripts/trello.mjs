#!/usr/bin/env node

/**
 * ====================================================================
 * UTILIDAD DE INTEGRACIÓN: TRELLO API CLI (M.I Stock)
 * ====================================================================
 * 
 * Permite interactuar con Trello directamente desde terminal o scripts:
 * - Listar tableros
 * - Listar columnas
 * - Listar y crear tarjetas de tareas
 * - Mover tarjetas entre columnas
 * 
 * Uso:
 * node scripts/trello.mjs boards
 * node scripts/trello.mjs lists <boardId>
 * node scripts/trello.mjs cards <boardId>
 * node scripts/trello.mjs add-card <listId> "Título" "Descripción opcional"
 * node scripts/trello.mjs move-card <cardId> <targetListId>
 */

import fs from 'node:fs';
import path from 'node:path';

// Cargar credenciales desde entorno o .env.local
let apiKey = process.env.TRELLO_API_KEY;
let token = process.env.TRELLO_TOKEN;

if (!apiKey || !token) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('TRELLO_API_KEY=')) {
          apiKey = trimmed.split('=')[1]?.trim();
        }
        if (trimmed.startsWith('TRELLO_TOKEN=')) {
          token = trimmed.split('=')[1]?.trim();
        }
      }
    }
  } catch {
    // Silently continue
  }
}

if (!apiKey || !token) {
  console.error('❌ Error: Faltan las variables TRELLO_API_KEY y TRELLO_TOKEN en .env.local');
  process.exit(1);
}

const BASE_URL = 'https://api.trello.com/1';

function authQuery(extra = '') {
  return `key=${apiKey}&token=${token}${extra ? `&${extra}` : ''}`;
}

async function getBoards() {
  const res = await fetch(`${BASE_URL}/members/me/boards?${authQuery('fields=name,url,closed')}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getLists(boardId) {
  const res = await fetch(`${BASE_URL}/boards/${boardId}/lists?${authQuery('fields=name,idBoard,pos')}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getCards(boardId) {
  const res = await fetch(`${BASE_URL}/boards/${boardId}/cards?${authQuery('fields=name,idList,desc,url')}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function createCard(listId, name, desc = '') {
  const res = await fetch(`${BASE_URL}/cards?${authQuery()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idList: listId,
      name,
      desc,
      pos: 'bottom',
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function moveCard(cardId, targetListId) {
  const res = await fetch(`${BASE_URL}/cards/${cardId}?${authQuery()}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idList: targetListId,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function main() {
  const [,, command, arg1, arg2, arg3] = process.argv;

  switch (command) {
    case 'boards': {
      const boards = await getBoards();
      console.log('\n📋 Tableros en tu cuenta de Trello:');
      for (const b of boards) {
        if (!b.closed) {
          console.log(`- ${b.name} (ID: ${b.id}) -> ${b.url}`);
        }
      }
      break;
    }

    case 'lists': {
      if (!arg1) {
        console.error('Uso: node scripts/trello.mjs lists <boardId>');
        process.exit(1);
      }
      const lists = await getLists(arg1);
      console.log(`\n📑 Columnas del tablero (${arg1}):`);
      for (const l of lists) {
        console.log(`- ${l.name} (ID: ${l.id})`);
      }
      break;
    }

    case 'cards': {
      if (!arg1) {
        console.error('Uso: node scripts/trello.mjs cards <boardId>');
        process.exit(1);
      }
      const cards = await getCards(arg1);
      console.log(`\n🗂️ Tarjetas del tablero (${arg1}):`);
      for (const c of cards) {
        console.log(`- [${c.name}] (ID: ${c.id})`);
      }
      break;
    }

    case 'add-card': {
      if (!arg1 || !arg2) {
        console.error('Uso: node scripts/trello.mjs add-card <listId> "Título" "Descripción"');
        process.exit(1);
      }
      const card = await createCard(arg1, arg2, arg3 || '');
      console.log(`\n✅ Tarjeta creada exitosamente: "${card.name}"`);
      console.log(`🔗 URL: ${card.url}`);
      console.log(`🆔 ID: ${card.id}`);
      break;
    }

    case 'move-card': {
      if (!arg1 || !arg2) {
        console.error('Uso: node scripts/trello.mjs move-card <cardId> <targetListId>');
        process.exit(1);
      }
      const card = await moveCard(arg1, arg2);
      console.log(`\n✅ Tarjeta movida exitosamente: "${card.name}"`);
      break;
    }

    default:
      console.log(`
Comandos disponibles:
  node scripts/trello.mjs boards
  node scripts/trello.mjs lists <boardId>
  node scripts/trello.mjs cards <boardId>
  node scripts/trello.mjs add-card <listId> "Título" "Descripción"
  node scripts/trello.mjs move-card <cardId> <targetListId>
`);
  }
}

main().catch((err) => {
  console.error('❌ Error en operación de Trello:', err.message || err);
  process.exit(1);
});
