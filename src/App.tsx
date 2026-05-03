import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Play, 
  Plus, 
  ChevronRight, 
  LogIn, 
  LogOut, 
  LayoutDashboard, 
  Settings,
  BarChart3,
  Building2,
  TrendingDown,
  User as UserIcon,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  Shield,
  Flame,
  Award
} from 'lucide-react';
import { auth, signInWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { Tournament, Player, Match, Registration, Club } from './types';
import { tournamentService } from './services/tournamentService';
import { clubService } from './services/clubService';
import { cn } from './lib/utils';

// Components
const Logo = () => (
  <div className="flex items-center gap-3 px-2">
    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center p-2 shadow-lg ring-1 ring-white/20">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white w-full h-full">
        <path d="M6 3C6 3 4 5 4 10V14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14V10C20 5 18 3 18 3M15 3V5M9 3V5M12 22H8M12 22H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7" cy="11" r="0.5" fill="currentColor"/>
        <circle cx="17" cy="11" r="0.5" fill="currentColor"/>
        <circle cx="8" cy="15" r="0.5" fill="currentColor"/>
        <circle cx="16" cy="15" r="0.5" fill="currentColor"/>
        <circle cx="12" cy="18" r="0.5" fill="currentColor"/>
      </svg>
    </div>
    <span className="text-xl font-bold text-white tracking-tight">BIG PLAY</span>
  </div>
);

// Public Landing Page Component
function PublicLanding({ onEnterArena, onSignIn, isSigningIn }: { onEnterArena: () => void; onSignIn: () => void; isSigningIn?: boolean }) {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 overflow-hidden relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{ backgroundImage: "url('https://i.imgur.com/X7cuO6z.png')" }}
      >
        <div className="absolute inset-0 bg-black/30" /> {/* Slightly darker overlay for contrast */}
      </div>

      {/* Hero Section (Get Started / Enter Arena / Sign In) */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-end pb-56 px-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-5xl"
        >
          <button 
            disabled={isSigningIn}
            onClick={onSignIn} 
            className={cn(
              "group w-full sm:w-auto px-8 py-3.5 sm:px-12 sm:py-5 bg-transparent border border-white/60 text-white rounded-2xl font-black italic uppercase tracking-widest text-xs sm:text-sm hover:bg-white/5 transition-all flex items-center justify-center",
              isSigningIn && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSigningIn ? 'SIGNING IN...' : 'Sign In / Join'}
          </button>

          <button 
            disabled={isSigningIn}
            onClick={onSignIn}
            className={cn(
              "group relative w-full sm:w-auto px-8 py-3.5 sm:px-12 sm:py-5 bg-transparent text-white rounded-2xl font-black italic uppercase tracking-widest text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all border border-white/60 overflow-hidden flex items-center justify-center",
              isSigningIn && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="relative z-10 flex items-center gap-2 sm:gap-3">
              {isSigningIn ? 'SYSTEM LOADING...' : 'Get Started'} 
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
          </button>
          
          <button 
            onClick={onEnterArena}
            className="group w-full sm:w-auto px-8 py-3.5 sm:px-12 sm:py-5 bg-transparent border border-white/60 text-white rounded-2xl font-black italic uppercase tracking-widest text-xs sm:text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2 sm:gap-3"
          >
            View Games <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 group-hover:animate-pulse" />
          </button>
        </motion.div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'arena' | 'tournaments' | 'rankings' | 'players' | 'clubs' | 'profile' | 'admin' | 'tournament'>('landing');
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExploring, setIsExploring] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [isDesignerMode, setIsDesignerMode] = useState(false);

  // Secret backdoor for the designer
  useEffect(() => {
    const handlePathChange = () => {
      if (window.location.pathname === '/petegould') {
        setIsDesignerMode(true);
        // Silently clear the path to keep it clean
        history.replaceState(null, "", "/");
      }
    };
    
    handlePathChange();
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  const isSystemAdmin = isDesignerMode;
  const isCaptain = tournaments.some(t => t.ownerId === user?.uid);
  const hasCommandAccess = isSystemAdmin || isCaptain;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setIsExploring(false);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const navItems = [
    { id: 'landing', label: 'Home', icon: LayoutDashboard, color: 'text-slate-400' },
    { id: 'arena', label: 'The Arena', icon: Flame, color: 'text-orange-500' },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy, color: 'text-primary' },
    { id: 'clubs', label: 'Clubs & Venues', icon: Building2, color: 'text-slate-400' },
    { id: 'rankings', label: 'Rankings', icon: Award, color: 'text-yellow-500' },
    { id: 'players', label: 'Player Pro', icon: UserIcon, color: 'text-slate-400' },
  ];

  const adminNav = [
    ...(isSystemAdmin ? [{ id: 'admin', label: 'Admins Control', icon: Shield, color: 'text-red-500' }] : []),
    ...(hasCommandAccess ? [{ id: 'admin', label: 'Captains Portal', icon: Shield, color: 'text-red-400' }] : []),
  ];

  const footerNav = user ? [
    { id: 'profile', label: 'My ScoreMagic', icon: CreditCard, color: 'text-primary' },
  ] : [];

  useEffect(() => {
    const fetchTournaments = async () => {
      const data = await tournamentService.getTournaments();
      if (data) setTournaments(data);
    };
    fetchTournaments();
  }, []);

  const handleCreateTournament = async (name: string, type: Tournament['type'], price: number, maxPlayers: number) => {
    if (!user) return;
    const id = await tournamentService.createTournament({
      name,
      type,
      price,
      maxPlayers,
      ownerId: user.uid,
      description: 'New tournament'
    });
    if (id) {
      setActiveTournamentId(id);
      setView('tournament');
      // Refresh list
      const data = await tournamentService.getTournaments();
      if (data) setTournaments(data);
    }
  };

  const navigateToTournament = (id: string) => {
    setActiveTournamentId(id);
    setView('tournament');
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-sans font-medium text-slate-500">Syncing with Big Play Tournaments...</div>;

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      console.log('App: signInWithGoogle button clicked');
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn('App: Sign-in popup request cancelled (likely concurrent call)');
      } else {
        console.error('App: Sign-in error caught in handler:', error);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!user && !isExploring && view === 'landing') {
    return <PublicLanding onEnterArena={() => { console.log('App: Entering arena as guest'); setIsExploring(true); setView('arena'); }} onSignIn={handleSignIn} isSigningIn={isSigningIn} />;
  }

  return (
    <div className="flex h-screen bg-transparent text-slate-text font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      {view !== 'landing' && !isExploring && (
        <aside className="w-64 bg-sidebar text-slate-300 flex flex-col shrink-0">
        <div className="p-6">
          <Logo />
        </div>
        
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto py-4">
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Spectator Mode</p>
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-sm",
                  view === item.id ? "bg-slate-800 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                <item.icon className={cn("w-5 h-5", view === item.id ? item.color : "opacity-40")} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {hasCommandAccess && (
            <div className="space-y-1">
              <p className="px-4 text-[10px] font-black text-red-500/50 uppercase tracking-widest mb-2">Command Center</p>
              {adminNav.map((item, idx) => (
                <button 
                  key={`${item.id}-${idx}`}
                  onClick={() => setView(item.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-sm",
                    view === item.id ? "bg-red-500/10 text-red-500 shadow-lg border border-red-500/20" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", view === item.id ? item.color : "opacity-40")} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="space-y-1 mb-4">
            {footerNav.map((item) => (
              <button 
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold text-sm",
                  view === item.id ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                <item.icon className={cn("w-5 h-5", view === item.id ? item.color : "opacity-40")} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="px-4 py-3 bg-slate-800 rounded-xl border border-slate-700">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden text-[10px]">
                    {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : user.displayName?.slice(0,2)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-[11px] font-bold text-white truncate leading-tight">{user.displayName}</p>
                    <p className="text-[9px] text-slate-500 truncate">{isSystemAdmin ? 'System Admin' : isCaptain ? 'Captain' : 'Player'}</p>
                  </div>
                </div>
                <button onClick={logout} className="text-slate-500 hover:text-white transition-colors shrink-0">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isDesignerMode ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center font-black italic text-white shrink-0 text-[10px]">
                    D
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-[11px] font-bold text-white truncate leading-tight">Designer</p>
                    <p className="text-[9px] text-slate-500 truncate">System Admin</p>
                  </div>
                </div>
                <button onClick={() => setIsDesignerMode(false)} className="text-slate-500 hover:text-white transition-colors shrink-0">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                disabled={isSigningIn}
                onClick={handleSignIn}
                className={cn(
                  "w-full flex items-center justify-center gap-2 text-white font-bold text-[11px] hover:text-primary transition-colors",
                  isSigningIn && "opacity-50 cursor-not-allowed"
                )}
              >
                <LogIn className="w-3.5 h-3.5" /> {isSigningIn ? '...' : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      </aside>
    )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        {view !== 'landing' && !isExploring && (
          <header className="h-16 bg-transparent flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-black italic text-slate-800 tracking-tight uppercase">
                {view === 'arena' ? 'The Arena' : 
                 view === 'admin' ? 'Admin Command' : 
                 view.replace('_', ' ')}
              </h1>
              {view === 'arena' && (
                <div className="flex items-center gap-2 px-2 py-1 bg-red-100 rounded text-red-600 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Live Activity</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EST
              </div>
            </div>
          </header>
        )}

        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">
            {view === 'landing' && (
              <div className="-m-8 h-screen overflow-y-auto">
                <PublicLanding 
                  onEnterArena={() => { console.log('App: Entering arena as guest from secondary landing'); setIsExploring(true); setView('arena'); }} 
                  onSignIn={user ? () => setView('profile') : handleSignIn} 
                  isSigningIn={isSigningIn}
                />
              </div>
            )}
            {view === 'arena' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-slate-800 italic tracking-tight uppercase">The Arena Is Live</h2>
                    <p className="text-slate-500 font-medium max-w-2xl">Spectators are welcome! Browse live events below and watch real-time scoring.</p>
                  </div>
                  {isExploring && (
                    <button 
                      disabled={isSigningIn}
                      onClick={handleSignIn}
                      className={cn(
                        "bg-primary hover:bg-orange-600 text-white px-8 py-3 rounded-full font-black italic uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95",
                        isSigningIn && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSigningIn ? 'Signing In...' : 'Sign In to Compete'}
                    </button>
                  )}
                </div>
                <LandingView key="arena" tournaments={tournaments} onSelect={navigateToTournament} hideTitle />
              </div>
            )}
            {view === 'admin' && user && (
              <AdminDashboardView 
                key="admin" 
                user={user} 
                tournaments={tournaments} 
                onCreateTournament={() => setView('create')}
                onSelectTournament={navigateToTournament}
                setView={setView}
              />
            )}
            {view === 'create' && (
              <CreateTournamentView key="create" onSubmit={handleCreateTournament} onCancel={() => setView('admin')} />
            )}
            {view === 'tournament' && activeTournamentId && (
              <TournamentView 
                key="tournament" 
                tournamentId={activeTournamentId} 
                user={user} 
                onBack={() => setView(hasCommandAccess ? 'admin' : 'arena')} 
              />
            )}
            {view === 'tournaments' && (
              <TournamentsListView key="tournaments" tournaments={tournaments} onSelect={navigateToTournament} />
            )}
            {view === 'players' && (
              <PlayersView key="players" />
            )}
            {view === 'clubs' && (
              <ClubsView key="clubs" user={user} />
            )}
            {view === 'rankings' && (
              <RankingsView key="rankings" />
            )}
            {view === 'profile' && (
              user ? <ProfileView key="profile" user={user} /> : (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto gap-6">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-slate-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Personal Scoreboard</h3>
                        <p className="text-slate-500 text-sm">Sign in to track your ScoreMagic™ stats, view your performance history, and manage your registrations.</p>
                    </div>
                    <button 
                        disabled={isSigningIn}
                        onClick={handleSignIn}
                        className={cn(
                            "bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all",
                            isSigningIn && "opacity-50"
                        )}
                    >
                        {isSigningIn ? 'Signing In...' : 'Sign in with Google'}
                    </button>
                </div>
              )
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Sub-Views
interface LandingViewProps {
  tournaments: Tournament[];
  onSelect: (id: string) => void;
  onCreate?: () => void;
  key?: string;
}

function LandingView({ tournaments, onSelect, hideTitle }: LandingViewProps & { hideTitle?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-8"
    >
      {!hideTitle && (
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-slate-800 italic tracking-tight">THE ARENA IS LIVE</h2>
          <p className="text-slate-500 font-medium max-w-2xl">Spectators are welcome! Browse live events below and enter any arena to watch real-time scoring. No account required to follow the action.</p>
        </div>
      )}
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Tournaments', value: tournaments.length, sub: '+2 today', color: 'text-slate-800' },
          { label: 'Live Players', value: '482', sub: 'Peak: 1,204', color: 'text-blue-500' },
          { label: 'Total Matches', value: '1,429', sub: 'Last 24h', color: 'text-slate-800' },
          { label: 'System Uptime', value: '99.9%', sub: 'Healthy', color: 'text-green-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 card-shadow">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold mt-1 leading-tight">{stat.value}</p>
            <p className={cn("text-[11px] font-semibold mt-2", stat.color)}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col card-shadow">
            <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase tracking-tighter">Live Feed</span>
                <h2 className="font-bold text-slate-800">Global Competition Status</h2>
              </div>
            </div>
            
            <div className="p-0">
              <table className="w-full text-sm data-table">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="text-left py-3 px-6">Event</th>
                    <th className="text-left py-3 px-6">Type</th>
                    <th className="text-right py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-20 text-center text-slate-400 font-medium italic">
                        No active tournaments broadcasting...
                      </td>
                    </tr>
                  ) : (
                    tournaments.map((t) => (
                      <tr 
                        key={t.id} 
                        onClick={() => onSelect(t.id)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">{t.name}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-500 capitalize">{t.type.replace('_', ' ')}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={cn(
                            "px-2 py-1 text-[10px] font-bold rounded uppercase",
                            t.status === 'active' ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
                          )}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 card-shadow">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Upcoming Events</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Next 7 Days</span>
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex flex-col items-center justify-center text-indigo-600 shrink-0">
                  <span className="text-[9px] font-bold uppercase leading-none">Jun</span>
                  <span className="text-xl font-bold leading-none">14</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 leading-snug">Regional Finals 2024</p>
                  <p className="text-xs text-slate-500 mt-0.5">Convention Center</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex flex-col items-center justify-center text-amber-600 shrink-0">
                  <span className="text-[9px] font-bold uppercase leading-none">Jun</span>
                  <span className="text-xl font-bold leading-none">16</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 leading-snug">Brewery Smash Up</p>
                  <p className="text-xs text-slate-500 mt-0.5">Local Venue</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg text-white">
            <h3 className="font-bold mb-4 text-orange-400 uppercase text-[10px] tracking-widest">Global Pro Ranking</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-700 border-2 border-orange-500 flex items-center justify-center text-xl font-bold">JD</div>
              <div>
                <p className="font-bold">John "Director" Doe</p>
                <p className="text-xs text-slate-400 italic">98.4 Rating Index</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-[11px] font-medium">
              <span className="text-slate-400">Win Rate: <span className="text-white">84.2%</span></span>
              <span className="text-orange-400">#1 Regionally</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface CreateTournamentProps {
  onSubmit: (name: string, type: Tournament['type'], price: number, maxPlayers: number) => void;
  onCancel: () => void;
  key?: string;
}

function CreateTournamentView({ onSubmit, onCancel }: CreateTournamentProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Tournament['type']>('round_robin');
  const [price, setPrice] = useState('0');
  const [maxPlayers, setMaxPlayers] = useState('64');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-10">
         <h2 className="text-3xl font-bold text-slate-800 mb-2">Create Tournament</h2>
         <p className="text-slate-500 text-sm mb-10 font-medium uppercase tracking-wider">Initialize System Hardware</p>
         
         <div className="space-y-8">
            <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Tournament Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Smash 2024"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-lg font-semibold placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Entry Fee ($)</label>
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold focus:border-primary outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Max Players</label>
                    <input 
                      type="number" 
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold focus:border-primary outline-none"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Event Format</label>
                <div className="grid grid-cols-3 gap-4">
                    {(['round_robin', 'single_elimination', 'ladder'] as const).map((t) => (
                        <button 
                          key={t}
                          onClick={() => setType(t)}
                          className={cn(
                            "p-4 border-2 rounded-xl text-[10px] font-bold uppercase transition-all flex flex-col gap-2 items-center text-center",
                            type === t ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                          )}
                        >
                            <Trophy className="w-5 h-5 mb-1" />
                            {t.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex gap-4 pt-6">
                <button 
                  disabled={!name}
                  onClick={() => onSubmit(name, type, Number(price), Number(maxPlayers))}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl text-base shadow-sm disabled:opacity-50 transition-all"
                >
                    Launch Tournament
                </button>
                <button 
                  onClick={onCancel} 
                  className="px-8 border border-slate-200 font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

function TournamentsListView({ tournaments, onSelect }: { tournaments: Tournament[]; onSelect: (id: string) => void; key?: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter mb-2">Tournament Discovery</h2>
        <p className="text-slate-500 font-medium">Browse live, upcoming, and past battles across all venues.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((t) => (
          <div key={t.id} onClick={() => onSelect(t.id)} className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow hover:border-primary transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded leading-none shrink-0">Live Now</span>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-primary transition-colors">{t.name}</h3>
            <p className="text-sm text-slate-400 font-medium mb-4 italic uppercase tracking-widest text-[10px]">{t.type.replace('_', ' ')}</p>
            <div className="flex justify-between items-end">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                <p className="mb-1">Entry Fee</p>
                <p className="text-slate-800">${t.price}</p>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">
                <p className="mb-1">Players</p>
                <p className="text-slate-800">{t.maxPlayers || 64}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface AdminDashboardViewProps {
  user: User;
  tournaments: Tournament[];
  onCreateTournament: () => void;
  onSelectTournament: (id: string) => void;
  key?: string;
}

function AdminDashboardView({ user, tournaments, onCreateTournament, onSelectTournament, setView }: AdminDashboardViewProps & { setView: (v: any) => void }) {
  const myTournaments = tournaments.filter(t => t.ownerId === user.uid);
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-800 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-red-500 rounded text-[10px] font-black uppercase tracking-widest">Captain Control</div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Big Play Network</span>
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter mb-2">WELCOME COMMANDER, {user.displayName?.split(' ')[0]}</h2>
          <p className="text-slate-400 font-medium max-w-md italic">Manage your clubs, coordinate matches, and build your tournament legacy.</p>
        </div>
        <div className="flex gap-4 relative z-10">
             <button 
                onClick={onCreateTournament}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black italic uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Launch Event
              </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">My Live Events</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myTournaments.map(t => (
              <div 
                key={t.id} 
                onClick={() => onSelectTournament(t.id)}
                className="bg-white border border-slate-200 rounded-3xl p-8 card-shadow hover:border-primary transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-slate-50 group-hover:bg-primary/10 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary mb-6 transition-colors">
                  <Settings className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2 truncate">{t.name}</h4>
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-6">{t.type.replace('_', ' ')}</p>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            ))}
            {myTournaments.length === 0 && (
              <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl py-20 text-center flex flex-col items-center gap-4 text-slate-300">
                <Play className="w-12 h-12 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No Active Campaigns</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">Captain Toolkit</h3>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 card-shadow space-y-4">
            {[
              { label: 'Roster Management', icon: Users, desc: 'Add players to teams', view: 'players' },
              { label: 'Venue Controls', icon: Building2, desc: 'Manage your club details', view: 'clubs' },
            ].map((tool, i) => (
              <button 
                key={i} 
                onClick={() => setView(tool.view)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-all">
                  <tool.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">{tool.label}</p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface TournamentViewProps {
  tournamentId: string;
  user: User | null;
  onBack?: () => void;
  key?: string;
}

function TournamentView({ tournamentId, user, onBack }: TournamentViewProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'players' | 'matches' | 'admin'>('leaderboard');
  const [manualPlayerName, setManualPlayerName] = useState('');
  const [newCaptainId, setNewCaptainId] = useState('');

  useEffect(() => {
    const unsubT = tournamentService.subscribeToTournament(tournamentId, setTournament);
    const unsubR = tournamentService.subscribeToRegistrations(tournamentId, setRegistrations);
    const unsubM = tournamentService.subscribeToMatches(tournamentId, setMatches);
    return () => { unsubT(); unsubR(); unsubM(); };
  }, [tournamentId]);

  if (!tournament) return <div className="p-20 text-center font-sans font-bold text-slate-300 uppercase animate-pulse">Syncing Event Stream...</div>;

  const isOwner = user?.uid === tournament.ownerId;
  const isCaptain = isOwner || (user && tournament.captains?.includes(user.uid));
  const canManage = isCaptain;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-1 px-2 border border-slate-200 rounded hover:bg-slate-50 mr-2 flex items-center gap-1 transition-all"
              >
                <ChevronRight className="w-3 h-3 rotate-180" /> <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
              </button>
            )}
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase tracking-tighter">Live Event</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tournament.type.replace('_', ' ')}</span>
            {!canManage && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded border border-slate-200">
                Spectator (View Only)
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">{tournament.name}</h1>
        </div>
        
        {!registrations.find(r => r.playerId === user?.uid) && tournament.status === 'draft' && (
            <div className="flex items-center gap-4">
              {tournament.price && tournament.price > 0 && (
                <span className="text-sm font-bold text-slate-800 bg-slate-100 px-4 py-2 rounded-lg">${tournament.price} Fee</span>
              )}
              <button 
                  onClick={() => user ? tournamentService.registerPlayer(tournamentId, { id: user.uid, displayName: user.displayName! } as Player) : signInWithGoogle()}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
              >
                  {tournament.price && tournament.price > 0 ? <CreditCard className="w-4 h-4" /> : null}
                  {tournament.price && tournament.price > 0 ? 'Pre-Pay & Join' : 'Join Bracket'}
              </button>
            </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: 'leaderboard', label: 'Standings', icon: Trophy },
          { id: 'players', label: 'Participants', icon: Users },
          { id: 'matches', label: 'Live Bracket', icon: Play },
          ...(canManage ? [{ id: 'admin', label: 'Event Control', icon: Settings }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all relative",
              activeTab === tab.id ? "text-primary" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' && (
          // ... (keep existing leaderboard code)
          <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden">
            <table className="w-full text-sm data-table">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-8 w-16">Rank</th>
                  <th className="text-left py-4 px-8">Team / Player</th>
                  <th className="text-center py-4 px-8">W/L</th>
                  <th className="text-center py-4 px-8">Points For</th>
                  <th className="text-center py-4 px-8">Points Against</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 font-medium italic">No data yet...</td>
                  </tr>
                ) : (
                  registrations
                    .sort((a,b) => b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst))
                    .map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-5 px-8 font-mono text-slate-400">#{i+1}</td>
                        <td className="py-5 px-8 font-bold text-slate-700">{r.teamName}</td>
                        <td className="py-5 px-8 text-center">
                          <span className="font-bold text-slate-800">{r.wins}</span> 
                          <span className="mx-1 text-slate-300">-</span>
                          <span className="text-slate-500">{r.losses}</span>
                        </td>
                        <td className="py-5 px-8 text-center text-slate-500 font-medium">{r.pointsFor}</td>
                        <td className="py-5 px-8 text-center text-slate-500 font-medium">{r.pointsAgainst}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === 'players' && (
          <motion.div key="players" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registrations.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex justify-between items-center card-shadow">
                    <div>
                        <p className="font-bold text-lg text-slate-800 leading-tight">{r.teamName}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Signed Up</p>
                    </div>
                    <div className={cn("w-2 h-2 rounded-full ring-4", r.checkedIn ? "bg-green-500 ring-green-100" : "bg-red-500 ring-red-500/10")} />
                </div>
            ))}
            {registrations.length === 0 && (
                 <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    Waiting for players to connect to terminal...
                 </div>
            )}
          </motion.div>
        )}

        {activeTab === 'matches' && (
          <motion.div key="matches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map(m => {
                const p1 = registrations.find(r => r.playerId === m.player1Id);
                const p2 = registrations.find(r => r.playerId === m.player2Id);
                return (
                    <div key={m.id} className="bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden flex flex-col">
                        <div className="bg-slate-50 px-6 py-3 flex justify-between items-center border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Match #{m.id.slice(-4)}</span>
                            <span className={cn(
                                "px-2 py-1 text-[9px] font-bold rounded uppercase",
                                m.status === 'completed' ? "bg-slate-200 text-slate-600" : "bg-orange-100 text-orange-600"
                            )}>
                                {m.status}
                            </span>
                        </div>
                        <div className="flex divide-x divide-slate-100 py-8">
                            <div className="flex-1 px-6 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Team A</p>
                                <p className="font-bold text-slate-700 truncate mb-4">{p1?.teamName || '---'}</p>
                                <p className="text-6xl font-black text-slate-800 tracking-tighter italic">{m.score1}</p>
                            </div>
                            <div className="flex-1 px-6 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Team B</p>
                                <p className="font-bold text-slate-700 truncate mb-4">{p2?.teamName || '---'}</p>
                                <p className="text-6xl font-black text-primary tracking-tighter italic">{m.score2}</p>
                            </div>
                        </div>
                        {canManage && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100">
                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-4 text-center">ScoreMagic™ Advanced Interface</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-1 justify-center mb-1">
                                            <button 
                                                onClick={() => tournamentService.updateMatchScore(tournamentId, m.id, { 
                                                    score1: m.score1 + 3, 
                                                    score2: m.score2, 
                                                    status: 'in_progress',
                                                    stats1: { ...m.stats1, ringers: (m.stats1?.ringers || 0) + 1 },
                                                    stats2: m.stats2
                                                })}
                                                className="flex-1 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold hover:border-primary transition-all"
                                            >
                                                RINGER
                                            </button>
                                            <button 
                                                onClick={() => tournamentService.updateMatchScore(tournamentId, m.id, { 
                                                    score1: m.score1 + 6, 
                                                    score2: m.score2, 
                                                    status: 'in_progress',
                                                    stats1: { ...m.stats1, doubles: (m.stats1?.doubles || 0) + 1 },
                                                    stats2: m.stats2
                                                })}
                                                className="flex-1 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold hover:border-orange-500 transition-all text-orange-600"
                                            >
                                                DBL
                                            </button>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => tournamentService.updateMatchScore(tournamentId, m.id, { score1: m.score1 + 1, score2: m.score2, status: 'in_progress' })}
                                                className="flex-1 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-100 transition-all"
                                            >
                                                +1
                                            </button>
                                            <button 
                                                onClick={() => tournamentService.updateMatchScore(tournamentId, m.id, { score1: Math.max(0, m.score1 - 1), score2: m.score2, status: 'in_progress' })}
                                                className="flex-1 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold hover:bg-red-50 hover:text-red-600 transition-all"
                                            >
                                                -1
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-1 justify-center mb-1">
                                            <button 
                                                onClick={() => tournamentService.updateMatchScore(tournamentId, m.id, { 
                                                    score1: m.score1, 
                                                    score2: m.score2 + 3, 
                                                    status: 'in_progress',
                                                    stats1: m.stats1,
                                                    stats2: { ...m.stats2, ringers: (m.stats2?.ringers || 0) + 1 }
                                                })}
                                                className="flex-1 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold hover:border-primary transition-all"
                                            >
                                                RINGER
                                            </button>
                                            <button 
                                                onClick={() => tournamentService.updateMatchScore(tournamentId, m.id, { 
                                                    score1: m.score1, 
                                                    score2: m.score2 + 6, 
                                                    status: 'in_progress',
                                                    stats1: m.stats1,
                                                    stats2: { ...m.stats2, doubles: (m.stats2?.doubles || 0) + 1 }
                                                })}
                                                className="flex-1 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold hover:border-orange-500 transition-all text-orange-600"
                                            >
                                                DBL
                                            </button>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => tournamentService.updateMatchScore(tournamentId, m.id, { score1: m.score1, score2: m.score2 + 1, status: 'in_progress' })}
                                                className="flex-1 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-100 transition-all"
                                            >
                                                +1
                                            </button>
                                            <button 
                                                onClick={() => tournamentService.updateMatchScore(tournamentId, m.id, { score1: m.score1, score2: Math.max(0, m.score2 - 1), status: 'in_progress' })}
                                                className="flex-1 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold hover:bg-red-50 hover:text-red-600 transition-all"
                                            >
                                                -1
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => tournamentService.updateMatchScore(tournamentId, m.id, { score1: m.score1, score2: m.score2, status: 'completed' })}
                                    className="w-full mt-4 py-2.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors shadow-sm"
                                >
                                    Finalize Match Results
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
            {matches.length === 0 && (
                <div className="col-span-full py-28 text-center text-slate-300 font-medium text-lg italic border-2 border-dashed border-slate-200 rounded-2xl">
                    Bracket hardware not yet initialized...
                </div>
            )}
          </motion.div>
        )}
        
        {activeTab === 'admin' && canManage && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bracket Generation */}
                <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Bracket Control</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Tournament Lifecycle</p>
                    
                    <button 
                        disabled={registrations.length < 2 || matches.length > 0}
                        onClick={() => {
                            for (let i = 0; i < registrations.length; i++) {
                                for (let j = i + 1; j < registrations.length; j++) {
                                    tournamentService.createMatch(tournamentId, {
                                        player1Id: registrations[i].playerId,
                                        player2Id: registrations[j].playerId,
                                        round: 1
                                    });
                                }
                            }
                        }}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl disabled:opacity-30 transition-all shadow-sm mb-4"
                    >
                        Generate Round Robin
                    </button>
                    <p className="text-xs text-slate-400 text-center italic">Requires at least 2 participants.</p>
                </div>

                {/* Manual Registration */}
                <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Manual Registration</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Add Players Manually</p>
                    
                    <div className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="Player / Team Name"
                            value={manualPlayerName}
                            onChange={(e) => setManualPlayerName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                        <button 
                            disabled={!manualPlayerName}
                            onClick={async () => {
                                await tournamentService.registerPlayer(tournamentId, { displayName: manualPlayerName });
                                setManualPlayerName('');
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg text-sm transition-all shadow-sm"
                        >
                            Register Player
                        </button>
                    </div>
                </div>

                {/* Captain Management - Only for Owner */}
                {isOwner && (
                    <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-8">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Captain Management</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Designate Event Admins</p>
                        
                        <div className="flex gap-2 mb-6">
                            <input 
                                type="text" 
                                placeholder="Captain User ID"
                                value={newCaptainId}
                                onChange={(e) => setNewCaptainId(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                            <button 
                                disabled={!newCaptainId}
                                onClick={async () => {
                                    await tournamentService.addCaptain(tournamentId, tournament, newCaptainId);
                                    setNewCaptainId('');
                                }}
                                className="bg-primary hover:bg-primary-dark text-white font-bold px-4 rounded-lg text-sm transition-all"
                            >
                                Add
                            </button>
                        </div>

                        <div className="space-y-2">
                            {tournament.captains?.map(capId => (
                                <div key={capId} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-xs font-mono text-slate-500">{capId}</span>
                                    <button 
                                        onClick={() => tournamentService.removeCaptain(tournamentId, tournament, capId)}
                                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            {(!tournament.captains || tournament.captains.length === 0) && (
                                <p className="text-xs text-slate-400 italic text-center py-4">No captains assigned.</p>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayersView() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Global Players</h2>
      <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-20 text-center">
        <Users className="w-16 h-16 text-slate-200 mx-auto mb-6" />
        <p className="text-slate-400 font-medium italic">The global player registry is being synchronized. Stay tuned for real-time stats.</p>
      </div>
    </motion.div>
  );
}

function ClubsView({ user }: { user: User | null; key?: string }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const unsubscribe = clubService.subscribeToClubs(setClubs);
    return () => unsubscribe();
  }, []);

  const handleCreateClub = async () => {
    if (!user) return;
    await clubService.createClub({
      name,
      location,
      description,
      ownerId: user.uid
    });
    setIsCreating(false);
    setName('');
    setLocation('');
    setDescription('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Clubs & Venues</h2>
          <p className="text-slate-500 font-medium">Home bases for tournaments and professional practice.</p>
        </div>
        {user && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" /> Register Club
          </button>
        )}
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-8 card-shadow">
              <h3 className="text-xl font-bold text-slate-800 mb-6 font-mono uppercase tracking-tighter">New Club Registry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Club Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Backyard Cornhole Club"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Phoenix, AZ"
                  />
                </div>
              </div>
              <div className="space-y-2 mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                  placeholder="Tell us about the facilities..."
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button 
                  disabled={!name || !location}
                  onClick={handleCreateClub}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Confirm Registry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow hover:border-primary/30 transition-all group relative">
            {user?.uid === c.ownerId && (
              <button 
                onClick={() => clubService.deleteClub(c.id)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="w-12 h-12 bg-slate-50 group-hover:bg-primary/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary mb-4 transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">{c.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
              <MapPin className="w-3.5 h-3.5" />
              {c.location}
            </div>
            <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">{c.description}</p>
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>{c.eventsCount || 0} Events</span>
              <span className="text-primary group-hover:translate-x-1 transition-transform inline-flex items-center">
                Enter Arena <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {clubs.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-20 text-center">
          <Building2 className="w-16 h-16 text-slate-100 mx-auto mb-6" />
          <p className="text-slate-400 font-medium italic">No clubs are currently registered in this region.</p>
        </div>
      )}
    </motion.div>
  );
}

function RankingsView() {
  const rankings = [
    { name: 'John "Director" Doe', rating: 98.4, rank: 1, region: 'North America' },
    { name: 'Jane "Ace" Smith', rating: 97.2, rank: 2, region: 'Europe' },
    { name: 'Mike "Power" Johnson', rating: 95.8, rank: 3, region: 'Asia' },
    { name: 'Sarah "The Slide" Williams', rating: 94.5, rank: 4, region: 'North America' },
    { name: 'David "Airmail" Chen', rating: 93.1, rank: 5, region: 'Australia' },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">World Series Rankings</h2>
          <p className="text-slate-500 font-medium">Official player rankings based on tournament coefficients.</p>
        </div>
        <div className="flex gap-2">
            <span className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm">Monthly</span>
            <span className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold text-white shadow-sm">Lifetime</span>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden">
        <table className="w-full text-sm data-table">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-4 px-8 w-16">Rank</th>
              <th className="text-left py-4 px-8">Pro Player</th>
              <th className="text-center py-4 px-8">Rating</th>
              <th className="text-right py-4 px-8">Region</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r) => (
              <tr key={r.rank} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 text-slate-700">
                <td className="py-5 px-8 font-mono text-slate-400 font-bold">#{r.rank}</td>
                <td className="py-5 px-8 font-bold">{r.name}</td>
                <td className="py-5 px-8 text-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full font-bold text-xs",
                    r.rank === 1 ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-600"
                  )}>{r.rating}</span>
                </td>
                <td className="py-5 px-8 text-right text-slate-500 font-bold uppercase tracking-widest text-[10px]">{r.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function ProfileView({ user }: { user: User; key?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [saving, setSaving] = useState(false);

  const stats = [
    { label: '7 Day Avg', value: '78.5%', color: 'text-emerald-500' },
    { label: '30 Day Avg', value: '74.2%', color: 'text-primary' },
    { label: '120 Day Avg', value: '71.8%', color: 'text-orange-500' },
    { label: 'Lifetime Avg', value: '68.5%', color: 'text-slate-800' },
  ];

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(user, {
        displayName,
        photoURL
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-bold text-white uppercase overflow-hidden relative group">
            {photoURL ? (
              <img src={photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              displayName?.slice(0,2) || user.displayName?.slice(0,2)
            )}
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <div>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Name</label>
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xl font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Photo URL</label>
                  <input 
                    type="text" 
                    value={photoURL} 
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-slate-800 tracking-tight">{user.displayName}</h2>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 font-medium">{user.email}</p>
                  <p className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 w-fit">
                    UID: {user.uid}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all"
              >
                <XCircle className="w-4 h-4" /> Cancel
              </button>
              <button 
                disabled={saving}
                onClick={handleUpdateProfile}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Profile
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-2 hover:border-primary transition-all shadow-sm"
            >
              <Edit2 className="w-4 h-4 text-primary" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{s.label}</p>
            <p className={cn("text-3xl font-black italic", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-10 font-sans">
        <div className="flex justify-between items-start mb-8">
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">ScoreMagic™ Performance History</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Deep Performance Insight • Rolling 7-Day Precision</p>
            </div>
            <div className="flex gap-1">
                {['7D', '30D', '120D', 'ALL'].map(t => (
                    <button key={t} className={cn(
                        "px-3 py-1 rounded text-[10px] font-bold transition-all",
                        t === '7D' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}>{t}</button>
                ))}
            </div>
        </div>
        
        <div className="h-64 flex items-end gap-2 px-4 pb-4">
          {[82, 78, 85, 92, 75, 88, 80].map((h, i) => (
            <div key={i} className="flex-1 bg-slate-50 rounded-t-lg relative group hover:bg-emerald-50 transition-all cursor-crosshair">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t-lg group-hover:bg-emerald-600 transition-all opacity-80" 
                style={{ height: `${h}%` }} 
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                Day {i + 1}: {h}% Accuracy
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>7 Days Ago</span>
          <span>Today</span>
        </div>
      </div>
    </motion.div>
  );
}
