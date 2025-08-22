/**
 * @file db_connect.ts
 * @description
 * This file centralizes the configuration for connecting to the correct
 * Firestore document for this specific website.
 */

/**
 * 🏢 ORG_ID - Identificador da Organização
 * 
 * ID da organização no Firestore. Usado para estruturar a base de dados multi-tenant.
 */
export const ORG_ID = 'ORG_ID_AGENCIA_TESTE_1';

/**
 * 🎯 SITE_ID - Identificador Único do Website
 * 
 * Este é o ID que liga o frontend ao backend no Firestore.
 * Corresponde ao ID do documento na coleção `websites`.
 * 
 * ⚠️ NÃO ALTERAR, a menos que o website seja migrado.
 */
export const SITE_ID = 'site-exemplo-teste-1';

/**
 * 🔗 API_BASE_URL - Endpoint da API de Conteúdo
 * 
 * URL base para a API que fornece o conteúdo do site.
 * Usa a variável de ambiente VITE_API_URL em produção e aponta para o emulador local em desenvolvimento.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * 📧 EMAIL_ENDPOINT - Endpoint para envio de emails
 * 
 * Endpoint específico para o serviço de envio de emails.
 * URL fixa para o serviço de email independente da API principal.
 */
export const EMAIL_ENDPOINT = 'https://mindful-renewal-production.up.railway.app/send-email';
