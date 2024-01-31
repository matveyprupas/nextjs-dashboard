'use server';

import { sql } from '@vercel/postgres';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
  
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
};

const UpdateInvoice = formSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
  
  try {
   
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
   
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
};

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
}