'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

// Form validation schema
const registerSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          username: values.username,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success('Registration successful! Please log in.');

      router.push('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error('Registration failed: ' + message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen px-4 bg-[#1E1E1E]'>
      <Card className='w-full max-w-md bg-[#292929] border border-[#49454F] shadow-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-white font-satoshi'>
            Create an account
          </CardTitle>
          <CardDescription className='text-[#86858d]'>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-white'>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='email@example.com'
                        {...field}
                        disabled={isLoading}
                        className='bg-[#1A1A1A] border-[#6D6D6D] text-white focus-visible:ring-[#90FE95] focus-visible:border-[#90FE95]'
                      />
                    </FormControl>
                    <FormMessage className='text-[#ff6b6b]' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-white'>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='username'
                        {...field}
                        disabled={isLoading}
                        className='bg-[#1A1A1A] border-[#6D6D6D] text-white focus-visible:ring-[#90FE95] focus-visible:border-[#90FE95]'
                      />
                    </FormControl>
                    <FormMessage className='text-[#ff6b6b]' />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='firstName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-white'>First Name (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='John'
                          {...field}
                          disabled={isLoading}
                          className='bg-[#1A1A1A] border-[#6D6D6D] text-white focus-visible:ring-[#90FE95] focus-visible:border-[#90FE95]'
                        />
                      </FormControl>
                      <FormMessage className='text-[#ff6b6b]' />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='lastName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-white'>Last Name (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Doe'
                          {...field}
                          disabled={isLoading}
                          className='bg-[#1A1A1A] border-[#6D6D6D] text-white focus-visible:ring-[#90FE95] focus-visible:border-[#90FE95]'
                        />
                      </FormControl>
                      <FormMessage className='text-[#ff6b6b]' />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-white'>Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='********'
                        {...field}
                        disabled={isLoading}
                        className='bg-[#1A1A1A] border-[#6D6D6D] text-white focus-visible:ring-[#90FE95] focus-visible:border-[#90FE95]'
                      />
                    </FormControl>
                    <FormMessage className='text-[#ff6b6b]' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-white'>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='********'
                        {...field}
                        disabled={isLoading}
                        className='bg-[#1A1A1A] border-[#6D6D6D] text-white focus-visible:ring-[#90FE95] focus-visible:border-[#90FE95]'
                      />
                    </FormControl>
                    <FormMessage className='text-[#ff6b6b]' />
                  </FormItem>
                )}
              />
              <Button
                type='submit'
                className='w-full py-6 rounded-xl border border-[#90FE95] bg-[#292929] text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 active:translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#3AFFE1]'
                disabled={isLoading}
                style={{ boxShadow: '0px 3px 0px 0px #3affe1' }}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className='flex justify-center pb-6'>
          <div className='text-[#86858d]'>
            Already have an account?{' '}
            <Link href='/login' className='text-[#90FE95] hover:underline font-medium'>
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
