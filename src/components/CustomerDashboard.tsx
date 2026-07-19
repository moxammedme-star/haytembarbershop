import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { User, Calendar, Heart, Bell, LogOut, ChevronRight, X, Clock, AlertCircle, Edit, Check } from "lucide-react";

interface CustomerDashboardProps {
  onClose: () => void;
  openBooking: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onClose, openBooking }) => {
  const {
    db,
    user,
    userBookings,
    userNotifications,
    registerUser,
    loginUser,
    logoutUser,
    updateUserProfile,
    markNotificationRead,
    rescheduleBooking,
    updateBookingStatus,
    currentLanguage,
    tText
  } = useApp();

  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");

  // Rescheduling states
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoadingAction(true);

    try {
      if (isRegister) {
        if (!name || !phone || !password) {
          setError("Veuillez remplir tous les champs obligatoires.");
          setLoadingAction(false);
          return;
        }
        const res = await registerUser(name, phone, email, password);
        if (res.success) {
          setSuccess("Compte créé avec succès !");
          setEditName(name);
          setEditPhone(phone);
          setEditEmail(email);
        } else {
          setError(res.error || "Une erreur est survenue.");
        }
      } else {
        if (!phone || !password) {
          setError("Veuillez remplir tous les champs.");
          setLoadingAction(false);
          return;
        }
        const res = await loginUser(phone, password);
        if (res.success) {
          setSuccess("Connexion réussie !");
          if (user) {
            setEditName(user.name);
            setEditPhone(user.phone);
            setEditEmail(user.email);
          }
        } else {
          setError(res.error || "Numéro de téléphone ou mot de passe incorrect.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const ok = await updateUserProfile(editName, editPhone, editEmail);
    if (ok) {
      setSuccess("Profil mis à jour avec succès !");
      setIsEditingProfile(false);
    } else {
      setError("Erreur lors de la mise à jour du profil.");
    }
  };

  const handleReschedule = async (bookingId: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      alert("Veuillez choisir une date et une heure valides.");
      return;
    }
    setError("");
    const res = await rescheduleBooking(bookingId, rescheduleDate, rescheduleTime);
    if (res.success) {
      setReschedulingId(null);
      setRescheduleDate("");
      setRescheduleTime("");
      alert("Rendez-vous reporté avec succès !");
    } else {
      alert(res.error || "Impossible de reporter à ce créneau (déjà réservé).");
    }
  };

  // Filter user favorites from DB
  const favoriteHairstyles = db?.hairstyles.filter(h => user?.favorites?.includes(h.id)) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-none shadow-2xl relative flex flex-col md:flex-row my-8" id="customer-dashboard-modal">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-white border border-white/10 bg-black/50 transition"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Sidebar / Accent panel */}
        <div className="md:w-1/3 bg-gradient-to-b from-neutral-900 to-black p-8 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-serif text-white tracking-widest uppercase mb-1">Espace Client</h2>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">HAYTEM BARBER LUXURY</p>
            
            <div className="mt-8 space-y-6">
              <div className="flex items-center space-x-3 text-neutral-300">
                <User className="w-4 h-4 text-neutral-400" />
                <span className="text-xs uppercase tracking-wider">Profil Sécurisé</span>
              </div>
              <div className="flex items-center space-x-3 text-neutral-300">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span className="text-xs uppercase tracking-wider">Vos Réservations</span>
              </div>
              <div className="flex items-center space-x-3 text-neutral-300">
                <Heart className="w-4 h-4 text-neutral-400" />
                <span className="text-xs uppercase tracking-wider">Favoris Sauvegardés</span>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <p className="text-[9px] text-neutral-500 font-mono leading-relaxed uppercase">
              Consultez vos rendez-vous, modifiez votre profil, et profitez d'une expérience sur mesure.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[85vh]">
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-900/60 flex items-center space-x-3 text-red-400 rounded-none text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-900/60 flex items-center space-x-3 text-emerald-400 rounded-none text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {!user ? (
            /* AUTH FORM SCREEN */
            <div className="max-w-md mx-auto py-4">
              <div className="flex border-b border-white/10 mb-8">
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(""); setSuccess(""); }}
                  className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition ${
                    !isRegister ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(""); setSuccess(""); }}
                  className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition ${
                    isRegister ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  S'enregistrer
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {isRegister && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-neutral-400 font-mono tracking-wider">Nom Complet *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jean Dupont"
                      className="w-full bg-[#050505] border border-white/10 rounded-none px-4 py-3 text-xs text-white focus:border-white/30 focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-400 font-mono tracking-wider">Numéro de Téléphone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full bg-[#050505] border border-white/10 rounded-none px-4 py-3 text-xs text-white focus:border-white/30 focus:outline-none font-mono"
                  />
                </div>

                {isRegister && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-neutral-400 font-mono tracking-wider">Adresse E-mail (optionnel)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jean.dupont@example.com"
                      className="w-full bg-[#050505] border border-white/10 rounded-none px-4 py-3 text-xs text-white focus:border-white/30 focus:outline-none font-mono"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-400 font-mono tracking-wider">Mot de Passe *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050505] border border-white/10 rounded-none px-4 py-3 text-xs text-white focus:border-white/30 focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAction}
                  className="w-full mt-4 bg-white hover:bg-neutral-200 text-black py-3.5 text-xs font-bold uppercase tracking-widest transition duration-300"
                >
                  {loadingAction ? "Chargement..." : isRegister ? "Créer mon Compte" : "Se Connecter"}
                </button>
              </form>
            </div>
          ) : (
            /* DASHBOARD SCREEN */
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 gap-4">
                <div>
                  <h3 className="text-lg font-serif text-white tracking-wider">Bonjour, {user.name}</h3>
                  <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">{user.phone}</p>
                </div>
                <button
                  onClick={logoutUser}
                  className="flex items-center space-x-2 border border-white/10 hover:border-white/20 bg-[#050505] px-4 py-2 text-xs text-red-400 uppercase tracking-wider transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Déconnexion</span>
                </button>
              </div>

              {/* Main Panels Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Bookings panel (Left 2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs uppercase font-bold tracking-widest text-neutral-300 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-accent" /> Mes Rendez-vous
                    </h4>
                    <button
                      onClick={() => { onClose(); openBooking(); }}
                      className="text-[10px] uppercase font-bold tracking-widest text-white underline hover:text-neutral-300"
                    >
                      Prendre rendez-vous
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {userBookings.length === 0 ? (
                      <div className="bg-[#050505] border border-white/5 p-8 text-center">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Aucun rendez-vous pour le moment.</p>
                      </div>
                    ) : (
                      userBookings.map((b) => {
                        const srv = db?.services.find(s => s.id === b.serviceId);
                        const srvTitle = srv ? tText(srv.title) : "Prestation";
                        const isRescheduling = reschedulingId === b.id;

                        // Check if booking date is in future
                        const isFuture = new Date(b.date) >= new Date(new Date().setHours(0,0,0,0));

                        return (
                          <div key={b.id} className="bg-[#050505] border border-white/10 p-5 space-y-4 transition hover:border-white/20">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-sm font-semibold text-white tracking-wide">{srvTitle}</h5>
                                <div className="flex items-center space-x-3 text-neutral-400 text-xs mt-1">
                                  <span className="font-mono">{b.date.split("-").reverse().join("/")}</span>
                                  <span className="text-neutral-600">&bull;</span>
                                  <span className="font-mono flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-neutral-500" /> {b.time}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[9px] uppercase tracking-widest px-2.5 py-1 font-bold ${
                                b.status === "confirmed" ? "bg-emerald-950 text-emerald-400 border border-emerald-900/40" :
                                b.status === "completed" ? "bg-blue-950 text-blue-400 border border-blue-900/40" :
                                b.status === "cancelled" ? "bg-red-950 text-red-400 border border-red-900/40" :
                                "bg-amber-950 text-amber-400 border border-amber-900/40"
                              }`}>
                                {b.status === "confirmed" ? "Confirmé" :
                                 b.status === "completed" ? "Terminé" :
                                 b.status === "cancelled" ? "Annulé" : "En attente"}
                              </span>
                            </div>

                            {/* Reschedule inline picker */}
                            {isRescheduling && (
                              <div className="bg-neutral-950 border border-white/10 p-4 space-y-3 animate-fade-in">
                                <p className="text-[10px] uppercase font-bold text-neutral-300">Modifier la date & l'heure</p>
                                <div className="grid grid-cols-2 gap-3">
                                  <input
                                    type="date"
                                    min={new Date().toISOString().split("T")[0]}
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    className="bg-[#050505] border border-white/10 text-white text-xs p-2.5 outline-none font-mono"
                                  />
                                  <input
                                    type="time"
                                    value={rescheduleTime}
                                    onChange={(e) => setRescheduleTime(e.target.value)}
                                    className="bg-[#050505] border border-white/10 text-white text-xs p-2.5 outline-none font-mono"
                                  />
                                </div>
                                <div className="flex space-x-2 pt-1">
                                  <button
                                    onClick={() => handleReschedule(b.id)}
                                    className="bg-white hover:bg-neutral-200 text-black px-4 py-2 text-[10px] uppercase tracking-widest font-bold"
                                  >
                                    Confirmer le report
                                  </button>
                                  <button
                                    onClick={() => setReschedulingId(null)}
                                    className="border border-white/10 hover:border-white/20 text-white px-4 py-2 text-[10px] uppercase tracking-widest"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Booking Action buttons */}
                            {isFuture && b.status !== "cancelled" && !isRescheduling && (
                              <div className="flex items-center space-x-2 pt-1 border-t border-white/5">
                                <button
                                  onClick={() => setReschedulingId(b.id)}
                                  className="text-[10px] uppercase tracking-widest font-bold border border-white/10 hover:border-white/20 px-3.5 py-1.5 transition"
                                >
                                  Reporter
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Voulez-vous vraiment annuler ce rendez-vous ?")) {
                                      await updateBookingStatus(b.id, "cancelled");
                                    }
                                  }}
                                  className="text-[10px] uppercase tracking-widest font-bold border border-red-900/30 text-red-400 hover:bg-red-950/20 px-3.5 py-1.5 transition"
                                >
                                  Annuler
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Profile & Notifications sidebar */}
                <div className="space-y-6">
                  {/* Profile Edit Info */}
                  <div className="bg-[#050505] border border-white/10 p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <h4 className="text-xs uppercase font-bold tracking-widest text-neutral-300 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-accent" /> Vos Informations
                      </h4>
                      {!isEditingProfile ? (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="text-neutral-400 hover:text-white"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className="text-neutral-400 hover:text-white text-[10px] uppercase tracking-wider font-bold"
                        >
                          Annuler
                        </button>
                      )}
                    </div>

                    {!isEditingProfile ? (
                      <div className="space-y-2.5 text-xs text-neutral-300">
                        <div>
                          <span className="text-[9px] uppercase text-neutral-500 block font-mono">Nom</span>
                          <span className="font-semibold text-white">{user.name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-neutral-500 block font-mono">Téléphone</span>
                          <span className="font-semibold text-white font-mono">{user.phone}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-neutral-500 block font-mono">E-mail</span>
                          <span className="font-semibold text-white font-mono">{user.email || "Non renseigné"}</span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-neutral-400 font-mono">Nom</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-none px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-neutral-400 font-mono">Téléphone</label>
                          <input
                            type="tel"
                            required
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-none px-3 py-2 text-xs text-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-neutral-400 font-mono">E-mail</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-none px-3 py-2 text-xs text-white font-mono"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-white hover:bg-neutral-200 text-black py-2 text-xs font-bold uppercase tracking-wider transition"
                        >
                          Enregistrer
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="bg-[#050505] border border-white/10 p-5 space-y-4">
                    <h4 className="text-xs uppercase font-bold tracking-widest text-neutral-300 flex items-center gap-2 border-b border-white/5 pb-3">
                      <Bell className="w-3.5 h-3.5 text-accent" /> Messagerie & Alertes
                    </h4>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto">
                      {userNotifications.length === 0 ? (
                        <p className="text-[11px] text-neutral-500 uppercase tracking-wider text-center py-4">Aucun message reçu.</p>
                      ) : (
                        userNotifications.map((n) => (
                          <div key={n.id} className="text-xs border-b border-white/5 last:border-b-0 pb-2.5 last:pb-0 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className={`font-semibold ${n.read ? "text-neutral-400" : "text-white"}`}>{n.title}</span>
                              {!n.read && (
                                <button
                                  onClick={() => markNotificationRead(n.id)}
                                  className="text-[9px] text-accent uppercase font-bold tracking-wider hover:underline"
                                >
                                  Lu
                                </button>
                              )}
                            </div>
                            <p className="text-neutral-400 text-[11px] leading-relaxed">{n.message}</p>
                            <span className="text-[9px] text-neutral-600 block font-mono">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Favorites Panel (Curated grid at bottom) */}
              <div className="space-y-4 border-t border-white/10 pt-6">
                <h4 className="text-xs uppercase font-bold tracking-widest text-neutral-300 flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-accent" /> Vos Inspirations & Coupes Favorites
                </h4>

                {favoriteHairstyles.length === 0 ? (
                  <div className="bg-[#050505] border border-white/5 p-6 text-center">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">
                      Cliquez sur le coeur d'une coupe sur le site pour la retrouver ici !
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {favoriteHairstyles.map((h) => (
                      <div key={h.id} className="group relative bg-[#050505] border border-white/10 overflow-hidden">
                        <div className="aspect-square w-full overflow-hidden relative">
                          <img
                            src={h.image}
                            alt={tText(h.name)}
                            className="object-cover w-full h-full transition duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="p-3 text-center bg-black/60 absolute bottom-0 inset-x-0 backdrop-blur-xs">
                          <p className="text-[11px] font-bold text-white uppercase tracking-wider truncate">{tText(h.name)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
