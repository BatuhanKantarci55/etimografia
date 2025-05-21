'use client';

import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';

interface Props {
    children: React.ReactNode;
}

function ActiveUpdater() {
    const session = useSession();
    const supabase = useSupabaseClient();

    useEffect(() => {
        if (!session?.user) return;

        const updateActive = async () => {
            await supabase
                .from('profiles')
                .update({ last_active: new Date().toISOString() })
                .eq('id', session.user.id);
        };

        // Hemen güncelle
        updateActive();

        // Sonra 30 saniyede bir güncelle
        const interval = setInterval(updateActive, 30000);

        return () => clearInterval(interval);
    }, [session, supabase]);

    return null; // UI göstermiyoruz
}

export default function SupabaseProvider({ children }: Props) {
    const [supabaseClient] = useState(() => createBrowserSupabaseClient());

    return (
        <SessionContextProvider supabaseClient={supabaseClient}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <ActiveUpdater />
                {children}
            </ThemeProvider>
        </SessionContextProvider>
    );
}
