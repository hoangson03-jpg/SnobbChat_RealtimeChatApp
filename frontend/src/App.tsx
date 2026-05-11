import {BrowserRouter, Route, Routes} from 'react-router';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ChatAppPage from './pages/ChatAppPage';
import {Toaster} from 'sonner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useThemeStore } from './stores/useThemeStore';
import { useEffect } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useSocketStore } from './stores/useSocketStore';
import { useNetworkSync } from './hooks/useNetworkSync';


function App() {

  const {isDark, setTheme} = useThemeStore();
  const {accessToken} = useAuthStore();
  const {connectSocket, disconnectSocket} = useSocketStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark])

  useEffect(() => {
    if(accessToken){
      connectSocket();
    }

    return () => disconnectSocket(); 
  }, [accessToken]) 
  useNetworkSync();
  return <>
  <Toaster richColors/>
  <BrowserRouter>
    <Routes>
    {/** public routes */}
    <Route
    path='/signin'
    element={<SignInPage></SignInPage>}
    />

    <Route
    path='/signup'
    element={<SignUpPage/>}>
    </Route>

    {/** protected route */}
    <Route element = {<ProtectedRoute/>}>
      <Route
      path='/'
      element={<ChatAppPage/>}/>
      </Route>
    </Routes>
  </BrowserRouter>
  </>
}

export default App
