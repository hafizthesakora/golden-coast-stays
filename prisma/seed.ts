import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function generateRef() {
  return "GCS" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin ──
  const adminPassword = await bcrypt.hash("Admin@GCS2025", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@goldencoaststays.com" },
    update: { password: adminPassword, role: "admin" },
    create: {
      name: "GCS Admin",
      email: "admin@goldencoaststays.com",
      password: adminPassword,
      role: "admin",
      phone: "+233200000001",
      lastLoginAt: daysAgo(0),
    },
  });
  console.log("✅ Admin:", admin.email, "/ password: Admin@GCS2025");

  // ── Owner ──
  const ownerPassword = await bcrypt.hash("Owner@GCS2025", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@goldencoaststays.com" },
    update: { password: ownerPassword, role: "owner" },
    create: {
      name: "Kwame Asante",
      email: "owner@goldencoaststays.com",
      password: ownerPassword,
      role: "owner",
      phone: "+233200000002",
      lastLoginAt: daysAgo(2),
    },
  });
  console.log("✅ Owner:", owner.email, "/ password: Owner@GCS2025");

  // ── Guest 1 ──
  const guestPassword = await bcrypt.hash("Guest@GCS2025", 12);
  const guest1 = await prisma.user.upsert({
    where: { email: "guest@goldencoaststays.com" },
    update: { password: guestPassword, role: "user" },
    create: {
      name: "Sarah Johnson",
      email: "guest@goldencoaststays.com",
      password: guestPassword,
      role: "user",
      phone: "+233200000003",
      lastLoginAt: daysAgo(1),
    },
  });
  console.log("✅ Guest 1:", guest1.email, "/ password: Guest@GCS2025");

  // ── Extra guests ──
  const extraGuests = [
    { name: "Michael Osei", email: "michael.osei@gmail.com", phone: "+233244112233" },
    { name: "Abena Mensah", email: "abena.mensah@outlook.com", phone: "+233277889900" },
    { name: "James Boateng", email: "j.boateng@yahoo.com", phone: "+233200556677" },
    { name: "Ama Darkwah", email: "ama.darkwah@gmail.com", phone: "+233244778899" },
    { name: "David Antwi", email: "david.antwi@gmail.com", phone: "+233209988776" },
    { name: "Grace Asare", email: "grace.asare@hotmail.com", phone: "+233277001122" },
  ];

  const guestRecs: { id: string; name: string; email: string }[] = [
    { id: guest1.id, name: guest1.name!, email: guest1.email },
  ];

  for (const g of extraGuests) {
    const pw = await bcrypt.hash("Guest@GCS2025", 12);
    const u = await prisma.user.upsert({
      where: { email: g.email },
      update: {},
      create: { ...g, password: pw, role: "user", lastLoginAt: daysAgo(Math.floor(Math.random() * 30)) },
    });
    guestRecs.push({ id: u.id, name: u.name!, email: u.email });
    console.log("✅ Guest:", u.email);
  }

  // ── Properties ──
  const properties = [
    {
      title: "Oceanview Luxury Villa",
      slug: "oceanview-luxury-villa",
      description: "A stunning 4-bedroom villa with breathtaking ocean views, private pool, and world-class amenities. Perfect for family retreats and corporate getaways in the heart of Accra.",
      propertyType: "villa" as const,
      city: "Accra",
      address: "Airport Residential Area, Accra",
      pricePerNight: 1500,
      bedrooms: 4,
      bathrooms: 4,
      maxGuests: 8,
      area: 3200,
      areaUnit: "sqft",
      amenities: ["WiFi", "Swimming Pool", "Air Conditioning", "Kitchen", "Parking", "Gym", "Security", "Generator", "DSTV", "Balcony"],
      featured: true,
      hasVirtualTour: true,
      virtualTourUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      status: "available" as const,
      images: [
        { imageUrl: "/images/h1.jpg", isPrimary: true, caption: "Villa exterior" },
        { imageUrl: "/images/h2.jpg", isPrimary: false, caption: "Living area" },
        { imageUrl: "/images/h3.jpg", isPrimary: false, caption: "Master bedroom" },
      ],
    },
    {
      title: "Executive Airport Apartment",
      slug: "executive-airport-apartment",
      description: "Modern 2-bedroom apartment minutes from Kotoka International Airport. Ideal for business travelers with high-speed WiFi, fully equipped kitchen, and 24/7 security.",
      propertyType: "apartment" as const,
      city: "Accra",
      address: "Airport City, Accra",
      pricePerNight: 800,
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      area: 1200,
      areaUnit: "sqft",
      amenities: ["WiFi", "Air Conditioning", "Kitchen", "Parking", "Security", "Generator", "TV", "Washer"],
      featured: true,
      hasVirtualTour: false,
      status: "available" as const,
      images: [
        { imageUrl: "/images/h2.jpg", isPrimary: true, caption: "Apartment view" },
        { imageUrl: "/images/h4.jpg", isPrimary: false, caption: "Bedroom" },
      ],
    },
    {
      title: "East Legon Penthouse",
      slug: "east-legon-penthouse",
      description: "Exclusive 5-bedroom penthouse in prestigious East Legon. Features a rooftop terrace, panoramic city views, private cinema, and luxury furnishings throughout.",
      propertyType: "penthouse" as const,
      city: "Accra",
      address: "East Legon, Accra",
      pricePerNight: 2000,
      bedrooms: 5,
      bathrooms: 5,
      maxGuests: 10,
      area: 4500,
      areaUnit: "sqft",
      amenities: ["WiFi", "Swimming Pool", "Air Conditioning", "Kitchen", "Parking", "Gym", "Security", "Generator", "DSTV", "Balcony", "Garden", "BBQ Grill"],
      featured: true,
      hasVirtualTour: true,
      virtualTourUrl: "https://my.matterport.com/show/?m=SxQL3iGyoDo",
      status: "available" as const,
      images: [
        { imageUrl: "/images/h3.jpg", isPrimary: true, caption: "Penthouse view" },
        { imageUrl: "/images/h5.jpg", isPrimary: false, caption: "Rooftop terrace" },
      ],
    },
    {
      title: "Cantonments Luxury Suite",
      slug: "cantonments-luxury-suite",
      description: "Sophisticated 3-bedroom suite in Cantonments, close to embassies and international schools. Features a private garden, outdoor dining area, and concierge service.",
      propertyType: "house" as const,
      city: "Accra",
      address: "Cantonments, Accra",
      pricePerNight: 1200,
      bedrooms: 3,
      bathrooms: 3,
      maxGuests: 6,
      area: 2400,
      areaUnit: "sqft",
      amenities: ["WiFi", "Air Conditioning", "Kitchen", "Parking", "Security", "Generator", "Garden", "BBQ Grill"],
      featured: false,
      hasVirtualTour: false,
      status: "available" as const,
      images: [{ imageUrl: "/images/h4.jpg", isPrimary: true, caption: "Suite exterior" }],
    },
    {
      title: "Labone Studio Retreat",
      slug: "labone-studio-retreat",
      description: "Cozy, stylishly designed studio in Labone. Perfect for solo travelers or couples seeking an intimate space with all modern comforts in a quiet, leafy neighborhood.",
      propertyType: "studio" as const,
      city: "Accra",
      address: "Labone, Accra",
      pricePerNight: 450,
      bedrooms: 0,
      bathrooms: 1,
      maxGuests: 2,
      area: 600,
      areaUnit: "sqft",
      amenities: ["WiFi", "Air Conditioning", "Kitchen", "Security", "TV"],
      featured: false,
      hasVirtualTour: false,
      status: "available" as const,
      images: [{ imageUrl: "/images/h5.jpg", isPrimary: true, caption: "Studio interior" }],
    },
    {
      title: "Kumasi Heritage Villa",
      slug: "kumasi-heritage-villa",
      description: "A beautiful 4-bedroom villa in Kumasi blending contemporary design with Ghanaian heritage elements. Located near Manhyia Palace with easy access to the city center.",
      propertyType: "villa" as const,
      city: "Kumasi",
      address: "Nhyiaeso, Kumasi",
      pricePerNight: 1100,
      bedrooms: 4,
      bathrooms: 3,
      maxGuests: 8,
      area: 2800,
      areaUnit: "sqft",
      amenities: ["WiFi", "Swimming Pool", "Air Conditioning", "Kitchen", "Parking", "Security", "Generator", "Garden"],
      featured: false,
      hasVirtualTour: false,
      status: "available" as const,
      images: [{ imageUrl: "/images/h6.jpg", isPrimary: true, caption: "Villa exterior" }],
    },
  ];

  const propIds: Record<string, string> = {};
  const propPrices: Record<string, number> = {};

  for (const p of properties) {
    const { images, ...propertyData } = p;
    const existing = await prisma.property.findUnique({ where: { slug: propertyData.slug } });
    if (!existing) {
      const property = await prisma.property.create({
        data: {
          ...propertyData,
          images: { create: images.map((img, i) => ({ ...img, order: i })) },
        },
      });
      propIds[propertyData.slug] = property.id;
      propPrices[propertyData.slug] = propertyData.pricePerNight;
      console.log("✅ Property:", property.title);
    } else {
      propIds[propertyData.slug] = existing.id;
      propPrices[propertyData.slug] = propertyData.pricePerNight;
      console.log("⏭  Skipped (exists):", propertyData.title);
    }
  }

  // ── Bookings ──
  const bookingSeeds = [
    {
      propertySlug: "oceanview-luxury-villa",
      guestIdx: 0,
      checkIn: daysAgo(60),
      checkOut: daysAgo(55),
      nights: 5,
      guests: 6,
      status: "completed" as const,
      paymentStatus: "paid" as const,
      paidAt: daysAgo(62),
    },
    {
      propertySlug: "executive-airport-apartment",
      guestIdx: 1,
      checkIn: daysAgo(45),
      checkOut: daysAgo(42),
      nights: 3,
      guests: 2,
      status: "completed" as const,
      paymentStatus: "paid" as const,
      paidAt: daysAgo(47),
    },
    {
      propertySlug: "east-legon-penthouse",
      guestIdx: 2,
      checkIn: daysAgo(30),
      checkOut: daysAgo(25),
      nights: 5,
      guests: 8,
      status: "completed" as const,
      paymentStatus: "paid" as const,
      paidAt: daysAgo(32),
    },
    {
      propertySlug: "cantonments-luxury-suite",
      guestIdx: 3,
      checkIn: daysAgo(20),
      checkOut: daysAgo(17),
      nights: 3,
      guests: 4,
      status: "confirmed" as const,
      paymentStatus: "paid" as const,
      paidAt: daysAgo(22),
    },
    {
      propertySlug: "oceanview-luxury-villa",
      guestIdx: 4,
      checkIn: daysAgo(10),
      checkOut: daysAgo(7),
      nights: 3,
      guests: 5,
      status: "confirmed" as const,
      paymentStatus: "paid" as const,
      paidAt: daysAgo(12),
    },
    {
      propertySlug: "labone-studio-retreat",
      guestIdx: 5,
      checkIn: daysAgo(5),
      checkOut: daysAgo(3),
      nights: 2,
      guests: 2,
      status: "confirmed" as const,
      paymentStatus: "paid" as const,
      paidAt: daysAgo(6),
    },
    {
      propertySlug: "executive-airport-apartment",
      guestIdx: 6,
      checkIn: daysFromNow(5),
      checkOut: daysFromNow(8),
      nights: 3,
      guests: 2,
      status: "pending" as const,
      paymentStatus: "pending" as const,
      paidAt: null,
    },
    {
      propertySlug: "kumasi-heritage-villa",
      guestIdx: 0,
      checkIn: daysFromNow(10),
      checkOut: daysFromNow(17),
      nights: 7,
      guests: 7,
      status: "confirmed" as const,
      paymentStatus: "paid" as const,
      paidAt: daysAgo(2),
    },
    {
      propertySlug: "east-legon-penthouse",
      guestIdx: 1,
      checkIn: daysFromNow(20),
      checkOut: daysFromNow(25),
      nights: 5,
      guests: 6,
      status: "pending" as const,
      paymentStatus: "pending" as const,
      paidAt: null,
    },
    {
      propertySlug: "cantonments-luxury-suite",
      guestIdx: 2,
      checkIn: daysAgo(90),
      checkOut: daysAgo(87),
      nights: 3,
      guests: 3,
      status: "cancelled" as const,
      paymentStatus: "refunded" as const,
      paidAt: daysAgo(92),
    },
  ];

  for (const b of bookingSeeds) {
    const propertyId = propIds[b.propertySlug];
    const pricePerNight = propPrices[b.propertySlug];
    if (!propertyId) continue;
    const guest = guestRecs[b.guestIdx % guestRecs.length];
    const totalAmount = pricePerNight * b.nights;

    const existing = await prisma.booking.findFirst({
      where: { propertyId, guestEmail: guest.email, checkIn: b.checkIn },
    });
    if (!existing) {
      await prisma.booking.create({
        data: {
          reference: generateRef(),
          propertyId,
          userId: guest.id,
          guestName: guest.name,
          guestEmail: guest.email,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          guests: b.guests,
          nights: b.nights,
          pricePerNight,
          totalAmount,
          status: b.status,
          paymentStatus: b.paymentStatus,
          paymentMethod: b.paymentStatus === "paid" || b.paymentStatus === "refunded" ? "paystack" : null,
          paidAt: b.paidAt,
          createdAt: b.checkIn < new Date() ? daysAgo(Math.abs(Math.round((new Date().getTime() - b.checkIn.getTime()) / 86400000)) + 2) : new Date(),
        },
      });
      console.log("✅ Booking:", guest.name, "→", b.propertySlug, `(${b.status})`);
    } else {
      console.log("⏭  Booking exists:", guest.name, "→", b.propertySlug);
    }
  }

  // ── Reviews ──
  const reviewSeeds = [
    {
      propertySlug: "oceanview-luxury-villa",
      guestIdx: 0,
      rating: 5,
      comment: "Absolutely stunning villa! The ocean views were breathtaking and the pool was perfect. Every detail was thoughtfully considered — we'll definitely be back.",
      isApproved: true,
    },
    {
      propertySlug: "oceanview-luxury-villa",
      guestIdx: 4,
      rating: 5,
      comment: "Best stay we've ever had in Accra. The villa exceeded every expectation. The team was incredibly responsive and made us feel truly at home.",
      isApproved: true,
    },
    {
      propertySlug: "executive-airport-apartment",
      guestIdx: 1,
      rating: 4,
      comment: "Great location, very convenient for our early morning flight. Clean, modern, and comfortable. The only minor issue was the WiFi speed during peak hours.",
      isApproved: true,
    },
    {
      propertySlug: "east-legon-penthouse",
      guestIdx: 2,
      rating: 5,
      comment: "The penthouse is simply magnificent. Hosting our corporate team here was a great decision — the cinema room and rooftop terrace were the highlights of our stay.",
      isApproved: true,
    },
    {
      propertySlug: "cantonments-luxury-suite",
      guestIdx: 3,
      rating: 4,
      comment: "Lovely property in a quiet neighborhood. The garden is beautiful and the suite itself is well-appointed. Would recommend for families or longer stays.",
      isApproved: true,
    },
    {
      propertySlug: "labone-studio-retreat",
      guestIdx: 5,
      rating: 5,
      comment: "Perfect cozy studio! Everything you need is there. The neighborhood is safe and charming. Great value for money.",
      isApproved: true,
    },
    {
      propertySlug: "kumasi-heritage-villa",
      guestIdx: 6,
      rating: 4,
      comment: "Wonderful villa with a great Ghanaian feel to it. The pool was a bonus after long days exploring Kumasi. Highly recommend this for anyone visiting the Ashanti region.",
      isApproved: false,
    },
    {
      propertySlug: "executive-airport-apartment",
      guestIdx: 6,
      rating: 3,
      comment: "Decent apartment and good location. However, the air conditioning in one of the rooms wasn't working properly. Staff were quick to address it though.",
      isApproved: false,
    },
  ];

  for (const r of reviewSeeds) {
    const propertyId = propIds[r.propertySlug];
    if (!propertyId) continue;
    const guest = guestRecs[r.guestIdx % guestRecs.length];

    const existing = await prisma.review.findFirst({
      where: { propertyId, userId: guest.id },
    });
    if (!existing) {
      await prisma.review.create({
        data: {
          propertyId,
          userId: guest.id,
          rating: r.rating,
          comment: r.comment,
          isApproved: r.isApproved,
          createdAt: daysAgo(Math.floor(Math.random() * 60) + 5),
        },
      });
      console.log("✅ Review:", guest.name, "→", r.propertySlug, `★${r.rating}`);
    } else {
      console.log("⏭  Review exists:", guest.name, "→", r.propertySlug);
    }
  }

  // ── Property Submissions ──
  const submissionSeeds = [
    {
      fullName: "Kofi Acheampong",
      email: "kofi.acheampong@gmail.com",
      phone: "+233244556677",
      propertyType: "villa",
      location: "Trasacco Valley, Accra",
      bedrooms: 5,
      bathrooms: 4,
      maxGuests: 10,
      priceEstimate: 2500,
      description: "Modern 5-bedroom villa in the prestigious Trasacco Valley estate. Features a private pool, landscaped garden, home cinema, and smart home automation. Available immediately.",
      amenities: ["Swimming Pool", "Home Cinema", "Smart Home", "Generator", "Security"],
      status: "pending",
    },
    {
      fullName: "Efua Amoah",
      email: "efua.amoah@hotmail.com",
      phone: "+233200998877",
      propertyType: "apartment",
      location: "Ridge, Accra",
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
      priceEstimate: 900,
      description: "Fully furnished 3-bedroom apartment on the 8th floor of Ridge Towers. Panoramic city and sea views, premium furnishings, and building amenities include gym and rooftop pool.",
      amenities: ["Gym", "Pool", "Concierge", "Generator", "Parking"],
      status: "reviewing",
    },
    {
      fullName: "Emmanuel Darko",
      email: "e.darko@corporategh.com",
      phone: "+233277334455",
      propertyType: "townhouse",
      location: "Abelemkpe, Accra",
      bedrooms: 4,
      bathrooms: 3,
      maxGuests: 8,
      priceEstimate: 1100,
      description: "Elegant 4-bedroom townhouse in the quiet Abelemkpe neighborhood. Recently renovated with European finishes, private courtyard, and dedicated parking for 3 vehicles.",
      amenities: ["Garden", "Parking", "Generator", "Security", "WiFi"],
      status: "approved",
      adminNote: "Approved and listed as Cantonments Luxury Suite equivalent. Owner briefed on listing requirements.",
    },
  ];

  for (const s of submissionSeeds) {
    const ref = "SUB" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await prisma.propertySubmission.findFirst({ where: { email: s.email } });
    if (!existing) {
      await prisma.propertySubmission.create({
        data: { ...s, submissionRef: ref, createdAt: daysAgo(Math.floor(Math.random() * 20) + 1) },
      });
      console.log("✅ Submission:", s.fullName, "→", s.propertyType, `(${s.status})`);
    } else {
      console.log("⏭  Submission exists:", s.fullName);
    }
  }

  // ── Gallery ──
  const galleryImages = [
    { imageUrl: "/images/h1.jpg", caption: "Oceanview Villa Pool", category: "Amenities", order: 1 },
    { imageUrl: "/images/h2.jpg", caption: "Airport Apartment Lounge", category: "Interior", order: 2 },
    { imageUrl: "/images/h3.jpg", caption: "Penthouse Rooftop", category: "Exterior", order: 3 },
    { imageUrl: "/images/h4.jpg", caption: "Master Bedroom Suite", category: "Interior", order: 4 },
    { imageUrl: "/images/h5.jpg", caption: "City Panoramic View", category: "Views", order: 5 },
    { imageUrl: "/images/h6.jpg", caption: "Garden Terrace", category: "Exterior", order: 6 },
    { imageUrl: "/images/b1.jpg", caption: "Luxury Bathroom", category: "Interior", order: 7 },
    { imageUrl: "/images/b2.jpg", caption: "Modern Kitchen", category: "Amenities", order: 8 },
  ];

  for (const img of galleryImages) {
    const existing = await prisma.galleryImage.findFirst({ where: { imageUrl: img.imageUrl } });
    if (!existing) {
      await prisma.galleryImage.create({ data: img });
      console.log("✅ Gallery:", img.caption);
    }
  }

  // ── Tours ──
  const tours = [
    {
      title: "Accra City Explorer",
      slug: "accra-city-explorer",
      description: "Explore the vibrant city of Accra — from Independence Square and the National Museum to Makola Market and Osu Castle. A comprehensive introduction to Ghana's dynamic capital.",
      date: daysFromNow(26),
      time: "09:00",
      duration: "4 hours",
      meetingPoint: "Golden Coast Office, East Legon",
      maxParticipants: 20,
      price: 150,
      isActive: true,
    },
    {
      title: "Luxury Property Showcase",
      slug: "luxury-property-showcase",
      description: "An exclusive tour of our premium properties. View fully furnished villas, penthouses, and apartments while our team walks you through investment opportunities.",
      date: daysFromNow(33),
      time: "10:00",
      duration: "3 hours",
      meetingPoint: "Golden Coast Office, East Legon",
      maxParticipants: 12,
      price: 0,
      isActive: true,
    },
    {
      title: "Coastal Drive & Sunset Tour",
      slug: "coastal-drive-sunset-tour",
      description: "A scenic drive along Ghana's beautiful coastline, stopping at Labadi Beach, Bojo Beach, and ending with a sunset dinner at a beachside restaurant.",
      date: daysFromNow(52),
      time: "15:00",
      duration: "5 hours",
      meetingPoint: "Labadi Beach Hotel, Accra",
      maxParticipants: 15,
      price: 200,
      isActive: true,
    },
    {
      title: "Cultural Heritage Experience",
      slug: "cultural-heritage-experience",
      description: "Discover Ghana's rich Ashanti heritage with visits to the Manhyia Palace Museum in Kumasi, traditional craft villages, and the iconic Kejetia Market.",
      date: daysFromNow(67),
      time: "08:00",
      duration: "Full day",
      meetingPoint: "Kumasi City Hotel, Kumasi",
      maxParticipants: 18,
      price: 350,
      isActive: true,
    },
  ];

  for (const t of tours) {
    const existing = await prisma.tour.findUnique({ where: { slug: t.slug } });
    if (!existing) {
      await prisma.tour.create({ data: t });
      console.log("✅ Tour:", t.title);
    }
  }

  // ── Notifications (for admin) ──
  const notifExisting = await prisma.notification.findFirst({ where: { userId: admin.id } });
  if (!notifExisting) {
    await prisma.notification.createMany({
      data: [
        { userId: admin.id, title: "New booking received", body: "Sarah Johnson booked Oceanview Luxury Villa for 5 nights.", type: "info", link: "/admin/bookings", createdAt: daysAgo(60) },
        { userId: admin.id, title: "Review submitted", body: "A 5-star review was submitted for Oceanview Luxury Villa.", type: "success", link: "/admin/reviews", createdAt: daysAgo(30) },
        { userId: admin.id, title: "New property submission", body: "Kofi Acheampong submitted a property for review.", type: "info", link: "/admin/submissions", createdAt: daysAgo(5) },
        { userId: admin.id, title: "Pending review requires approval", body: "2 reviews are pending approval.", type: "warning", link: "/admin/reviews", createdAt: daysAgo(1) },
      ],
    });
    console.log("✅ Notifications created for admin");
  }

  console.log("\n✨ Seeding complete!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
