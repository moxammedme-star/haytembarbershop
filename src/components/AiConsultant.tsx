import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Sparkles, X, Send, AlertCircle, Bot, User, HelpCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "model";
  content: string;
  sources?: { title: string; url: string }[];
}

export const AiConsultant: React.FC = () => {
  const { currentLanguage, t, db } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isRtl = currentLanguage === "ar";

  // Pre-configured luxury sample questions
  const sampleQuestions = {
    fr: [
      "Quelles sont les coiffures masculines tendance en 2026 ?",
      "Quelle coupe convient le mieux à un visage rond ?",
      "Comment est reçue et gérée ma réservation ?",
      "Comment prendre soin de sa barbe au quotidien ?",
      "Quels sont vos tarifs et horaires ?"
    ],
    ar: [
      "ما هي تسريحات الشعر الرجالية الرائجة في 2026؟",
      "ما هي القصة الأنسب للوجه المستدير؟",
      "كيف يتم استقبال حجز المكان للحلاقة؟",
      "كيف أعتني بلحيتي بشكل يومي؟",
      "ما هي أسعاركم وأوقات العمل؟"
    ],
    en: [
      "What are the trending men's hairstyles in 2026?",
      "Which haircut fits best for a round face shape?",
      "How is my booking received and managed?",
      "How do I care for my beard daily?",
      "What are your prices and opening hours?"
    ]
  };

  const getGreeting = () => {
    if (currentLanguage === "ar") {
      return "مرحباً بك! أنا مستشارك الشخصي الذكي لصالون HAYTEM BARBER. اسألني عن أفضل قصات الشعر المناسبة لوجهك، اتجاهات الموضة لعام 2026، أو كيفية العناية بلحيتك وبشرتك.";
    } else if (currentLanguage === "en") {
      return "Welcome! I am your AI Grooming Consultant at HAYTEM BARBER. Ask me anything about trending hairstyles in 2026, which haircut suits your face shape, or how to maintain a premium beard.";
    } else {
      return "Bienvenue ! Je suis votre Conseiller Capillaire Intelligent chez HAYTEM BARBER. Posez-moi vos questions sur les coupes idéales selon la forme de votre visage, les tendances coiffure de 2026, ou comment entretenir une barbe d'exception.";
    }
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "model",
          content: getGreeting()
        }
      ]);
    }
  }, [currentLanguage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError("");
    const userMsg = textToSend.trim();
    setInput("");
    
    // Add user message locally
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      // Map existing history to expected structure for the api
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: historyPayload,
          lang: currentLanguage
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: data.text,
            sources: data.sources
          }
        ]);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to communicate with AI.");
      }
    } catch (err: any) {
      console.warn("AI Assistant fetch failed, using client-side premium fallback engine:", err);
      const fallbackContent = getClientAIFallback(userMsg, currentLanguage, db);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: fallbackContent
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Highly robust client-side fallback knowledge matching
  const getClientAIFallback = (query: string, lang: string, localDb: any): string => {
    const q = query.toLowerCase();
    const siteUrl = window.location.origin;

    // 1. Website / Domain / Online presence / link / search
    if (
      q.includes("موقع") || 
      q.includes("رابط") || 
      q.includes("دومين") || 
      q.includes("بحث") || 
      q.includes("إنترنت") || 
      q.includes("انترنت") || 
      q.includes("أين أجد") || 
      q.includes("اين اجد") || 
      q.includes("العنوان") ||
      q.includes("site") || 
      q.includes("website") || 
      q.includes("domain") || 
      q.includes("link") || 
      q.includes("internet") || 
      q.includes("search") || 
      q.includes("url") || 
      q.includes("online")
    ) {
      if (lang === "ar") {
        return `رابط الموقع الحالي لصالون الحلاقة على الإنترنت هو:
**${siteUrl}**

هذا الموقع آمن ومحمي بالكامل، ومصمم خصيصاً لراحتك. من خلاله يمكنك:
1️⃣ **تصفح الكتالوج**: رؤية قصات الشعر الفاخرة لعام 2026 وأسعارها بالجزائر.
2️⃣ **الحجز الفوري**: اختيار خدمتك والحلاق والوقت المناسب لك في أقل من 60 ثانية.
3️⃣ **لوحة تحكم فورية**: بمجرد ضغطك على تأكيد، يتم تسجيل حجزك فوراً في قاعدة بياناتنا المشفرة وتظهر فوراً على لوحة تحكم الإدارة (Admin Dashboard) الخاصة بالحلاق هيثم لتجهيز الأدوات وتطهير كرسي الحلاقة لك مسبقاً.
4️⃣ **تهيئة محركات البحث (SEO)**: الموقع مهيأ بالكامل بأرقى معايير الأرشفة للظهور في مقدمة نتائج بحث Google في الجزائر العاصمة!`;
      } else if (lang === "en") {
        return `The current active web address for our luxury salon is:
**${siteUrl}**

It is a fully secured, state-of-the-art platform optimized for search engines (SEO) and client convenience. Here you can:
1️⃣ **Explore Catalog**: Browse our curated trending hairstyles for 2026 with transparent pricing in DZD.
2️⃣ **Instant Reservation**: Book your seat and custom service in less than a minute.
3️⃣ **Admin Live Feed**: Your booking instantly locks in our database and updates the master barber's Admin Panel, ensuring your station is prepped and sanitized before you walk in.`;
      } else {
        return `L'adresse web actuelle de notre salon de prestige est :
**${siteUrl}**

C'est un site haut de gamme, sécurisé et optimisé pour le référencement naturel (SEO). Sur cette plateforme, vous pouvez :
1️⃣ **Consulter le catalogue** : Découvrez les coupes masculines tendances pour 2026 et leurs tarifs en DZD.
2️⃣ **Réserver en ligne** : Bloquez votre créneau horaire et votre prestation sur mesure en moins de 60 secondes.
3️⃣ **Transmission Admin** : Votre réservation est immédiatement sauvegardée en base de données et s'affiche instantanément sur le panneau d'administration du coiffeur pour préparer votre accueil royal.`;
      }
    }

    // 2. Booking / how reservation is received
    if (
      q.includes("استقبال") || 
      q.includes("كيف يتم") || 
      q.includes("طريقة الحجز") || 
      q.includes("كيف أحجز") || 
      q.includes("booking method") || 
      q.includes("comment réserver") || 
      q.includes("processus") || 
      q.includes("how booking")
    ) {
      if (lang === "ar") {
        return `مرحباً بك! في صالون HAYTEM BARBER، نعتمد على نظام حجز رقمي متطور ومحمي لضمان راحة زبائننا:
1️⃣ **الحجز الإلكتروني**: تختار الخدمة وقصة الشعر والوقت الذي يناسبك على موقعنا في ثوانٍ معدودة.
2️⃣ **الوصول الفوري للإدارة**: بمجرد الحجز، تظهر معلوماتك (الاسم، الخدمة، الموعد) فوراً على لوحة تحكم الحلاق (Admin Dashboard) في الوقت الفعلي.
3️⃣ **التحضير المسبق**: يقوم الحلاق بمراجعة موعدك وتجهيز مكان الحلاقة وتطهير الأدوات المطلوبة مسبقاً.
4️⃣ **استقبالك بالترحاب**: تأتي في موعدك ويتم استقبالك على الفور دون الوقوف في طوابير الانتظار الطويلة.

اضغط على زر "RÉSERVER" في الأعلى لحجز مكانك الآن!`;
      } else if (lang === "en") {
        return `Hello! Here is how our premium reservation system is received and managed at HAYTEM BARBER:
1️⃣ **Online Booking**: Choose your style, service, and slot in under a minute.
2️⃣ **Admin Live Feed**: Your reservation updates instantly on our barber's Admin Panel, ensuring we have your slot locked in.
3️⃣ **Prep & Warmup**: We prepare the tools and sanitize your chair prior to your arrival.
4️⃣ **No Waiting**: Walk in at your selected hour and get seated immediately for a luxury grooming experience.

Click the "RÉSERVER" button at the top to book now!`;
      } else {
        return `Bonjour ! Voici comment votre réservation est reçue et gérée chez HAYTEM BARBER :
1️⃣ **Réservation en ligne** : Sélectionnez votre style, prestation et horaire sur notre site en un clic.
2️⃣ **Notification Administration** : Votre rendez-vous s'affiche instantanément sur la console d'administration du coiffeur en temps réel.
3️⃣ **Préparation optimale** : Le coiffeur prépare le matériel et désinfecte le fauteuil avant votre arrivée.
4️⃣ **Zéro attente** : Arrivez à l'heure convenue et installez-vous directement pour votre séance de coiffure.

Réservez votre créneau dès maintenant via le bouton "RÉSERVER" en haut !`;
      }
    }

    // 3. Contact / phone / call / address
    if (
      q.includes("اتصال") || 
      q.includes("هاتف") || 
      q.includes("رقم") || 
      q.includes("تواصل") || 
      q.includes("تلفون") || 
      q.includes("رقمكم") || 
      q.includes("رقمك") || 
      q.includes("عنوان") || 
      q.includes("مكان") || 
      q.includes("وين") || 
      q.includes("اين") || 
      q.includes("فين") || 
      q.includes("خرائط") || 
      q.includes("خريطة") || 
      q.includes("phone") || 
      q.includes("contact") || 
      q.includes("number") || 
      q.includes("tel") || 
      q.includes("address") || 
      q.includes("location") || 
      q.includes("maps")
    ) {
      if (lang === "ar") {
        return `يسعدنا تواصلكم وتواجدكم معنا في صالون HAYTEM BARBER!
📞 **رقم الهاتف المباشر**: +213 675 16 11 87
📍 **العنوان**: وسط الجزائر العاصمة، الجزائر (Alger Centre, Alger)

يمكنكم تتبع الموقع الجغرافي للصالون بالضغط على رابط Google Maps المتواجد أسفل صفحة الموقع، أو حجز موعدكم مباشرة عبر الإنترنت دون الحاجة للاتصال!`;
      } else if (lang === "en") {
        return `We would love to welcome you at HAYTEM BARBER!
📞 **Direct Phone**: +213 675 16 11 87
📍 **Address**: Alger Center, Algiers, Algeria

You can find our exact interactive map on our contact section, or book your slot immediately on the website without calling!`;
      } else {
        return `Nous serions ravis de vous accueillir chez HAYTEM BARBER !
📞 **Téléphone Direct** : +213 675 16 11 87
📍 **Adresse** : Alger Centre, Alger, Algérie

Retrouvez notre carte interactive Google Maps en bas de notre site, ou réservez votre séance directement en ligne pour un accès prioritaire !`;
      }
    }

    // 4. Hairstyles catalogue
    if (
      q.includes("قصة") || 
      q.includes("قصات") || 
      q.includes("تسريحة") || 
      q.includes("تسريحات") || 
      q.includes("coiffure") || 
      q.includes("haircut") || 
      q.includes("style") || 
      q.includes("catalogue") || 
      q.includes("trend") || 
      q.includes("buzz") || 
      q.includes("crop") || 
      q.includes("fade") || 
      q.includes("skin") || 
      q.includes("pompadour")
    ) {
      if (lang === "ar") {
        return `يقدم صالون HAYTEM BARBER أرقى قصات الشعر العالمية المشهورة لعام 2026 بأسعار مناسبة في الجزائر:
• ✂️ **Buzz Cut (بز كات)**: قصة عسكرية عملية وذكورية (600 دج).
• ✂️ **French Crop (فرنش كروب)**: جوانب مدرجة مع غرة قصيرة محددة (800 دج).
• ✂️ **Mid Fade (ميد فيد)**: تدرج متوسط ممتاز ومناسب للجميع (800 دج).
• ✂️ **Classic Pompadour (بومبادور كلاسيكي)**: حجم مصفف للخلف لمظهر راقٍ (1000 دج).
• ✂️ **Low Fade & Slick Back**: تدرج منخفض مع شعر مسرح للخلف (1000 دج).
• ✂️ **Skin Fade (تدرج على الجلد)**: التدرج الدقيق الأكثر رواجاً بالجزائر (1200 دج).

يمكنك حجز أي منها مباشرة عبر الضغط على زر "RÉSERVER" بالأعلى!`;
      } else if (lang === "en") {
        return `Here is our official catalog of famous men's haircuts at HAYTEM BARBER with pricing in DZD:
• ✂️ **Buzz Cut**: Clean and easy-to-maintain military style (600 DZD).
• ✂️ **French Crop**: Textured fringe with crisp gradient sides (800 DZD).
• ✂️ **Mid Fade**: Balanced classic medium gradient (800 DZD).
• ✂️ **Classic Pompadour**: Vintage elegance with back-swept high volume (1000 DZD).
• ✂️ **Low Fade & Slick Back**: Executive smooth slicked hair with low fade (1000 DZD).
• ✂️ **Skin Fade**: Blended gradient transitioning smoothly down to the skin (1200 DZD).

Book your favorite style now using the top "RÉSERVER" button!`;
      } else {
        return `Voici notre catalogue des coupes masculines les plus demandées chez HAYTEM BARBER avec tarifs en DZD :
• ✂️ **Buzz Cut** : Coupe militaire nette et moderne (600 DZD).
• ✂️ **French Crop** : Frange texturée et côtés dégradés nets (800 DZD).
• ✂️ **Mid Fade** : Dégradé moyen équilibré et intemporel (800 DZD).
• ✂️ **Classic Pompadour** : Volume vintage gominé vers l'arrière (1000 DZD).
• ✂️ **Low Fade & Slick Back** : Coupe affaire élégante avec dégradé bas (1000 DZD).
• ✂️ **Skin Fade (Dégradé à blanc)** : Le fondu ultra-propre indispensable (1200 DZD).

Réservez votre coupe idéale en un clin d'œil via le bouton "RÉSERVER" en haut de page !`;
      }
    }

    // 5. Face shape advice
    if (
      q.includes("وجه") || 
      q.includes("دائري") || 
      q.includes("مستدير") || 
      q.includes("مربع") || 
      q.includes("بيضاوي") || 
      q.includes("طويل") || 
      q.includes("visage") || 
      q.includes("face") || 
      q.includes("round") || 
      q.includes("oval") || 
      q.includes("square")
    ) {
      if (lang === "ar") {
        return `نصائح شكل الوجه من خبراء صالوننا:
• 🟢 **الوجه المستدير**: ننصح بالـ **Pompadour** أو تدرج عالٍ لزيادة الارتفاع البصري وتخفيف العرض.
• 🟦 **الوجه المربع**: تناسبه قصة **French Crop** أو تدرج منخفض لتنعيم الزوايا الحادة.
• 🥚 **الوجه البيضاوي**: متوازن للغاية وتناسبه كافة القصات كـ **Buzz Cut** أو **Skin Fade**.
• ⏳ **الوجه الطويل**: يفضل التدرج المتوسط (**Mid Fade**) مع تجنب الارتفاع الشاهق في الأعلى.`;
      } else if (lang === "en") {
        return `Face shape tips from our professional styling experts:
• 🟢 **Round Face**: Go for a **Classic Pompadour** or a high **Skin Fade** to create height and balance.
• 🟦 **Square Face**: Soften hard jaw angles with a textured **French Crop** or a neat **Low Fade**.
• 🥚 **Oval Face**: Highly balanced; you can perfectly wear any cut, including a classic **Buzz Cut** or modern **Slick Back**.
• ⏳ **Long Face**: Choose a balanced **Mid Fade** and avoid extreme vertical hair heights to balance proportions.`;
      } else {
        return `Nos conseils visagistes professionnels :
• 🟢 **Visage Rond** : Optez pour un **Classic Pompadour** ou un dégradé haut pour étirer le visage en hauteur.
• 🟦 **Visage Carré** : Adoucissez les contours avec un **French Crop** texturé ou un **Low Fade** élégant.
• 🥚 **Visage Ovale** : Parfaitement équilibré, toutes les coupes vous vont à ravir (comme un **Buzz Cut** ou un dégradé à blanc).
• ⏳ **Visage Long** : Privilégiez un **Mid Fade** moyen et évitez les hauteurs de cheveux extrêmes pour harmoniser les volumes.`;
      }
    }

    // 6. Beard care
    if (q.includes("لحية") || q.includes("دقن") || q.includes("ذقن") || q.includes("barbe") || q.includes("beard")) {
      if (lang === "ar") {
        return `خطوات العناية باللحية من صالون HAYTEM BARBER:
1. **الترطيب**: استخدم زيت اللحية يومياً لتجنب الحكة وجفاف البشرة تحت اللحية.
2. **التمشيط**: استخدم فرشاة شعر خشن لتوجيه نمو الشعر وتوزيع الزيوت.
3. **التنظيف**: اغسل اللحية بشامبو مخصص للحية 2-3 مرات أسبوعياً.
4. **التحديد**: زر صالوننا للحصول على تحديد فائق الدقة بالمنشفة الساخنة والشفيرة التقليدية.`;
      } else if (lang === "en") {
        return `Essential beard care routine by HAYTEM BARBER:
1. **Hydration**: Apply natural beard oil daily to nourish the skin and prevent itching.
2. **Brushing**: Use a natural boar bristle brush daily to guide the hair growth.
3. **Washing**: Use specialized beard shampoo 2-3 times a week to preserve natural oils.
4. **Contour**: Visit our salon regularly for hot towel precision straight razor line-ups.`;
      } else {
        return `Routine essentielle de soin de barbe par HAYTEM BARBER :
1. **Hydratation** : Appliquez de l'huile à barbe tous les jours pour nourrir la peau sous-jacente.
2. **Brossage** : Utilisez une brosse en poils de sanglier pour discipliner et orienter la pousse.
3. **Nettoyage** : Lavez 2 à 3 fois par semaine avec un shampooing doux spécifique pour barbe.
4. **Contours** : Confiez vos lignes à notre salon pour un rasage de précision à la serviette chaude.`;
      }
    }

    // 7. Hours & days
    if (
      q.includes("ساعة") || 
      q.includes("أوقات") || 
      q.includes("وقت") || 
      q.includes("متى") || 
      q.includes("يفتح") || 
      q.includes("يغلق") || 
      q.includes("يوم") || 
      q.includes("العمل") || 
      q.includes("horaire") || 
      q.includes("heure") || 
      q.includes("open") || 
      q.includes("close") || 
      q.includes("time") || 
      q.includes("days")
    ) {
      if (lang === "ar") {
        return `صالون **HAYTEM BARBER** يفتح أبوابه لزبائنه الكرام طوال أيام الأسبوع (بما في ذلك الجمعة والسبت) من الساعة **09:00 صباحاً حتى 21:00 مساءً** لتوفير أقصى درجات المرونة والراحة لكم.`;
      } else if (lang === "en") {
        return `**HAYTEM BARBER** is open daily from **09:00 AM to 09:00 PM** (including weekends) to offer premium styling sessions suited to your executive schedule.`;
      } else {
        return `Le salon **HAYTEM BARBER** vous accueille tous les jours (week-end inclus) de **09h00 à 21h00** pour vous offrir des rituels de soin d'exception selon vos disponibilités.`;
      }
    }

    // Default general greeting
    if (lang === "ar") {
      return `مرحباً بك في صالون HAYTEM BARBER الفاخر!
أنا مستشارك الذكي المساعد. الصالون مفتوح طوال أيام العمل من الساعة 09:00 صباحاً إلى 21:00 مساءً، بقيادة المتميز هيثم محزم.
يمكنك حجز موعدك مباشرة عبر الضغط على زر "RÉSERVER" في الأعلى لحجز مكانك وتجنب الانتظار!`;
    } else if (lang === "en") {
      return `Welcome to HAYTEM BARBER!
I am your smart virtual advisor. The salon is open daily from 09:00 AM to 09:00 PM, managed by master barber Haytem Mehazzem.
Book your appointment online anytime by clicking "RÉSERVER" at the top to secure a zero-wait luxury slot!`;
    } else {
      return `Bienvenue au salon HAYTEM BARBER !
Je suis votre conseiller virtuel intelligent. Le salon est ouvert tous les jours de 09h00 à 21h00 sous la direction du maître coiffeur Haytem Mehazzem.
Réservez votre moment de soin de prestige en cliquant sur "RÉSERVER" en haut de la page pour une séance sur mesure sans attente !`;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40" id="ai-consultant-wrapper">
      {/* Pulse button trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-14 h-14 rounded-none bg-black text-white hover:bg-[#0a0a0a] shadow-2xl shadow-black/80 hover:scale-105 transition-all duration-300 relative group border border-white/10 hover:border-accent"
        id="ai-consultant-trigger-btn"
      >
        <Sparkles className="w-5.5 h-5.5 text-accent animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-none h-3 w-3 bg-accent"></span>
        </span>
      </button>

      {/* Drawer Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
              id="ai-consultant-backdrop"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: isRtl ? "-100%" : "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRtl ? "-100%" : "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed top-0 bottom-0 ${
                isRtl ? "left-0" : "right-0"
              } w-full max-w-md bg-[#0a0a0a] border-${
                isRtl ? "r" : "l"
              } border-white/10 shadow-2xl z-50 flex flex-col`}
              id="ai-consultant-sidebar"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-black/40 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-[#050505] rounded-none border border-white/10">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif tracking-[0.15em] text-white uppercase font-bold">
                      {currentLanguage === "fr" ? "L'ASSISTANT HAYTEM" : currentLanguage === "ar" ? "مستشار هيثم الذكي" : "HAYTEM AI CONSULTANT"}
                    </h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-[0.1em] font-mono mt-0.5">
                      {currentLanguage === "fr" ? "Intelligence Artificielle & Google Search" : currentLanguage === "ar" ? "ذكاء اصطناعي وبحث جوجل" : "Artificial Intelligence & Google Search"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-none border border-white/10 text-neutral-400 hover:text-accent hover:border-accent/40 hover:bg-white/5 transition-all duration-300"
                  id="close-ai-consultant-btn"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    style={{ direction: isRtl ? "rtl" : "ltr" }}
                  >
                    <div className="flex items-start gap-2.5 max-w-[85%]">
                      {msg.role === "model" && (
                        <div className="p-1.5 rounded-none border border-white/10 bg-[#050505] text-accent shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div
                          className={`px-4 py-3 rounded-none text-xs leading-relaxed ${
                            msg.role === "user"
                              ? "bg-white text-black"
                              : "bg-[#050505] text-neutral-300 border border-white/10"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Sources Grounding List */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-white/5 space-y-1">
                              <span className="text-[9px] uppercase tracking-wider text-accent block font-semibold font-mono">
                                {currentLanguage === "fr" ? "Sources de recherche :" : currentLanguage === "ar" ? "مصادر البحث :" : "Search references :"}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.sources.slice(0, 3).map((src, sIdx) => (
                                  <a
                                    key={sIdx}
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-[#0a0a0a] border border-white/10 text-[10px] text-neutral-400 hover:text-accent hover:border-accent/40 transition-all"
                                  >
                                    <span>{src.title.length > 15 ? `${src.title.slice(0, 15)}...` : src.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-accent" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {msg.role === "user" && (
                        <div className="p-1.5 rounded-none border border-white/10 bg-[#050505] text-white shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className={`flex justify-start`} style={{ direction: isRtl ? "rtl" : "ltr" }}>
                    <div className="flex items-start gap-2.5 max-w-[85%]">
                      <div className="p-1.5 rounded-none border border-white/10 bg-[#050505] text-accent shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="px-4 py-3 bg-[#050505] border border-white/10 rounded-none">
                        <div className="flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-none bg-accent animate-bounce" style={{ animationDelay: "100ms" }}></span>
                          <span className="w-1.5 h-1.5 rounded-none bg-accent animate-bounce" style={{ animationDelay: "200ms" }}></span>
                          <span className="w-1.5 h-1.5 rounded-none bg-accent animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-none flex items-start space-x-2 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Sample Questions Drawer */}
              {messages.length === 1 && (
                <div className="px-6 py-2" style={{ direction: isRtl ? "rtl" : "ltr" }}>
                  <p className="text-[10px] uppercase font-semibold text-accent tracking-[0.15em] mb-2 flex items-center font-mono">
                    <HelpCircle className="w-3.5 h-3.5 mr-1" />
                    <span className="mx-1">{currentLanguage === "fr" ? "Suggestions d'entretien" : currentLanguage === "ar" ? "الأسئلة المقترحة" : "Suggested questions"}</span>
                  </p>
                  <div className="space-y-1.5">
                    {sampleQuestions[currentLanguage].map((q, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleSend(q)}
                        className="w-full text-left px-3.5 py-2.5 bg-[#050505] hover:bg-white/5 hover:text-accent rounded-none border border-white/10 text-neutral-400 text-xs transition-all duration-300"
                        style={{ textAlign: isRtl ? "right" : "left" }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input */}
              <div className="p-6 border-t border-white/10 bg-black/40">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={input}
                    disabled={loading}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      currentLanguage === "fr"
                        ? "Posez votre question de style..."
                        : currentLanguage === "ar"
                        ? "اكتب سؤالك هنا..."
                        : "Ask about hairstyle & care..."
                    }
                    className="w-full bg-[#050505] border border-white/10 rounded-none pl-5 pr-14 py-4 text-xs text-white focus:outline-none focus:border-accent/40 transition-all duration-300"
                    style={{
                      direction: isRtl ? "rtl" : "ltr",
                      paddingLeft: isRtl ? "3.5rem" : "1.25rem",
                      paddingRight: isRtl ? "1.25rem" : "3.5rem"
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className={`absolute ${
                      isRtl ? "left-2" : "right-2"
                    } p-2.5 bg-white text-black hover:bg-transparent hover:text-white disabled:bg-neutral-800 disabled:text-neutral-600 rounded-none border border-white transition-all duration-300`}
                    id="ai-send-btn"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
