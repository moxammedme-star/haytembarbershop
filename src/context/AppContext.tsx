import React, { createContext, useContext, useState, useEffect } from "react";
import { BusinessInfo, WorkingHourDay, Service, Hairstyle, GalleryItem, Booking, Stats, Language, TranslationDictionary } from "../types";

interface AppContextType {
  db: {
    businessInfo: BusinessInfo;
    workingHours: WorkingHourDay[];
    services: Service[];
    hairstyles: Hairstyle[];
    gallery: GalleryItem[];
    dictionary: TranslationDictionary;
  } | null;
  stats: Stats | null;
  bookings: Booking[];
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  loading: boolean;
  refetchDb: () => Promise<void>;
  refetchBookings: () => Promise<void>;
  refetchStats: () => Promise<void>;
  isAdminAuthenticated: boolean;
  loginAdmin: (passcode: string) => Promise<boolean>;
  logoutAdmin: () => void;
  t: (key: string) => string;
  tText: (textObj: { [key: string]: string } | undefined | null) => string;
  createBooking: (bookingData: Omit<Booking, "id" | "status" | "createdAt">) => Promise<boolean>;
  updateBookingStatus: (id: string, status: Booking["status"]) => Promise<void>;
  updateBusinessInfo: (info: Partial<BusinessInfo>) => Promise<void>;
  updateWorkingHours: (hours: WorkingHourDay[]) => Promise<void>;
  saveService: (service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  saveHairstyle: (hairstyle: Partial<Hairstyle>) => Promise<void>;
  deleteHairstyle: (id: string) => Promise<void>;
  addGalleryItem: (item: Omit<GalleryItem, "id">) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;
  saveDictionary: (dict: Partial<TranslationDictionary>) => Promise<void>;
  adminPasscode: string;

  // Customer Authentication & Dashboard Features
  user: any | null;
  userBookings: Booking[];
  userNotifications: any[];
  registerUser: (name: string, phone: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginUser: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  updateUserProfile: (name: string, phone: string, email: string) => Promise<boolean>;
  toggleFavorite: (hairstyleId: string) => Promise<boolean>;
  fetchUserBookings: () => Promise<void>;
  fetchUserNotifications: () => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  deleteBooking: (id: string) => Promise<boolean>;
  rescheduleBooking: (id: string, date: string, time: string) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbState, setDbState] = useState<AppContextType["db"]>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentLanguage, setCurrentLanguageState] = useState<Language>("fr");
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState("1234"); // Default passcode can be customized

  // Customer states
  const [user, setUser] = useState<any | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [userNotifications, setUserNotifications] = useState<any[]>([]);

  // Set active language from localStorage and restore session
  useEffect(() => {
    const savedLang = localStorage.getItem("haytem_barber_lang");
    if (savedLang === "fr" || savedLang === "ar" || savedLang === "en") {
      setCurrentLanguageState(savedLang);
    }

    const adminAuth = localStorage.getItem("haytem_barber_admin_auth");
    if (adminAuth === "true") {
      setIsAdminAuthenticated(true);
    }

    const savedPasscode = localStorage.getItem("haytem_barber_admin_passcode");
    if (savedPasscode) {
      setAdminPasscode(savedPasscode);
    }

    const savedUser = localStorage.getItem("haytem_barber_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setCurrentLanguageState(lang);
    localStorage.setItem("haytem_barber_lang", lang);
  };

  const refetchDb = async () => {
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setDbState({
          businessInfo: data.businessInfo,
          workingHours: data.workingHours,
          services: data.services,
          hairstyles: data.hairstyles,
          gallery: data.gallery,
          dictionary: data.dictionary
        });
      }
    } catch (err) {
      console.error("Failed to fetch database:", err);
    }
  };

  const refetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    }
  };

  const refetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  // Initial load
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      await Promise.all([refetchDb(), refetchBookings(), refetchStats()]);
      
      const savedUser = localStorage.getItem("haytem_barber_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          // Fetch user bookings & notifications
          const bRes = await fetch(`/api/users/${parsed.id}/bookings`);
          if (bRes.ok) setUserBookings(await bRes.json());
          const nRes = await fetch(`/api/users/${parsed.id}/notifications`);
          if (nRes.ok) setUserNotifications(await nRes.json());
        } catch (e) {}
      }
      
      // Log visitor entry (Real analytics only!)
      try {
        await fetch("/api/stats/visit", { method: "POST" });
        refetchStats(); // Refresh stats with new visit count
      } catch (err) {
        console.error("Failed to log visit:", err);
      }
      
      setLoading(false);
    };
    initApp();
  }, []);

  // Admin login using passcode
  const loginAdmin = async (passcode: string): Promise<boolean> => {
    if (passcode === adminPasscode) {
      setIsAdminAuthenticated(true);
      localStorage.setItem("haytem_barber_admin_auth", "true");
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("haytem_barber_admin_auth");
  };

  // Helper translation function
  const t = (key: string): string => {
    if (!dbState || !dbState.dictionary) return key;
    const item = dbState.dictionary[key];
    if (!item) return key;
    return item[currentLanguage] || item.fr || key;
  };

  // Helper translation for structured fields
  const tText = (textObj: { [key: string]: string } | undefined | null): string => {
    if (!textObj) return "";
    return textObj[currentLanguage] || textObj.fr || textObj.en || "";
  };

  // Booking creator
  const createBooking = async (bookingData: Omit<Booking, "id" | "status" | "createdAt">): Promise<boolean> => {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) {
        await Promise.all([refetchBookings(), refetchStats()]);
        if (user) {
          await Promise.all([fetchUserBookings(), fetchUserNotifications()]);
        }
        return true;
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to book");
      }
    } catch (err: any) {
      console.error("Error creating booking:", err);
      alert(err.message || "Erreur de réservation.");
    }
    return false;
  };

  // Update booking status (confirm, cancel, complete)
  const updateBookingStatus = async (id: string, status: Booking["status"]) => {
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await Promise.all([refetchBookings(), refetchStats()]);
        if (user) {
          await Promise.all([fetchUserBookings(), fetchUserNotifications()]);
        }
      }
    } catch (err) {
      console.error("Error updating booking status:", err);
    }
  };

  // Delete Booking completely
  const deleteBooking = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await Promise.all([refetchBookings(), refetchStats()]);
        return true;
      }
    } catch (err) {
      console.error("Failed to delete booking:", err);
    }
    return false;
  };

  // Reschedule Booking
  const rescheduleBooking = async (id: string, date: string, time: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/bookings/${id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time })
      });
      if (res.ok) {
        await Promise.all([refetchBookings(), refetchStats()]);
        if (user) {
          await Promise.all([fetchUserBookings(), fetchUserNotifications()]);
        }
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      console.error("Failed to reschedule:", err);
      return { success: false, error: err.message };
    }
  };

  // Fetch logged in user's bookings
  const fetchUserBookings = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/bookings`);
      if (res.ok) {
        setUserBookings(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch user bookings:", e);
    }
  };

  // Fetch logged in user's notifications
  const fetchUserNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/notifications`);
      if (res.ok) {
        setUserNotifications(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  // Mark notification read
  const markNotificationRead = async (notifId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/notifications/${notifId}/read`, {
        method: "POST"
      });
      if (res.ok) {
        fetchUserNotifications();
      }
    } catch (e) {
      console.error("Failed to mark notification read:", e);
    }
  };

  // Register Customer
  const registerUser = async (name: string, phone: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("haytem_barber_user", JSON.stringify(data.user));
        // Fetch fresh bookings & notifications
        const bRes = await fetch(`/api/users/${data.user.id}/bookings`);
        if (bRes.ok) setUserBookings(await bRes.json());
        const nRes = await fetch(`/api/users/${data.user.id}/notifications`);
        if (nRes.ok) setUserNotifications(await nRes.json());
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  // Login Customer
  const loginUser = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("haytem_barber_user", JSON.stringify(data.user));
        // Fetch bookings & notifications
        const bRes = await fetch(`/api/users/${data.user.id}/bookings`);
        if (bRes.ok) setUserBookings(await bRes.json());
        const nRes = await fetch(`/api/users/${data.user.id}/notifications`);
        if (nRes.ok) setUserNotifications(await nRes.json());
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  // Logout Customer
  const logoutUser = () => {
    setUser(null);
    setUserBookings([]);
    setUserNotifications([]);
    localStorage.removeItem("haytem_barber_user");
  };

  // Update User Profile
  const updateUserProfile = async (name: string, phone: string, email: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, name, phone, email })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("haytem_barber_user", JSON.stringify(data.user));
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // Toggle favorite hairstyle
  const toggleFavorite = async (hairstyleId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, hairstyleId })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, favorites: data.favorites };
        setUser(updatedUser);
        localStorage.setItem("haytem_barber_user", JSON.stringify(updatedUser));
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // Update business info (general config)
  const updateBusinessInfo = async (info: Partial<BusinessInfo>) => {
    try {
      const res = await fetch("/api/db/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info)
      });
      if (res.ok) {
        const data = await res.json();
        // Update local passcode if it was changed
        if (info.policies && (info.policies as any).adminPasscode) {
          const newPass = (info.policies as any).adminPasscode;
          setAdminPasscode(newPass);
          localStorage.setItem("haytem_barber_admin_passcode", newPass);
        }
        await refetchDb();
      }
    } catch (err) {
      console.error("Error updating business info:", err);
    }
  };

  // Update working hours
  const updateWorkingHours = async (hours: WorkingHourDay[]) => {
    try {
      const res = await fetch("/api/db/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hours)
      });
      if (res.ok) {
        await refetchDb();
      }
    } catch (err) {
      console.error("Error updating hours:", err);
    }
  };

  // Save (add/edit) service
  const saveService = async (service: Partial<Service>) => {
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service)
      });
      if (res.ok) {
        await refetchDb();
      }
    } catch (err) {
      console.error("Error saving service:", err);
    }
  };

  // Delete service
  const deleteService = async (id: string) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await refetchDb();
      }
    } catch (err) {
      console.error("Error deleting service:", err);
    }
  };

  // Save (add/edit) hairstyle
  const saveHairstyle = async (hairstyle: Partial<Hairstyle>) => {
    try {
      const res = await fetch("/api/hairstyles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hairstyle)
      });
      if (res.ok) {
        await refetchDb();
      }
    } catch (err) {
      console.error("Error saving hairstyle:", err);
    }
  };

  // Delete hairstyle
  const deleteHairstyle = async (id: string) => {
    try {
      const res = await fetch(`/api/hairstyles/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await refetchDb();
      }
    } catch (err) {
      console.error("Error deleting hairstyle:", err);
    }
  };

  // Add gallery item
  const addGalleryItem = async (item: Omit<GalleryItem, "id">) => {
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        await refetchDb();
      }
    } catch (err) {
      console.error("Error adding gallery item:", err);
    }
  };

  // Delete gallery item
  const deleteGalleryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await refetchDb();
      }
    } catch (err) {
      console.error("Error deleting gallery item:", err);
    }
  };

  // Save dictionary records
  const saveDictionary = async (dict: Partial<TranslationDictionary>) => {
    try {
      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dict)
      });
      if (res.ok) {
        await refetchDb();
      }
    } catch (err) {
      console.error("Error saving dictionary:", err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        db: dbState,
        stats,
        bookings,
        currentLanguage,
        setLanguage,
        loading,
        refetchDb,
        refetchBookings,
        refetchStats,
        isAdminAuthenticated,
        loginAdmin,
        logoutAdmin,
        t,
        tText,
        createBooking,
        updateBookingStatus,
        updateBusinessInfo,
        updateWorkingHours,
        saveService,
        deleteService,
        saveHairstyle,
        deleteHairstyle,
        addGalleryItem,
        deleteGalleryItem,
        saveDictionary,
        adminPasscode,

        // Customer dashboard values
        user,
        userBookings,
        userNotifications,
        registerUser,
        loginUser,
        logoutUser,
        updateUserProfile,
        toggleFavorite,
        fetchUserBookings,
        fetchUserNotifications,
        markNotificationRead,
        deleteBooking,
        rescheduleBooking
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
