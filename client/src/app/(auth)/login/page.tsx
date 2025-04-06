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
import { signIn } from 'next-auth/react';

const loginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);

    try {
      await signIn('credentials', values);

      toast.success('Login successful! Redirecting to dashboard...');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen px-4 bg-[#1E1E1E]'>
      <Card className='w-full max-w-md bg-[#292929] border border-[#49454F] shadow-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-white font-satoshi'>Welcome back</CardTitle>
          <CardDescription className='text-[#86858d]'>
            Enter your credentials to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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
              <Button
                type='submit'
                className='w-full py-6 rounded-xl border border-[#90FE95] bg-[#292929] text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 active:translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#3AFFE1]'
                disabled={isLoading}
                style={{ boxShadow: '0px 3px 0px 0px #3affe1' }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className='flex justify-center pb-6'>
          <div className='text-[#86858d]'>
            Don&apos;t have an account?{' '}
            <Link href='/register' className='text-[#90FE95] hover:underline font-medium'>
              Register
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
