import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              data: { full_name: email.split('@')[0] } 
            }
        });
        if (signUpError) throw signUpError;
        alert('Check your email to confirm registration!');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden transition-colors duration-500">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 15 }}
            className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20 mb-4"
          >
            <span className="text-white text-3xl font-bold italic">P</span>
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Planex</h1>
          <p className="text-muted-foreground mt-2">Premium Travel Planning for Groups</p>
        </div>

        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{isRegistering ? 'Create an Account' : 'Welcome Back'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent focus:border-primary focus:ring-0 rounded-2xl text-sm transition-all outline-none"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent focus:border-primary focus:ring-0 rounded-2xl text-sm transition-all outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100 mt-2"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 rounded-2xl text-md font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : isRegistering ? 'Get Started' : 'Login'}
                {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? 'Already have an account? Login' : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
