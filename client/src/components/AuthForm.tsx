import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, LoginInput } from '../../../server/src/schema';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginData, setLoginData] = useState<LoginInput>({
    username: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await trpc.login.mutate(loginData);
      onLogin(user);
    } catch (error) {
      console.error('Login failed:', error);
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await trpc.createUser.mutate(registerData);
      onLogin(user);
    } catch (error) {
      console.error('Registration failed:', error);
      setError('Failed to create account. Username or email may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-purple-800/50">
      <CardHeader className="text-center">
        <CardTitle className="text-white">Welcome to MythCrafter</CardTitle>
        <CardDescription className="text-purple-200">
          Sign in to your account or create a new one to begin your adventure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-purple-900/50">
            <TabsTrigger value="login" className="data-[state=active]:bg-purple-600">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-purple-600">
              Register
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert className="mt-4 border-red-500/50 bg-red-900/20">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username" className="text-purple-200">
                  Username
                </Label>
                <Input
                  id="login-username"
                  type="text"
                  value={loginData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, username: e.target.value }))
                  }
                  className="bg-black/30 border-purple-800/50 text-white placeholder:text-purple-400"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-purple-200">
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  className="bg-black/30 border-purple-800/50 text-white placeholder:text-purple-400"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username" className="text-purple-200">
                  Username
                </Label>
                <Input
                  id="register-username"
                  type="text"
                  value={registerData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                  }
                  className="bg-black/30 border-purple-800/50 text-white placeholder:text-purple-400"
                  placeholder="Choose a username"
                  minLength={3}
                  maxLength={50}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-purple-200">
                  Email
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  className="bg-black/30 border-purple-800/50 text-white placeholder:text-purple-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-purple-200">
                  Password
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  className="bg-black/30 border-purple-800/50 text-white placeholder:text-purple-400"
                  placeholder="Create a password"
                  minLength={6}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}