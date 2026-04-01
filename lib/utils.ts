import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateNumber(prefix: string, count: number): string {
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`
}

export function calcInvoiceTotal(items: { quantity: number; unitPrice: number; taxRate: number }[]) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tax = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100), 0)
  return { subtotal, tax, total: subtotal + tax }
}

export function calcOrderTotal(items: { quantity: number; unitPrice: number }[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}

export const STATUS_COLORS: Record<string, string> = {
  // Invoice
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PARTIAL: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-red-100 text-red-700',
  // Employee
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  ON_LEAVE: 'bg-yellow-100 text-yellow-700',
  TERMINATED: 'bg-red-100 text-red-700',
  // Leave
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  // Order
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  PARTIAL: 'Partiel',
  PAID: 'Payé',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulé',
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  ON_LEAVE: 'En congé',
  TERMINATED: 'Terminé',
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  CONFIRMED: 'Confirmé',
  PROCESSING: 'En cours',
  SHIPPED: 'Expédié',
  DELIVERED: 'Livré',
  ACCEPTED: 'Accepté',
  EXPIRED: 'Expiré',
  ORDERED: 'Commandé',
  RECEIVED: 'Reçu',
}
