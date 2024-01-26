'use server';

import { sql } from '@vercel/postgres';
import { z } from 'zod';

const formSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  date: z.string(),
  status: z.enum(['pending', 'paid']),
});

const CreateInvoice = formSchema.omit({id: true, date: true});

const sum = (...args: any[]) => {
  const operands = args.filter(el => !Array.isArray(el));
  return operands.reduce((acc, el) => acc + el);
}

export const createInvoice = async (formData: FormData) => {
  const rawFormData = Object.fromEntries( formData.entries() );
  const { customerId, amount, status } = CreateInvoice.parse(rawFormData);
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
}