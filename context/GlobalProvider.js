import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, supabase } from "../lib/supabase";

fetch('https://hwxubzbnpgfxsxtejfxm.supabase.co')
  .then(res => console.log('✅ Supabase reachable:', res.status))
  .catch(err => console.log('❌ Fetch failed:', err.message))

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Vérifie la session au démarrage
        getCurrentUser()
            .then((res) => {
                if (res) {
                    setIsLoggedIn(true);
                    setUser(res);
                } else {
                    setIsLoggedIn(false);
                    setUser(null);
                }
            })
            .catch(() => {
                setIsLoggedIn(false);
                setUser(null);
            })
            .finally(() => {
                setIsLoading(false);
            });

        // Écoute les changements de session (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                getCurrentUser().then((res) => {
                    setUser(res);
                    setIsLoggedIn(true);
                });
            } else {
                setUser(null);
                setIsLoggedIn(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);
 
    return (
        <GlobalContext.Provider 
            value={{
                isLoggedIn,
                setIsLoggedIn,
                user,
                setUser,
                isLoading,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
}

export default GlobalProvider;