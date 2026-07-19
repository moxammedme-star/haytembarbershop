import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Dynamic/lazy initialization for Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for AI features. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Database JSON filepath
const DB_DIR = path.join(process.cwd(), "src", "data");
const DB_PATH = path.join(DB_DIR, "db.json");

// Default DB definition matching requirements (leave empty fields where requested)
const defaultDb = {
  businessInfo: {
    name: "HAYTEM BARBERSHOP",
    phone: "+213 675 16 11 87",
    email: "", // Empty email as requested
    whatsapp: "+213 675 16 11 87",
    instagram: "https://www.instagram.com/haytem_br_1",
    facebook: "https://www.facebook.com/haytem.mehazzem.39",
    tiktok: "https://www.tiktok.com/@haytemmehazzem",
    googleMaps: "https://maps.app.goo.gl/E11tAiMQUmmpSEc56",
    biography: { fr: "", ar: "", en: "" }, // Empty bio
    story: { fr: "", ar: "", en: "" }, // Empty business story
    mission: { fr: "", ar: "", en: "" }, // Empty mission
    vision: { fr: "", ar: "", en: "" }, // Empty vision
    logoUrl: "", // Empty logo
    promoBanner: { fr: "", ar: "", en: "" }, // Empty promotions
    policies: { fr: "", ar: "", en: "" } // Empty policies
  },
  workingHours: [
    { day: "Lundi", dayKey: "monday", open: "09:00", close: "21:00", isClosed: false },
    { day: "Mardi", dayKey: "tuesday", open: "09:00", close: "21:00", isClosed: false },
    { day: "Mercredi", dayKey: "wednesday", open: "09:00", close: "21:00", isClosed: false },
    { day: "Jeudi", dayKey: "thuesday", open: "09:00", close: "21:00", isClosed: false },
    { day: "Vendredi", dayKey: "friday", open: "09:00", close: "21:00", isClosed: false },
    { day: "Samedi", dayKey: "saturday", open: "09:00", close: "21:00", isClosed: false },
    { day: "Dimanche", dayKey: "sunday", open: "09:00", close: "21:00", isClosed: false }
  ],
  services: [
    {
      id: "srv-1",
      title: { fr: "Coupe de Cheveux Signature", ar: "قصة شعر سيجنتشر", en: "Signature Haircut" },
      description: { fr: "Coupe sur mesure adaptée à la forme du visage et rituel shampoing.", ar: "قصة شعر مخصصة تناسب شكل الوجه مع غسيل الشعر.", en: "Custom haircut adapted to face shape and shampoo ritual." },
      price: null, // Empty price
      duration: 30,
      category: "Haircut",
      availability: true
    },
    {
      id: "srv-2",
      title: { fr: "Taille de Barbe & Rasage Traditionnel", ar: "حلاقة ذقن تقليدية", en: "Beard Trim & Hot Towel Shave" },
      description: { fr: "Taille de barbe de précision, serviette chaude et huile hydratante.", ar: "تحديد دقيق للحية مع منشفة ساخنة وزيت مرطب.", en: "Precision beard trim, hot towel, and moisturizing oil." },
      price: null, // Empty price
      duration: 30,
      category: "Beard",
      availability: true
    },
    {
      id: "srv-3",
      title: { fr: "Formule Intégrale (Cheveux + Barbe)", ar: "الباقة الكاملة (شعر + ذقن)", en: "Full Combo (Hair + Beard)" },
      description: { fr: "La formule ultime alliant coupe de cheveux premium et soin de barbe traditionnel.", ar: "الباقة المثالية التي تجمع بين قصة الشعر الفاخرة والعناية التقليدية باللحية.", en: "The ultimate formula combining premium haircut and traditional beard care." },
      price: null, // Empty price
      duration: 60,
      category: "Special",
      availability: true
    },
    {
      id: "srv-4",
      title: { fr: "Coloration Premium", ar: "صبغ شعر فاخر", en: "Premium Hair Coloring" },
      description: { fr: "Technique de coloration moderne pour couvrir les cheveux blancs ou apporter une nuance.", ar: "تقنية صبغ حديثة لتغطية الشعر الأبيض أو إضفاء لون مميز.", en: "Modern coloring technique to cover white hair or add a unique tone." },
      price: null,
      duration: 45,
      category: "Coloring",
      availability: true
    },
    {
      id: "srv-5",
      title: { fr: "Rituel Soin du Visage Purifiant", ar: "عناية فائقة بالبشرة والوجه", en: "Purifying Facial Care Ritual" },
      description: { fr: "Nettoyage en profondeur du visage, masque exfoliant et massage relaxant.", ar: "تنظيف عميق للوجه مع قناع مقشر ومساج مريح للبشرة.", en: "Deep facial cleansing, exfoliating mask, and relaxing facial massage." },
      price: null,
      duration: 25,
      category: "Special",
      availability: true
    }
  ],
  hairstyles: [
    {
      id: "hair-buzz",
      name: { fr: "Buzz Cut", ar: "بز كات", en: "Buzz Cut" },
      description: {
        fr: "Une coupe très courte, uniforme et ultra-moderne, facile à entretenir.",
        ar: "قصة شعر قصيرة جداً ومتناسقة، عملية وسهلة العناية اليومية.",
        en: "A very short, uniform, and ultra-modern cut, extremely easy to maintain."
      },
      image: "https://images.unsplash.com/photo-1643273111242-ff0f4bc9cc3c?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 600,
      duration: 20,
      difficulty: 2,
      category: "Short Styles"
    },
    {
      id: "hair-crew",
      name: { fr: "Crew Cut", ar: "كرو كات", en: "Crew Cut" },
      description: {
        fr: "Coupe classique fuselée, légèrement plus longue sur le dessus.",
        ar: "قصة كلاسيكية أنيقة، أطول قليلاً من الأعلى مع جوانب متدرجة.",
        en: "Classic tapered clean look, slightly longer on top than a buzz cut."
      },
      image: "https://images.unsplash.com/photo-1517832204353-00e7048f07aa?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 700,
      duration: 25,
      difficulty: 2,
      category: "Short Styles"
    },
    {
      id: "hair-crop",
      name: { fr: "French Crop", ar: "فرنش كروب", en: "French Crop" },
      description: {
        fr: "Un dégradé court sur les côtés avec une frange courte texturée.",
        ar: "تدرج قصير على الجانبين مع غرة أمامية محددة ومحسنة الملمس.",
        en: "A short fade on the sides with a textured short fringe on top."
      },
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 800,
      duration: 30,
      difficulty: 3,
      category: "Textured"
    },
    {
      id: "hair-caesar",
      name: { fr: "Caesar Cut", ar: "قصة سيزار", en: "Caesar Cut" },
      description: {
        fr: "Coupe avec frange droite et côtés courts, style classique inspiré de l'empereur.",
        ar: "قصة شعر كلاسيكية مستوحاة من الإمبراطور الروماني بغرة أفقية مستقيمة.",
        en: "Short hairstyle with an even horizontal-cut fringe, inspired by Julius Caesar."
      },
      image: "https://images.unsplash.com/photo-1605497746444-ac9dbd39f400?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 800,
      duration: 25,
      difficulty: 3,
      category: "Short Styles"
    },
    {
      id: "hair-lowfade",
      name: { fr: "Low Fade", ar: "لو فيد", en: "Low Fade" },
      description: {
        fr: "Un dégradé bas subtil commençant juste au-dessus des oreilles.",
        ar: "تدرج منخفض خفيف وأنيق يبدأ مباشرة فوق الأذنين وخط الرقبة.",
        en: "A subtle, clean fade starting just above the ears and neckline."
      },
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1000,
      duration: 35,
      difficulty: 4,
      category: "Fades"
    },
    {
      id: "hair-midfade",
      name: { fr: "Mid Fade", ar: "ميد فيد", en: "Mid Fade" },
      description: {
        fr: "Dégradé moyen moderne, équilibré et de haute précision.",
        ar: "تدرج متوسط متوازن وحديث يمنح مظهراً حاداً ومميزاً.",
        en: "The perfect balance of a medium height fade, clean and sharp."
      },
      image: "https://images.unsplash.com/photo-1512864084360-7c0c4d0a0845?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 800,
      duration: 30,
      difficulty: 3,
      category: "Fades"
    },
    {
      id: "hair-highfade",
      name: { fr: "High Fade", ar: "هاي فيد", en: "High Fade" },
      description: {
        fr: "Un dégradé haut audacieux pour un contraste saisissant.",
        ar: "تدرج مرتفع جريء يبرز ملامح الوجه بشكل متباين وجذاب.",
        en: "Bold, high-contrast fade that starts near the top of the temples."
      },
      image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1000,
      duration: 35,
      difficulty: 4,
      category: "Fades"
    },
    {
      id: "hair-skinfade",
      name: { fr: "Skin Fade", ar: "سكين فيد", en: "Skin Fade" },
      description: {
        fr: "Dégradé à blanc millimétré qui se fond parfaitement sur la peau.",
        ar: "تدرج على الصفر دقيق للغاية يتلاشى بسلاسة حتى يلامس الجلد.",
        en: "Masterful fade blending completely down to the bare skin."
      },
      image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1200,
      duration: 35,
      difficulty: 4,
      category: "Fades"
    },
    {
      id: "hair-taperfade",
      name: { fr: "Taper Fade", ar: "تيبر فيد", en: "Taper Fade" },
      description: {
        fr: "Dégradé subtil concentré uniquement sur les pattes et la nuque.",
        ar: "تدرج ناعم ومحدد يستهدف السوالف ومؤخرة العنق فقط.",
        en: "Gradual fade restricted only to the sideburns and neckline."
      },
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 900,
      duration: 30,
      difficulty: 3,
      category: "Fades"
    },
    {
      id: "hair-dropfade",
      name: { fr: "Drop Fade", ar: "دروب فيد", en: "Drop Fade" },
      description: {
        fr: "Un dégradé qui descend derrière l'oreille pour épouser la forme de la tête.",
        ar: "تدرج ينخفض تدريجياً خلف الأذن ليتبع المحيط الطبيعي للرأس.",
        en: "Elegant fade that drops low behind the ears for a curved profile."
      },
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1100,
      duration: 35,
      difficulty: 4,
      category: "Fades"
    },
    {
      id: "hair-burstfade",
      name: { fr: "Burst Fade", ar: "بيرست فيد", en: "Burst Fade" },
      description: {
        fr: "Dégradé circulaire autour de l'oreille, idéal pour des styles texturés.",
        ar: "تدرج دائري الشكل حول الأذن يمنح قصتك طابعاً مفعماً بالحيوية.",
        en: "Semi-circular fade curving around the ear, perfect for mohawks or crops."
      },
      image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1100,
      duration: 35,
      difficulty: 4,
      category: "Fades"
    },
    {
      id: "hair-templefade",
      name: { fr: "Temple Fade", ar: "تمبل فيد", en: "Temple Fade" },
      description: {
        fr: "Dégradé minimalist et précis localisé uniquement aux tempes.",
        ar: "تدرج دقيق ومحدد يقتصر فقط على منطقة الصدغين.",
        en: "Precise small fade concentrated exclusively at the temples."
      },
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 850,
      duration: 30,
      difficulty: 3,
      category: "Fades"
    },
    {
      id: "hair-combover",
      name: { fr: "Comb Over", ar: "كومب أوفر", en: "Comb Over" },
      description: {
        fr: "Cheveux rabattus avec une raie nette, pour un style gentleman soigné.",
        ar: "تسريحة كلاسيكية بفرقة جانبية واضحة وشعر مسرح للجانب.",
        en: "Neat parting with hair combed to one side for an executive appearance."
      },
      image: "https://images.unsplash.com/photo-1512864084360-7c0c4d0a0845?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1000,
      duration: 30,
      difficulty: 3,
      category: "Classic"
    },
    {
      id: "hair-slickback",
      name: { fr: "Slick Back", ar: "سليك باك", en: "Slick Back" },
      description: {
        fr: "Cheveux peignés droits vers l'arrière avec un fini brillant ou mat élégant.",
        ar: "شعر مسرح بالكامل إلى الخلف بمظهر رطب أو مطفي عالي الجاذبية.",
        en: "Bold combed straight-back look with premium wet-look pomade or matte hold."
      },
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1000,
      duration: 30,
      difficulty: 3,
      category: "Classic"
    },
    {
      id: "hair-pompadour",
      name: { fr: "Pompadour", ar: "بومبادور", en: "Pompadour" },
      description: {
        fr: "Volume sophistiqué rabattu vers l'arrière, d'une élégance intemporelle.",
        ar: "حجم شعر مرتفع ومصفف للخلف بدقة لإبراز كاريزما مميزة.",
        en: "Retro-modern high volume quiff swept back with perfect elegance."
      },
      image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1100,
      duration: 40,
      difficulty: 4,
      category: "Classic"
    },
    {
      id: "hair-quiff",
      name: { fr: "Quiff", ar: "كويف", en: "Quiff" },
      description: {
        fr: "Coupe avec volume dynamique texturé sur le devant de la tête.",
        ar: "تسريحة حيوية مرتفعة للأعلى والأمام لمنح الوجه طولاً رائعاً.",
        en: "Sophisticated textured top brushed up and slightly forward."
      },
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1000,
      duration: 35,
      difficulty: 3,
      category: "Classic"
    },
    {
      id: "hair-texturedcrop",
      name: { fr: "Textured Crop", ar: "تيكستشرد كروب", en: "Textured Crop" },
      description: {
        fr: "Cheveux texturés sur le dessus avec côtés rasés en dégradé.",
        ar: "شعر ذو ملمس محكم وفوضوي منسق في الأعلى مع تدرج حاد على الجوانب.",
        en: "Modern messy top style with a high fade for high contrast definition."
      },
      image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 950,
      duration: 30,
      difficulty: 3,
      category: "Textured"
    },
    {
      id: "hair-sidepart",
      name: { fr: "Side Part", ar: "فرق جانبي", en: "Side Part" },
      description: {
        fr: "Style traditionnel distingué avec séparation nette sur le côté.",
        ar: "مظهر تقليدي أنيق يعتمد على خط فرق جانبي واضح ومحدد.",
        en: "Timeless gentleman's haircut with a clean hard-part or soft-part line."
      },
      image: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 900,
      duration: 30,
      difficulty: 3,
      category: "Classic"
    },
    {
      id: "hair-middlepart",
      name: { fr: "Middle Part", ar: "فرق أوسط", en: "Middle Part" },
      description: {
        fr: "Séparation centrale moderne avec mouvement naturel fluide.",
        ar: "فرق أوسط عصري يتدلى بنعومة على جانبي الوجه مع حجم طبيعي.",
        en: "Relaxed center parting styled with natural volume and flow."
      },
      image: "https://images.unsplash.com/photo-1620122303020-43ec4b6cf7f8?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 900,
      duration: 30,
      difficulty: 3,
      category: "Classic"
    },
    {
      id: "hair-curtains",
      name: { fr: "Curtains", ar: "كورتنز (ستائرية)", en: "Curtains" },
      description: {
        fr: "Style rétro des années 90 avec frange longue divisée au centre.",
        ar: "تسريحة التسعينات الشهيرة بخصلات أمامية طويلة منسدلة بشكل متناظر.",
        en: "Iconic 90s vintage style with long fringe parted down the center framing the face."
      },
      image: "https://images.unsplash.com/photo-1504257404760-43b6de35494f?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1000,
      duration: 35,
      difficulty: 3,
      category: "Classic"
    },
    {
      id: "hair-undercut",
      name: { fr: "Undercut", ar: "أندر كات", en: "Undercut" },
      description: {
        fr: "Côtés rasés de près contrastant fortement avec la longueur du dessus.",
        ar: "جوانب محلوقة تماماً تخلق تبايناً حاداً مع الشعر الطويل in الأعلى.",
        en: "High shaved sides with a sharp, disconnected contrast to the long hair on top."
      },
      image: "https://images.unsplash.com/photo-1635273051937-201185a16c24?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1100,
      duration: 35,
      difficulty: 4,
      category: "Textured"
    },
    {
      id: "hair-mohawk",
      name: { fr: "Mohawk", ar: "موهوك", en: "Mohawk" },
      description: {
        fr: "Crête centrale profilée se prolongeant jusqu'à la nuque.",
        ar: "عرف شعر طولي بارز من مقدمة الرأس إلى العنق مع حلق الجانبين.",
        en: "Striking strip of longer hair running from the forehead down to the neck."
      },
      image: "https://images.unsplash.com/photo-1583195764036-6bb240ac062e?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1200,
      duration: 40,
      difficulty: 5,
      category: "Creative"
    },
    {
      id: "hair-fauxhawk",
      name: { fr: "Faux Hawk", ar: "فو هوك", en: "Faux Hawk" },
      description: {
        fr: "Alternative moderne et élégante au Mohawk avec dégradé subtil.",
        ar: "تسريحة عصرية تحاكي الموهوك ولكن بتدرج أكثر نعومة وقبولاً.",
        en: "Tamer, stylish alternative to the mohawk with tapered side transitions."
      },
      image: "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1000,
      duration: 35,
      difficulty: 4,
      category: "Creative"
    },
    {
      id: "hair-afrofade",
      name: { fr: "Afro Fade", ar: "أفرو فيد", en: "Afro Fade" },
      description: {
        fr: "Mélange parfait de texture afro naturelle et de dégradé à blanc net.",
        ar: "تدرج دقيق ومميز يندمج بسلاسة مع الشعر الأفريقي الطبيعي الكثيف.",
        en: "Clean-cut skin fade combined with natural, high-volume afro hair."
      },
      image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1100,
      duration: 40,
      difficulty: 4,
      category: "Textured"
    },
    {
      id: "hair-curlyfade",
      name: { fr: "Curly Fade", ar: "كيرلي فيد", en: "Curly Fade" },
      description: {
        fr: "Boucles naturelles sculptées sur le dessus avec dégradé progressif.",
        ar: "خصلات كيرلي طبيعية في الأعلى متناسقة مع تدرج ناعم على الجوانب.",
        en: "Highlighted curls on top with a smooth taper fade on the sides."
      },
      image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1100,
      duration: 35,
      difficulty: 4,
      category: "Textured"
    },
    {
      id: "hair-longhair",
      name: { fr: "Long Hair Grooming", ar: "العناية بالشعر الطويل", en: "Long Hair Grooming" },
      description: {
        fr: "Coupe d'entretien et stylisation de cheveux longs pour homme.",
        ar: "تشذيب وتنسيق الشعر الطويل للرجال للحفاظ على حيويته وجاذبيته.",
        en: "Full flow, groomed long locks styled with natural texture and definition."
      },
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1300,
      duration: 45,
      difficulty: 4,
      category: "Long Hair"
    },
    {
      id: "hair-manbun",
      name: { fr: "Man Bun", ar: "مان بان (كعكة)", en: "Man Bun" },
      description: {
        fr: "Cheveux longs rassemblés en chignon haut avec finitions impeccables.",
        ar: "تجميع احترافي للشعر الطويل في كعكة علوية مرتبة مع جوانب مهندمة.",
        en: "Long hair gathered neatly into a high bun, paired with clean sides."
      },
      image: "https://images.unsplash.com/photo-1511551203524-9a24350a5771?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 1200,
      duration: 35,
      difficulty: 3,
      category: "Long Hair"
    },
    {
      id: "hair-beardtrim",
      name: { fr: "Beard Trim", ar: "تشذيب اللحية", en: "Beard Trim" },
      description: {
        fr: "Tracé de précision au rasoir et taille de la longueur.",
        ar: "تشذيب اللحية وتحديد خطوط الوجنتين والعنق بدقة متناهية.",
        en: "Sculpted, crisp beard line detailing and length adjustment."
      },
      image: "https://images.unsplash.com/photo-1593702295094-aea22597af65?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 600,
      duration: 25,
      difficulty: 3,
      category: "Beard"
    },
    {
      id: "hair-beardfade",
      name: { fr: "Beard Fade", ar: "تدرج اللحية", en: "Beard Fade" },
      description: {
        fr: "Dégradé progressif de la barbe connecté harmonieusement aux pattes.",
        ar: "دمج اللحية بشكل تدريجي رائع يربط السوالف بشعر الوجه بسلاسة.",
        en: "Seamless gradient blend connecting the sideburns down into the beard."
      },
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 800,
      duration: 25,
      difficulty: 3,
      category: "Beard"
    },
    {
      id: "hair-kids",
      name: { fr: "Kids Haircut", ar: "قصة أطفال", en: "Kids Haircut" },
      description: {
        fr: "Coupe adaptée pour les plus jeunes, tendance et confortable.",
        ar: "قصات شعر عصرية ومريحة مخصصة ومحببة لفرساننا الصغار.",
        en: "Playful, comfortable, and stylish haircuts tailored for younger gentlemen."
      },
      image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=600",
      video: "",
      price: 600,
      duration: 25,
      difficulty: 2,
      category: "Kids"
    }
  ],
  gallery: [], // Starts empty
  bookings: [], // Starts from zero
  stats: {
    totalVisits: 0,
    totalBookings: 0,
    totalRevenue: 0,
    visitsHistory: [],
    bookingsHistory: [],
    popularServices: []
  },
  dictionary: {
    hero_title: {
      fr: "L'ART DE LA COIFFURE MASCULINE DE LUXE",
      ar: "فن الحلاقة الرجالية الفاخرة",
      en: "THE ART OF LUXURY MASCULINE GROOMING"
    },
    hero_subtitle: {
      fr: "Vivez une expérience de coiffure inégalée chez Haytem Barbershop. Précision, élégance et raffinement pour l'homme moderne.",
      ar: "عش تجربة حلاقة لا مثيل لها لدى هيثم باربرشوب. دقة، أناقة، ورقي للرجل العصري.",
      "en": "Experience an unparalleled grooming session at Haytem Barbershop. Precision, elegance, and refinement for the modern man."
    },
    book_now: {
      fr: "Réserver maintenant",
      ar: "احجز الآن",
      en: "Book Now"
    },
    explore_styles: {
      fr: "Explorer les coiffures",
      ar: "استكشف القصات",
      en: "Explore Hairstyles"
    },
    popular_services_title: {
      fr: "Prestations d'Exception",
      ar: "خدمات مميزة",
      en: "Exceptional Services"
    },
    popular_services_desc: {
      fr: "Chaque service est exécuté avec une attention méticuleuse portée aux moindres détails.",
      ar: "يتم تنفيذ كل خدمة بعناية فائقة واهتمام دقيق بأصغر التفاصيل.",
      en: "Each service is executed with meticulous attention to the smallest details."
    },
    duration: {
      fr: "Durée",
      ar: "المدة",
      en: "Duration"
    },
    price_on_request: {
      fr: "Tarif sur demande",
      ar: "السعر عند الطلب",
      en: "Price on request"
    },
    about_us_title: {
      fr: "Notre Philosophie",
      ar: "فلسفتنا",
      en: "Our Philosophy"
    },
    why_choose_us_title: {
      fr: "Pourquoi Nous Choisir",
      ar: "لماذا تختارنا",
      en: "Why Choose Us"
    },
    gallery_title: {
      fr: "Galerie de Réalisations",
      ar: "معرض الأعمال",
      en: "Gallery of Creations"
    },
    contact_title: {
      fr: "Prendre Contact",
      ar: "اتصل بنا",
      en: "Get In Touch"
    },
    working_hours_title: {
      fr: "Horaires d'Ouverture",
      ar: "أوقات العمل",
      en: "Opening Hours"
    },
    all_categories: {
      fr: "Toutes les catégories",
      ar: "جميع الفئات",
      en: "All Categories"
    }
  }
};

// Ensure database file is initialized
function loadDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf-8");
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.users) parsed.users = [];
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.bookings) parsed.bookings = [];
    return parsed;
  } catch (err) {
    console.error("Error reading database file, resetting to default:", err);
    return defaultDb;
  }
}

function saveDb(data: any) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// REST API ROUTING
app.get("/api/db", (req, res) => {
  const db = loadDb();
  res.json(db);
});

// Update general business info
app.post("/api/db/info", (req, res) => {
  const db = loadDb();
  db.businessInfo = { ...db.businessInfo, ...req.body };
  saveDb(db);
  res.json({ success: true, businessInfo: db.businessInfo });
});

// Update working hours
app.post("/api/db/hours", (req, res) => {
  const db = loadDb();
  if (Array.isArray(req.body)) {
    db.workingHours = req.body;
    saveDb(db);
    res.json({ success: true, workingHours: db.workingHours });
  } else {
    res.status(400).json({ error: "Invalid payload format. Expected an array." });
  }
});

// Add/update service
app.post("/api/services", (req, res) => {
  const db = loadDb();
  const service = req.body;
  
  if (!service.id) {
    service.id = "srv-" + Date.now();
    db.services.push(service);
  } else {
    const index = db.services.findIndex((s: any) => s.id === service.id);
    if (index !== -1) {
      db.services[index] = { ...db.services[index], ...service };
    } else {
      db.services.push(service);
    }
  }
  saveDb(db);
  res.json({ success: true, service, services: db.services });
});

// Delete service
app.delete("/api/services/:id", (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  db.services = db.services.filter((s: any) => s.id !== id);
  saveDb(db);
  res.json({ success: true, services: db.services });
});

// Add/update hairstyle
app.post("/api/hairstyles", (req, res) => {
  const db = loadDb();
  const hairstyle = req.body;
  
  if (!hairstyle.id) {
    hairstyle.id = "hair-" + Date.now();
    db.hairstyles.push(hairstyle);
  } else {
    const index = db.hairstyles.findIndex((h: any) => h.id === hairstyle.id);
    if (index !== -1) {
      db.hairstyles[index] = { ...db.hairstyles[index], ...hairstyle };
    } else {
      db.hairstyles.push(hairstyle);
    }
  }
  saveDb(db);
  res.json({ success: true, hairstyle, hairstyles: db.hairstyles });
});

// Delete hairstyle
app.delete("/api/hairstyles/:id", (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  db.hairstyles = db.hairstyles.filter((h: any) => h.id !== id);
  saveDb(db);
  res.json({ success: true, hairstyles: db.hairstyles });
});

// Add to gallery
app.post("/api/gallery", (req, res) => {
  const db = loadDb();
  const item = req.body;
  if (!item.id) {
    item.id = "gal-" + Date.now();
  }
  db.gallery.push(item);
  saveDb(db);
  res.json({ success: true, item, gallery: db.gallery });
});

// Delete from gallery
app.delete("/api/gallery/:id", (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  db.gallery = db.gallery.filter((g: any) => g.id !== id);
  saveDb(db);
  res.json({ success: true, gallery: db.gallery });
});

// Update single dictionary record or full dictionary
app.post("/api/dictionary", (req, res) => {
  const db = loadDb();
  db.dictionary = { ...db.dictionary, ...req.body };
  saveDb(db);
  res.json({ success: true, dictionary: db.dictionary });
});

// Password hashing helper
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "haytem_salt_123!").digest("hex");
}

// Convert "HH:MM" to minutes from midnight
function timeToMinutes(tStr: string): number {
  const [h, m] = tStr.split(":").map(Number);
  return h * 60 + m;
}

// Check for booking overlap
function isOverlapping(
  date1: string,
  time1: string,
  duration1: number,
  date2: string,
  time2: string,
  duration2: number
): boolean {
  if (date1 !== date2) return false;
  const start1 = timeToMinutes(time1);
  const end1 = start1 + duration1;
  const start2 = timeToMinutes(time2);
  const end2 = start2 + duration2;
  return start1 < end2 && start2 < end1;
}

// Get bookings
app.get("/api/bookings", (req, res) => {
  const db = loadDb();
  res.json(db.bookings);
});

// Create booking (with Double Booking Protection)
app.post("/api/bookings", (req, res) => {
  const db = loadDb();
  const { customerName, customerPhone, serviceId, date, time } = req.body;

  if (!customerName || !customerPhone || !serviceId || !date || !time) {
    return res.status(400).json({ error: "Tous les champs de réservation obligatoires sont requis." });
  }

  const service = db.services.find((s: any) => s.id === serviceId);
  const newDuration = service ? service.duration : 30;

  // Double Booking Check: find overlap with existing active bookings
  const conflict = db.bookings.find((b: any) => {
    if (b.date !== date || b.status === "cancelled") return false;
    const bService = db.services.find((s: any) => s.id === b.serviceId);
    const bDuration = bService ? bService.duration : 30;
    return isOverlapping(date, time, newDuration, b.date, b.time, bDuration);
  });

  if (conflict) {
    return res.status(400).json({ error: "Ce créneau horaire est déjà réservé ou chevauche un autre rendez-vous." });
  }

  const booking = {
    id: "bk-" + Date.now(),
    customerName,
    customerPhone,
    serviceId,
    date,
    time,
    status: req.body.status || "pending",
    createdAt: new Date().toISOString()
  };

  db.bookings.push(booking);

  // Update stats
  db.stats.totalBookings = db.bookings.length;

  const historyIndex = db.stats.bookingsHistory.findIndex((h: any) => h.date === date);
  if (historyIndex !== -1) {
    db.stats.bookingsHistory[historyIndex].count += 1;
  } else {
    db.stats.bookingsHistory.push({ date, count: 1 });
  }

  if (service) {
    const serviceTitle = service.title.fr || service.title.en || "Service";
    const popIndex = db.stats.popularServices.findIndex((p: any) => p.serviceId === serviceId);
    if (popIndex !== -1) {
      db.stats.popularServices[popIndex].count += 1;
    } else {
      db.stats.popularServices.push({ serviceId, title: serviceTitle, count: 1 });
    }
  }

  // Create real-time user notification if user exists
  const cleanPhone = customerPhone.replace(/[\s+]/g, "");
  const user = db.users.find((u: any) => u.phone.replace(/[\s+]/g, "") === cleanPhone);
  if (user) {
    const srvName = service ? (service.title.fr || service.title.en) : "Prestation";
    const formattedDate = date.split("-").reverse().join("/");
    db.notifications.push({
      id: "notif-" + Date.now(),
      userId: user.id,
      title: "Rendez-vous enregistré",
      message: `Votre réservation pour "${srvName}" le ${formattedDate} à ${time} a été enregistrée avec succès.`,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  saveDb(db);
  res.json({ success: true, booking });
});

// Update booking status
app.post("/api/bookings/:id/status", (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  const { status } = req.body;
  
  const bookingIndex = db.bookings.findIndex((b: any) => b.id === id);
  if (bookingIndex !== -1) {
    const oldStatus = db.bookings[bookingIndex].status;
    db.bookings[bookingIndex].status = status;

    const booking = db.bookings[bookingIndex];

    // If status is changed to completed, calculate real revenue
    if (status === "completed" && oldStatus !== "completed") {
      const service = db.services.find((s: any) => s.id === booking.serviceId);
      if (service && typeof service.price === "number") {
        db.stats.totalRevenue += service.price;
      }
    }
    // If status is reverted from completed, subtract revenue
    if (oldStatus === "completed" && status !== "completed") {
      const service = db.services.find((s: any) => s.id === booking.serviceId);
      if (service && typeof service.price === "number") {
        db.stats.totalRevenue = Math.max(0, db.stats.totalRevenue - service.price);
      }
    }

    // Add user notification
    const cleanPhone = booking.customerPhone.replace(/[\s+]/g, "");
    const user = db.users.find((u: any) => u.phone.replace(/[\s+]/g, "") === cleanPhone);
    if (user) {
      let title = "Mise à jour de votre rendez-vous";
      let message = "";
      const formattedDate = booking.date.split("-").reverse().join("/");
      const srv = db.services.find((s: any) => s.id === booking.serviceId);
      const srvName = srv ? (srv.title.fr || srv.title.en) : "prestation";

      if (status === "confirmed") {
        title = "Rendez-vous Confirmé !";
        message = `Votre rendez-vous pour "${srvName}" le ${formattedDate} à ${booking.time} est validé ! À très vite chez HAYTEM BARBER.`;
      } else if (status === "cancelled") {
        title = "Rendez-vous Annulé";
        message = `Votre rendez-vous pour "${srvName}" le ${formattedDate} à ${booking.time} a été annulé.`;
      } else if (status === "completed") {
        title = "Merci de votre visite !";
        message = `Votre séance pour "${srvName}" est terminée. Laissez-nous votre avis en ligne !`;
      } else {
        message = `Le statut de votre rendez-vous pour "${srvName}" est passé à : ${status}.`;
      }

      db.notifications.push({
        id: "notif-" + Date.now(),
        userId: user.id,
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    saveDb(db);
    res.json({ success: true, booking });
  } else {
    res.status(404).json({ error: "Booking not found" });
  }
});

// Delete booking completely (Admin action)
app.delete("/api/bookings/:id", (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  const index = db.bookings.findIndex((b: any) => b.id === id);
  if (index !== -1) {
    db.bookings.splice(index, 1);
    db.stats.totalBookings = db.bookings.length;
    saveDb(db);
    res.json({ success: true, bookings: db.bookings });
  } else {
    res.status(404).json({ error: "Booking not found" });
  }
});

// Reschedule booking
app.post("/api/bookings/:id/reschedule", (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  const { date, time } = req.body;

  if (!date || !time) {
    return res.status(400).json({ error: "Date et heure requises pour le report." });
  }

  const bookingIndex = db.bookings.findIndex((b: any) => b.id === id);
  if (bookingIndex === -1) {
    return res.status(404).json({ error: "Rendez-vous introuvable." });
  }

  const booking = db.bookings[bookingIndex];
  const service = db.services.find((s: any) => s.id === booking.serviceId);
  const newDuration = service ? service.duration : 30;

  // Check overlap with other bookings (excluding itself!)
  const conflict = db.bookings.find((b: any) => {
    if (b.id === id || b.date !== date || b.status === "cancelled") return false;
    const bService = db.services.find((s: any) => s.id === b.serviceId);
    const bDuration = bService ? bService.duration : 30;
    return isOverlapping(date, time, newDuration, b.date, b.time, bDuration);
  });

  if (conflict) {
    return res.status(400).json({ error: "Ce créneau horaire est déjà réservé ou chevauche un autre rendez-vous." });
  }

  booking.date = date;
  booking.time = time;
  // If it was cancelled or completed, revert to pending/confirmed when rescheduled
  if (booking.status === "cancelled") {
    booking.status = "pending";
  }

  // Create user notification if user exists
  const cleanPhone = booking.customerPhone.replace(/[\s+]/g, "");
  const user = db.users.find((u: any) => u.phone.replace(/[\s+]/g, "") === cleanPhone);
  if (user) {
    const srvName = service ? (service.title.fr || service.title.en) : "prestation";
    const formattedDate = date.split("-").reverse().join("/");
    db.notifications.push({
      id: "notif-" + Date.now(),
      userId: user.id,
      title: "Rendez-vous reporté",
      message: `Votre rendez-vous pour "${srvName}" a été reporté au ${formattedDate} à ${time}.`,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  saveDb(db);
  res.json({ success: true, booking });
});

// AUTHENTICATION & CUSTOMER ACCOUNT MANAGEMENT
app.post("/api/auth/register", (req, res) => {
  const db = loadDb();
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: "Le nom, le téléphone et le mot de passe sont obligatoires." });
  }

  const cleanPhone = phone.replace(/[\s+]/g, "");
  const exists = db.users.find((u: any) => u.phone.replace(/[\s+]/g, "") === cleanPhone);
  if (exists) {
    return res.status(400).json({ error: "Un compte avec ce numéro de téléphone existe déjà." });
  }

  const newUser = {
    id: "usr-" + Date.now(),
    name,
    phone,
    email: email || "",
    passwordHash: hashPassword(password),
    favorites: [],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // Send a welcome notification
  db.notifications.push({
    id: "notif-" + Date.now(),
    userId: newUser.id,
    title: "Bienvenue !",
    message: `Bienvenue chez HAYTEM BARBER, ${name} ! Votre compte est créé avec succès. Vous pouvez désormais consulter votre historique et enregistrer vos coiffures favorites.`,
    createdAt: new Date().toISOString(),
    read: false
  });

  saveDb(db);

  // Return user without password hash
  const { passwordHash, ...userResponse } = newUser;
  res.json({ success: true, user: userResponse });
});

app.post("/api/auth/login", (req, res) => {
  const db = loadDb();
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: "Veuillez fournir un téléphone et un mot de passe." });
  }

  const cleanPhone = phone.replace(/[\s+]/g, "");
  const user = db.users.find((u: any) => u.phone.replace(/[\s+]/g, "") === cleanPhone);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(400).json({ error: "Numéro de téléphone ou mot de passe incorrect." });
  }

  const { passwordHash, ...userResponse } = user;
  res.json({ success: true, user: userResponse });
});

app.post("/api/users/profile", (req, res) => {
  const db = loadDb();
  const { userId, name, phone, email } = req.body;

  const idx = db.users.findIndex((u: any) => u.id === userId);
  if (idx === -1) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  db.users[idx].name = name || db.users[idx].name;
  db.users[idx].phone = phone || db.users[idx].phone;
  db.users[idx].email = email || db.users[idx].email;

  saveDb(db);
  const { passwordHash, ...userResponse } = db.users[idx];
  res.json({ success: true, user: userResponse });
});

app.post("/api/users/favorites", (req, res) => {
  const db = loadDb();
  const { userId, hairstyleId } = req.body;

  const idx = db.users.findIndex((u: any) => u.id === userId);
  if (idx === -1) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  const favorites = db.users[idx].favorites || [];
  const favIdx = favorites.indexOf(hairstyleId);
  if (favIdx !== -1) {
    favorites.splice(favIdx, 1); // Remove
  } else {
    favorites.push(hairstyleId); // Add
  }
  db.users[idx].favorites = favorites;

  saveDb(db);
  res.json({ success: true, favorites });
});

app.get("/api/users/:userId/bookings", (req, res) => {
  const db = loadDb();
  const { userId } = req.params;

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  const cleanPhone = user.phone.replace(/[\s+]/g, "");
  const userBookings = db.bookings.filter((b: any) => b.customerPhone.replace(/[\s+]/g, "") === cleanPhone);

  res.json(userBookings);
});

app.get("/api/users/:userId/notifications", (req, res) => {
  const db = loadDb();
  const { userId } = req.params;

  const userNotifs = db.notifications.filter((n: any) => n.userId === userId);
  res.json(userNotifs);
});

app.post("/api/users/:userId/notifications/:notifId/read", (req, res) => {
  const db = loadDb();
  const { notifId } = req.params;

  const idx = db.notifications.findIndex((n: any) => n.id === notifId);
  if (idx !== -1) {
    db.notifications[idx].read = true;
    saveDb(db);
  }
  res.json({ success: true });
});

// Get Stats
app.get("/api/stats", (req, res) => {
  const db = loadDb();
  res.json(db.stats);
});

// Log visitor visit (Increments stats.totalVisits based on real visitor loadings)
app.post("/api/stats/visit", (req, res) => {
  const db = loadDb();
  db.stats.totalVisits = (db.stats.totalVisits || 0) + 1;

  const todayStr = new Date().toISOString().split("T")[0];
  const historyIndex = db.stats.visitsHistory.findIndex((h: any) => h.date === todayStr);
  if (historyIndex !== -1) {
    db.stats.visitsHistory[historyIndex].count += 1;
  } else {
    db.stats.visitsHistory.push({ date: todayStr, count: 1 });
  }

  saveDb(db);
  res.json({ success: true, totalVisits: db.stats.totalVisits });
});

// GEMINI AI INTEGRATION ROUTINGS

// Graceful, luxurious fallback functions if Gemini API key exceeds its quota or is inactive
function getAIFallbackResponse(message: string, lang: string, db: any, originUrl: string = ""): string {
  const msg = message.toLowerCase();
  const siteUrl = originUrl || "notre site web";
  
  // Website / Domain / Online Presence
  if (
    msg.includes("رابط") ||
    msg.includes("دومين") ||
    msg.includes("ويب") ||
    msg.includes("انترنت") ||
    msg.includes("إنترنت") ||
    msg.includes("اسم الموقع") ||
    msg.includes("رابط الموقع") ||
    msg.includes("موقعكم") ||
    msg.includes("link") ||
    msg.includes("website") ||
    msg.includes("domain") ||
    msg.includes("url") ||
    msg.includes("online")
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

  // How Booking/Reservation works (كيف يتم استقبال حجز الحلاقة)
  if (
    msg.includes("استقبال") || 
    msg.includes("كيف يتم") || 
    msg.includes("طريقة الحجز") || 
    msg.includes("كيف أحجز") || 
    msg.includes("خطوات") || 
    msg.includes("booking method") || 
    msg.includes("comment réserver") || 
    msg.includes("processus") || 
    msg.includes("how booking")
  ) {
    if (lang === "ar") {
      return `مرحباً بك! في صالون **HAYTEM BARBER**، قمنا بابتكار نظام حجز متكامل ورقمي بالكامل لتوفير تجربة مريحة وخالية من الانتظار. وإليك بالتفصيل كيف يتم استقبال ومعالجة حجزك:

1️⃣ **خطوة الحجز الإلكتروني**: يقوم الزبون باختيار الخدمة المطلوبة وقصة الشعر الشهيرة التي يفضلها من الكتالوج، ثم يحدد التاريخ والوقت المتاحين بدقة تامة في أقل من 60 ثانية.
2️⃣ **التسجيل الفوري في قاعدة البيانات**: بمجرد ضغطك على تأكيد الحجز، يتم حفظ الموعد فوراً وبشكل آمن في قاعدة بيانات الصالون المشفرة.
3️⃣ **الظهور الآني على لوحة تحكم الإدارة (Admin Panel)**: يتلقى الحلاق إشعاراً فورياً على لوحة التحكم الإدارية الخاصة به، حيث يظهر حجزك بالاسم، ورقم الهاتف، والخدمة، والقصة المحددة مع الوقت المختار ليتسنى له تنظيم عمله وتجهيز الأدوات اللازمة.
4️⃣ **المتابعة عبر فضاء الزبون الخاص**: يتمكن الزبون من متابعة حالة الحجز (قيد الانتظار، مؤكد، مكتمل) عبر حسابه الشخصي على الموقع الإلكتروني في أي وقت.
5️⃣ **الاستقبال الملكي في الصالون**: عند وصولك في الوقت المحدد تماماً، يتم استقبالك مباشرة وتوجيهك لكرسي الحلاقة المهيأ لك خصيصاً دون الحاجة للانتظار في الطوابير المزعجة.

نحن نضمن لك خدمة احترافية تليق بك! احجز موعدك الآن بالضغط على زر "RÉSERVER" في الأعلى.`;
    } else if (lang === "en") {
      return `Welcome! At **HAYTEM BARBER**, we have designed a state-of-the-art digital booking system to ensure a luxury, wait-free experience. Here is how your reservation is processed and received:

1️⃣ **Instant Online Booking**: You select your desired service and preferred hairstyle from our catalogue, then pick a convenient date and time in under 60 seconds.
2️⃣ **Database Sync**: Your booking is instantly recorded and secured in our database.
3️⃣ **Admin Panel Notification**: The barber receives an immediate live update on the Admin Dashboard showing your name, phone number, chosen haircut, and exact slot. This allows the team to prepare your station and tools in advance.
4️⃣ **Personal Dashboard**: You can monitor your booking status and manage your past or upcoming sessions anytime in 'My Account' space.
5️⃣ **VIP Reception**: When you arrive at your exact scheduled hour, you are immediately seated. No waiting lines, no delays—just pure, custom grooming.

Secure your VIP seat today by clicking the "RÉSERVER" button at the top!`;
    } else {
      return `Bienvenue ! Chez **HAYTEM BARBER**, nous avons développé un système de réservation numérique de pointe pour vous garantir un service d'exception sans aucune attente. Voici comment votre rendez-vous est reçu et géré :

1️⃣ **Réservation en ligne rapide** : Vous choisissez la prestation et votre style de coupe favori depuis notre catalogue, puis sélectionnez le créneau disponible de votre choix en moins d'une minute.
2️⃣ **Synchronisation en base de données** : Votre réservation est instantanément enregistrée de manière sécurisée.
3️⃣ **Réception sur la console d'administration (Admin Panel)** : Le coiffeur reçoit une notification en temps réel sur son tableau de bord d'administration avec vos coordonnées, la coupe choisie et l'heure exacte. Cela lui permet de préparer les outils et le poste de coiffure spécifiquement pour vous.
4️⃣ **Suivi sur votre Espace Client** : Vous pouvez consulter, suivre ou gérer vos rendez-vous passés et futurs à tout moment sur votre espace personnel.
5️⃣ **Accueil de prestige au salon** : À l'heure exacte de votre rendez-vous, vous êtes immédiatement installé sur votre fauteuil de coiffure. Pas de file d'attente, pas de perte de temps.

Réservez votre moment d'exception dès maintenant en cliquant sur le bouton "RÉSERVER" en haut de la page !`;
    }
  }

  // Famous Hairstyles Catalogue / Trends (قصات الشعر المشهورة وأسعارها بالجزائر)
  if (
    msg.includes("قصة") || 
    msg.includes("قصات") || 
    msg.includes("تسريحة") || 
    msg.includes("تسريحات") || 
    msg.includes("كتالوج") || 
    msg.includes("coiffure") || 
    msg.includes("haircut") || 
    msg.includes("style") || 
    msg.includes("catalogue") || 
    msg.includes("trend") || 
    msg.includes("buzz") || 
    msg.includes("crop") || 
    msg.includes("fade") || 
    msg.includes("skin") || 
    msg.includes("pompadour")
  ) {
    if (lang === "ar") {
      return `يقدم صالون **HAYTEM BARBER** كتالوجاً لأشهر قصات الشعر العالمية المنجزة بأقصى درجات الاحترافية والدقة، وإليك أسعارها الرسمية والمدروسة في الجزائر لعام 2026:

✂️ **Buzz Cut (بز كات / قصة عسكرية)**: قصة فائقة القصر، متناسقة ومميزة، مريحة للغاية وسهلة العناية بها. 
💰 **السعر**: 600 دج | ⏱️ **المدة**: 20 دقيقة.

✂️ **French Crop (فرنش كروب)**: تدرج عصري نظيف على الجانبين مع غرة أمامية قصيرة ومحسنة في الأعلى لتمنح مظهراً ممتلئاً.
💰 **السعر**: 800 دج | ⏱️ **المدة**: 30 دقيقة.

✂️ **Mid Fade (ميد فيد / تدرج متوسط)**: قصة شعر متوازنة ورائعة للغاية، حيث يبدأ تدرج الشعر من منتصف الرأس ليناسب كافة المناسبات.
💰 **السعر**: 800 دج | ⏱️ **المدة**: 30 دقيقة.

✂️ **Classic Pompadour (بومبادور كلاسيكي)**: شعر طويل نسبياً في الأعلى ومصفف للخلف بأناقة لإعطاء حجم وكثافة كلاسيكية جذابة مع جوانب مدرجة بدقة.
💰 **السعر**: 1000 دج | ⏱️ **المدة**: 40 دقيقة.

✂️ **Low Fade & Slick Back (لو فيد مسرح للخلف)**: تدرج منخفض وتدريجي خفيف مع تصفيف كامل خصلات الشعر للخلف بلمسة راقية ومظهر لامع.
💰 **السعر**: 1000 دج | ⏱️ **المدة**: 35 دقيقة.

✂️ **Skin Fade (سكين فيد / تدرج على الجلد)**: التدرج الأكثر طلباً في الجزائر، يبدأ من الصفر تماماً (على الجلد) ليتداخل بسلاسة ونعومة مذهلة مع الشعر في الأعلى.
💰 **السعر**: 1200 دج | ⏱️ **المدة**: 35 دقيقة.

يمكنك تحديد أي من هذه القصات الرائعة مباشرة أثناء ملء استمارة حجز موعدك وسنقوم بنحتها لك بدقة متناهية!`;
    } else if (lang === "en") {
      return `At **HAYTEM BARBER**, we curate the world's most famous and trending hairstyles with precise executions. Here is our official catalog and pricing in Algeria (DZD):

✂️ **Buzz Cut**: Clean, uniform, ultra-short masculine aesthetic, very easy to maintain.
💰 **Price**: 600 DZD | ⏱️ **Duration**: 20 mins.

✂️ **French Crop**: Modern short fade on the sides with textured short fringe on top.
💰 **Price**: 800 DZD | ⏱️ **Duration**: 30 mins.

✂️ **Mid Fade**: A perfectly balanced modern fade starting at the midpoint of your temples.
💰 **Price**: 800 DZD | ⏱️ **Duration**: 30 mins.

✂️ **Classic Pompadour**: Elegant volume swept backward with clean sculpted sides.
💰 **Price**: 1000 DZD | ⏱️ **Duration**: 40 mins.

✂️ **Low Fade & Slick Back**: Soft, low graduation with slicked-back executive hair styling.
💰 **Price**: 1000 DZD | ⏱️ **Duration**: 35 mins.

✂️ **Skin Fade (High/Drop)**: High-definition fade blending seamlessly down to the skin. Extremely popular in Algeria.
💰 **Price**: 1200 DZD | ⏱️ **Duration**: 35 mins.

Select any of these premium looks during your reservation to get it tailored to your face shape!`;
    } else {
      return `Chez **HAYTEM BARBER**, nous réalisons les coupes de cheveux masculines les plus célèbres et tendances au monde avec une précision chirurgicale. Voici notre catalogue officiel et nos tarifs en Algérie (DZD) :

✂️ **Buzz Cut** : Une coupe militaire ultra-courte, moderne, uniforme et très facile à entretenir.
💰 **Tarif** : 600 DZD | ⏱️ **Durée** : 20 min.

✂️ **French Crop** : Dégradé court sur les côtés avec une frange courte texturée sur le dessus.
💰 **Tarif** : 800 DZD | ⏱️ **Durée** : 30 min.

✂️ **Mid Fade** : Dégradé moyen équilibré qui commence à mi-hauteur des tempes, très élégant.
💰 **Tarif** : 800 DZD | ⏱️ **Durée** : 30 min.

✂️ **Classic Pompadour** : Volume prestigieux rabattu vers l'arrière avec des côtés sculptés à la perfection.
💰 **Tarif** : 1000 DZD | ⏱️ **Durée** : 40 min.

✂️ **Low Fade & Slick Back** : Dégradé bas progressif avec cheveux gominés et coiffés vers l'arrière.
💰 **Tarif** : 1000 DZD | ⏱️ **Durée** : 35 min.

✂️ **Skin Fade (Dégradé à blanc)** : Le dégradé le plus demandé en Algérie, se fondant directement sur la peau de manière ultra-propre.
💰 **Tarif** : 1200 DZD | ⏱️ **Durée** : 35 min.

Vous pouvez choisir et associer l'un de ces styles directement lors de votre réservation de créneau !`;
    }
  }

  // Face Shape Advice (تقديم نصائح حسب شكل الوجه)
  if (
    msg.includes("وجه") || 
    msg.includes("دائري") || 
    msg.includes("مستدير") || 
    msg.includes("مربع") || 
    msg.includes("بيضاوي") || 
    msg.includes("طويل") || 
    msg.includes("visage") || 
    msg.includes("face") || 
    msg.includes("round") || 
    msg.includes("oval") || 
    msg.includes("square")
  ) {
    if (lang === "ar") {
      return `إن تحديد قصة الشعر المناسبة يعتمد بشكل أساسي على شكل وجهك للحصول على توازن بصري جذاب. وإليك نصائح خبراء صالون **HAYTEM BARBER**:

• 🟢 **الوجه المستدير (Round Face)**: هدفنا هو إضافة ارتفاع بصري لتنحيف الوجه. ننصحك بقصة **Classic Pompadour** أو تدرج عالٍ (**High Skin Fade**) مع الحفاظ على كثافة جيدة للشعر في الأعلى لتمنح وجهك طولاً متناسقاً.
• 🟦 **الوجه المربع (Square Face)**: يتميز بزوايا فك عريضة وبارزة. لتخفيف حدة الزوايا، ننصح بقصة **French Crop** أو تدرج منخفض تدريجي (**Low Fade**) ليعطي لمسة ناعمة وأنيقة.
• 🥚 **الوجه البيضاوي (Oval Face)**: يعتبر الوجه الأكثر توازناً ومحظوظاً للغاية! تناسبك جميع القصات تقريباً بلا استثناء، سواء كانت قصيرة جداً كـ **Buzz Cut** أو متدرجة كـ **Skin Fade** أو مسرحة كـ **Slick Back**.
• ⏳ **الوجه المستطيل أو الطويل (Long Face)**: يفضل الحفاظ على طول معتدل على الجانبين لتفادي زيادة طول الوجه بصرياً، وتجنب الارتفاع المفرط في الأعلى. القصة المثالية هي التدرج المتوسط (**Mid Fade**).

يمكننا مناقشة شكل وجهك بالتفصيل واقتراح القصة المثالية لك بمجرد تشريفك لنا في صالون **HAYTEM BARBER**!`;
    } else if (lang === "en") {
      return `Choosing the right haircut is all about geometry and facial harmony. Here is how we match hairstyles to different face shapes at **HAYTEM BARBER**:

• 🟢 **Round Face**: The goal is to add length and structure. We recommend a **Classic Pompadour** or a high graduation (**High Skin Fade**) to add vertical height and slim down the sides.
• 🟦 **Square Face**: Strong, wide jawlines look spectacular. To soften or enhance this structure, we recommend a textured **French Crop** or a smooth **Low Fade** that provides a modern, balanced appearance.
• 🥚 **Oval Face**: The most versatile face shape of all. You can pull off almost any style, from an ultra-short **Buzz Cut** to a stylized **Skin Fade** or a sleek **Slick Back**.
• ⏳ **Long Face**: Avoid excessive height on top and extremely shaved sides. Opt for a balanced **Mid Fade** to keep the proportions visually harmonized.

Our master barber Haytem will evaluate your bone structure on-site to execute the absolute perfect cut for you!`;
    } else {
      return `Le choix de votre coupe dépend essentiellement de la structure de votre visage pour créer une harmonie parfaite. Voici les conseils de **HAYTEM BARBER** :

• 🟢 **Visage Rond** : L'objectif est d'ajouter de la hauteur et de structurer le visage. Nous vous recommandons une coupe **Classic Pompadour** ou un dégradé haut (**High Skin Fade**) pour allonger visuellement les traits.
• 🟦 **Visage Carré** : Caractérisé par une mâchoire forte et masculine. Pour adoucir les angles, un **French Crop** texturé ou un **Low Fade** progressif sera parfait pour un look équilibré et moderne.
• 🥚 **Visage Ovale** : Le visage idéal ! Vous avez la liberté absolue de tout essayer : du très court **Buzz Cut**, en passant par un **Skin Fade** percutant, jusqu'à un **Slick Back** très classe.
• ⏳ **Visage Long** : Évitez le volume excessif sur le dessus et les côtés trop rasés à blanc. Nous vous conseillons un **Mid Fade** équilibré pour harmoniser les proportions faciales.

Lors de votre rendez-vous, notre maître barbier analysera la morphologie de votre visage pour sculpter la coupe parfaite !`;
    }
  }

  // Beard Care (نصائح العناية باللحية)
  if (
    msg.includes("لحية") || 
    msg.includes("دقن") || 
    msg.includes("ذقن") || 
    msg.includes("barbe") || 
    msg.includes("beard")
  ) {
    if (lang === "ar") {
      return `اللحية المحددة والمهيأة جيداً هي عنوان جاذبية الرجل العصري. وإليك روتين العناية الذهبي للحصول على لحية مثالية من خبراء صالون **HAYTEM BARBER**:

1️⃣ **الترطيب والتغذية اليومية**: استخدم قطرات من زيت اللحية الطبيعي (Beard Oil) يومياً لتغذية بصيلات الشعر وترطيب البشرة تحت اللحية ومنع الحكة والقشرة.
2️⃣ **التمشيط المنتظم**: استخدم فرشاة مخصصة من شعر الخنزير البري (Boar Bristle Brush) لتوجيه نمو الشعر وتوزيع الزيوت الطبيعية بالتساوي.
3️⃣ **الغسيل اللطيف**: لا تستخدم صابون الجسم العادي على لحيتك؛ بل اغسلها بشامبو مخصص للحية 2 إلى 3 مرات أسبوعياً للحفاظ على الزيوت الطبيعية المغذية للبشرة.
4️⃣ **التحديد الاحترافي**: قم بزيارتنا بانتظام للحصول على تحديد دقيق بالرازور المستقيم التقليدي مع طقوس المنشفة الساخنة التي تفتح المسام وترطب الشعر بعمق.

يسعدنا حلاقة وتحديد لحيتك بأعلى مستويات الاحترافية! احجز موعدك الآن عبر زر "RÉSERVER" في الأعلى.`;
    } else if (lang === "en") {
      return `A well-groomed, sharp beard is the ultimate mark of modern masculinity. Here is the golden beard care routine from **HAYTEM BARBER**:

1️⃣ **Daily Hydration**: Apply 3-4 drops of natural beard oil daily to nourish the hair follicles, hydrate the skin underneath, and prevent itchiness or dry skin.
2️⃣ **Brushing**: Use a high-quality boar bristle brush daily to tame stray hairs, train growth direction, and distribute oils evenly.
3️⃣ **Gentle Cleansing**: Never use regular hair shampoo or body wash on your face. Cleanse your beard with a dedicated beard shampoo 2-3 times a week to keep it soft.
4️⃣ **Precision Styling**: Visit our salon regularly for hot towel razor trims that open up pores, relax facial muscles, and define perfect contours.

Let us carve the ultimate beard shape for you! Book your session via the "RÉSERVER" button at the top.`;
    } else {
      return `Une barbe sculptée et soignée est la signature d'un homme élégant. Voici le rituel de soin de barbe recommandé par **HAYTEM BARBER** :

1️⃣ **Hydratation quotidienne** : Appliquez quelques gouttes d'huile à barbe naturelle chaque jour pour nourrir le poil, hydrater la peau sous-jacente et éviter les démangeaisons ou pellicules.
2️⃣ **Le brossage** : Utilisez une brosse en poils de sanglier pour discipliner les poils, stimuler la circulation sanguine et répartir l'huile uniformément.
3️⃣ **Le lavage adapté** : N'utilisez jamais de shampooing classique ou de gel douche. Lavez votre barbe 2 à 3 fois par semaine avec un shampooing doux spécifique pour préserver son hydratation naturelle.
4️⃣ **L'entretien professionnel** : Venez régulièrement au salon pour une taille au rasoir droit traditionnel accompagnée d'une serviette chaude pour dilater les pores et détendre le poil.

Confiez-nous le sculptage de vos contours ! Réservez votre créneau via le bouton "RÉSERVER" en haut de la page.`;
    }
  }

  // Hours inquiry
  if (msg.includes("horaire") || msg.includes("temps") || msg.includes("heure") || msg.includes("ساعة") || msg.includes("أوقات") || msg.includes("وقت") || msg.includes("hour") || msg.includes("time") || msg.includes("open") || msg.includes("close") || msg.includes("مفتوح") || msg.includes("يوم")) {
    const hours = db.workingHours.map((h: any) => `- ${h.day}: ${h.isClosed ? "Fermé / Closed" : `${h.open} - ${h.close}`}`).join("\n");
    if (lang === "ar") {
      return `أهلاً بك في صالون HAYTEM BARBER! إليك أوقات العمل الرسمية والمفتوحة للصالون حالياً:\n\n${hours}\n\nيسعدنا دائماً استقبالك وحجز موعدك عبر زر 'RÉSERVER' في الأعلى بالوقت الذي يناسبك!`;
    } else if (lang === "en") {
      return `Hello! Here are the official open working hours of HAYTEM BARBER:\n\n${hours}\n\nWe look forward to welcoming you. Book your slot anytime using the 'RÉSERVER' button at the top!`;
    } else {
      return `Bonjour ! Voici les horaires d'ouverture officiels de HAYTEM BARBER :\n\n${hours}\n\nNous serons ravis de vous accueillir. Réservez votre créneau en un clic avec le bouton 'RÉSERVER' en haut !`;
    }
  }

  // Price/services inquiry
  if (msg.includes("prix") || msg.includes("tarif") || msg.includes("سعر") || msg.includes("أسعار") || msg.includes("كم") || msg.includes("cost") || msg.includes("price") || msg.includes("service") || msg.includes("خدمة") || msg.includes("خدمات") || msg.includes("تكل")) {
    const services = db.services.map((s: any) => `- ${s.title[lang] || s.title.fr}: ${s.price ? s.price + " DZD" : "Tarif sur demande"} (${s.duration} min)`).join("\n");
    if (lang === "ar") {
      return `أهلاً بك! إليك قائمة الخدمات والأسعار المتاحة لدينا في صالون هيثم باربر:\n\n${services}\n\nيمكنك اختيار الخدمة المناسبة لك وحجزها مباشرة عبر الموقع!`;
    } else if (lang === "en") {
      return `Hello! Here is the list of our premium services and prices:\n\n${services}\n\nFeel free to choose and book your preferred service directly from our online reservation system!`;
    } else {
      return `Bonjour ! Voici la liste de nos prestations et tarifs d'exception :\n\n${services}\n\nVous pouvez sélectionner et réserver la prestation de votre choix directement depuis notre plateforme de réservation !`;
    }
  }

  // Location/contact inquiry
  if (msg.includes("adresse") || msg.includes("localisation") || msg.includes("مكان") || msg.includes("موقع") || msg.includes("وين") || msg.includes("عنوان") || msg.includes("address") || msg.includes("location") || msg.includes("maps") || msg.includes("téléphone") || msg.includes("رقم") || msg.includes("اتصال") || msg.includes("تواصل") || msg.includes("هاتف")) {
    const phone = db.businessInfo.phone || "+213 675 16 11 87";
    const gmaps = db.businessInfo.googleMaps || "https://maps.app.goo.gl/E11tAiMQUmmpSEc56";
    if (lang === "ar") {
      return `يقع صالون HAYTEM BARBER في موقع مميز بالجزائر العاصمة. \n\n📞 هاتف الحجز المباشر: ${phone}\n📍 موقعنا على خرائط جوجل: ${gmaps}\n\nيمكنك زيارتنا في أي وقت أو الحجز مباشرة عبر الموقع لضمان مكانك دون انتظار!`;
    } else if (lang === "en") {
      return `HAYTEM BARBER is located in a premier location in Algiers, Algeria.\n\n📞 Direct phone: ${phone}\n📍 Google Maps: ${gmaps}\n\nWe recommend booking your appointment online to enjoy a seamless experience without waiting!`;
    } else {
      return `Le salon HAYTEM BARBER est situé à Alger, Algérie, dans un cadre prestigieux.\n\n📞 Téléphone direct : ${phone}\n📍 Localisation Google Maps : ${gmaps}\n\nNous vous conseillons vivement de réserver votre créneau en ligne pour profiter d'un accueil personnalisé sans attente !`;
    }
  }

  // General fallback greeting
  if (lang === "ar") {
    return `مرحباً بك في صالون HAYTEM BARBERSHOP الفاخر!

أنا مستشارك الشخصي الذكي لخدمتكم وإجابة كافة استفساراتكم. الصالون مفتوح طوال أيام الأسبوع من الساعة 09:00 صباحاً إلى 21:00 مساءً تحت إشراف الحلاق المتميز هيثم محزم.

يمكنك حجز موعدك فوراً في أقل من دقيقة بالضغط على زر "RÉSERVER" في الأعلى لتفادي الانتظار والتمتع بتجربة حلاقة دقيقة ومترفة، أو التواصل المباشر معنا على الهاتف: +213 675 16 11 87. اسألني عن القصات، العناية باللحية، أو أسعار الخدمات!`;
  } else if (lang === "en") {
    return `Welcome to the luxury HAYTEM BARBERSHOP!

I am your personal smart assistant, dedicated to providing premium styling advice. The salon is open daily from 09:00 AM to 09:00 PM, led by our master barber Haytem Mehazzem.

You can book your appointment online in under a minute by clicking the "RÉSERVER" button at the top to secure a zero-wait premium slot, or call us directly at +213 675 16 11 87. Ask me about hairstyles, face shape tips, or beard care!`;
  } else {
    return `Bienvenue chez HAYTEM BARBERSHOP !

Je suis votre conseiller virtuel intelligent, à votre entière disposition pour vous guider. Le salon est ouvert tous les jours de 09h00 à 21h00 sous la direction du maître coiffeur Haytem Mehazzem.

Vous pouvez réserver votre créneau en moins d'une minute en cliquant sur le bouton "RÉSERVER" en haut pour profiter d'une séance sur mesure sans file d'attente, ou nous contacter directement au +213 675 16 11 87. Posez-moi vos questions sur nos coupes, conseils de forme de visage, ou soins de barbe !`;
  }
}

function getImageFallback(prompt: string): string {
  const p = prompt.toLowerCase();
  const options = [
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1605497746444-ac9dbd39f400?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1512864084360-7c0c4d0a0845?auto=format&fit=crop&q=80&w=600"
  ];
  
  if (p.includes("beard") || p.includes("barbe") || p.includes("ذقن") || p.includes("لحية")) {
    return "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600";
  }
  if (p.includes("buzz") || p.includes("short") || p.includes("قصيرة")) {
    return "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600";
  }
  if (p.includes("fade") || p.includes("dégradé") || p.includes("تدرج")) {
    return "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600";
  }
  
  return options[Math.floor(Math.random() * options.length)];
}

// AI Assistant / Barber Consultant Chat
app.post("/api/gemini/chat", async (req, res) => {
  const db = loadDb();
  const { message, history = [], lang = "fr" } = req.body;

  const host = req.get('host') || "";
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const currentPublicUrl = `${protocol}://${host}`;

  try {
    const ai = getGeminiClient();

    // Construct a rich context about the barber shop for Gemini
    const servicesText = db.services
      .map((s: any) => `- ${s.title[lang] || s.title.fr}: ${s.price ? s.price + " DZD" : "Tarif sur demande"} (${s.duration} min) - ${s.description[lang] || s.description.fr || "Aucune description"}`)
      .join("\n");

    const hairstylesText = db.hairstyles
      .map((h: any) => `- ${h.name[lang] || h.name.fr}: ${h.price ? h.price + " DZD" : "Tarif sur demande"} (${h.description[lang] || h.description.fr || "Aucun détail"}) - Difficulté technique de coupe: ${h.difficulty}/5`)
      .join("\n");

    const hoursText = db.workingHours
      .map((h: any) => `- ${h.day}: ${h.isClosed ? "Fermé / Closed" : `${h.open} - ${h.close}`}`)
      .join("\n");

    const systemInstruction = `
      Tu es l'Assistant Virtuel Intelligent Premium de "HAYTEM BARBER" (le salon de coiffure de luxe fondé par Haytem Mehazzem, situé en Algérie, accessible à l'adresse officielle ${currentPublicUrl}).
      Ton objectif exclusif est d'aider les utilisateurs à rechercher et s'informer uniquement sur le contenu du site (tarifs, horaires, prestations de coiffure, réservations, conseils capillaires, entretien de la barbe et tendances 2026).
      Langue courante de réponse: ${lang === "fr" ? "Français" : lang === "ar" ? "Arabe (العربية)" : "Anglais (English)"}.
      
      Voici les informations réelles du salon à utiliser impérativement :
      - Nom du salon : HAYTEM BARBER
      - Téléphone : +213 675 16 11 87
      - Adresse officielle du site web : ${currentPublicUrl}
      - Adresse / Google Maps : ${db.businessInfo.googleMaps || "https://maps.app.goo.gl/E11tAiMQUmmpSEc56"}
      - Réseaux Sociaux : Instagram (${db.businessInfo.instagram}), TikTok (${db.businessInfo.tiktok}), Facebook (${db.businessInfo.facebook})
      - Biographie / Histoire : ${db.businessInfo.biography[lang] || db.businessInfo.biography.fr || "Salon de coiffure de luxe et moderne."}
      
      Horaires d'ouverture réels du salon :
      ${hoursText}
      
      Nos prestations :
      ${servicesText}
      
      Notre catalogue de coiffures tendance :
      ${hairstylesText}
      
      Directives strictes de communication :
      1. RECHERCHE INTERNE UNIQUEMENT : Tu es un assistant de recherche dédié à ce site. Si l'utilisateur pose une question totalement hors de propos (programmation informatique, politique, cuisine, devoirs scolaires, météo générale, etc.), réponds poliment que tu es l'assistant de recherche exclusif de "HAYTEM BARBER" et que tu ne peux l'aider que sur les sujets liés au salon, aux coupes, au site ou aux réservations.
      2. Adopte un ton extrêmement professionnel, chaleureux, haut de gamme et élégant (ton de marque de prestige).
      3. Ne donne JAMAIS de faux tarifs ou de fausses informations.
      4. Si le client veut réserver, guide-le pour cliquer sur le bouton de réservation en haut du site.
    `;

    // Map history to match expectations
    const chatHistory = history.map((h: any) => ({
      role: h.role,
      parts: [{ text: h.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }], // Ground in web search for accurate hairstyle trends & grooming info!
      }
    });

    // Extract citations/sources from grounding metadata if present
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      url: chunk.web?.uri || ""
    })).filter((s: any) => s.url) || [];

    res.json({
      text: response.text,
      sources
    });
  } catch (error: any) {
    console.warn("AI Chat quota exceeded or API error, using luxury fallback:", error.message);
    const fallbackText = getAIFallbackResponse(message, lang, db, currentPublicUrl);
    res.json({
      text: fallbackText,
      sources: []
    });
  }
});

// AI Hairstyle Image Generator (gemini-3-pro-image or gemini-3.1-flash-image)
app.post("/api/gemini/generate-image", async (req, res) => {
  const { prompt, size = "1K", aspectRatio = "1:1" } = req.body;
  try {
    const ai = getGeminiClient();

    // Map size labels to appropriate values for gemini-3-pro-image or gemini-3.1-flash-image
    // Prompting model with a premium hairstyle context
    const fullPrompt = `Professional close-up portrait of a high-end luxury haircut, ${prompt}, clean studio lighting, 8k resolution, photorealistic, premium barbershop catalog style, dark dramatic background, black and white aesthetic.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image", // High-Quality Image Generation Tasks
      contents: {
        parts: [
          { text: fullPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any, // "1:1" | "3:4" | "4:3" | "16:9"
          imageSize: size as any // "1K" | "2K" | "4K"
        }
      }
    });

    let base64Image = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      throw new Error("No image was returned by the AI generator.");
    }

    res.json({
      imageUrl: `data:image/png;base64,${base64Image}`
    });
  } catch (error: any) {
    console.warn("AI Image Generation quota exceeded or API error, using luxury stock fallback:", error.message);
    const fallbackUrl = getImageFallback(prompt);
    res.json({
      imageUrl: fallbackUrl
    });
  }
});

// AI Writer / Text Enhancer using gemini-3.1-pro-preview with Thinking level HIGH
app.post("/api/gemini/ai-writer", async (req, res) => {
  const { prompt, context = "", targetLang = "fr" } = req.body;
  try {
    const ai = getGeminiClient();

    const systemInstruction = `
      Tu es un Concepteur-Rédacteur (Copywriter) Senior spécialisé dans le luxe international et l'industrie de la beauté/coiffure masculine haut de gamme.
      Ta mission est de rédiger ou perfectionner le texte soumis afin de le rendre extrêmement raffiné, évocateur, professionnel, et digne d'une marque internationale de luxe.
      Rédige exclusivement dans la langue demandée : ${targetLang === "fr" ? "Français" : targetLang === "ar" ? "Arabe (العربية)" : "Anglais (English)"}.
      Assure-toi de respecter le style minimaliste, élégant et captivant du salon HAYTEM BARBER.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Complex Text Tasks, supports thinking level
      contents: `Rédige ou sublime le texte suivant :\n${prompt}\n\nContexte additionnel du salon :\n${context}`,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: "HIGH" as any // Enable high thinking mode for complex creative copywriting
        }
      }
    });

    res.json({
      text: response.text
    });
  } catch (error: any) {
    console.warn("AI Writer quota exceeded or API error, returning original text:", error.message);
    res.json({
      text: prompt ? prompt.trim() : ""
    });
  }
});

// VITE MIDDLEWARE FOR DEVELOPMENT AND STATIC SERVING FOR PRODUCTION
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
