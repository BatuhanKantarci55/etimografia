'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import {
    BookOpen,
    List,
    Trophy,
    User as UserIcon,
    Users,
    LogOut,
    LogIn,
    Search,
    Home,
    Sun,
    Moon,
} from 'lucide-react';

const NavItem = ({
    label,
    path,
    icon: Icon,
}: {
    label: string;
    path: string;
    icon: React.ElementType;
}) => (
    <Link href={path}>
        <div className="flex items-center gap-2 px-2 py-1 hover:scale-105 transition cursor-pointer">
            <Icon className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="hidden md:inline">{label}</span>
        </div>
    </Link>
);

const MobileNavItem = ({
    label,
    path,
    icon: Icon,
}: {
    label: string;
    path: string;
    icon: React.ElementType;
}) => (
    <Link href={path}>
        <div className="flex flex-col items-center px-2 py-1 hover:scale-105 transition cursor-pointer">
            <Icon className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="text-xs">{label}</span>
        </div>
    </Link>
);

const NavBar = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string; username: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    const pathname = usePathname();
    const router = useRouter();
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!user) {
            setPendingRequestsCount(0);
            return;
        }

        const fetchPendingRequests = async () => {
            const { count, error } = await supabase
                .from('friendships')
                .select('*', { count: 'exact', head: true })
                .eq('friend_id', user.id)
                .eq('status', 'pending');

            if (error) {
                console.error('Bekleyen istek sayısı alınamadı:', error);
                setPendingRequestsCount(0);
                return;
            }

            setPendingRequestsCount(count || 0);
        };

        fetchPendingRequests();
    }, [user]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push('/');
    };

    const searchUsers = async (query: string) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username')
            .ilike('username', `${query}%`)
            .limit(5);

        if (error) {
            console.error('Kullanıcı arama hatası:', error);
            setSearchResults([]);
        } else {
            setSearchResults(data || []);
        }
    };

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(() => {
            searchUsers(val);
        }, 300);

        setShowSuggestions(true);
    };

    const onSelectSuggestion = (username: string) => {
        setSearchTerm(username);
        setShowSuggestions(false);
        router.push(`/profil/${username}`);
    };

    if (!mounted) return null;

    const hiddenRoutes = [''];
    if (hiddenRoutes.includes(pathname)) {
        return null;
    }

    return (
        <>
            {/* Desktop NavBar (Top - Full) */}
            <nav className="hidden md:flex fixed top-0 left-0 w-full z-50 px-6 py-3 backdrop-blur-lg bg-black/30 shadow-md justify-between items-center">
                <Link
                    href="/"
                    className="text-2xl font-bold tracking-wide text-white hidden sm:inline"
                >
                    Etimografia
                </Link>

                <div className="flex items-center gap-4 flex-grow max-w-xl relative mx-6">
                    {user && (
                        <div className="relative w-full">
                            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
                                <Search className="w-5 h-5 text-white" />
                                <input
                                    type="text"
                                    placeholder="Kullanıcı ara..."
                                    value={searchTerm}
                                    onChange={onSearchChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    className="bg-transparent text-white placeholder-white/70 focus:outline-none w-full text-sm"
                                />
                            </div>
                            {showSuggestions && searchResults.length > 0 && (
                                <ul className="absolute bg-white text-black w-full rounded-xl shadow-lg mt-1 max-h-48 overflow-auto z-50">
                                    {searchResults.map((user) => (
                                        <li
                                            key={user.id}
                                            className="px-4 py-2 cursor-pointer hover:bg-indigo-100"
                                            onClick={() => onSelectSuggestion(user.username)}
                                        >
                                            @{user.username}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-evenly flex-grow flex-nowrap text-base font-medium text-white">
                    <NavItem label="Etkinlikler" path="/etkinlikler" icon={BookOpen} />
                    <NavItem label="Liste" path="/liste" icon={List} />
                    <NavItem label="Liderlik" path="/liderlik" icon={Trophy} />
                    {user ? (
                        <>
                            <NavItem label="Profil" path="/profil" icon={UserIcon} />
                            <Link href="/arkadas-istekleri" className="relative">
                                <div className="flex items-center gap-2 px-2 py-1 hover:scale-105 transition cursor-pointer">
                                    <Users className="w-6 h-6 sm:w-5 sm:h-5" />
                                    <span className="hidden md:inline">İstekler</span>
                                    {pendingRequestsCount > 0 && (
                                        <span className="absolute -top-2 -right-3 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold shadow-md">
                                            {pendingRequestsCount}
                                        </span>
                                    )}
                                </div>
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-3 py-2 sm:px-2 sm:py-1 rounded-full bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 transition text-white text-sm shadow"
                            >
                                <LogOut className="w-6 h-6 sm:w-5 sm:h-5" />
                                <span className="hidden md:inline">Çıkış</span>
                            </button>
                        </>
                    ) : (
                        <NavItem label="Giriş" path="/giris-kaydol" icon={LogIn} />
                    )}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-white/20 transition"
                        title="Tema Değiştir"
                    >
                        {theme === 'dark' ? (
                            <Moon className="w-6 h-6" />
                        ) : (
                            <Sun className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile Top NavBar - Logged In */}
            {user && (
                <nav className="md:hidden fixed top-0 left-0 w-full z-50 px-4 py-4 backdrop-blur-lg bg-black/30 shadow-md flex justify-between items-center">
                    <div className="flex items-center gap-4 w-full">
                        <Link href="/" className="p-1 hover:bg-white/20 rounded-full transition">
                            <Home className="w-5 h-5 text-white" />
                        </Link>

                        <div className="relative flex-grow">
                            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
                                <Search className="w-5 h-5 text-white" />
                                <input
                                    type="text"
                                    placeholder="Kullanıcı ara..."
                                    value={searchTerm}
                                    onChange={onSearchChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    className="bg-transparent text-white placeholder-white/70 focus:outline-none w-full text-sm"
                                />
                            </div>
                            {showSuggestions && searchResults.length > 0 && (
                                <ul className="absolute bg-white text-black w-full rounded-xl shadow-lg mt-1 max-h-48 overflow-auto z-50">
                                    {searchResults.map((user) => (
                                        <li
                                            key={user.id}
                                            className="px-4 py-2 cursor-pointer hover:bg-indigo-100"
                                            onClick={() => onSelectSuggestion(user.username)}
                                        >
                                            @{user.username}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-white">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full hover:bg-white/20 transition"
                                title="Tema Değiştir"
                            >
                                {theme === 'dark' ? (
                                    <Moon className="w-6 h-6" />
                                ) : (
                                    <Sun className="w-6 h-6" />
                                )}
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="p-2 rounded-full hover:bg-white/20 transition"
                                title="Çıkış Yap"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </nav>
            )}

            {/* Mobile Top NavBar - Not Logged In */}
            {!user && (
                <nav className="md:hidden fixed top-0 left-0 w-full z-50 px-4 py-2 backdrop-blur-lg bg-black/30 shadow-md flex justify-between items-center">
                    <Link
                        href="/"
                        className="text-xl font-bold tracking-wide text-white"
                    >
                        Etimografia
                    </Link>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-white/20 transition"
                        title="Tema Değiştir"
                    >
                        {theme === 'dark' ? (
                            <Moon className="w-6 h-6" />
                        ) : (
                            <Sun className="w-6 h-6 text-white" />
                        )}
                    </button>
                </nav>
            )}

            {/* Mobile Bottom NavBar */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 px-2 py-2 backdrop-blur-lg bg-black/30 shadow-md flex justify-between items-center">
                <div className="flex items-center justify-around w-full text-sm font-medium text-white">
                    <MobileNavItem label="Liste" path="/liste" icon={List} />
                    <MobileNavItem label="Liderlik" path="/liderlik" icon={Trophy} />
                    <MobileNavItem label="Etkinlikler" path="/etkinlikler" icon={BookOpen} />
                    {user ? (
                        <>
                            <Link href="/arkadas-istekleri" className="relative">
                                <div className="flex flex-col items-center px-2 py-1 hover:scale-105 transition cursor-pointer">
                                    <Users className="w-6 h-6 sm:w-5 sm:h-5" />
                                    <span className="text-xs">İstekler</span>
                                    {pendingRequestsCount > 0 && (
                                        <span className="absolute -top-1 right-0 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center font-bold shadow-md">
                                            {pendingRequestsCount}
                                        </span>
                                    )}
                                </div>
                            </Link>
                            <MobileNavItem label="Profil" path="/profil" icon={UserIcon} />
                        </>
                    ) : (
                        <MobileNavItem label="Giriş" path="/giris-kaydol" icon={LogIn} />
                    )}
                </div>
            </nav>
        </>
    );
};

export default NavBar;