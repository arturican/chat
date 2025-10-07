import Victory from '@/assets/victory.svg';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useState } from 'react';
import { Input } from '@/components/ui/input.tsx';
import { Button } from '@/components/ui/button.tsx';

export const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async () => {};
  const handleSigup = async () => {};
  return (
    <div className="flex h-[100vh] w-[100vw] items-center justify-center">
      <div className="text-opacity-90 grid h-[80vh] w-[80vw] rounded-3xl border-2 border-white bg-white shadow-2xl md:w-[90vw] lg:w-[70vw] xl:w-[60vw] xl:grid-cols-10">
        <div className="flex flex-col items-center justify-center gap-10">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <h1 className="text-5xl font-bold md:text-6xl">Welcome</h1>
              <img src={Victory} alt="Victory Emoji" className="h-[100px]" />
            </div>
            <p className="text-center font-medium">
              Fill in the details to get started with the best chat app!
            </p>
          </div>
          <div className="flex w-full items-center justify-center">
            <Tabs className="w-3/4">
              <TabsList className="w-full rounded-none bg-transparent">
                <TabsTrigger
                  value="login"
                  className="text-opacity-90 w-full rounded-none border-b-2 p-3 text-black transition-all duration-300 data-[state=active]:border-b-purple-500 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-black"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="text-opacity-90 w-full rounded-none border-b-2 p-3 text-black transition-all duration-300 data-[state=active]:border-b-purple-500 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-black"
                >
                  Signup
                </TabsTrigger>
              </TabsList>

              <TabsContent className="mt-10 flex flex-col gap-5" value="login">
                <Input
                  placeholder="email"
                  type="email"
                  className="rounded-full p-6"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <Input
                  placeholder="password"
                  type="password"
                  className="rounded-full p-6"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Button className={'rounded-full p-6'} onClick={handleLogin}>
                  Login
                </Button>
              </TabsContent>
              <TabsContent className="mt-10 flex flex-col gap-5" value="signup">
                <Input
                  placeholder="Email"
                  type="email"
                  className="rounded-full p-6"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  className="rounded-full p-6"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Input
                  placeholder="Confirm Password"
                  type="password"
                  className="rounded-full p-6"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <Button className={'rounded-full p-6'} onClick={handleSigup}>
                  Signup
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
